// Date handling for scholarship deadlines.
//
// Policy (documented in README):
// - A date is only accepted when the source text itself states a complete,
//   unambiguous calendar date (day, month and year). Dates are never guessed.
// - Deadlines are treated as "Anywhere on Earth" (UTC-12): a deadline only
//   counts as passed once that calendar day has ended in every time zone.
// - Opening dates count as reached once that day has started in the earliest
//   time zone (UTC+14).
// - "Closing soon" means the deadline is at most 30 days away.

const MONTHS = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9,
    september: 9, oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12
};

const MONTH_PATTERN = "(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?";
const DAY_PATTERN = "(\\d{1,2})(?:st|nd|rd|th)?";
const YEAR_PATTERN = "(\\d{4})";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export const CLOSING_SOON_DAYS = 30;

function toIso(year, month, day) {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);

    if (!Number.isInteger(y) || y < 2000 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) {
        return null;
    }

    const date = new Date(Date.UTC(y, m - 1, d));

    // Reject impossible dates such as 31 February.
    if (date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
        return null;
    }

    return date.toISOString().slice(0, 10);
}

// Every complete, unambiguous date written in the text, with its position.
function dateMentions(text) {
    const found = [];

    if (typeof text !== "string") {
        return found;
    }

    const lower = text.toLowerCase();
    const add = (iso, match) => {
        if (iso) found.push({ iso, index: match.index, end: match.index + match[0].length });
    };

    // 2027-01-15
    for (const m of lower.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
        add(toIso(m[1], m[2], m[3]), m);
    }

    // 15 January 2027, 15th of January, 2027
    const dayFirst = new RegExp(`\\b${DAY_PATTERN}\\s+(?:of\\s+)?${MONTH_PATTERN},?\\s+${YEAR_PATTERN}\\b`, "g");
    for (const m of lower.matchAll(dayFirst)) {
        add(toIso(m[3], MONTHS[m[2].replace(/\.$/, "")], m[1]), m);
    }

    // January 15, 2027
    const monthFirst = new RegExp(`\\b${MONTH_PATTERN}\\s+${DAY_PATTERN},?\\s+${YEAR_PATTERN}\\b`, "g");
    for (const m of lower.matchAll(monthFirst)) {
        add(toIso(m[3], MONTHS[m[1].replace(/\.$/, "")], m[2]), m);
    }

    // 15.01.2027 or 15/01/2027: only when day and month cannot be confused.
    for (const m of lower.matchAll(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/g)) {
        const a = Number(m[1]);
        const b = Number(m[2]);
        let iso = null;

        if (a === b) {
            iso = toIso(m[3], a, b);
        } else if (a > 12 && b <= 12) {
            iso = toIso(m[3], b, a);
        } else if (b > 12 && a <= 12) {
            iso = toIso(m[3], a, b);
        }

        add(iso, m);
    }

    return found.sort((x, y) => x.index - y.index);
}

// Returns every complete, unambiguous date written in the text, as YYYY-MM-DD.
export function extractDates(text) {
    return new Set(dateMentions(text).map((mention) => mention.iso));
}

