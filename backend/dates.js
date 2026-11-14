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

// Returns every complete, unambiguous date written in the text, as YYYY-MM-DD.
export function extractDates(text) {
    const found = new Set();

    if (typeof text !== "string") {
        return found;
    }

    const lower = text.toLowerCase();

    // 2027-01-15
    for (const m of lower.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
        const iso = toIso(m[1], m[2], m[3]);
        if (iso) found.add(iso);
    }

    // 15 January 2027, 15th of January, 2027
    const dayFirst = new RegExp(`\\b${DAY_PATTERN}\\s+(?:of\\s+)?${MONTH_PATTERN},?\\s+${YEAR_PATTERN}\\b`, "g");
    for (const m of lower.matchAll(dayFirst)) {
        const iso = toIso(m[3], MONTHS[m[2].replace(/\.$/, "")], m[1]);
        if (iso) found.add(iso);
    }

    // January 15, 2027
    const monthFirst = new RegExp(`\\b${MONTH_PATTERN}\\s+${DAY_PATTERN},?\\s+${YEAR_PATTERN}\\b`, "g");
    for (const m of lower.matchAll(monthFirst)) {
        const iso = toIso(m[3], MONTHS[m[1].replace(/\.$/, "")], m[2]);
        if (iso) found.add(iso);
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

        if (iso) found.add(iso);
    }

    return found;
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
    opening: /open|apply|applica|call for|portal|start accepting|available from|bewerbung/i
};

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

    return extractDates(unwrapQuote(claim.evidence)).has(date) ? date : null;
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
