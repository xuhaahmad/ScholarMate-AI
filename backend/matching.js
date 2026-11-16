import { resolveCountry, resolveDestination, countriesMentioned, EU_EEA } from "./countries.js";
import { normalizeDegree } from "./searchPlan.js";

// Matching rules (documented in README):
// - Each criterion is checked separately and reports met / not_met / unknown,
//   plus whether the scholarship requirement was backed by a quote found in
//   the source page ("source") or only stated by the AI ("ai").
// - Hard criteria (degree, nationality, minimum grade) decide eligibility.
//   The deadline and preferences (field, destination, funding) only affect
//   ranking; a closed round is shown with its status, not as "not eligible".
// - "verified" means every hard criterion that the source states was checked
//   against on-topic evidence from an OFFICIAL source page and met. Quotes from
//   third-party or unverified sites at most give a "preliminary" match. It does
//   not guarantee eligibility: providers may have requirements the page did not list.
// - Nothing is turned into a percentage score.

// Eligibility requirements. The deadline is about timing, not eligibility: a
// closed scholarship is still shown (with its status) and ranked lower.
const HARD = ["degree", "nationality", "grade"];

// Only requirements from these sources can make a match "verified".
const OFFICIAL_SOURCE_TYPES = ["government", "university", "official_program"];

const DEGREE_NAMES = { bachelor: "Bachelor's", master: "Master's", phd: "PhD", any: "all degree levels" };

// Degree-level words in quotes.
const LEVEL = String.raw`(?:bachelor|undergraduate|master|postgraduate|graduate|ph\.?\s?d|doctora)[\w'’]*`;
const LEVEL_WORDS = { bachelor: /\b(bachelor|undergraduate)/i, master: /\b(master|postgraduate)/i, phd: /\b(ph\.?\s?d|doctora)/i };
// One or more degree levels: "Master's and PhD", "Master's, PhD or doctoral".
const LEVELS = String.raw`${LEVEL}(?:\s*(?:,|and|or|&|/)\s*(?:the\s+)?${LEVEL})*`;
// People the levels describe: "Master's students", "doctoral candidates".
const PEOPLE = String.raw`(?:\s+(?:students?|candidates?|applicants?|scholars?|graduates?|degree\s+holders?|programmes?|programs?|degrees?))?`;
// Neutral words allowed between "only" and the level: "only full-time Master's students".
const ONLY_FILLER = String.raw`(?:(?:the|full-time|part-time|international|current|prospective|registered|incoming|new)\s+){0,2}`;
// An eligibility statement: "may apply", "are eligible", "will be considered".
const ELIGIBILITY_VERB = String.raw`\s+(?:may|can|are\s+(?:eligible|able|entitled|allowed|permitted|invited|considered)|is\s+(?:eligible|open)|will\s+be\s+(?:considered|accepted|eligible|selected)|qualify|be\s+considered)\b`;

// The listed degree levels are the ONLY eligible ones only when "only" (or an
// equivalent) restricts WHO MAY APPLY, attached to the levels themselves:
// - "Only PhD students may apply", "Only Master's and PhD students are eligible";
// - "open only to Master's students", "limited to doctoral candidates",
//   "restricted to PhD students", "reserved for Master's students";
// - "for Master's and PhD students only."
// Not: "PhD students only need to submit a proposal", "Only the PhD stipend is
// taxable", "tenable only at the University of Toronto", "Funding is only
// available for one year".
const ONLY_LEVELS = [
    new RegExp(String.raw`\b(?:only|exclusively|solely)\s+${ONLY_FILLER}${LEVELS}${PEOPLE}${ELIGIBILITY_VERB}`, "i"),
    new RegExp(String.raw`\b(?:(?:open|available|offered|awarded|granted)\s+(?:only|exclusively|solely)\s+(?:to|for)|(?:restricted|limited|reserved)\s+(?:(?:only|exclusively|solely)\s+)?(?:to|for))\s+${ONLY_FILLER}${LEVELS}`, "i"),
    new RegExp(String.raw`\b(?:for|to)\s+(?:the\s+)?${LEVELS}${PEOPLE}\s+only\s*(?:[.,;:)]|$)`, "i")
];

