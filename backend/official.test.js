// Tests for curated official sources, live page reading, application status and
// next-cycle information. No network calls: pages come from a fake fetch.
import { test } from "node:test";
import assert from "node:assert/strict";
import { OFFICIAL_SOURCES, SUPPORTED_COUNTRIES, officialSourcesFor, quotedDegreeLevels } from "./officialSources.js";
import { classifySource, parseSafeUrl } from "./sources.js";
import { extractDates, applicationStatus, nextCycle } from "./dates.js";
import { htmlToText, fetchOfficialPages } from "./pageFetch.js";
import { searchScholarships } from "./scholarshipSearch.js";
import { loadConfig } from "./config.js";
import { createCache } from "./cache.js";

const at = (iso) => new Date(iso);

// --------------------------------------------------------------- source list

test("official sources: every entry is a safe, official, unique URL", () => {
    const ids = new Set();

    for (const entry of OFFICIAL_SOURCES) {
        assert.ok(!ids.has(entry.id), `duplicate id ${entry.id}`);
        ids.add(entry.id);

        const url = parseSafeUrl(entry.url);
        assert.ok(url && url.protocol === "https:", `${entry.id} has an https URL`);
        assert.equal(classifySource(url).official, true, `${entry.id} is classified as official (${url.hostname})`);
        assert.ok(["programme", "directory"].includes(entry.kind));
        assert.ok(["direct", "extract"].includes(entry.fetch));
        assert.ok(SUPPORTED_COUNTRIES.includes(entry.country));
        assert.match(entry.checkedOn, /^\d{4}-\d{2}-\d{2}$/);
    }

    assert.ok(OFFICIAL_SOURCES.length <= 50, "a small curated list, not a catalogue");
});

test("official sources: every supported country has official programmes or university pages", () => {
    for (const code of SUPPORTED_COUNTRIES) {
        const entries = OFFICIAL_SOURCES.filter((entry) => entry.country === code);
        assert.ok(entries.length >= 2, `${code} has at least two official sources`);
        assert.ok(entries.some((entry) => entry.kind === "programme"), `${code} has a named programme`);
    }
});

test("official sources: stated facts carry quotes and dates match their quotes", () => {
    for (const entry of OFFICIAL_SOURCES) {
        if (entry.degreeLevels?.length) {
            // Either a quote that names at least one listed level, or an explicit
            // null when the official page does not name the levels (unconfirmed).
            if (entry.degreeEvidence === null) {
                assert.ok(Object.hasOwn(entry, "degreeEvidence"), `${entry.id} marks its degree levels as unconfirmed`);
            } else {
                assert.ok(entry.degreeEvidence?.length > 10, `${entry.id} quotes its degree levels`);
                assert.ok(quotedDegreeLevels(entry).length > 0, `${entry.id}: the degree quote names at least one listed level`);
            }
        }

        for (const fact of [entry.nationality, entry.funding, entry.howToApply]) {
            if (fact) assert.ok(fact.evidence?.length > 10, `${entry.id} quotes its facts`);
        }

        for (const known of entry.knownDates ?? []) {
            assert.ok(extractDates(known.evidence).has(known.deadlineDate), `${entry.id} deadline ${known.deadlineDate} is in its quote`);
        }

        if (entry.cycle) {
            const month = entry.cycle.opensMonth ?? entry.cycle.closesMonth;
            assert.ok(month >= 1 && month <= 12, `${entry.id} cycle month`);
            assert.ok(entry.cycle.evidence?.length > 10, `${entry.id} cycle has a quote`);
        }
    }
});

