// Unit tests for the search, data-integrity and matching building blocks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCountry, resolveDestination, countryName } from "./countries.js";
import { classifySource, parseSafeUrl, pageKey, baseDomain } from "./sources.js";
import { extractDates, verifiedDate, quoteInSource, normalizeForMatch, applicationStatus, intakeYear, DATE_CONTEXT } from "./dates.js";
import { planSearch, normalizeDegree } from "./searchPlan.js";
import { matchScholarship, rankScholarship } from "./matching.js";
import { createCache } from "./cache.js";
import { loadConfig } from "./config.js";
import { validateProfile } from "./validation.js";

// ---------------------------------------------------------------- countries

test("countries: names, aliases and nationalities resolve to ISO codes", () => {
    const cases = {
        Pakistan: "PK", Pakistani: "PK", Kenyan: "KE", Nigerian: "NG", Brazilian: "BR",
        USA: "US", "United States": "US", American: "US", UK: "GB", British: "GB",
        "South Korea": "KR", Korean: "KR", Turkey: "TR", "Türkiye": "TR", Turkish: "TR",
        Chinese: "CN", Japanese: "JP", Swiss: "CH", Dutch: "NL", "Sri Lankan": "LK", "New Zealand": "NZ"
    };

    for (const [input, code] of Object.entries(cases)) {
        assert.equal(resolveCountry(input), code, input);
    }

    assert.equal(resolveCountry("gibberish"), null);
    assert.equal(resolveCountry(""), null);
    assert.equal(countryName("TR"), "Turkey");

    // Deprecated codes must not shadow current countries.
    assert.equal(resolveCountry("France"), "FR");
    assert.equal(resolveCountry("United Kingdom"), "GB");
    assert.equal(resolveCountry("Germany"), "DE");
    assert.equal(resolveCountry("Russia"), "RU");
    assert.equal(resolveCountry("Serbia"), "RS");
});

test("countries: destinations understand countries, regions and 'any'", () => {
    assert.equal(resolveDestination("Germany").code, "DE");
    assert.ok(resolveDestination("Germany").officialDomains.includes("daad.de"));
    assert.equal(resolveDestination("Europe").kind, "region");
    assert.ok(resolveDestination("Europe").codes.includes("FR"));
    assert.equal(resolveDestination("Any"), null);
    assert.equal(resolveDestination(""), null);
    assert.equal(resolveDestination("Atlantis").kind, "text");

    for (const place of ["USA", "Canada", "UK", "France", "Italy", "Denmark", "Norway", "Switzerland", "Turkey",
        "South Korea", "Japan", "China", "Austria", "Australia", "Germany", "Sweden", "Finland", "New Zealand"]) {
        const destination = resolveDestination(place);
        assert.equal(destination.kind, "country", place);
        assert.ok(destination.tavilyCountry, `${place} has a search country`);
        assert.ok(destination.officialDomains.length > 0, `${place} has official domains`);
    }
});

// ------------------------------------------------------------------ sources

test("sources: official, third-party and unknown domains are classified conservatively", () => {
    const type = (url) => classifySource(url).type;

    assert.equal(type("https://www.daad.de/en/"), "official_program");
    assert.equal(type("https://www.chevening.org/apply"), "official_program");
    assert.equal(type("https://www.studyinkorea.go.kr/"), "official_program");
    assert.equal(type("https://www.state.gov/x"), "government");
    assert.equal(type("https://www.gov.uk/x"), "government");
    assert.equal(type("https://www.cic.gc.ca/x"), "government");
    assert.equal(classifySource("https://scholarships.gc.ca/x").official, true);
    assert.equal(type("https://www.mext.go.jp/x"), "official_program");
    assert.equal(type("https://www.education.gouv.fr/x"), "government");
    assert.equal(type("https://www.harvard.edu/x"), "university");
    assert.equal(type("https://www.ox.ac.uk/x"), "university");
    assert.equal(type("https://www.unimelb.edu.au/x"), "university");
    assert.equal(type("https://www.scholars4dev.com/x"), "third_party");
    assert.equal(type("https://opportunitiesforafricans.com/x"), "third_party");

    // Unknown domains are never assumed official, even with official-sounding names.
    assert.equal(type("https://www.ethz.ch/x"), "unknown");
    assert.equal(type("https://university-scholarships-blog.com/x"), "unknown");
    assert.equal(type("https://daad.de.evil.example/x"), "unknown");
    assert.equal(type("https://evil.example/?daad.de"), "unknown");
    assert.equal(type("https://gov.uk.evil.example/x"), "unknown");
    assert.equal(type("javascript:alert(1)"), "unknown");
    assert.equal(classifySource("https://www.daad.de@evil.example/").official, false);
});

