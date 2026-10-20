import { resolveCountry, resolveDestination, EU_EEA } from "./countries.js";
import { normalizeDegree } from "./searchPlan.js";

// Matching rules (documented in README):
// - Each criterion is checked separately and reports met / not_met / unknown,
//   plus whether the scholarship requirement was backed by a quote found in
//   the source page ("source") or only stated by the AI ("ai").
// - Hard criteria (degree, nationality, minimum grade, deadline) decide
//   eligibility. Preferences (field, destination, funding) only affect ranking.
// - "verified" means every hard criterion that the source states was checked
//   against source-backed evidence and met. It does not guarantee eligibility:
//   providers may have requirements the page did not list.
// - Nothing is turned into a percentage score.

const HARD = ["degree", "nationality", "grade", "deadline"];

function check(criterion, status, basis, detail) {
    return { criterion, status, basis, detail, hard: HARD.includes(criterion) };
}

function degreeCheck(profile, scholarship) {
    const wanted = normalizeDegree(profile.degree);
    const offered = scholarship.degreeLevels ?? [];

    if (!wanted || offered.length === 0) {
        return check("degree", "unknown", null, "The source does not clearly state which degree levels are eligible.");
    }

    const basis = scholarship.evidenceVerified?.degree ? "source" : "ai";
    const met = offered.includes(wanted) || offered.includes("any");

    return check("degree", met ? "met" : "not_met", basis,
        met ? `Open to ${wanted === "phd" ? "PhD" : wanted} students.` : `Listed for ${offered.join(", ")} students, not ${wanted}.`);
}

function nationalityCheck(profile, scholarship) {
    const rule = scholarship.nationality ?? { type: "unknown" };
    const code = resolveCountry(profile.nationality);
    const basis = rule.evidenceVerified ? "source" : "ai";

    if (rule.type === "any") {
        return check("nationality", "met", basis, "Open to all nationalities.");
    }

    if (!code) {
        return check("nationality", "unknown", null, profile.nationality
            ? "Your nationality could not be matched to a country."
            : "Add your nationality to check this requirement.");
    }

    const listed = (rule.countries ?? []).map((country) => resolveCountry(country)).filter(Boolean);
    const includesEu = (rule.countries ?? []).some((country) => /\b(eu|eea|european union)\b/i.test(country));
    const inList = listed.includes(code) || (includesEu && EU_EEA.has(code));

    if (rule.type === "specific" && (listed.length > 0 || includesEu)) {
        return check("nationality", inList ? "met" : "not_met", basis,
            inList ? "Your nationality is on the eligible list." : "Your nationality is not on the eligible list.");
    }

    if (rule.type === "excluded" && (listed.length > 0 || includesEu)) {
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
            return check("deadline", "not_met", "source", "The application deadline has passed.");
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
    verified: "Meets verified requirements",
    preliminary: "Preliminary match",
    not_eligible: "Not eligible"
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
    const failed = hard.filter((item) => item.status === "not_met");
    const degreeAndNationality = hard.filter((item) => item.criterion === "degree" || item.criterion === "nationality");

    let level;

    if (failed.length > 0) {
        level = "not_eligible";
    } else if (
        degreeAndNationality.every((item) => item.status === "met" && item.basis === "source") &&
        hard.every((item) => item.status !== "met" || item.basis === "source")
    ) {
        level = "verified";
    } else {
        level = "preliminary";
    }

    return {
        level,
        label: MATCH_LABELS[level],
        eligibilityStatus: LEVEL_TO_STATUS[level],
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