// Normalizes text for "does this quote appear in the source?" comparisons.
export function normalizeForMatch(text) {
    return String(text ?? "")
        .normalize("NFKC")
        .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // markdown links -> link text
        .replace(/[‘’`´]/g, "'")
        .replace(/[“”]/g, "\"")
        .replace(/[‐-―−]/g, "-")
        .replace(/[*_#>|]/g, " ")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

// Removes quotation marks the AI sometimes wraps around a quote.
export function unwrapQuote(quote) {
    return typeof quote === "string"
        ? quote.trim().replace(/^["'“”‘’«»„\s]+|["'“”‘’«»„\s]+$/g, "")
        : quote;
}

// True when the evidence quote is actually present in the source text.
// Quotes shortened with "..." must have every part present.
export function quoteInSource(quote, normalizedSource) {
    if (typeof quote !== "string") {
        return false;
    }

    const parts = unwrapQuote(quote).split(/\.\.\.|…/).map(normalizeForMatch).filter((part) => part.length > 0);

    if (parts.length === 0 || parts.join(" ").length < 8) {
        return false;
    }

    return parts.every((part) => part.length >= 4 && normalizedSource.includes(part));
}

// Words that show a quote is about applications, so a programme start date
// ("the scholarship begins on 1 October") is not mistaken for a deadline.
export const DATE_CONTEXT = {
    deadline: /deadline|apply|applica|submi|close|closing|until|no later than|due|bewerbung/i,
    // Opening dates need explicit wording about an application round opening, in a
    // sentence about applications. A bare "open" is not enough: "open to students
    // who begin on 1 October", "Open Day: 12 March", "The new campus opens on ..."
    // and "Starting 1 March 2027, we will only accept applications for ..." are not
    // opening dates. Which date in the sentence is the opening date is checked
    // separately (openingDateFits), so "Applications are open and close on 1 March"
    // does not give an opening date.
    opening: new RegExp([
        // "Applications open on ...", "Submissions open 1 October", "Scholarship registration opens: ..."
        // (general university, student or course registration is not a scholarship opening)
        String.raw`\b(applications?|submissions?|(?:scholarship|award|fellowship|bursary|application)\s+registration|registration\s+for\s+(?:the|this)\s+(?:scholarship|award|fellowship|bursary)|nominations?|(the\s+)?call(\s+for\s+applications)?)\b[^.]{0,60}?\b(will\s+(now\s+)?)?(be\s+)?(re)?open(s|ed)?\b(?!\s+(until|till)\b)`,
        // "The application period begins ...", "The application portal opens on ..."
        String.raw`\bapplication\s+(period|window|round|cycle|portal|process|form)s?\b[^.]{0,40}?\b(begins|starts|opens|commences|is\s+open|will\s+(be\s+)?open)\b`,
        // "Application window: 1 October 2026 – 15 January 2027", "The opening date is ..."
        String.raw`\bapplication\s+(period|window)\s*(:|is|runs|-|–)`,
        String.raw`\b(application\s+)?opening\s+date\b`,
        // "You can apply from ...", "Applications can be submitted / made / accepted from ..."
        String.raw`\bapply\s+(from|starting|beginning)\b`,
        String.raw`\bapplications?\b[^.]{0,40}?\b(submitted|made|accepted|lodged|received)\s+(from|starting|beginning|between)\b`,
        String.raw`\bstart(s|ing)?\s+accepting\s+applications\b`,
        String.raw`\baccepting\s+applications\s+(from|on|starting)\b`,
        String.raw`\bapplications?(\s+forms?)?\b[^.]{0,40}?\bavailable\s+from\b`,
        String.raw`\bcall\s+for\s+applications\b[^.]{0,40}?\b(opens|starts|begins|launch\w*|is\s+published|will\s+be\s+published)\b`
    ].join("|"), "i")
};

// A statement without a full date that a round has already closed, e.g.
// "Applications for 2026-2027 have now closed." ("Applications close on ..." is
// about a future deadline and does not match.)
const CLOSED_STATEMENT = /\b(applications?|round|call)\b[^.]{0,80}?\b(has|have|is|are)\s+(now\s+)?closed\b|\bapplications?\s+(are|is)\s+now\s+closed\b/i;

export function statesClosed(quote) {
    return typeof quote === "string" && CLOSED_STATEMENT.test(unwrapQuote(quote));
}

const yearsIn = (text) => [...String(text ?? "").matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));

// Scholarship names written on a page ("Summer Research Scholarships",
// "Excellence Scholarship"), so statements about one scholarship are not
// applied to another on the same page.
const SCHOLARSHIP_NAME = /\b[A-Z][\w'’&-]*(?:\s+(?:of|for|and|the|in|[A-Z][\w'’&-]*))*\s+(?:Scholarships?|Awards?|Fellowships?|Grants?|Bursar(?:y|ies)|Stipends?|Prizes?|Studentships?)\b/g;
const nameKey = (name) => normalizeForMatch(name).replace(/[^a-z0-9 ]+/g, " ").replace(/\b(the|scholarships?|awards?|fellowships?|grants?|bursar(?:y|ies)|stipends?|prizes?|studentships?)\b/g, " ").replace(/\s+/g, " ").trim();
// Known limitation: names are compared by substring, so "Excellence Scholarship"
// also matches "Vice-Chancellor's Excellence Scholarship". An opening of the other
// scholarship can then cancel a closure (the round falls back to its dates). It
// never confirms a new cycle: a confirmed opening date needs the result's own
// quoted opening statement (see verifiedDate / openingDateFits).
const sameName = (a, b) => {
    const x = nameKey(a);
    const y = nameKey(b);
    return Boolean(x && y) && (x === y || x.includes(y) || y.includes(x));
};

// Whether a "has closed" statement is about the current round:
// - a statement naming only past years ("Applications for 2025 have closed",
//   checked in 2026) is about an old round;
// - when the same page announces a newer round of THE SAME scholarship (an
//   opening statement for a later year, or with a future date), the closure does
//   not describe the current round. Openings of other scholarships on the page
//   (named in the sentence, or under another scholarship's heading) are ignored.
// Nothing is inferred when the page does not say so.
export function closedRoundIsCurrent(quote, pageText, now = new Date(), scholarshipName = null) {
    if (!statesClosed(quote)) {
        return false;
    }

    const closedYears = yearsIn(unwrapQuote(quote));
    const latestClosed = closedYears.length > 0 ? Math.max(...closedYears) : null;

    if (latestClosed !== null && latestClosed < now.getUTCFullYear()) {
        return false;
    }

    const quoteKey = normalizeForMatch(unwrapQuote(quote));
    // The scholarship a sentence is about: one it names, otherwise the one most
    // recently named before it (a heading or an earlier sentence). Page text often
    // has no line breaks, so this does not rely on headings alone.
    let current = null;

    for (const sentence of String(pageText ?? "").split(/(?<=[.!?])\s+|\n+/)) {
        if (!sentence.trim()) continue;

        const named = sentence.match(SCHOLARSHIP_NAME) ?? [];
        const about = named.length > 0 ? named : current ? [current] : [];
        if (named.length > 0) current = named[named.length - 1];

        if (!DATE_CONTEXT.opening.test(sentence) || statesClosed(sentence)) continue;
        if (quoteKey && normalizeForMatch(sentence).includes(quoteKey)) continue;

        // Only openings of the same scholarship count. Without the closed
        // scholarship's name, a named opening cannot be tied to it.
        if (about.length > 0 && !(scholarshipName && about.some((name) => sameName(name, scholarshipName)))) continue;

        const newerYear = latestClosed !== null && yearsIn(sentence).some((year) => year > latestClosed);
        const futureDate = [...extractDates(sentence)].some((date) =>
            openingDateFits(sentence, date) && Date.parse(`${date}T23:59:59Z`) >= now.getTime());

        if (newerYear || futureDate) {
            return false;
        }
    }

    return true;
}

// An application-opening expression that must come DIRECTLY before the date, in
// the same clause: "Applications open on [date]", "Applications can be submitted
// from [date]", "Application window: [date] – ...", "The opening date is [date]".
// A date is only an opening date when it is introduced like this; a sentence
// that merely says "applications are open" somewhere does not make any of its
// dates an opening date ("Applications are open now; the deadline for
// submissions is 1 March 2027").
const APPLICATION_SUBJECT = String.raw`(?:applications?|submissions?|nominations?|(?:scholarship|award|fellowship|bursary|application)\s+registration|registration\s+for\s+(?:the|this)\s+(?:scholarship|award|fellowship|bursary)|(?:the\s+)?call(?:\s+for\s+applications)?|application\s+(?:portal|form|process|round|cycle))`;
const OPENING_LEAD = new RegExp("(?:" + [
    // "Applications open on", "Applications will open from", "The call is open from",
    // "Applications for the Bachelor programme open to international students on"
    String.raw`\b${APPLICATION_SUBJECT}\b[^.;]{0,60}?\b(?:(?:will\s+(?:now\s+)?)?(?:re)?open(?:s|ed)?|(?:is|are|will\s+be)\s+open)(?:\s+to\s+(?:(?!(?:and|or|but|while|will|be|is|are|was|were|paid|awarded)\b)[\w'’-]+\s+){1,5}?)?\s*(?:on|from|starting|beginning|as\s+of)?\s*:?`,
    // "The opening date is", "Opening date:"
    String.raw`\b(?:application\s+)?opening\s+date\s*(?:is|:|-|–)?`,
    // "Application window: ", "Application period runs from"
    String.raw`\bapplication\s+(?:period|window)\s*(?:is|:|runs|-|–)?\s*(?:from)?`,
    // "The application period begins on"
    String.raw`\bapplication\s+(?:period|window|round|cycle|portal|process)\b[^.;]{0,30}?\b(?:begins|starts|opens|commences)\s*(?:on|from)?\s*:?`,
    // "You can apply from"
    String.raw`\bapply\s+(?:from|starting|beginning)`,
    // "Applications can be submitted / made / accepted from", "accepted between"
    String.raw`\b${APPLICATION_SUBJECT}\b[^.;]{0,40}?\b(?:submitted|made|accepted|lodged|received)\s+(?:from|starting|beginning|between)`,
    String.raw`\bstart(?:s|ing)?\s+accepting\s+applications\s+(?:on|from)`,
    String.raw`\baccepting\s+applications\s+(?:from|on|starting)`,
    // "Application forms are available from"
    String.raw`\bapplications?(?:\s+forms?)?\b[^.;]{0,40}?\bavailable\s+from`,
    // "The call for applications starts on"
    String.raw`\bcall\s+for\s+applications\b[^.;]{0,40}?\b(?:opens|starts|begins|launch\w*)\s*(?:on|from)?`
].join("|") + String.raw`)\s*(?:the\s+)?$`, "i");

// Words right before a date that make it a deadline, the end of a range or a
// study start date (kept as an extra safeguard).
const DEADLINE_BEFORE = /\b(close[sd]?|closing|deadline|due|until|till|by|before|no\s+later\s+than|ends?|ending|expires?)\b[^.\d]{0,12}$/i;
const RANGE_END_BEFORE = /(\band|\bto|\bthrough|\buntil|[-–—])\s*$/i;
const STUDY_START_BEFORE = /\b(studies|classes|semester|courses?|enrol\w*|arrive|arrival|intake|commenc\w*)\b[^.\d]{0,30}$/i;

// Whether a date in an opening statement is the opening date: it must be
// introduced by an application-opening expression in the same clause, and must
// not be a deadline, the end of a range or a study start date.
export function openingDateFits(quote, isoDate) {
    const text = unwrapQuote(quote);
    const mentions = dateMentions(text).filter((mention) => mention.iso === isoDate);

    return mentions.some((mention) => {
        // The clause the date is in: back to the previous sentence or clause break.
        const upTo = text.slice(0, mention.index);
        const clauseStart = Math.max(upTo.lastIndexOf(". "), upTo.lastIndexOf(";"), upTo.lastIndexOf("\n"), -1) + 1;
        const clause = upTo.slice(clauseStart);
        const near = upTo.slice(Math.max(0, mention.index - 40));

        return OPENING_LEAD.test(clause) &&
            !DEADLINE_BEFORE.test(near) && !RANGE_END_BEFORE.test(near) && !STUDY_START_BEFORE.test(near);
    });
}

// Accepts a date claimed by the AI only if the quoted source text contains it
// (and, when a context pattern is given, the quote is about applications).
export function verifiedDate(claim, normalizedSource, context) {
    if (!claim || typeof claim !== "object") {
        return null;
    }

    const date = typeof claim.date === "string" ? claim.date.trim() : "";

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !quoteInSource(claim.evidence, normalizedSource)) {
        return null;
    }

    if (context && !context.test(claim.evidence)) {
        return null;
    }

    if (!extractDates(unwrapQuote(claim.evidence)).has(date)) {
        return null;
    }

    // For opening dates, the date itself must be the opening date of the sentence.
    if (context === DATE_CONTEXT.opening && !openingDateFits(claim.evidence, date)) {
        return null;
    }

    return date;
}

// Offset of a time zone from UTC (in ms) at a given instant.
function zoneOffset(time, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(time));
    const value = (type) => Number(parts.find((part) => part.type === type).value);

    return Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second")) - time;
}

function deadlineEnd(isoDate, timeZone) {
    const endOfDayUtc = Date.parse(`${isoDate}T23:59:59Z`);

    if (timeZone) {
        try {
            // 23:59:59 local time in the provider's time zone.
            return endOfDayUtc - zoneOffset(endOfDayUtc, timeZone) + 999;
        } catch {
            // Unknown time zone: fall back to Anywhere on Earth.
        }
    }

    // End of the day at UTC-12 ("Anywhere on Earth").
    return Date.parse(`${isoDate}T00:00:00Z`) + DAY + 12 * HOUR;
}

function openingStart(isoDate) {
    // Start of the day at UTC+14, the earliest time zone.
    return Date.parse(`${isoDate}T00:00:00Z`) - 14 * HOUR;
}

// open | upcoming | closing_soon | closed | unknown
export function applicationStatus({ openingDate, deadlineDate, timeZone }, now = new Date()) {
    const time = now.getTime();

    if (deadlineDate) {
        const end = deadlineEnd(deadlineDate, timeZone);

        if (time > end) {
            return "closed";
        }

        if (openingDate && time < openingStart(openingDate)) {
            return "upcoming";
        }

        return end - time <= CLOSING_SOON_DAYS * DAY ? "closing_soon" : "open";
    }

    if (openingDate && time < openingStart(openingDate)) {
        return "upcoming";
    }

    return "unknown";
}

export const STATUS_LABELS = {
    open: "Open",
    upcoming: "Opens soon",
    closing_soon: "Closing soon",
    closed: "Closed",
    unknown: "Deadline not confirmed"
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// What a student should know about the next application round.
// - confirmed: the source announces a future opening date.
// - tentative: estimated from a yearly pattern stated on the official page
//   (the quote is returned so it can be shown).
// - unknown: no reliable basis.
export function nextCycle({ status, openingDate, cycle, sourceUrl }, now = new Date()) {
    if (openingDate && Date.parse(`${openingDate}T00:00:00Z`) > now.getTime()) {
        return { type: "confirmed", openingDate, text: `Applications open on ${formatIsoDate(openingDate)}.`, sourceUrl };
    }

    if (status !== "closed" && status !== "unknown") {
        return null;
    }

    const month = now.getUTCMonth() + 1;
    const year = now.getUTCFullYear();

    if (cycle?.opensMonth) {
        const basis = cycle.cycleYear
            ? `Estimated from the ${cycle.cycleYear} application cycle on the official page: “${cycle.evidence}”`
            : `Estimated from the application period stated on the official page: “${cycle.evidence}”`;
        const monthsSinceOpening = (month - cycle.opensMonth + 12) % 12;

        // Without dates for this year, a round that usually opened in the last
        // few months may be open right now.
        if (status === "unknown" && monthsSinceOpening > 0 && monthsSinceOpening <= 4) {
            return {
                type: "tentative",
                month: MONTH_NAMES[cycle.opensMonth - 1],
                text: `Applications usually open in ${MONTH_NAMES[cycle.opensMonth - 1]} each year, so the current round may already be open. Check the official page.`,
                basis,
                sourceUrl
            };
        }

        // The next time that month comes round after the current round closed.
        const nextYear = status === "closed"
            ? (cycle.opensMonth > month ? year : year + 1)
            : (cycle.opensMonth >= month ? year : year + 1);

        return {
            type: "tentative",
            month: `${MONTH_NAMES[cycle.opensMonth - 1]} ${nextYear}`,
            text: `Tentatively expected to open in ${MONTH_NAMES[cycle.opensMonth - 1]} ${nextYear}.`,
            basis,
            sourceUrl
        };
    }

    if (cycle?.closesMonth && status === "closed") {
        const nextYear = cycle.closesMonth > month ? year : year + 1;

        return {
            type: "tentative",
            month: `${MONTH_NAMES[cycle.closesMonth - 1]} ${nextYear}`,
            text: `The next deadline is tentatively expected around ${MONTH_NAMES[cycle.closesMonth - 1]} ${nextYear}; the opening date has not been announced.`,
            basis: `Estimated from the ${cycle.cycleYear ?? "previous"} application cycle on the official page: “${cycle.evidence}”`,
            sourceUrl
        };
    }

    return { type: "unknown", text: "Next application opening date has not yet been announced.", sourceUrl };
}

export function formatIsoDate(iso) {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// Calendar years relevant for upcoming intakes, used in search queries.
export function intakeYear(now = new Date()) {
    const year = now.getUTCFullYear();
    // From June onwards most scholarship cycles target the next academic year.
    return now.getUTCMonth() >= 5 ? year + 1 : year;
}
