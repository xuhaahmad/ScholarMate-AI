// Unit tests for the search, data-integrity and matching building blocks.
import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCountry, resolveDestination, countryName, countryFromDomain, countriesMentioned } from "./countries.js";
import { classifySource, parseSafeUrl, pageKey, baseDomain } from "./sources.js";
import { extractDates, verifiedDate, quoteInSource, normalizeForMatch, applicationStatus, intakeYear, statesClosed, closedRoundIsCurrent, DATE_CONTEXT } from "./dates.js";
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

test("countries: only country-code domains imply a country", () => {
    assert.equal(countryFromDomain("https://www.auckland.ac.nz/en/study.html"), "NZ");
    assert.equal(countryFromDomain("https://www.ox.ac.uk/"), "GB");
    assert.equal(countryFromDomain("https://www.sydney.edu.au/"), "AU");
    assert.equal(countryFromDomain("https://www.boun.edu.tr/"), "TR");
    for (const generic of ["https://www.mit.edu/", "https://www.chevening.org/", "https://example.com/", "https://www.daad.de.example.com/", "not a url"]) {
        assert.equal(countryFromDomain(generic), null, generic);
    }
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

test("dates: opening dates need wording about applications opening", () => {
    const policy = "Note for Master's students: Starting March 1, 2027, we will only accept applications for first-cycle programs.";
    const source = normalizeForMatch(policy + " Applications open on 1 October 2026. The call for applications starts on 5 January 2027.");

    assert.equal(verifiedDate({ date: "2027-03-01", evidence: "Starting March 1, 2027, we will only accept applications for first-cycle programs" }, source, DATE_CONTEXT.opening), null, "policy change, not an opening date");
    assert.equal(verifiedDate({ date: "2026-10-01", evidence: "Applications open on 1 October 2026" }, source, DATE_CONTEXT.opening), "2026-10-01");
    assert.equal(verifiedDate({ date: "2027-01-05", evidence: "The call for applications starts on 5 January 2027" }, source, DATE_CONTEXT.opening), "2027-01-05");
});

test("dates: a bare 'open' is not an opening date; explicit opening wording is", () => {
    const rejected = [
        "The scholarship is open to students who begin their studies on 1 October 2027.",
        "Open Day: 12 March 2027.",
        "Applications are open until 5 March 2027.",
        "The scholarship is available from 1 September 2027.",
        "Starting March 1, 2027, we will only accept applications for first-cycle programs."
    ];
    const accepted = [
        "Applications open on 1 October 2026.",
        "Applications will open on 1 October 2026.",
        "The application period begins on 1 October 2026.",
        "The opening date is 1 October 2026.",
        "You can apply from 1 October 2026.",
        "Applications can be submitted from 1 October 2026.",
        "The application portal opens on 1 February 2027.",
        "Application forms are available from 1 March 2027."
    ];

    for (const sentence of rejected) {
        assert.equal(DATE_CONTEXT.opening.test(sentence), false, sentence);
    }

    for (const sentence of accepted) {
        assert.equal(DATE_CONTEXT.opening.test(sentence), true, sentence);
    }

    // End to end through verifiedDate: the date is in the quote, but only the
    // explicit opening statements count.
    const source = normalizeForMatch([...rejected, ...accepted].join(" "));
    assert.equal(verifiedDate({ date: "2027-10-01", evidence: rejected[0] }, source, DATE_CONTEXT.opening), null);
    assert.equal(verifiedDate({ date: "2027-03-12", evidence: rejected[1] }, source, DATE_CONTEXT.opening), null);
    assert.equal(verifiedDate({ date: "2026-10-01", evidence: accepted[4] }, source, DATE_CONTEXT.opening), "2026-10-01");
    assert.equal(verifiedDate({ date: "2026-10-01", evidence: accepted[5] }, source, DATE_CONTEXT.opening), "2026-10-01");
});

// Which date (if any) a quote gives as the opening date, through verifiedDate.
function openingDatesIn(sentence) {
    const source = normalizeForMatch(sentence);
    return [...extractDates(sentence)].filter((date) => verifiedDate({ date, evidence: sentence }, source, DATE_CONTEXT.opening));
}

test("dates: a deadline in an opening sentence is never taken as the opening date (H1)", () => {
    assert.deepEqual(openingDatesIn("Applications are now open and close on 1 March 2027."), []);
    assert.deepEqual(openingDatesIn("Applications are open and must be submitted by 1 March 2027."), []);
    assert.deepEqual(openingDatesIn("Applications are open until 5 March 2027."), []);
    // Opening and closing dates in one sentence: only the opening date counts.
    assert.deepEqual(openingDatesIn("Applications open on 1 October 2026 and close on 15 January 2027."), ["2026-10-01"]);
});

test("dates: 'opens on/from' needs a sentence about applications (M1)", () => {
    assert.deepEqual(openingDatesIn("The new campus opens on 1 September 2027."), []);
    assert.deepEqual(openingDatesIn("The library opens from 8 am on 1 October 2026."), []);
    assert.deepEqual(openingDatesIn("Applications are open to students who begin their studies on 1 October 2027."), [], "a study start date");
    assert.deepEqual(openingDatesIn("The application portal opens on 1 February 2027."), ["2027-02-01"]);
});

test("dates: common opening formats give the opening date, never the closing date (M2)", () => {
    const cases = [
        ["Application window: 1 October 2026 – 15 January 2027", ["2026-10-01"]],
        ["Application period: 1 October 2026 to 15 January 2027", ["2026-10-01"]],
        ["Applications are accepted between 1 October 2026 and 30 November 2026.", ["2026-10-01"]],
        ["Online applications can be made from 1 October 2026.", ["2026-10-01"]],
        ["Scholarship registration opens: 1 February 2027", ["2027-02-01"]],
        ["Submissions open 1 October 2026", ["2026-10-01"]],
        ["Applications for the Bachelor programme open to international students on 1 October 2026", ["2026-10-01"]],
        ["The call is open from 1 February 2027 to 31 March 2027.", ["2027-02-01"]],
        // Without a full opening date nothing is guessed (the closing date is not used).
        ["Applications are accepted between 1 October and 30 November 2026.", []]
    ];

    for (const [sentence, expected] of cases) {
        assert.deepEqual(openingDatesIn(sentence), expected, sentence);
    }
});

test("dates: an opening date must be introduced by an opening expression (R4)", () => {
    // No opening date at all.
    for (const sentence of [
        "Applications are open now; the deadline for submissions is 1 March 2027.",
        "Applications are open. Final date for receipt of applications: 1 March 2027.",
        "The scholarship covers study from 1 September 2027.",
        "The award will be paid from 1 September 2027.",
        "Applications are open to all students, and the award will be paid from 1 September 2027.",
        "Interviews take place on 15 January 2027.",
        "The scholarship is available from 1 September 2027.",
        "Applications for 2027 entry open in October; the scholarship covers study from 1 September 2027."
    ]) {
        assert.deepEqual(openingDatesIn(sentence), [], sentence);
    }

    // Only the date the opening expression introduces, never the other dates.
    assert.deepEqual(openingDatesIn("Applications open on 1 October 2026 for courses starting on 1 September 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications open on 1 October 2026 for the intake beginning 1 September 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications open on 1 October 2026. Interviews take place on 15 January 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Results will be announced on 1 March 2027; applications open on 1 October 2026."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications open from 1 October 2026, with studies commencing 1 September 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications will be accepted from 1 October 2026; the closing date is 15 January 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("The application window runs from 1 October 2026 until 15 January 2027."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications open from 1 October 2026."), ["2026-10-01"]);
    assert.deepEqual(openingDatesIn("Applications for the MSc programme open on 1 October 2026."), ["2026-10-01"]);
});

test("dates: only scholarship-specific registration is a scholarship opening date (R5)", () => {
    assert.deepEqual(openingDatesIn("University registration opens on 1 March 2027."), []);
    assert.deepEqual(openingDatesIn("Online registration for new students opens on 1 March 2027."), []);
    assert.deepEqual(openingDatesIn("Course registration opens on 1 March 2027."), []);
    assert.deepEqual(openingDatesIn("Registration opens: 1 February 2027"), [], "general registration is ambiguous");
    assert.deepEqual(openingDatesIn("Registration for the scholarship opens on 1 March 2027."), ["2027-03-01"]);
    assert.deepEqual(openingDatesIn("Scholarship applications open on 1 March 2027."), ["2027-03-01"]);
    assert.deepEqual(openingDatesIn("Scholarship applications open on 1 February 2027. University registration opens on 1 March 2027."), ["2027-02-01"]);
});

test("dates: a closure is not cancelled by another scholarship's opening on the same page (M3)", () => {
    const now = new Date("2026-11-15T12:00:00Z");
    const closed = "Applications for 2026-2027 have now closed.";
    const name = "Summer Research Scholarships";

    // A different scholarship opens later, in the same sentence block or under its own heading.
    assert.equal(closedRoundIsCurrent(closed, `Summer Research Scholarships: ${closed} Excellence Scholarship: applications open on 1 March 2027.`, now, name), true);
    assert.equal(closedRoundIsCurrent(closed, `## Summer Research Scholarships\n${closed}\n## International Excellence Scholarship\nApplications open on 1 March 2027.`, now, name), true);
    // An unrelated portal/enrolment date.
    assert.equal(closedRoundIsCurrent("Applications have now closed.", "Applications have now closed. The portal opens on 1 June 2027 for enrolment.", now, name), true);

    // A genuinely newer opening of the same scholarship.
    assert.equal(closedRoundIsCurrent(closed, `Summer Research Scholarships: ${closed} Applications for the 2027-2028 Summer Research Scholarships open on 1 August 2027.`, now, name), false);
    assert.equal(closedRoundIsCurrent("Applications have now closed.", "## Summer Research Scholarships\nApplications have now closed. Applications for the next round open on 1 August 2027.", now, name), false);
});

test("dates: a closed statement only counts when it is about the current round", () => {
    const at = (iso) => new Date(iso);
    const now = at("2026-11-14T12:00:00Z");

    // Historical round: only past years are named.
    assert.equal(closedRoundIsCurrent("Applications for 2025 have closed.", "Applications for 2025 have closed.", now), false);
    // Current and future rounds.
    assert.equal(closedRoundIsCurrent("Applications for 2026-2027 have now closed.", "Applications for 2026-2027 have now closed.", now), true);
    assert.equal(closedRoundIsCurrent("Applications for 2027 have now closed.", "Applications for 2027 have now closed.", now), true);
    // No year: closed, unless the page announces a newer round.
    assert.equal(closedRoundIsCurrent("Applications are now closed.", "Applications are now closed.", now), true);
    assert.equal(closedRoundIsCurrent("Applications are now closed.", "Applications are now closed. Applications opened on 1 March 2026.", now), true, "a past opening is not a newer round");
    assert.equal(closedRoundIsCurrent("Applications are now closed.", "Applications are now closed. Applications for the next round open on 1 March 2027.", now), false);

    // An old closure followed by a newer opening announcement, even while the
    // closed year is not yet in the past.
    const page = "Applications for 2025 have closed. Applications for 2026 open on 1 March 2026.";
    assert.equal(closedRoundIsCurrent("Applications for 2025 have closed.", page, at("2025-12-01T12:00:00Z")), false);
    assert.equal(closedRoundIsCurrent("Applications for 2025 have closed.", "Applications for 2025 have closed.", at("2025-12-01T12:00:00Z")), true, "without the announcement it is the current round");

    // Not a closed statement at all.
    assert.equal(closedRoundIsCurrent("Applications close on 1 December 2026.", "Applications close on 1 December 2026.", now), false);
});

test("dates: only statements that a round has already closed count as closed", () => {
    assert.equal(statesClosed("Applications for 2026-2027 have now closed."), true);
    assert.equal(statesClosed("“Applications are now closed”"), true);
    assert.equal(statesClosed("The 2026 round has closed."), true);
    assert.equal(statesClosed("Applications close on 1 December 2026."), false);
    assert.equal(statesClosed("The application portal closes at midnight."), false);
    assert.equal(statesClosed(null), false);
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
    assert.equal(match.label, "Confirmed eligibility");
});

// Quotes that state the requirement itself (used where a source-backed failure is expected).
const PHD_ONLY = [{ field: "degree", quote: "The programme is open only to PhD candidates." }];
const KENYA_GHANA = "Applicants must be citizens of Kenya or Ghana.";

test("matching: hard requirements that are not met make a student not eligible", () => {
    assert.equal(matchScholarship(STUDENT, scholarship({ degreeLevels: ["phd"], evidence: PHD_ONLY })).level, "not_eligible");
    // A closed round is about timing, not eligibility.
    const closed = matchScholarship(STUDENT, scholarship({ applicationStatus: "closed" }));
    assert.equal(closed.level, "verified");
    assert.equal(statusOf(closed, "deadline"), "not_met");
    assert.equal(matchScholarship(STUDENT, scholarship({
        nationality: { type: "specific", countries: ["Kenya", "Ghana"], text: KENYA_GHANA, evidenceVerified: true }
    })).level, "not_eligible");
    assert.equal(matchScholarship(STUDENT, scholarship({
        nationality: { type: "excluded", countries: ["Pakistan"], text: "Citizens of Pakistan are not eligible for this award.", evidenceVerified: true }
    })).level, "not_eligible");
    assert.equal(matchScholarship({ ...STUDENT, cgpa: "2.5" }, scholarship({
        minGrade: { value: 3.0, scale: 4, evidenceVerified: true }
    })).level, "not_eligible");
});

test("matching: quotes from third-party or unverified sites never give a verified match", () => {
    for (const sourceType of ["third_party", "unknown"]) {
        const match = matchScholarship(STUDENT, scholarship({ sourceType }));

        assert.equal(match.level, "preliminary", sourceType);
        assert.equal(match.eligibilityStatus, "unclear");
        assert.match(match.note, /third-party or unverified website/);
    }

    assert.equal(matchScholarship(STUDENT, scholarship({ sourceType: "university" })).level, "verified");
    assert.equal(matchScholarship(STUDENT, scholarship({ sourceType: "government" })).note, null);
});

test("matching: AI-only or unknown requirements stay preliminary", () => {
    assert.equal(matchScholarship(STUDENT, scholarship({ evidenceVerified: { degree: false } })).level, "preliminary");
    assert.equal(matchScholarship(STUDENT, scholarship({ nationality: { type: "unknown" } })).level, "preliminary");
    assert.equal(matchScholarship(STUDENT, scholarship({ degreeLevels: [] })).level, "preliminary");
    assert.equal(matchScholarship({ ...STUDENT, nationality: "" }, scholarship({
        nationality: { type: "specific", countries: ["Pakistan"], evidenceVerified: true }
    })).level, "preliminary");
});

test("countries: countries named in a quote, by name or nationality", () => {
    assert.deepEqual([...countriesMentioned("Applicants must be citizens of Kenya or Ghana.")].sort(), ["GH", "KE"]);
    assert.deepEqual([...countriesMentioned("Ghanaian and Nigerian applicants only")].sort(), ["GH", "NG"]);
    assert.deepEqual([...countriesMentioned("open to students from developing countries")], []);
    assert.deepEqual([...countriesMentioned("Please contact us for details")], [], "lower-case words are not countries");
});

test("matching: a nationality list must be stated by the quote, not only by the AI", () => {
    const NIGERIAN = { ...STUDENT, nationality: "Nigerian" };

    // "Developing countries" with an AI-made list that omits Nigeria.
    const developing = scholarship({
        nationality: { type: "specific", countries: ["Kenya", "Ghana", "India"], text: "open to students from developing countries", evidenceVerified: true }
    });
    const vague = matchScholarship(NIGERIAN, developing);
    assert.equal(statusOf(vague, "nationality"), "not_met");
    assert.equal(vague.checks.find((item) => item.criterion === "nationality").basis, "ai");
    assert.equal(vague.level, "preliminary", "an AI list for a group is not a stated restriction");

    // A list the quote actually states.
    const stated = scholarship({
        nationality: { type: "specific", countries: ["Kenya", "Ghana"], text: "Applicants must be citizens of Kenya or Ghana.", evidenceVerified: true }
    });
    const ruledOut = matchScholarship(NIGERIAN, stated);
    assert.equal(ruledOut.checks.find((item) => item.criterion === "nationality").basis, "source");
    assert.equal(ruledOut.level, "not_eligible");

    // The same quote with an AI list that adds a country it does not name.
    const padded = scholarship({
        nationality: { type: "specific", countries: ["Kenya", "Ghana", "Uganda"], text: "Applicants must be citizens of Kenya or Ghana.", evidenceVerified: true }
    });
    assert.equal(matchScholarship(NIGERIAN, padded).level, "preliminary");

    // A stated EU/EEA group.
    const eu = scholarship({ nationality: { type: "specific", countries: ["EU/EEA citizens"], text: "Only EU/EEA citizens are eligible.", evidenceVerified: true } });
    assert.equal(matchScholarship(STUDENT, eu).level, "not_eligible");
    const euNotQuoted = scholarship({ nationality: { type: "specific", countries: ["EU/EEA citizens"], text: "Open to students from partner countries.", evidenceVerified: true } });
    assert.equal(matchScholarship(STUDENT, euNotQuoted).level, "preliminary");
});

test("matching: quoted conflicts on third-party pages never give a definitive 'not eligible'", () => {
    const stated = { type: "specific", countries: ["Kenya"], text: "Only Kenyan citizens may apply.", evidenceVerified: true };

    for (const sourceType of ["third_party", "unknown"]) {
        const match = matchScholarship(STUDENT, scholarship({ sourceType, nationality: stated }));
        assert.equal(match.level, "preliminary", sourceType);
        assert.match(match.note, /quoted from a third-party or unverified website conflicts with your profile/);
    }

    assert.equal(matchScholarship(STUDENT, scholarship({ sourceType: "university", nationality: stated })).level, "not_eligible");
});

// Degree check for a student against an official quote.
function degreeResult(levels, quote, degree) {
    const match = matchScholarship({ ...STUDENT, degree }, scholarship({ degreeLevels: levels, evidence: [{ field: "degree", quote }] }));
    const check = match.checks.find((item) => item.criterion === "degree");
    return { level: match.level, status: check.status, basis: check.basis };
}

test("matching: 'only' that restricts something else does not exclude a degree level (C1)", () => {
    const restrictsSomethingElse = [
        [["bachelor", "master"], "This scholarship is tenable only at the University of Toronto for undergraduate and graduate students"],
        [["master"], "Funding is only available for one year. Open to Master's students."],
        [["master"], "The award is not available for part-time study by Master's students"],
        [["master"], "Only international students may apply. Open to Master's students."],
        [["master"], "Only one Master's scholarship is awarded each year."],
        [["master"], "Bachelor's students are not eligible."]
    ];

    for (const [levels, quote] of restrictsSomethingElse) {
        const result = degreeResult(levels, quote, "PhD");
        assert.equal(result.status, "not_met", quote);
        assert.equal(result.basis, "ai", quote);
        assert.equal(result.level, "preliminary", quote);
    }
});

test("matching: a restriction attached to the degree levels excludes other levels (C1)", () => {
    const cases = [
        [["master", "phd"], "Only Master's and PhD students are eligible", "Bachelor"],
        [["master"], "The scholarship is open only to Master's students.", "PhD"],
        [["phd"], "Funding is limited to doctoral candidates.", "Master"],
        [["master", "phd"], "For Master's and PhD students only.", "Bachelor"],
        [["master", "phd"], "Undergraduate students are not eligible for this award.", "Bachelor"]
    ];

    for (const [levels, quote, degree] of cases) {
        const result = degreeResult(levels, quote, degree);
        assert.equal(result.basis, "source", quote);
        assert.equal(result.level, "not_eligible", quote);
    }

    // A listed level is still open.
    assert.equal(degreeResult(["master", "phd"], "Undergraduate students are not eligible for this award.", "PhD").status, "met");
});

// Nationality check for a student against an official quote.
function nationalityResult(rule, nationality) {
    const match = matchScholarship({ ...STUDENT, nationality }, scholarship({ nationality: { evidenceVerified: true, ...rule } }));
    const check = match.checks.find((item) => item.criterion === "nationality");
    return { level: match.level, status: check.status, basis: check.basis };
}

test("matching: example lists and flipped rules never exclude a nationality (C2)", () => {
    // Examples, not an exhaustive list.
    const examples = nationalityResult({ type: "specific", countries: ["Kenya", "Ghana"], text: "Applicants from African countries such as Kenya and Ghana are encouraged to apply." }, "Nigerian");
    assert.equal(examples.basis, "ai");
    assert.notEqual(examples.level, "not_eligible");

    // The AI read an exclusion as "only Kenya".
    const flipped = nationalityResult({ type: "specific", countries: ["Kenya"], text: "Citizens of Kenya are not eligible." }, "Nigerian");
    assert.equal(flipped.basis, "ai");
    assert.notEqual(flipped.level, "not_eligible");

    // The AI read a permission as an exclusion.
    const permission = nationalityResult({ type: "excluded", countries: ["Kenya"], text: "Applicants from Kenya may apply." }, "Kenyan");
    assert.equal(permission.basis, "ai");
    assert.notEqual(permission.level, "not_eligible");

    // "Only ..., including ..." is not a closed list either; nor is "may apply".
    assert.equal(nationalityResult({ type: "specific", countries: ["Kenya", "Ghana"], text: "Only citizens of Kenya, Ghana, including dual nationals, may apply." }, "Nigerian").basis, "ai");
    assert.equal(nationalityResult({ type: "specific", countries: ["Kenya", "Ghana"], text: "Citizens of Kenya or Ghana may apply." }, "Nigerian").level, "preliminary");
});

test("matching: explicit nationality restrictions and exclusions are source-backed (C2)", () => {
    const only = { type: "specific", countries: ["Kenya", "Ghana"], text: "Applicants must be citizens of Kenya or Ghana." };
    assert.deepEqual(nationalityResult(only, "Nigerian"), { level: "not_eligible", status: "not_met", basis: "source" });
    assert.equal(nationalityResult(only, "Kenyan").status, "met");

    const excluded = { type: "excluded", countries: ["Kenya"], text: "Citizens of Kenya are not eligible for this award." };
    assert.deepEqual(nationalityResult(excluded, "Kenyan"), { level: "not_eligible", status: "not_met", basis: "source" });
    assert.deepEqual(nationalityResult(excluded, "Nigerian").status, "met", "only Kenya is excluded");
});

test("matching: 'non-EU' is never read as the EU group (C3)", () => {
    const openToNonEu = { type: "specific", countries: ["non-EU countries"], text: "Open to non-EU/EEA students." };
    const pakistani = nationalityResult(openToNonEu, "Pakistani");
    const german = nationalityResult(openToNonEu, "German");
    assert.equal(pakistani.status, "met", "a Pakistani student is outside the EU");
    assert.notEqual(pakistani.level, "not_eligible");
    assert.equal(german.status, "not_met");
    assert.equal(german.basis, "ai", "'open to' is not an exclusive statement");
    assert.notEqual(german.level, "not_eligible");

    const onlyNonEu = { type: "specific", countries: ["non-EU/EEA"], text: "Only non-EU/EEA students are eligible." };
    assert.equal(nationalityResult(onlyNonEu, "German").level, "not_eligible");
    assert.equal(nationalityResult(onlyNonEu, "Pakistani").status, "met");

    // An AI "EU" group backed only by "outside the EU" wording is not the source's rule.
    const misread = { type: "specific", countries: ["EU/EEA citizens"], text: "Students from outside the EU may apply only for the international track." };
    assert.equal(nationalityResult(misread, "Pakistani").basis, "ai");
    assert.notEqual(nationalityResult(misread, "Pakistani").level, "not_eligible");

    // The real EU group still works.
    assert.equal(nationalityResult({ type: "specific", countries: ["EU/EEA citizens"], text: "Only EU/EEA citizens are eligible." }, "Pakistani").level, "not_eligible");
    assert.equal(nationalityResult({ type: "excluded", countries: ["EU/EEA"], text: "EU/EEA students are not eligible." }, "German").level, "not_eligible");
});

test("matching: illustrative nationality lists never exclude a nationality (R1)", () => {
    for (const text of [
        "Only students from Kenya, Ghana and other African countries may apply.",
        "Applicants from Kenya or Ghana and other countries are eligible.",
        "Applicants from Kenya, Ghana and similar countries may apply.",
        "Applicants from Kenya and Ghana, among others, are encouraged to apply.",
        "Only citizens of Kenya, Ghana or other Commonwealth nations may apply.",
        "Eligible nationalities include, but are not limited to, Kenya and Ghana.",
        "Only applicants from African countries like Kenya and Ghana may apply."
    ]) {
        const result = nationalityResult({ type: "specific", countries: ["Kenya", "Ghana"], text }, "Nigerian");
        assert.equal(result.basis, "ai", text);
        assert.notEqual(result.level, "not_eligible", text);
    }

    // Explicit, closed lists still exclude.
    for (const text of [
        "Only citizens of Kenya or Ghana may apply.",
        "Applicants must be citizens of Kenya or Ghana.",
        "Applicants must be citizens of one of the following countries: Kenya, Ghana."
    ]) {
        assert.deepEqual(nationalityResult({ type: "specific", countries: ["Kenya", "Ghana"], text }, "Nigerian"),
            { level: "not_eligible", status: "not_met", basis: "source" }, text);
    }
});

test("matching: slash-joined and coordinated non-EU/EEA wording keeps its meaning (R2)", () => {
    for (const [text, group] of [
        ["Only non-EU/EEA students are eligible.", "non-EU/EEA"],
        ["Only students from outside the EU/EEA are eligible.", "outside the EU/EEA"],
        ["Only students from outside the EU and EEA are eligible.", "outside the EU and EEA"]
    ]) {
        // Correct AI classification: the source states the non-EU group.
        assert.equal(nationalityResult({ type: "specific", countries: [group], text }, "Pakistani").level, "verified", text);
        assert.deepEqual(nationalityResult({ type: "specific", countries: [group], text }, "German"),
            { level: "not_eligible", status: "not_met", basis: "source" }, text);

        // Incorrect AI classification ("EU/EEA"): nothing source-backed, nobody excluded.
        for (const nationality of ["Pakistani", "German"]) {
            const wrong = nationalityResult({ type: "specific", countries: ["EU/EEA"], text }, nationality);
            assert.equal(wrong.basis, "ai", `${nationality}: ${text}`);
            assert.notEqual(wrong.level, "not_eligible", `${nationality}: ${text}`);
            assert.notEqual(wrong.level, "verified", `${nationality}: ${text}`);
        }
    }

    // A real EU rule still works.
    assert.equal(nationalityResult({ type: "specific", countries: ["EU/EEA"], text: "Only EU/EEA citizens are eligible." }, "Pakistani").level, "not_eligible");
});

test("matching: 'only' must restrict who may apply to exclude a degree level (R3)", () => {
    for (const quote of ["PhD students only need to submit a research proposal.", "Only the PhD stipend is taxable."]) {
        const result = degreeResult(["phd"], quote, "Master");
        assert.equal(result.basis, "ai", quote);
        assert.equal(result.level, "preliminary", quote);
    }

    for (const [levels, quote, degree] of [
        [["phd"], "Only PhD students may apply.", "Master"],
        [["master", "phd"], "Only Master's and PhD students are eligible.", "Bachelor"],
        [["phd"], "The scholarship is limited to doctoral candidates.", "Master"],
        [["phd"], "Master's students are not eligible.", "Master"],
        [["phd"], "Master's students cannot apply for this scholarship.", "Master"]
    ]) {
        const result = degreeResult(levels, quote, degree);
        assert.equal(result.basis, "source", quote);
        assert.equal(result.level, "not_eligible", quote);
    }
});

test("matching: an exclusion from a component or subgroup is not a degree-level exclusion (R6)", () => {
    for (const [levels, quote, degree] of [
        [["phd"], "Master's students are not eligible for the travel grant component.", "Master"],
        [["master"], "The award is not available to undergraduate students in their final year.", "Bachelor"],
        [["master"], "Final-year undergraduate students are not eligible.", "Bachelor"]
    ]) {
        const result = degreeResult(levels, quote, degree);
        assert.equal(result.basis, "ai", quote);
        assert.equal(result.level, "preliminary", quote);
    }

    // The whole scholarship is still excluded when the quote says so.
    assert.equal(degreeResult(["master", "phd"], "Undergraduate students are not eligible for this award.", "Bachelor").level, "not_eligible");
    assert.equal(degreeResult(["phd"], "The scholarship is not open to Master's students.", "Master").level, "not_eligible");
});

test("matching: degree levels a quote merely mentions are not exclusive", () => {
    const BACHELOR = { ...STUDENT, degree: "Bachelor" };
    const mentions = scholarship({ degreeLevels: ["master", "phd"], evidence: [{ field: "degree", quote: "Scholarships for Master's and PhD students." }] });
    const exclusive = scholarship({ degreeLevels: ["master", "phd"], evidence: [{ field: "degree", quote: "Only Master's and PhD students are eligible." }] });

    const mentioned = matchScholarship(BACHELOR, mentions);
    assert.equal(statusOf(mentioned, "degree"), "not_met");
    assert.equal(mentioned.checks.find((item) => item.criterion === "degree").basis, "ai");
    assert.match(mentioned.checks.find((item) => item.criterion === "degree").detail, /does not say whether Bachelor's students are excluded/);
    assert.equal(mentioned.level, "preliminary");

    const excluded = matchScholarship(BACHELOR, exclusive);
    assert.equal(excluded.checks.find((item) => item.criterion === "degree").basis, "source");
    assert.equal(excluded.level, "not_eligible");

    // A listed level is still confirmed by a quote that names it.
    assert.equal(statusOf(matchScholarship(STUDENT, mentions), "degree"), "met");
});

test("matching: only source-stated requirements can rule a student out", () => {
    const aiOnlyNationality = scholarship({ nationality: { type: "specific", countries: ["Kenya"], evidenceVerified: false } });
    const aiMatch = matchScholarship(STUDENT, aiOnlyNationality);
    assert.equal(statusOf(aiMatch, "nationality"), "not_met");
    assert.equal(aiMatch.level, "preliminary", "an AI-only conflict is not a stated requirement");

    const quoted = scholarship({ nationality: { type: "specific", countries: ["Kenya"], text: "Only Kenyan citizens may apply.", evidenceVerified: true } });
    assert.equal(matchScholarship(STUDENT, quoted).level, "not_eligible");

    assert.equal(matchScholarship(STUDENT, scholarship({ degreeLevels: ["phd"], evidenceVerified: { degree: false } })).level, "preliminary");
    assert.equal(matchScholarship({ ...STUDENT, cgpa: "2.5" }, scholarship({ minGrade: { value: 3.0, scale: 4, evidenceVerified: false } })).level, "preliminary");
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
