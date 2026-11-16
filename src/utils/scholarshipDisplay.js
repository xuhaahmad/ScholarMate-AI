// Display rules shared by the results, card and details pages.
// They also handle results in the older format (without match/source fields).

const NOT_SPECIFIED = "Not specified";

export function isSpecified(value) {
    return typeof value === "string" && value.trim() !== "" && value !== NOT_SPECIFIED;
}

// verified | preliminary | not_eligible
export function matchLevel(scholarship) {
    if (scholarship?.match?.level) {
        return scholarship.match.level;
    }

    if (scholarship?.eligibilityStatus === "likely_match") return "verified";
    if (scholarship?.eligibilityStatus === "not_a_match") return "not_eligible";

    return "preliminary";
}

export const MATCH_TEXT = {
    verified: { badge: "Confirmed Eligibility", short: "Confirmed", detail: "Your profile meets every requirement we could check on the official page. Other conditions may still apply, so read the full rules before applying." },
    preliminary: { badge: "Preliminary Match", short: "Preliminary", detail: "Some requirements could not be confirmed from the source. Check them on the official website." },
    not_eligible: { badge: "Does Not Meet Stated Requirements", short: "Not eligible", detail: "At least one requirement stated on the source page does not match your profile." }
};

export const STATUS_TEXT = {
    open: "OPEN",
    upcoming: "UPCOMING",
    closing_soon: "CLOSING SOON",
    closed: "CLOSED",
    unknown: "UNKNOWN"
};

export const STATUS_MESSAGES = {
    open: "Applications are open.",
    closing_soon: "Applications are open but close within 30 days.",
    upcoming: "Applications have not opened yet.",
    closed: "Applications for this scholarship are currently closed. You can still visit the official website to review eligibility and prepare for the next application cycle.",
    unknown: "The application dates were not found on the official page we checked. Check the official website for the current dates."
};

export function applicationStatusOf(scholarship) {
    return STATUS_TEXT[scholarship?.applicationStatus] ? scholarship.applicationStatus : "unknown";
}

export function statusText(scholarship) {
    return `Applications: ${STATUS_TEXT[applicationStatusOf(scholarship)]}`;
}

export function deadlineText(scholarship) {
    return isSpecified(scholarship?.deadline) ? `Deadline: ${scholarship.deadline}` : "Deadline: Not announced";
}

export function formatDate(iso) {
    if (typeof iso !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        return null;
    }

    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

const LIVE_STATUSES = ["analysed", "downloaded", "unavailable", "not_requested"];

// What happened to the official page during this search, for the date note.
const PAGE_STATES = {
    analysed: "the page was analysed during this search, but no current dates were found on it",
    downloaded: "the page was downloaded during this search but could not be analysed",
    unavailable: "the page could not be read during this search",
    not_requested: "the page was not re-read during this search"
};

// Where the dates on the details page come from. Never claims the official page
// was analysed unless the backend says so, and never presents dates from a
// third-party website as official.
export function datesSourceNote(scholarship) {
    const page = scholarship?.officialPage;
    // Older results only had readLive (downloaded, analysis unknown): never
    // treat that as analysed.
    const live = LIVE_STATUSES.includes(page?.liveStatus)
        ? page.liveStatus
        : page ? (page.readLive ? "downloaded" : "not_requested") : null;
    const hasDates = Boolean(formatDate(scholarship?.deadlineDate) || formatDate(scholarship?.openingDate));
    const storedOn = formatDate(scholarship?.datesCheckedOn);
    const linkCheckedOn = formatDate(page?.checkedOn);
    const thirdParty = scholarship?.datesSource === "third_party_source" ||
        (!page && !scholarship?.datesSource && !isOfficialSourceType(scholarship?.sourceType));

    if (hasDates && thirdParty) {
        return "Dates supplied by a third-party website found in this search, not by the official page. Confirm them on the official website.";
    }

    if (page) {
        if (storedOn) {
            return `Dates taken from the official page as checked on ${storedOn}; ${PAGE_STATES[live]}.`;
        }

        if (live === "analysed") {
            if (hasDates) return "Dates read from the official page during this search.";
            if (scholarship?.datesSource === "official_live") return "Application status read from the official page during this search.";
            return "Official page analysed during this search. No current dates were found on the page.";
        }

        if (live === "downloaded") {
            return "Official page downloaded during this search but not analysed, so its current dates could not be checked.";
        }

        if (live === "unavailable") {
            return linkCheckedOn
                ? `The official page could not be read during this search (link checked on ${linkCheckedOn}).`
                : "The official page could not be read during this search.";
        }

        return linkCheckedOn
            ? `Official page link checked on ${linkCheckedOn}; the page was not read during this search.`
            : "The official page was not read during this search.";
    }

    if (hasDates) {
        return "Dates quoted from an official page found in this search.";
    }

    return null;
}

// "Confirmed", "Tentative" or "Not announced" information about the next round.
export function nextCycleInfo(scholarship) {
    const cycle = scholarship?.nextCycle;

    if (!cycle || typeof cycle.text !== "string") {
        return null;
    }

    return {
        label: cycle.type === "confirmed" ? "Confirmed" : cycle.type === "tentative" ? "Tentative" : "Not announced",
        text: cycle.text,
        basis: typeof cycle.basis === "string" ? cycle.basis : null
    };
}

export function sourceText(scholarship) {
    if (scholarship?.sourceLabel) {
        return scholarship.sourceLabel;
    }

    return "Source not verified";
}

export function isOfficialSourceType(type) {
    return ["government", "university", "official_program"].includes(type);
}

// Returns only http(s) links, so nothing else can ever be opened.
export function safeHttpUrl(value) {
    if (!isSpecified(value)) {
        return null;
    }

    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
    } catch {
        return null;
    }
}

// The verified official link, if any. Older results only had applicationLink,
// which was never verified, so they are treated as unverified.
export function officialLink(scholarship) {
    const url = safeHttpUrl(scholarship?.officialUrl);

    if (!url) {
        return null;
    }

    const isApplication = scholarship.applicationLinkStatus === "official" && url === safeHttpUrl(scholarship.applicationLink);
    const status = applicationStatusOf(scholarship);

    // Never invite students to "apply" to a closed or not-yet-open round.
    const canApply = isApplication && status !== "closed" && status !== "upcoming";

    return {
        url,
        isApplication,
        label: canApply ? "Apply on Official Website" : "Visit Official Scholarship Page"
    };
}

// A non-official page the information came from, clearly labelled as such.
export function referenceLink(scholarship) {
    if (officialLink(scholarship)) {
        return null;
    }

    const url = safeHttpUrl(scholarship?.sourceUrl) ?? safeHttpUrl(scholarship?.referenceUrl) ?? safeHttpUrl(scholarship?.applicationLink);

    return url ? { url, label: sourceText(scholarship) } : null;
}

export function domainOf(url) {
    try {
        return new URL(url).hostname.replace(/^www\./, "");
    } catch {
        return "";
    }
}

export function formatCgpa(profile) {
    if (!profile?.cgpa) {
        return "N/A";
    }

    return profile.cgpaScale ? `${profile.cgpa} / ${profile.cgpaScale}` : profile.cgpa;
}