// Words that narrow an exclusion to a subgroup ("final-year undergraduates",
// "students in their final year") or to a component ("not eligible for the
// travel grant component"), so it does not exclude the whole level.
const SUBGROUP_BEFORE = /\b(?:final[-\s]year|first[-\s]year|second[-\s]year|part[-\s]time|full[-\s]time|current|continuing|returning|self[-\s]funded|international|domestic|some|certain|visiting|exchange)\s+$/i;
const SUBGROUP_AFTER = /^\s+(?:in|who|whose|with|from|on|during|at|enrolled|studying|taking|already|currently|that)\b/i;
const COMPONENT_AFTER = /^\s+(?:for|from|to\s+receive)\s+(?!(?:this|the|these)\s+(?:scholarships?|awards?|programmes?|programs?|fellowships?|bursar(?:y|ies)|grants?|funding|stipends?)\b(?!\s+(?:component|element|part|portion|top[-\s]?up|supplement|allowance)))/i;

// A quote that excludes the student's whole level: "Master's students are not
// eligible", "undergraduates cannot apply", "not open to Bachelor's students".
// An exclusion from one component or of a subgroup does not count.
function excludesLevel(sentence, wanted) {
    const word = LEVEL_WORDS[wanted];
    if (!word) return false;

    const levelThenNo = new RegExp(String.raw`${word.source}[\w'’]*${PEOPLE}\s+(?:(?:are|is)\s+(?:not\s+eligible|ineligible|excluded|not\s+accepted)|(?:cannot|can\s*not|may\s+not)\s+apply)`, "gi");
    const noThenLevel = new RegExp(String.raw`\bnot\s+(?:open|available|offered)\s+to\s+(?:the\s+)?${word.source}[\w'’]*${PEOPLE}`, "gi");

    for (const pattern of [levelThenNo, noThenLevel]) {
        for (const match of sentence.matchAll(pattern)) {
            const before = sentence.slice(0, match.index);
            const after = sentence.slice(match.index + match[0].length);

            if (SUBGROUP_BEFORE.test(before) || SUBGROUP_AFTER.test(after) || COMPONENT_AFTER.test(after)) {
                continue;
            }

            return true;
        }
    }

    return false;
}

// Nationality wording. A "specific" list must be stated as the only eligible
// nationalities, and not as examples; an "excluded" list must be stated as
// excluded. Otherwise the list is the AI's reading, not the source's.
// A list is treated as illustrative (not exhaustive) when the quote:
// - gives examples ("such as", "including", "e.g.", "for example", "like");
// - leaves it open ("and/or other …", "and similar …", "among others", "etc.",
//   "not limited to", "and more");
// - refers to a wider group ("African countries", "Commonwealth nations",
//   "developing countries"), except "the following countries" and similar;
// - only encourages or prefers some nationalities.
const LIST_IS_EXAMPLE = new RegExp([
    String.raw`\bsuch\s+as\b`, String.raw`\bincluding\b`, String.raw`\binclude[sd]?\b`, String.raw`\be\.\s?g\.?`,
    String.raw`\bfor\s+(?:example|instance)\b`, String.raw`\blike\b`, String.raw`\bamong\s+others\b`, String.raw`\betc\b`,
    String.raw`\bnot\s+limited\s+to\b`, String.raw`\band\s+more\b`,
    String.raw`\b(?:and|or|&|plus)\s+(?:\w+\s+)?(?:other|similar|related|additional|further|selected|certain|various|neighbouring|neighboring|partner)\b`,
    String.raw`\bother\s+(?:\w+\s+)?(?:countries|nations|nationalities|states|regions|territories)\b`,
    String.raw`\b(?!(?:following|these|those|listed|named|two|three|four|five|both|the|of|from|in)\b)[A-Za-z-]+\s+(?:countries|nations|nationalities|regions|territories)\b`,
    String.raw`\bencourag\w*`, String.raw`\bpriority\b`, String.raw`\bpreferen\w*`, String.raw`\bparticularly\b`, String.raw`\bespecially\b`
].join("|"), "i");
const ONLY_THESE_NATIONALITIES = /\bonly\b|\bexclusively\b|\bsolely\b|\blimited\s+to\b|\brestricted\s+to\b|\bmust\s+(?:be|hold|have)\b|\brequired\s+to\s+(?:be|hold|have)\b/i;
const EXCLUSION_WORDING = /\bnot\s+eligible\b|\bineligible\b|\bcannot\s+apply\b|\bcan\s*not\s+apply\b|\bmay\s+not\s+apply\b|\bexcluded\b|\bnot\s+open\s+to\b|\bnot\s+accepted\b|\bare\s+not\s+(?:able|allowed|permitted)\b/i;