test("official sources: a degree level is confirmed only when its quote names it", () => {
    const named = {
        bachelor: /bachelor|undergraduate|first-entry|first-time university/i,
        master: /master|graduate/i,
        phd: /ph\.?\s?d|doctora|postgraduate|graduate (degree|research)|research degree/i
    };

    for (const entry of OFFICIAL_SOURCES.filter((item) => item.degreeLevels?.length)) {
        for (const level of quotedDegreeLevels(entry)) {
            assert.match(entry.degreeEvidence, named[level], `${entry.id}: "${level}" is named in its quote`);
        }
    }

    const byId = (id) => OFFICIAL_SOURCES.find((entry) => entry.id === id);
    assert.equal(byId("boell-foundation").degreeEvidence, "International students who have completed their first degree abroad can apply prior to starting a Master's degree program in Germany");
    assert.deepEqual(quotedDegreeLevels(byId("boell-foundation")), ["master"]);
    assert.deepEqual(quotedDegreeLevels(byId("deutschlandstipendium")), [], "the checked page does not name degree levels");
    assert.deepEqual(quotedDegreeLevels(byId("daad-scholarships")), ["phd"], "'graduates' alone does not confirm a Master's");
    assert.deepEqual(quotedDegreeLevels(byId("chevening")), ["master"]);
});

test("official sources: selection by country and degree", () => {
    const germanyMaster = officialSourcesFor({ countryCodes: ["DE"], degree: "master" });
    assert.ok(germanyMaster.some((entry) => entry.id === "daad-scholarships"));
    assert.ok(germanyMaster.every((entry) => entry.country === "DE"));
    assert.equal(germanyMaster[0].kind, "programme", "programmes first");

    const canadaBachelor = officialSourcesFor({ countryCodes: ["CA"], degree: "bachelor" });
    assert.ok(canadaBachelor.some((entry) => entry.id === "uoft-pearson"));
    assert.ok(!canadaBachelor.some((entry) => entry.degreeLevels?.length && !entry.degreeLevels.includes("bachelor")));

    const anyPhd = officialSourcesFor({ countryCodes: null, degree: "phd" });
    assert.ok(anyPhd.every((entry) => entry.kind === "programme"));
    assert.ok(anyPhd.some((entry) => entry.id === "gates-cambridge"));
    assert.ok(!anyPhd.some((entry) => entry.id === "uoft-pearson"), "bachelor-only programmes are excluded");
});

// ------------------------------------------------------------------- dates

test("deadlines use the provider's time zone when known", () => {
    // 6 November 2026, end of day in Toronto = 7 November 04:59:59 UTC (EST, UTC-5).
    const toronto = "America/Toronto";
    assert.equal(applicationStatus({ deadlineDate: "2026-11-06", timeZone: toronto }, at("2026-11-07T04:30:00Z")), "closing_soon");
    assert.equal(applicationStatus({ deadlineDate: "2026-11-06", timeZone: toronto }, at("2026-11-07T05:30:00Z")), "closed");

    // Without a time zone, "Anywhere on Earth" keeps it open longer.
    assert.equal(applicationStatus({ deadlineDate: "2026-11-06" }, at("2026-11-07T05:30:00Z")), "closing_soon");

    // An invalid time zone falls back to Anywhere on Earth.
    assert.equal(applicationStatus({ deadlineDate: "2026-11-06", timeZone: "Not/AZone" }, at("2026-11-07T05:30:00Z")), "closing_soon");
});

test("next cycle: confirmed, tentative with its basis, or not announced", () => {
    const now = at("2026-11-14T12:00:00Z");
    const pearsonCycle = { opensMonth: 7, cycleYear: 2026, evidence: "nomination form beginning July 6, 2026" };

    const confirmed = nextCycle({ status: "upcoming", openingDate: "2027-02-01", sourceUrl: "https://x.example/" }, now);
    assert.equal(confirmed.type, "confirmed");
    assert.match(confirmed.text, /1 February 2027/);

    const tentative = nextCycle({ status: "closed", cycle: pearsonCycle }, now);
    assert.equal(tentative.type, "tentative");
    assert.equal(tentative.month, "July 2027");
    assert.match(tentative.text, /^Tentatively expected to open in July 2027/);
    assert.match(tentative.basis, /2026 application cycle/);
    assert.match(tentative.basis, /beginning July 6, 2026/);

    const usually = nextCycle({ status: "unknown", cycle: { opensMonth: 10, evidence: "Applications open October 1st" } }, now);
    assert.match(usually.text, /usually open in October each year, so the current round may already be open/);

    const later = nextCycle({ status: "unknown", cycle: { opensMonth: 2, evidence: "Application Period : February - March" } }, now);
    assert.equal(later.month, "February 2027");

    const closesOnly = nextCycle({ status: "closed", cycle: { closesMonth: 3, cycleYear: 2026, evidence: "deadline … 31 March 2026" } }, now);
    assert.match(closesOnly.text, /next deadline is tentatively expected around March 2027; the opening date has not been announced/);

    const unknown = nextCycle({ status: "closed" }, now);
    assert.equal(unknown.type, "unknown");
    assert.equal(unknown.text, "Next application opening date has not yet been announced.");

    assert.equal(nextCycle({ status: "open" }, now), null, "nothing to add while applications are open");
});

