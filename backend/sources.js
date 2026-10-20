import { isIP } from "node:net";
import { allOfficialProgrammeDomains } from "./countries.js";

// Source types. Only the first three count as official.
export const SOURCE_TYPES = {
    government: { official: true, label: "Government source" },
    university: { official: true, label: "University source" },
    official_program: { official: true, label: "Official scholarship programme" },
    third_party: { official: false, label: "Third-party website" },
    unknown: { official: false, label: "Unverified source" }
};

// Hostname patterns for government domains, by country convention.
const GOVERNMENT_PATTERNS = [
    /\.gov$/,
    /\.gov\.[a-z]{2}$/,
    /\.gouv\.[a-z]{2}$/,
    /\.gob\.[a-z]{2}$/,
    /\.go\.(jp|kr|th|id|ke|tz|ug)$/,
    /\.govt\.nz$/,
    /\.gc\.ca$/,
    /(^|\.)canada\.ca$/,
    /\.gv\.at$/,
    /\.admin\.ch$/,
    /\.bund\.de$/,
    /(^|\.)europa\.eu$/,
    /\.mil$/
];

// Hostname patterns for accredited academic domains.
const ACADEMIC_PATTERNS = [
    /\.edu$/,
    /\.edu\.[a-z]{2}$/,
    /\.ac\.[a-z]{2}$/
];

// Official scholarship programmes and agencies whose domains do not follow the
// patterns above (for example daad.de or chevening.org). Domains only, never
// scholarship records.
const OFFICIAL_PROGRAMME_DOMAINS = new Set([
    ...allOfficialProgrammeDomains(),
    "erasmus-plus.ec.europa.eu",
    "mastercardfdn.org",
    "akdn.org",
    "rhodeshouse.ox.ac.uk",
    "schwarzmanscholars.org",
    "knight-hennessy.stanford.edu"
]);

// Well-known scholarship aggregators, directories, blogs and general sites.
// Useful as references, but never official application pages.
const THIRD_PARTY_DOMAINS = [
    "scholarshipportal.com", "mastersportal.com", "bachelorsportal.com", "phdportal.com",
    "studyportals.com", "scholars4dev.com", "opportunitiesforafricans.com", "afterschoolafrica.com",
    "scholarshipsads.com", "buddy4study.com", "wemakescholars.com", "scholarships.com", "fastweb.com",
    "internationalscholarships.com", "iefa.org", "topuniversities.com", "timeshighereducation.com",
    "scholarshiproar.com", "scholarshipunion.com", "greatyop.com", "opportunitydesk.org", "youthop.com",
    "studyabroad.com", "educations.com", "mladiinfo.eu", "scholarshipdb.net", "findaphd.com",
    "findamasters.com", "scholarshipset.com", "worldscholarshipforum.com", "globalscholarships.com",
    "studentscholarships.org", "scholarship-positions.com", "advance-africa.com", "wikipedia.org",
    "medium.com", "blogspot.com", "wordpress.com", "quora.com", "reddit.com", "youtube.com",
    "facebook.com", "instagram.com", "linkedin.com", "x.com", "twitter.com", "tiktok.com",
    "pinterest.com", "scribd.com", "studyinternational.com", "leverageedu.com", "yocket.com",
    "idp.com", "shiksha.com", "collegedunia.com", "afterschoolafrica.com", "scholarshipscorner.website",
    "scholarshiproar.com", "opportunitiescorners.com", "scholarshipsinfo.org"
];

// Domains that never contain useful scholarship pages; excluded from searches.
export const EXCLUDED_SEARCH_DOMAINS = [
    "facebook.com", "instagram.com", "x.com", "twitter.com", "tiktok.com",
    "youtube.com", "pinterest.com", "linkedin.com", "reddit.com", "quora.com", "scribd.com"
];

function matchesDomain(hostname, domain) {
    return hostname === domain || hostname.endsWith(`.${domain}`);
}

// Parses a link and rejects anything unsafe: malformed URLs, non-http(s) schemes,
// embedded credentials, IP-address hosts and hosts without a domain name.
export function parseSafeUrl(value) {
    if (typeof value !== "string" || value.length > 2000) {
        return null;
    }

    let url;

    try {
        url = new URL(value.trim());
    } catch {
        return null;
    }

    if (url.protocol !== "https:" && url.protocol !== "http:") {
        return null;
    }

    if (url.username || url.password) {
        return null;
    }

    const hostname = url.hostname.replace(/^\[|\]$/g, "");

    if (!hostname.includes(".") || isIP(hostname)) {
        return null;
    }

    return url;
}

// "www.daad.de" and "daad.de" count as the same site; ports must match.
export function siteKey(url) {
    return url.host.toLowerCase().replace(/^www\./, "");
}

// The organisation-level domain, so www.daad.de and www2.daad.de count as one
// website (keeps "ac.uk"-style second-level domains together).
export function baseDomain(url) {
    const labels = url.hostname.toLowerCase().split(".");
    const secondLevel = labels[labels.length - 2];
    const keep = labels.length >= 3 && labels[labels.length - 1].length === 2 &&
        ["co", "ac", "gov", "edu", "com", "org", "net", "go", "or", "gob", "gouv", "govt"].includes(secondLevel)
        ? 3
        : 2;

    return labels.slice(-keep).join(".");
}

// Identifies a page regardless of #fragment, trailing slash and tracking parameters.
export function pageKey(url) {
    const params = new URLSearchParams(url.search);

    for (const name of [...params.keys()]) {
        if (/^(utm_|fbclid|gclid|mc_|ref$|source$)/i.test(name)) {
            params.delete(name);
        }
    }

    const search = params.toString();
    const path = url.pathname.replace(/\/+$/, "");

    return `${url.protocol}//${siteKey(url)}${path}${search ? `?${search}` : ""}`;
}

// Classifies where a page comes from. Unknown domains are never assumed official.
export function classifySource(value) {
    const url = value instanceof URL ? value : parseSafeUrl(value);

    if (!url) {
        return { type: "unknown", official: false, label: SOURCE_TYPES.unknown.label, domain: null };
    }

    const hostname = url.hostname.toLowerCase();
    const domain = hostname.replace(/^www\./, "");

    let type = "unknown";

    if (THIRD_PARTY_DOMAINS.some((d) => matchesDomain(hostname, d))) {
        type = "third_party";
    } else if ([...OFFICIAL_PROGRAMME_DOMAINS].some((d) => matchesDomain(hostname, d))) {
        type = "official_program";
    } else if (GOVERNMENT_PATTERNS.some((pattern) => pattern.test(hostname))) {
        type = "government";
    } else if (ACADEMIC_PATTERNS.some((pattern) => pattern.test(hostname))) {
        type = "university";
    }

    return { type, official: SOURCE_TYPES[type].official, label: SOURCE_TYPES[type].label, domain };
}

export function isOfficialSource(value) {
    return classifySource(value).official;
}