// EU/EEA groups. "Non-EU", "outside the EU" and similar mean the opposite group.
const EU_GROUP = /\b(eu|eea|european\s+union|european\s+economic\s+area)\b/i;
const NON_EU = /\bnon[-\s]?(eu|eea|european)\b|\boutside\s+(of\s+)?(the\s+)?(eu|eea|european)\b|\bnot\s+(from|in|citizens\s+of)\s+(the\s+|an?\s+)?(eu|eea)\b|\bother\s+than\s+(the\s+)?(eu|eea)\b/i;
// A whole negated group expression, including slash-joined and coordinated
// parts: "non-EU/EEA", "outside the EU/EEA", "from outside the EU and EEA",
// "non-EU or EEA". Every EU/EEA mention inside it is part of the negation.
const EU_NAME = String.raw`(?:EU|EEA|European\s+Union|European\s+Economic\s+Area|Switzerland|Swiss)`;
const NEGATED_EU_GROUP = new RegExp(String.raw`\b(?:non[-\s]?|outside\s+(?:of\s+)?(?:the\s+)?|not\s+(?:from|in|citizens\s+of)\s+(?:the\s+|an?\s+)?|other\s+than\s+(?:the\s+)?)${EU_NAME}(?:\s*(?:/|,|and|or|&)\s*(?:the\s+)?${EU_NAME})*`, "gi");

// The quote names the EU/EEA group itself, outside any negated group expression.
function quoteNamesEuGroup(text) {
    const positive = String(text ?? "").replace(NEGATED_EU_GROUP, " ");
    return /\b(EU|EEA|European Union|European Economic Area)\b/.test(positive);
}

function check(criterion, status, basis, detail) {
    return { criterion, status, basis, detail, hard: HARD.includes(criterion) };
}

function degreeCheck(profile, scholarship) {
    const wanted = normalizeDegree(profile.degree);
    const offered = scholarship.degreeLevels ?? [];

    if (!wanted || offered.length === 0) {
        return check("degree", "unknown", null, "The source does not clearly state which degree levels are eligible.");
    }

    const quoted = Boolean(scholarship.evidenceVerified?.degree);
    const met = offered.includes(wanted) || offered.includes("any");
    const listedFor = `Listed for ${offered.map((level) => DEGREE_NAMES[level] ?? level).join(", ")} students`;

    if (met) {
        return check("degree", "met", quoted ? "source" : "ai", `Open to ${DEGREE_NAMES[wanted]} students.`);
    }

    // A level that is simply not mentioned is only excluded when the quote says
    // the listed levels are the only eligible ones, or excludes this level.
    const quote = (scholarship.evidence ?? []).find((item) => item.field === "degree")?.quote ?? "";
    const sentences = quote.split(/(?<=[.!?;])\s+/);
    const exclusive = quoted && sentences.some((sentence) =>
        ONLY_LEVELS.some((pattern) => pattern.test(sentence)) || excludesLevel(sentence, wanted));

    return check("degree", "not_met", exclusive ? "source" : "ai", exclusive
        ? `${listedFor}, not ${DEGREE_NAMES[wanted]}.`
        : `${listedFor}; the source does not say whether ${DEGREE_NAMES[wanted]} students are excluded.`);
}

// Whether the nationality quote itself states the rule:
// - "any" rules need an on-topic quote;
// - every listed country (or the EU/EEA or non-EU group) must be named in it;
// - a "specific" list must be stated as the only eligible nationalities ("only",
//   "must be citizens of", "limited to"), not as examples ("such as",
//   "including", "encouraged"), and must not be worded as an exclusion;
// - an "excluded" list must be worded as an exclusion ("not eligible",
//   "cannot apply", "excluded").
// Otherwise the rule is the AI's reading of the page, not a stated requirement.
function nationalityStatedBySource(rule) {
    if (!rule.evidenceVerified) {
        return false;
    }

    if (rule.type === "any") {
        return true;
    }

    const text = String(rule.text ?? "");
    const countries = rule.countries ?? [];
    const groups = countries.filter((country) => EU_GROUP.test(country));
    const named = countries.filter((country) => !EU_GROUP.test(country)).map((country) => resolveCountry(country));

    if (named.length + groups.length === 0 || named.some((code) => !code)) {
        return false;
    }

    const mentioned = countriesMentioned(text);
    const groupsStated = groups.every((group) => NON_EU.test(group) ? NON_EU.test(text) : quoteNamesEuGroup(text));

    if (!named.every((code) => mentioned.has(code)) || !groupsStated) {
        return false;
    }

    if (rule.type === "specific") {
        return ONLY_THESE_NATIONALITIES.test(text) && !LIST_IS_EXAMPLE.test(text) && !EXCLUSION_WORDING.test(text);
    }

    if (rule.type === "excluded") {
        return EXCLUSION_WORDING.test(text) && !LIST_IS_EXAMPLE.test(text);
    }

    return false;
}