test("sources: URL safety and page identity", () => {
    assert.equal(parseSafeUrl("javascript:alert(1)"), null);
    assert.equal(parseSafeUrl("https://user:pass@example.com/"), null);
    assert.equal(parseSafeUrl("http://203.0.113.5/"), null);
    assert.equal(parseSafeUrl("https://localhost/"), null);
    assert.equal(parseSafeUrl("not a url"), null);
    assert.ok(parseSafeUrl("https://www.daad.de/en/"));

    assert.equal(
        pageKey(parseSafeUrl("https://www.Example.com/page/?utm_source=x&id=2#top")),
        pageKey(parseSafeUrl("https://example.com/page?id=2"))
    );

    const base = (url) => baseDomain(parseSafeUrl(url));
    assert.equal(base("https://www2.daad.de/x"), "daad.de");
    assert.equal(base("https://www.ox.ac.uk/x"), "ox.ac.uk");
    assert.equal(base("https://cscuk.fcdo.gov.uk/x"), "fcdo.gov.uk");
    assert.equal(base("https://example.com/x"), "example.com");
});

// -------------------------------------------------------------------- dates

test("dates: only complete, unambiguous dates are extracted", () => {
    const found = (text) => [...extractDates(text)].sort();

    assert.deepEqual(found("Deadline: 15 January 2027"), ["2027-01-15"]);
    assert.deepEqual(found("Apply by January 15th, 2027."), ["2027-01-15"]);
    assert.deepEqual(found("Closes 2027-03-01"), ["2027-03-01"]);
    assert.deepEqual(found("until 31.10.2026"), ["2026-10-31"]);
    assert.deepEqual(found("until 10/31/2026"), ["2026-10-31"]);
    assert.deepEqual(found("until 05/06/2026"), [], "day/month order is ambiguous");
    assert.deepEqual(found("Deadline usually in October"), []);
    assert.deepEqual(found("15 January"), [], "no year");
    assert.deepEqual(found("31 February 2027"), [], "impossible date");
});

test("dates: AI-claimed dates are accepted only when the source quote states them", () => {
    const source = normalizeForMatch("Applications open on 1 September 2026. Application deadline: 31 October 2026.");

    assert.equal(verifiedDate({ date: "2026-10-31", evidence: "Application deadline: 31 October 2026" }, source), "2026-10-31");
    assert.equal(verifiedDate({ date: "2026-11-30", evidence: "Application deadline: 31 October 2026" }, source), null, "date not in quote");
    assert.equal(verifiedDate({ date: "2026-10-31", evidence: "Deadline: 31 October 2026 (invented)" }, source), null, "quote not in source");
    assert.equal(verifiedDate({ date: "31/10/2026", evidence: "Application deadline: 31 October 2026" }, source), null, "not ISO");
    assert.equal(verifiedDate(null, source), null);
});

test("dates: programme start dates are not accepted as application dates", () => {
    const source = normalizeForMatch("The scholarship usually begins on 1 October 2027. Applications open on 1 August 2026 and close on 15 October 2026.");

    assert.equal(verifiedDate({ date: "2027-10-01", evidence: "The scholarship usually begins on 1 October 2027" }, source, DATE_CONTEXT.opening), null);
    assert.equal(verifiedDate({ date: "2027-10-01", evidence: "The scholarship usually begins on 1 October 2027" }, source, DATE_CONTEXT.deadline), null);
    assert.equal(verifiedDate({ date: "2026-08-01", evidence: "Applications open on 1 August 2026" }, source, DATE_CONTEXT.opening), "2026-08-01");
    assert.equal(verifiedDate({ date: "2026-10-15", evidence: "close on 15 October 2026" }, source, DATE_CONTEXT.deadline), "2026-10-15");
});

