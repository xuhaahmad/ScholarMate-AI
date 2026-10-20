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

function deadlineEnd(isoDate) {
    // End of the day at UTC-12 ("Anywhere on Earth").
    return Date.parse(`${isoDate}T00:00:00Z`) + DAY + 12 * HOUR;
}

function openingStart(isoDate) {
    // Start of the day at UTC+14, the earliest time zone.
    return Date.parse(`${isoDate}T00:00:00Z`) - 14 * HOUR;
}

// open | upcoming | closing_soon | closed | unknown
export function applicationStatus({ openingDate, deadlineDate }, now = new Date()) {
    const time = now.getTime();

    if (deadlineDate) {
        const end = deadlineEnd(deadlineDate);

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

// Calendar years relevant for upcoming intakes, used in search queries.
export function intakeYear(now = new Date()) {
    const year = now.getUTCFullYear();
    // From June onwards most scholarship cycles target the next academic year.
    return now.getUTCMonth() >= 5 ? year + 1 : year;
}