function nationalityCheck(profile, scholarship) {
    const rule = scholarship.nationality ?? { type: "unknown" };
    const code = resolveCountry(profile.nationality);
    const basis = nationalityStatedBySource(rule) ? "source" : "ai";

    if (rule.type === "any") {
        return check("nationality", "met", basis, "Open to all nationalities.");
    }

    if (!code) {
        return check("nationality", "unknown", null, profile.nationality
            ? "Your nationality could not be matched to a country."
            : "Add your nationality to check this requirement.");
    }

    const entries = rule.countries ?? [];
    const listed = entries.filter((country) => !EU_GROUP.test(country)).map((country) => resolveCountry(country)).filter(Boolean);
    // "Non-EU" is the opposite group, never the EU itself.
    const includesNonEu = entries.some((country) => EU_GROUP.test(country) && NON_EU.test(country));
    const includesEu = entries.some((country) => EU_GROUP.test(country) && !NON_EU.test(country));
    const inList = listed.includes(code) || (includesEu && EU_EEA.has(code)) || (includesNonEu && !EU_EEA.has(code));
    const hasRule = listed.length > 0 || includesEu || includesNonEu;

    if (rule.type === "specific" && hasRule) {
        return check("nationality", inList ? "met" : "not_met", basis,
            inList ? "Your nationality is on the eligible list." : "Your nationality is not on the eligible list.");
    }

    if (rule.type === "excluded" && hasRule) {
        return check("nationality", inList ? "not_met" : "met", basis,
            inList ? "Your nationality is excluded." : "Your nationality is not excluded.");
    }

    return check("nationality", "unknown", null, rule.text
        ? "The nationality rule could not be checked automatically."
        : "The source does not state a nationality requirement.");
}

function gradeCheck(profile, scholarship) {
    const minimum = scholarship.minGrade;
    const value = Number(profile.cgpa);
    const scale = Number(profile.cgpaScale);

    if (!minimum) {
        return check("grade", "unknown", null, "No minimum grade found in the source.");
    }

    if (!Number.isFinite(value) || !Number.isFinite(scale) || scale <= 0) {
        return check("grade", "unknown", null, "Add your CGPA and its scale to check the grade requirement.");
    }

    if (!minimum.scale || Number(minimum.scale) !== scale) {
        // Grade scales are not linearly convertible, so different scales are not compared.
        return check("grade", "unknown", null,
            `The source uses a different grading scale (${minimum.value}${minimum.scale ? ` / ${minimum.scale}` : ""}); confirm the conversion with the provider.`);
    }

    const basis = minimum.evidenceVerified ? "source" : "ai";
    const met = value >= Number(minimum.value);

    return check("grade", met ? "met" : "not_met", basis,
        `Minimum ${minimum.value} / ${minimum.scale}; yours is ${value} / ${scale}.`);
}

function deadlineCheck(scholarship) {
    switch (scholarship.applicationStatus) {
        case "closed":
            return check("deadline", "not_met", "source", "Applications for this round are closed.");
        case "open":
        case "closing_soon":
        case "upcoming":
            return check("deadline", "met", "source", "The deadline has not passed.");
        default:
            return check("deadline", "unknown", null, "No confirmed deadline.");
    }
}

function words(text) {
    return String(text ?? "")
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 4 && !["studies", "study", "field", "fields", "science", "sciences"].includes(word))
        .map((word) => word.replace(/(ing|s)$/, ""));
}

function fieldCheck(profile, scholarship) {
    const fields = scholarship.fields ?? [];

    if (fields.length === 0) {
        return check("field", "unknown", null, "The source does not list eligible fields.");
    }

    if (fields.some((field) => /\b(all|any)\b/i.test(field))) {
        return check("field", "met", scholarship.evidenceVerified?.fields ? "source" : "ai", "Open to all fields.");
    }

    const wanted = new Set(words(profile.field));
    const overlap = fields.some((field) => words(field).some((word) => wanted.has(word)));

    return overlap
        ? check("field", "met", scholarship.evidenceVerified?.fields ? "source" : "ai", "Your field is listed.")
        : check("field", "unknown", null, "Your field is not obviously listed; check the eligible subjects.");
}