// -------------------------------------------------------------- page reading

test("htmlToText keeps content and absolute links, drops scripts and menus", () => {
    const html = `<html><head><title>T</title><script>var secret = 1;</script></head><body>
        <nav><a href="/menu">Menu item</a></nav>
        <main><h2>Scholarship &amp; Funding</h2><p>Apply by <b>15 January 2027</b> at
        <a href="/apply?x=1&amp;y=2">the portal</a>.</p><style>.x{}</style></main>
        <footer>Footer text</footer></body></html>`;

    const text = htmlToText(html, "https://www.example.edu/page");

    assert.match(text, /## Scholarship & Funding/);
    assert.match(text, /Apply by 15 January 2027 at \[the portal\]\(https:\/\/www\.example\.edu\/apply\?x=1&y=2\)/);
    assert.ok(!text.includes("secret") && !text.includes("Menu item") && !text.includes("Footer text"));
});

function htmlResponse(body, status = 200) {
    return new Response(`<html><head><title>Page</title></head><body><main>${body}</main></body></html>`, {
        status, headers: { "content-type": "text/html; charset=utf-8" }
    });
}

const LONG = "<p>" + "Scholarship information for international students. ".repeat(12) + "</p>";

test("official pages: direct reading, fallback to Tavily Extract, and caching", async () => {
    const entries = [
        { id: "a", url: "https://a.example.edu/s", fetch: "direct" },
        { id: "b", url: "https://b.example.edu/s", fetch: "direct" },
        { id: "c", url: "https://c.example.edu/s", fetch: "extract" },
        { id: "d", url: "https://d.example.edu/s", fetch: "direct" }
    ];
    const requested = [];
    const fetchImpl = async (url) => {
        requested.push(url);
        if (url.startsWith("https://a.")) return htmlResponse(LONG);
        if (url.startsWith("https://b.")) return htmlResponse("blocked", 403);
        return new Response("<html><head><title>Just a moment...</title></head></html>", { status: 200, headers: { "content-type": "text/html" } });
    };
    const extracted = [];
    const searchClient = {
        extract: async (urls) => {
            extracted.push(...urls);
            return { results: urls.filter((url) => !url.startsWith("https://d.")).map((url) => ({ url, rawContent: `# Extracted\n${"Scholarship details. ".repeat(30)}` })), failedResults: [], usage: { credits: 1 } };
        }
    };
    const cache = createCache();

    const result = await fetchOfficialPages(entries, { searchClient, cache, logger: { error() {} }, fetchImpl });

    assert.equal(result.pages.get("https://a.example.edu/s").method, "direct");
    assert.equal(result.pages.get("https://b.example.edu/s").method, "extract", "403 falls back to Tavily Extract");
    assert.equal(result.pages.get("https://c.example.edu/s").method, "extract", "known-blocked sites go straight to Extract");
    assert.ok(!requested.includes("https://c.example.edu/s"));
    assert.deepEqual(result.failed, ["https://d.example.edu/s"], "bot-protection page and failed extract");
    assert.equal(result.credits, 1);
    assert.deepEqual(extracted.sort(), ["https://b.example.edu/s", "https://c.example.edu/s", "https://d.example.edu/s"]);

    requested.length = 0;
    const again = await fetchOfficialPages(entries.slice(0, 1), { searchClient, cache, logger: { error() {} }, fetchImpl });
    assert.equal(again.pages.get("https://a.example.edu/s").cached, true);
    assert.equal(requested.length, 0, "cached pages are not requested again");
});

// ------------------------------------------------------------------ pipeline

const PEARSON = OFFICIAL_SOURCES.find((entry) => entry.id === "uoft-pearson");
const NOW = at("2026-11-14T12:00:00Z");

function fakeSearch(results = []) {
    const calls = [];
    return { calls, search: async (query, options) => { calls.push({ query, options }); return { results, usage: { credits: 1 } }; } };
}

function fakeAi(scholarships = [], { fail } = {}) {
    const calls = [];
    return {
        calls,
        chat: { completions: { create: async (request) => {
            calls.push(request);
            if (fail) throw Object.assign(new Error("down"), { status: 500 });
            return { usage: { prompt_tokens: 100, completion_tokens: 50 }, choices: [{ message: { content: JSON.stringify({ scholarships }) } }] };
        } } }
    };
}

// Official pages answer with text that names the programme; others 404.
const officialFetch = (texts = {}) => async (url) => {
    const entry = OFFICIAL_SOURCES.find((candidate) => candidate.url === url);
    if (!entry) return htmlResponse("nothing", 404);
    return htmlResponse(texts[entry.id] ?? `<h2>${entry.name}</h2>${LONG}`);
};

async function run(profile, { search = fakeSearch(), ai = fakeAi(), fetchImpl = officialFetch(), config = {}, now = NOW } = {}) {
    const result = await searchScholarships({
        profile, searchClient: search, aiClient: ai, config: loadConfig({}, config),
        queryCache: createCache(), logger: { log() {}, error() {} }, now, fetchImpl
    });
    return { result, search, ai };
}

const BACHELOR_CANADA = { field: "Economics", degree: "Bachelor", nationality: "Nigerian", destination: "Canada" };

test("pipeline: official programmes for the chosen country are always shown", async () => {
    const { result, search } = await run(BACHELOR_CANADA);
    const names = result.scholarships.map((item) => item.name);

    assert.ok(names.includes("Lester B. Pearson International Student Scholarships"));
    assert.ok(names.includes("McGill Major Entrance Scholarships"));
    assert.ok(result.scholarships.every((item) => item.country === "Canada"));
    assert.equal(search.calls.length, 4, "fewer web searches when official pages cover the country");
    assert.ok(result.coverage.officialPagesRead >= 2);
});

test("pipeline: a closed round shows its status and a tentative next cycle, not 'not eligible'", async () => {
    const { result } = await run(BACHELOR_CANADA);
    const pearson = result.scholarships.find((item) => item.registryId === "uoft-pearson");

    assert.equal(pearson.applicationStatus, "closed");
    assert.equal(pearson.deadlineDate, "2026-11-06");
    assert.equal(pearson.deadline, "6 November 2026");
    assert.equal(pearson.datesCheckedOn, PEARSON.checkedOn);
    assert.notEqual(pearson.match.level, "not_eligible");
    assert.equal(pearson.nextCycle.type, "tentative");
    assert.equal(pearson.nextCycle.month, "July 2027");
    assert.equal(pearson.officialUrl, PEARSON.url);
    assert.equal(pearson.applicationLink, "Not specified", "no unverified application link");
    assert.equal(pearson.sourceType, "university");
    assert.ok(pearson.evidence.some((item) => item.field === "deadline" && item.checkedOn));
});

test("pipeline: dates read live from the official page replace the last check", async () => {
    const live = {
        sourceId: "S1",
        name: "Lester B. Pearson International Student Scholarships",
        deadline: { date: "2027-11-05", text: "November 5, 2027", evidence: "The deadline to complete the Pearson International Scholarship application is November 5, 2027" }
    };
    const page = `<h2>Lester B. Pearson International Student Scholarships</h2><p>The deadline to complete the Pearson International Scholarship application is November 5, 2027.</p>${LONG}`;
    const { result } = await run({ ...BACHELOR_CANADA }, {
        ai: fakeAi([live]),
        fetchImpl: officialFetch({ "uoft-pearson": page }),
        config: { officialPagesMax: 1 },
        now: at("2027-08-01T12:00:00Z")
    });
    const pearson = result.scholarships.find((item) => item.registryId === "uoft-pearson");

    assert.equal(pearson.deadlineDate, "2027-11-05");
    assert.equal(pearson.applicationStatus, "open");
    assert.equal(pearson.datesCheckedOn, undefined, "live dates, not the saved ones");
    assert.equal(pearson.officialPage.readLive, true);
});

test("pipeline: dates from an old round are not shown as this year's status", async () => {
    const { result } = await run(BACHELOR_CANADA, { now: at("2027-09-01T12:00:00Z") });
    const pearson = result.scholarships.find((item) => item.registryId === "uoft-pearson");

    assert.equal(pearson.applicationStatus, "unknown");
    assert.equal(pearson.deadlineDate, null);
    assert.match(pearson.nextCycle.text, /usually open in July each year, so the current round may already be open/);
});

test("pipeline: an open round with a known deadline is OPEN", async () => {
    const { result } = await run({ field: "Engineering", degree: "Master", destination: "France" });
    const eiffel = result.scholarships.find((item) => item.registryId === "eiffel");

    assert.equal(eiffel.applicationStatus, "open");
    assert.equal(eiffel.deadline, "6 January 2027");
    assert.equal(eiffel.nextCycle, null);
});

test("pipeline: official programmes still appear when the AI and the web search fail", async () => {
    const failingSearch = { search: async () => { throw new Error("down"); } };
    const { result } = await run(BACHELOR_CANADA, { search: failingSearch, ai: fakeAi([], { fail: true }) });

    assert.ok(result.scholarships.some((item) => item.registryId === "uoft-pearson"));
    assert.ok(result.coverage.notes.some((note) => /searches did not complete/.test(note)));
    assert.ok(result.coverage.notes.some((note) => /Live details could not be analyzed/.test(note)));
});

test("pipeline: unreadable official pages are still listed with a note", async () => {
    const { result } = await run(BACHELOR_CANADA, { fetchImpl: async () => htmlResponse("", 503) });

    assert.ok(result.scholarships.some((item) => item.registryId === "uoft-pearson"));
    assert.ok(result.coverage.notes.some((note) => /official page\(s\) could not be read right now/.test(note)));
    const pearson = result.scholarships.find((item) => item.registryId === "uoft-pearson");
    assert.equal(pearson.officialPage.readLive, false);
});

test("pipeline: a third-party copy of an official programme merges into the official one", async () => {
    const blog = { title: "Top Canadian scholarships", url: "https://www.scholars4dev.com/canada", content: `Lester B. Pearson International Student Scholarships at the University of Toronto. ${"More scholarship information. ".repeat(10)}`, score: 0.9 };
    const fromBlog = { sourceId: "S6", name: "Lester B. Pearson International Student Scholarships", summary: "From a blog.", assessment: { status: "likely_match", reason: "x" } };
    const { result } = await run(BACHELOR_CANADA, { search: fakeSearch([blog]), ai: fakeAi([fromBlog]) });

    const pearsons = result.scholarships.filter((item) => /Pearson/.test(item.name));
    assert.equal(pearsons.length, 1);
    assert.equal(pearsons[0].sourceType, "university");
    assert.ok(pearsons[0].otherSources.some((source) => source.url === "https://www.scholars4dev.com/canada"));
});

test("pipeline: Böll's Master's level is confirmed by its quote, other levels are not", async () => {
    const master = await run({ field: "Physics", degree: "Master", nationality: "Kenyan", destination: "Germany" });
    const boellMaster = master.result.scholarships.find((item) => item.registryId === "boell-foundation");
    assert.equal(boellMaster.match.checks.find((item) => item.criterion === "degree").basis, "source");
    assert.equal(boellMaster.degreeLevel, "Master; Bachelor, PhD (unconfirmed)");
    assert.ok(boellMaster.evidence.some((item) => item.field === "degree" && /Master's degree program/.test(item.quote)));

    const bachelor = await run({ field: "Physics", degree: "Bachelor", nationality: "Kenyan", destination: "Germany" });
    const boellBachelor = bachelor.result.scholarships.find((item) => item.registryId === "boell-foundation");
    assert.equal(boellBachelor.match.checks.find((item) => item.criterion === "degree").basis, "ai");
    assert.notEqual(boellBachelor.match.level, "verified");
});

test("pipeline: Böll's policy-change sentence is not an opening date", async () => {
    const policy = "Note for Master's students: Starting March 1, 2027, we will only accept applications for first-cycle programs.";
    const page = `<h2>Heinrich Böll Foundation Scholarships</h2><p>Each year, we run two application procedures. The deadlines are 1 March and 1 September.</p><p>${policy}</p>${LONG}`;
    const live = {
        sourceId: "S1",
        name: "Heinrich Böll Foundation Scholarships",
        openingDate: { date: "2027-03-01", text: "1 March 2027", evidence: "Starting March 1, 2027, we will only accept applications for first-cycle programs" }
    };
    const { result } = await run({ field: "Physics", degree: "Master", nationality: "Kenyan", destination: "Germany" }, {
        ai: fakeAi([live]),
        fetchImpl: officialFetch({ "boell-foundation": page })
    });
    const boell = result.scholarships.find((item) => item.registryId === "boell-foundation");

    assert.equal(boell.officialPage.readLive, true);
    assert.equal(boell.openingDate, null);
    assert.equal(boell.applicationStatus, "unknown", "the page gives no year-specific dates");
    assert.notEqual(boell.nextCycle?.type, "confirmed");
});

test("pipeline: official pages record whether they were analysed, downloaded, unavailable or not requested", async () => {
    const { result } = await run(BACHELOR_CANADA, {
        fetchImpl: async (url) => url === PEARSON.url ? htmlResponse("blocked", 403) : officialFetch()(url),
        config: { officialPagesMax: 2 }
    });
    const pageOf = (id) => result.scholarships.find((item) => item.registryId === id)?.officialPage;

    assert.equal(pageOf("uoft-pearson").liveStatus, "unavailable");
    assert.equal(pageOf("uoft-pearson").readLive, false);
    assert.equal(pageOf("mcgill-entrance").liveStatus, "analysed", "downloaded and analysed by the (fake) AI");
    assert.equal(pageOf("mcgill-entrance").readLive, true);

    const listedOnly = await run({ field: "Engineering", degree: "Master", destination: "France" }, { config: { officialPagesMax: 1 } });
    const notRead = listedOnly.result.scholarships.filter((item) => item.officialPage && !item.officialPage.readLive);
    assert.ok(notRead.length > 0);
    assert.ok(notRead.every((item) => item.officialPage.liveStatus === "not_requested"));
});

const FRANCE_MASTER = { field: "Engineering", degree: "Master", nationality: "Kenyan", destination: "France" };
const EIFFEL = OFFICIAL_SOURCES.find((entry) => entry.id === "eiffel");

function eiffelLive(statement) {
    const page = `<h2>${EIFFEL.name}</h2><p>${statement}</p>${LONG}`;
    const live = {
        sourceId: "S1",
        name: EIFFEL.name,
        deadline: { date: null, text: "Closed", evidence: statement.split(". ")[0].replace(/\.$/, "") + "." }
    };
    return { ai: fakeAi([live]), fetchImpl: officialFetch({ eiffel: page }), config: { officialPagesMax: 1 } };
}

test("pipeline: a live 'now closed' statement on the official page beats a future stored deadline", async () => {
    // Control: without the statement, the stored future deadline makes the round OPEN.
    const control = (await run(FRANCE_MASTER)).result.scholarships.find((item) => item.registryId === "eiffel");
    assert.equal(control.applicationStatus, "open");
    assert.ok(Date.parse(`${EIFFEL.knownDates[0].deadlineDate}T00:00:00Z`) > NOW.getTime(), "the stored deadline is in the future");

    const { result } = await run(FRANCE_MASTER, eiffelLive("Applications for the 2027 Eiffel programme have now closed."));
    const eiffel = result.scholarships.find((item) => item.registryId === "eiffel");

    assert.equal(eiffel.applicationStatus, "closed");
    assert.equal(eiffel.deadlineDate, null, "the stale stored deadline is not used");
    assert.equal(eiffel.datesCheckedOn, undefined);
    assert.equal(eiffel.datesSource, "official_live");
    assert.equal(eiffel.officialPage.liveStatus, "analysed");
    assert.notEqual(eiffel.match.level, "not_eligible", "a closed round is not ineligibility");
    assert.equal(eiffel.match.checks.find((item) => item.criterion === "deadline").hard, false);
});

test("pipeline: a closure of an older round does not close the current one", async () => {
    const { result } = await run(FRANCE_MASTER, eiffelLive("Applications for 2025 have closed. Applications for the 2027 programme open on 1 October 2026."));
    const eiffel = result.scholarships.find((item) => item.registryId === "eiffel");

    assert.notEqual(eiffel.applicationStatus, "closed");
    assert.equal(eiffel.applicationStatus, "open", "the stored current-round deadline still applies");
});

test("pipeline: a page that was downloaded but not analysed is not reported as analysed", async () => {
    const { result } = await run(BACHELOR_CANADA, { ai: fakeAi([], { fail: true }) });
    const pearson = result.scholarships.find((item) => item.registryId === "uoft-pearson");

    assert.equal(pearson.officialPage.readLive, true, "the page was downloaded");
    assert.equal(pearson.officialPage.liveStatus, "downloaded");
    assert.equal(pearson.datesSource, "official_stored");
    assert.equal(pearson.datesCheckedOn, PEARSON.checkedOn);

    // Analysed even when the AI found nothing on the page.
    const analysed = await run(BACHELOR_CANADA, { ai: fakeAi([]) });
    assert.equal(analysed.result.scholarships.find((item) => item.registryId === "uoft-pearson").officialPage.liveStatus, "analysed");
});

test("pipeline: dates from a third-party copy never become an official programme's dates", async () => {
    const blog = { title: "Top Canadian scholarships", url: "https://www.scholars4dev.com/canada", content: `Lester B. Pearson International Student Scholarships at the University of Toronto. Application deadline: 30 January 2027. ${"More scholarship information. ".repeat(10)}`, score: 0.9 };
    const fromBlog = {
        sourceId: "S6",
        name: "Lester B. Pearson International Student Scholarships",
        deadline: { date: "2027-01-30", text: "30 January 2027", evidence: "Application deadline: 30 January 2027" },
        summary: "From a blog.",
        assessment: { status: "unclear", reason: "x" }
    };
    const { result } = await run(BACHELOR_CANADA, { search: fakeSearch([blog]), ai: fakeAi([fromBlog]) });
    const pearson = result.scholarships.find((item) => /Pearson/.test(item.name));

    assert.equal(pearson.registryId, "uoft-pearson");
    assert.equal(pearson.deadlineDate, PEARSON.knownDates[0].deadlineDate, "official stored date, not the blog's");
    assert.equal(pearson.datesSource, "official_stored");
    assert.ok(pearson.otherSources.some((source) => source.url === blog.url), "the blog is only a reference");

    // On its own, a third-party result is labelled as such.
    const { result: webOnly } = await run({ field: "Economics", degree: "Bachelor", nationality: "Nigerian", destination: "Netherlands" }, {
        search: fakeSearch([{ ...blog, url: "https://www.scholars4dev.com/netherlands", content: blog.content.replace(/Lester B\. Pearson International Student Scholarships at the University of Toronto/, "Holland Excellence Scholarship") }]),
        ai: fakeAi([{ ...fromBlog, sourceId: "S1", name: "Holland Excellence Scholarship" }])
    });
    const holland = webOnly.scholarships.find((item) => item.name === "Holland Excellence Scholarship");
    assert.equal(holland.datesSource, "third_party_source");
});

test("pipeline: a quote that mentions Master's and PhD does not rule out a Bachelor's student; 'only' does", async () => {
    // The official list is filtered by degree level, so this matters for web results.
    const levelsFor = async (sentence) => {
        const page = {
            title: "Graduate funding",
            url: "https://www.example.edu/funding",
            content: `Example Graduate Fellowship. ${sentence} Applicants from all countries may apply. ${"More scholarship information. ".repeat(10)}`,
            score: 0.9
        };
        const item = {
            sourceId: "S1",
            name: "Example Graduate Fellowship",
            degreeLevels: ["master", "phd"],
            degreeEvidence: sentence.replace(/\.$/, ""),
            nationality: { type: "any", countries: [], evidence: "Applicants from all countries may apply" },
            summary: "x",
            assessment: { status: "unclear", reason: "y" }
        };
        const { result } = await run({ field: "Physics", degree: "Bachelor", nationality: "Kenyan", destination: "Netherlands" }, {
            search: fakeSearch([page]),
            ai: fakeAi([item])
        });
        return result.scholarships.find((entry) => entry.name === "Example Graduate Fellowship");
    };

    const mentions = await levelsFor("The fellowship supports Master's and PhD students.");
    assert.equal(mentions.sourceType, "university");
    assert.equal(mentions.match.checks.find((item) => item.criterion === "degree").basis, "ai");
    assert.equal(mentions.match.level, "preliminary");

    const only = await levelsFor("The fellowship is open only to Master's and PhD students.");
    assert.equal(only.match.checks.find((item) => item.criterion === "degree").basis, "source");
    assert.equal(only.match.level, "not_eligible");
});

test("pipeline: results that are not named like scholarships are dropped", async () => {
    const page = { title: "Admissions", url: "https://www.example.org/admissions", content: `Admissions Office of Example University. ${"General scholarship and admissions information. ".repeat(10)}`, score: 0.9 };
    const items = [{ sourceId: "S1", name: "Admissions Office" }, { sourceId: "S1", name: "Example University" }];
    const { result } = await run({ field: "Law", degree: "Master", destination: "Netherlands" }, { search: fakeSearch([page]), ai: fakeAi(items) });

    assert.deepEqual(result.scholarships, []);
});

test("pipeline: unsupported destinations use web search only", async () => {
    const { result, search } = await run({ field: "Law", degree: "Master", nationality: "Kenyan", destination: "Netherlands" });

    assert.equal(search.calls.length, 6);
    assert.equal(result.coverage.officialProgrammesListed, 0);
});

test("pipeline: without a destination, official programmes from all countries are listed", async () => {
    const { result } = await run({ field: "Engineering", degree: "Master", destination: "" });
    const countries = new Set(result.scholarships.map((item) => item.country));

    assert.ok(result.scholarships.length >= 10);
    assert.ok(countries.size >= 5, `several countries (${[...countries].join(", ")})`);
    assert.ok(result.scholarships.every((item) => item.officialUrl), "every listed programme links to its official page");
    assert.ok(result.coverage.notes.some((note) => /more official programme\(s\) are listed/.test(note)));
});

test("pipeline: confirmed eligibility only from official quotes; others stay preliminary", async () => {
    const { result } = await run({ field: "Physics", degree: "Master", nationality: "Kenyan", destination: "Germany" });
    const deutschland = result.scholarships.find((item) => item.registryId === "deutschlandstipendium");
    const daad = result.scholarships.find((item) => item.registryId === "daad-scholarships");

    // The checked Deutschlandstipendium page quotes "all nationalities" but does not
    // name degree levels, so the Master's level is not confirmed by the source.
    assert.equal(deutschland.match.level, "preliminary");
    assert.equal(deutschland.match.checks.find((item) => item.criterion === "degree").basis, "ai");
    assert.equal(deutschland.degreeLevel, "Bachelor, Master (unconfirmed)");
    assert.ok(!deutschland.evidence.some((item) => item.field === "degree"), "no degree quote is shown as evidence");
    assert.equal(daad.match.level, "preliminary", "nationality rules are not stated, so not confirmed");
    assert.equal(JSON.stringify(result).includes("%\""), false, "no percentage scores");
});