test("dates: quotes are matched loosely on formatting but strictly on content", () => {
    const source = normalizeForMatch("**Eligibility:** Applicants must hold a [bachelor's degree](https://x.org) — any field.");

    assert.equal(quoteInSource("Applicants must hold a bachelor's degree", source), true);
    assert.equal(quoteInSource("Applicants must hold a bachelor’s degree", source), true, "curly apostrophe");
    assert.equal(quoteInSource("Applicants must hold a master's degree", source), false);
    assert.equal(quoteInSource("Applicants must ... any field", source), true, "ellipsis");
    assert.equal(quoteInSource("degree", source), false, "too short to be evidence");
    assert.equal(quoteInSource("\"Applicants must hold a bachelor's degree\"", source), true, "wrapped in quotes");
    assert.equal(quoteInSource("“Applicants must hold a bachelor's degree.”", source), false, "the full stop is not on the page");
    assert.equal(verifiedDate({ date: "2026-10-31", evidence: "\"Application deadline: 31 October 2026\"" },
        normalizeForMatch("Application deadline: 31 October 2026.")), "2026-10-31");
    assert.equal(quoteInSource(null, source), false);
});

test("dates: application status uses Anywhere-on-Earth deadlines and a 30-day closing window", () => {
    const at = (iso) => new Date(iso);

    assert.equal(applicationStatus({ deadlineDate: "2026-10-31" }, at("2026-10-20T12:00:00Z")), "closing_soon");
    assert.equal(applicationStatus({ deadlineDate: "2027-03-01" }, at("2026-10-20T12:00:00Z")), "open");
    // Still open just after midnight UTC because it is still 31 October west of UTC.
    assert.equal(applicationStatus({ deadlineDate: "2026-10-31" }, at("2026-11-01T06:00:00Z")), "closing_soon");
    assert.equal(applicationStatus({ deadlineDate: "2026-10-31" }, at("2026-11-01T12:00:01Z")), "closed");
    assert.equal(applicationStatus({ openingDate: "2026-12-01", deadlineDate: "2027-02-01" }, at("2026-10-20T12:00:00Z")), "upcoming");
    assert.equal(applicationStatus({ openingDate: "2026-12-01" }, at("2026-10-20T12:00:00Z")), "upcoming");
    assert.equal(applicationStatus({}, at("2026-10-20T12:00:00Z")), "unknown");

    assert.equal(intakeYear(at("2026-10-20T00:00:00Z")), 2027);
    assert.equal(intakeYear(at("2026-03-20T00:00:00Z")), 2026);
});

// --------------------------------------------------------------- search plan

const NOW = new Date("2026-10-20T12:00:00Z");

test("search plan: country searches use 6 distinct targeted queries", () => {
    const plan = planSearch({ field: "Computer Science", degree: "Master", nationality: "Pakistani", destination: "Germany", funding: "Fully Funded" }, { now: NOW });

    assert.equal(plan.queries.length, 6);
    assert.equal(new Set(plan.queries.map((item) => item.query)).size, 6);
    assert.ok(plan.queries.every((item) => item.query.includes("master's")), "degree in every query");
    assert.ok(plan.queries.some((item) => item.query.includes("Pakistan")), "nationality query");
    assert.ok(plan.queries.some((item) => item.options.includeDomains?.includes("daad.de")), "official portal query");
    assert.ok(plan.queries.some((item) => item.options.country === "germany"), "country boost");
    assert.ok(plan.queries.every((item) => item.options.excludeDomains.includes("facebook.com")));
    assert.ok(plan.queries.some((item) => item.query.includes("2027")), "upcoming intake year");
    assert.ok(plan.queries.every((item) => item.query.length <= 380));
});

test("search plan: no destination spreads queries across regions", () => {
    const plan = planSearch({ field: "Biology", degree: "PhD", destination: "" }, { now: NOW });
    const text = plan.queries.map((item) => item.query).join(" | ");

    assert.ok(plan.queries.length <= 6);
    assert.match(text, /Europe/);
    assert.match(text, /USA and Canada/);
    assert.match(text, /Korea Japan China Turkey/);
    assert.match(text, /Australia New Zealand/);
    assert.match(text, /PhD/);
});