function destinationCheck(profile, scholarship) {
    const wanted = resolveDestination(profile.destination ?? profile.country);
    const country = resolveCountry(scholarship.country);

    if (!wanted || wanted.kind === "text") {
        return check("destination", "unknown", null, wanted ? "Destination could not be compared." : "No destination preference.");
    }

    if (!country) {
        return check("destination", "unknown", null, "Study destination not stated.");
    }

    const met = wanted.kind === "country" ? wanted.code === country : wanted.codes.includes(country);

    return check("destination", met ? "met" : "not_met", "ai",
        met ? "In your preferred destination." : "Outside your preferred destination.");
}

function fundingCheck(profile, scholarship) {
    const wantsFull = /full/i.test(profile.funding ?? "");

    if (!profile.funding || !wantsFull) {
        return check("funding", "unknown", null, profile.funding ? "Funding preference noted." : "No funding preference.");
    }

    if (scholarship.fundingType === "full") {
        return check("funding", "met", "ai", "Fully funded.");
    }

    if (scholarship.fundingType === "partial") {
        return check("funding", "not_met", "ai", "Partially funded.");
    }

    return check("funding", "unknown", null, "Funding level not stated.");
}

const LEVEL_TO_STATUS = {
    verified: "likely_match",
    preliminary: "unclear",
    not_eligible: "not_a_match"
};

export const MATCH_LABELS = {
    verified: "Confirmed eligibility",
    preliminary: "Preliminary match",
    not_eligible: "Does not meet stated requirements"
};

export function matchScholarship(profile, scholarship) {
    const checks = [
        degreeCheck(profile, scholarship),
        nationalityCheck(profile, scholarship),
        gradeCheck(profile, scholarship),
        deadlineCheck(scholarship),
        fieldCheck(profile, scholarship),
        destinationCheck(profile, scholarship),
        fundingCheck(profile, scholarship)
    ];

    const hard = checks.filter((item) => item.hard);
    // Only requirements stated on an OFFICIAL source page can rule a student out.
    // A conflict that only the AI reported, or one quoted from a third-party or
    // unverified website, leaves the match preliminary.
    const official = OFFICIAL_SOURCE_TYPES.includes(scholarship.sourceType);
    const stated = hard.filter((item) => item.status === "not_met" && item.basis === "source");
    const failed = official ? stated : [];
    const degreeAndNationality = hard.filter((item) => item.criterion === "degree" || item.criterion === "nationality");

    let level;
    let note = null;

    const requirementsConfirmed =
        degreeAndNationality.every((item) => item.status === "met" && item.basis === "source") &&
        // An AI-only conflict does not rule a student out, but it is not confirmed either.
        hard.every((item) => item.status !== "not_met") &&
        hard.every((item) => item.status !== "met" || item.basis === "source");

    if (failed.length > 0) {
        level = "not_eligible";
    } else if (requirementsConfirmed && OFFICIAL_SOURCE_TYPES.includes(scholarship.sourceType)) {
        level = "verified";
    } else {
        level = "preliminary";

        // Quotes from aggregators or unknown sites are useful, but not proof.
        if (stated.length > 0) {
            note = "A requirement quoted from a third-party or unverified website conflicts with your profile. Check it on the official website.";
        } else if (requirementsConfirmed) {
            note = "The requirements were read from a third-party or unverified website, so they are not treated as verified. Check them on the official website.";
        }
    }

    return {
        level,
        label: MATCH_LABELS[level],
        eligibilityStatus: LEVEL_TO_STATUS[level],
        note,
        checks,
        aiAssessment: scholarship.aiAssessment ?? null
    };
}

const STATUS_RANK = { open: 30, closing_soon: 35, upcoming: 20, unknown: 10, closed: -50 };
const SOURCE_RANK = { government: 20, official_program: 20, university: 18, unknown: 5, third_party: 0 };
const LEVEL_RANK = { verified: 300, preliminary: 200, not_eligible: 0 };

// Internal ordering only; never shown to students as a score.
export function rankScholarship(scholarship) {
    let rank = LEVEL_RANK[scholarship.match.level] ?? 0;

    rank += STATUS_RANK[scholarship.applicationStatus] ?? 0;
    rank += SOURCE_RANK[scholarship.sourceType] ?? 0;

    for (const item of scholarship.match.checks) {
        if (item.hard) continue;
        if (item.status === "met") rank += 10;
        if (item.status === "not_met") rank -= 15;
    }

    if (scholarship.match.aiAssessment?.status === "likely_match") rank += 5;
    if (scholarship.match.aiAssessment?.status === "not_a_match") rank -= 5;

    return rank;
}
