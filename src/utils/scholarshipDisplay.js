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
    verified: { badge: "Meets Verified Requirements", short: "Verified", detail: "Every requirement we could check against the source page is met." },
    preliminary: { badge: "Preliminary Match", short: "Preliminary", detail: "Some requirements could not be confirmed from the source. Check them on the official website." },
    not_eligible: { badge: "Not Eligible", short: "Not eligible", detail: "At least one stated requirement is not met." }
};

export const STATUS_TEXT = {
    open: "Open",
    upcoming: "Opens soon",
    closing_soon: "Closing soon",
    closed: "Closed",
    unknown: "Deadline not confirmed"
};

export function deadlineText(scholarship) {
    const deadline = isSpecified(scholarship?.deadline) ? scholarship.deadline : "Deadline not specified";
    const status = scholarship?.applicationStatus;

    if (!status || status === "unknown") {
        return deadline;
    }

    return `${deadline} · ${STATUS_TEXT[status]}`;
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

    return {
        url,
        isApplication: scholarship.applicationLinkStatus === "official" && url === safeHttpUrl(scholarship.applicationLink)
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