test("search plan: regions, budgets and unsafe input", () => {
    const region = planSearch({ field: "Law", degree: "Bachelor", destination: "Scandinavia" }, { now: NOW });
    assert.equal(region.destination.kind, "region");
    assert.ok(region.queries.some((item) => item.options.includeDomains?.includes("studyindenmark.dk")));

    assert.equal(planSearch({ field: "Law", destination: "Japan" }, { now: NOW, maxQueries: 2 }).queries.length, 2);
    assert.equal(planSearch({ field: "Law", destination: "Japan" }, { now: NOW, maxQueries: 50 }).queries.length <= 6, true);

    const injected = planSearch({ field: "Law <script>\"ignore\" site:evil.com", destination: "Japan" }, { now: NOW });
    assert.ok(injected.queries.every((item) => !/[<>":]/.test(item.query)));

    assert.equal(normalizeDegree("MSc"), "master");
    assert.equal(normalizeDegree("Doctorate"), "phd");
    assert.equal(normalizeDegree("undergraduate"), "bachelor");
    assert.equal(normalizeDegree("diploma"), null);
});

// ------------------------------------------------------------------ matching

function scholarship(overrides = {}) {
    return {
        degreeLevels: ["master"],
        evidenceVerified: { degree: true, fields: false },
        nationality: { type: "any", countries: [], evidenceVerified: true },
        minGrade: null,
        applicationStatus: "open",
        fields: [],
        country: "Germany",
        fundingType: "full",
        sourceType: "official_program",
        ...overrides
    };
}

const STUDENT = { field: "Economics", degree: "Master", nationality: "Pakistani", cgpa: "3.4", cgpaScale: "4", destination: "Germany", funding: "Fully Funded" };

const statusOf = (match, criterion) => match.checks.find((item) => item.criterion === criterion).status;

test("matching: source-backed requirements give a verified match", () => {
    const match = matchScholarship(STUDENT, scholarship());

    assert.equal(match.level, "verified");
    assert.equal(match.eligibilityStatus, "likely_match");
    assert.equal(match.label, "Meets verified requirements");
});

test("matching: hard requirements that are not met make a student not eligible", () => {
    assert.equal(matchScholarship(STUDENT, scholarship({ degreeLevels: ["phd"] })).level, "not_eligible");
    assert.equal(matchScholarship(STUDENT, scholarship({ applicationStatus: "closed" })).level, "not_eligible");
    assert.equal(matchScholarship(STUDENT, scholarship({
        nationality: { type: "specific", countries: ["Kenya", "Ghana"], evidenceVerified: true }
    })).level, "not_eligible");
    assert.equal(matchScholarship(STUDENT, scholarship({
        nationality: { type: "excluded", countries: ["Pakistan"], evidenceVerified: true }
    })).level, "not_eligible");
    assert.equal(matchScholarship({ ...STUDENT, cgpa: "2.5" }, scholarship({
        minGrade: { value: 3.0, scale: 4, evidenceVerified: true }
    })).level, "not_eligible");
});

test("matching: AI-only or unknown requirements stay preliminary", () => {
    assert.equal(matchScholarship(STUDENT, scholarship({ evidenceVerified: { degree: false } })).level, "preliminary");
    assert.equal(matchScholarship(STUDENT, scholarship({ nationality: { type: "unknown" } })).level, "preliminary");
    assert.equal(matchScholarship(STUDENT, scholarship({ degreeLevels: [] })).level, "preliminary");
    assert.equal(matchScholarship({ ...STUDENT, nationality: "" }, scholarship({
        nationality: { type: "specific", countries: ["Pakistan"], evidenceVerified: true }
    })).level, "preliminary");
});

test("matching: nationality lists, EU groups and grade scales", () => {
    const eu = scholarship({ nationality: { type: "specific", countries: ["EU/EEA citizens"], evidenceVerified: true } });
    assert.equal(statusOf(matchScholarship({ ...STUDENT, nationality: "German" }, eu), "nationality"), "met");
    assert.equal(statusOf(matchScholarship(STUDENT, eu), "nationality"), "not_met");

    const differentScale = scholarship({ minGrade: { value: 8, scale: 10, evidenceVerified: true } });
    assert.equal(statusOf(matchScholarship(STUDENT, differentScale), "grade"), "unknown", "scales are not converted");

    const sameScale = scholarship({ minGrade: { value: 3.0, scale: 4, evidenceVerified: true } });
    assert.equal(statusOf(matchScholarship(STUDENT, sameScale), "grade"), "met");
    assert.equal(statusOf(matchScholarship({ ...STUDENT, cgpaScale: "" }, sameScale), "grade"), "unknown");
});

test("matching: preferences affect ranking but not eligibility", () => {
    const inGermany = scholarship();
    const inFrance = scholarship({ country: "France" });
    const partial = scholarship({ fundingType: "partial" });

    assert.equal(statusOf(matchScholarship(STUDENT, inFrance), "destination"), "not_met");
    assert.equal(matchScholarship(STUDENT, inFrance).level, "verified", "destination is a preference");
    assert.equal(statusOf(matchScholarship(STUDENT, partial), "funding"), "not_met");

    const rank = (item) => rankScholarship({ ...item, match: matchScholarship(STUDENT, item) });
    assert.ok(rank(inGermany) > rank(inFrance));
    assert.ok(rank(inGermany) > rank(partial));
    assert.ok(rank(scholarship({ sourceType: "official_program" })) > rank(scholarship({ sourceType: "third_party" })));
    assert.ok(rank(scholarship()) > rank(scholarship({ applicationStatus: "closed" })));

    // No percentage is ever produced.
    assert.equal(JSON.stringify(matchScholarship(STUDENT, inGermany)).includes("%"), false);
});

test("matching: field check uses the student's actual field", () => {
    assert.equal(statusOf(matchScholarship(STUDENT, scholarship({ fields: ["Economics and Business"] })), "field"), "met");
    assert.equal(statusOf(matchScholarship(STUDENT, scholarship({ fields: ["All fields of study"] })), "field"), "met");
    assert.equal(statusOf(matchScholarship(STUDENT, scholarship({ fields: ["Medicine"] })), "field"), "unknown");
});

// --------------------------------------------------------------------- cache

test("cache: expiry, size limit and shared in-flight loads", async () => {
    let clock = 0;
    const cache = createCache({ maxEntries: 2, ttlMs: 100, now: () => clock });

    cache.set("a", 1);
    cache.set("b", 2);
    cache.get("a");
    cache.set("c", 3);
    assert.equal(cache.get("b"), undefined, "least recently used is evicted");
    assert.equal(cache.get("a"), 1);

    clock = 200;
    assert.equal(cache.get("a"), undefined, "expired");

    let loads = 0;
    const load = async () => {
        loads += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return "value";
    };

    const [first, second] = await Promise.all([cache.getOrLoad("k", load), cache.getOrLoad("k", load)]);
    assert.equal(loads, 1, "concurrent callers share one load");
    assert.equal(first.cached, false);
    assert.equal(second.cached, true);

    await assert.rejects(cache.getOrLoad("bad", async () => { throw new Error("boom"); }));
    assert.equal(cache.get("bad"), undefined, "failures are not cached");
});

// -------------------------------------------------------------------- config

test("config: defaults, environment overrides and hard limits", () => {
    const defaults = loadConfig({});
    assert.equal(defaults.maxQueries, 6);
    assert.equal(defaults.rawContent, "markdown");

    const custom = loadConfig({ SEARCH_MAX_QUERIES: "3", AI_MAX_SOURCES: "999", RATE_LIMIT_MAX: "abc", TAVILY_RAW_CONTENT: "false" });
    assert.equal(custom.maxQueries, 3);
    assert.equal(custom.aiMaxSources, 12, "clamped to the hard limit");
    assert.equal(custom.rateLimitMax, 6, "invalid values fall back to the default");
    assert.equal(custom.rawContent, false);

    assert.equal(loadConfig({ SEARCH_MAX_QUERIES: "20" }).maxQueries, 6, "never more than 6 queries");
});

// ---------------------------------------------------------------- validation

test("validation: new profile fields are normalized and checked", () => {
    const { profile } = validateProfile({ field: "CS", degree: "msc", nationality: "Pakistani", cgpa: "3,7", cgpaScale: "4.0" });
    assert.equal(profile.degree, "Master");
    assert.equal(profile.cgpa, "3.7");
    assert.equal(profile.cgpaScale, "4");
    assert.equal(profile.nationality, "Pakistani");

    assert.ok(validateProfile({ field: "CS", degree: "Diploma" }).errors);
    assert.ok(validateProfile({ field: "CS", cgpaScale: "7" }).errors);
    assert.ok(validateProfile({ field: "CS", cgpa: "4.5", cgpaScale: "4" }).errors);
    assert.ok(validateProfile({ field: "CS", cgpa: "excellent" }).errors);
    assert.equal(validateProfile({ field: "CS" }).profile.degree, "Bachelor", "older clients default to Bachelor");
});
