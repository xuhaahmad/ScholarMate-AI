import { normalizeDegree } from "./searchPlan.js";

// Profile fields accepted from the frontend, with their maximum lengths.
// Anything else in the request body is ignored so it never reaches the AI prompt.
const PROFILE_FIELDS = {
    name: 100,
    field: 100,
    cgpa: 20,
    cgpaScale: 10,
    nationality: 60,
    country: 100,
    funding: 100,
    degree: 50,
    destination: 100
};

const DEFAULT_DEGREE = "Bachelor";
const DEGREE_NAMES = { bachelor: "Bachelor", master: "Master", phd: "PhD" };
export const CGPA_SCALES = ["4", "5", "10", "100"];

export function validateProfile(body) {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: ["Request body must be a JSON object."] };
    }

    const profile = {};
    const errors = [];

    for (const [key, maxLength] of Object.entries(PROFILE_FIELDS)) {
        const raw = body[key];

        if (raw === undefined || raw === null || raw === "") {
            continue;
        }

        if (typeof raw !== "string" && typeof raw !== "number") {
            errors.push(`${key} must be text.`);
            continue;
        }

        const value = String(raw).replace(/\p{Cc}/gu, " ").trim();

        if (value.length > maxLength) {
            errors.push(`${key} must be at most ${maxLength} characters.`);
            continue;
        }

        if (value) {
            profile[key] = value;
        }
    }

    if (!profile.field) {
        errors.push("field is required.");
    }

    if (profile.degree) {
        const degree = normalizeDegree(profile.degree);

        if (degree) {
            profile.degree = DEGREE_NAMES[degree];
        } else {
            errors.push("degree must be Bachelor, Master or PhD.");
        }
    }

    if (profile.cgpaScale !== undefined) {
        // Accept "4.0", "out of 10", "100%" etc.
        const scale = String(Number.parseFloat(profile.cgpaScale.replace(/[^\d.]/g, "")));

        if (CGPA_SCALES.includes(scale)) {
            profile.cgpaScale = scale;
        } else {
            errors.push("cgpaScale must be 4, 5, 10 or 100.");
        }
    }

    if (profile.cgpa !== undefined) {
        const value = Number(profile.cgpa.replace(",", "."));

        if (!Number.isFinite(value) || value < 0) {
            errors.push("CGPA must be a number.");
        } else if (profile.cgpaScale && value > Number(profile.cgpaScale)) {
            errors.push(`CGPA must not be higher than the scale (${profile.cgpaScale}).`);
        } else {
            profile.cgpa = String(value);
        }
    }

    if (errors.length > 0) {
        return { errors };
    }

    // Older clients do not send a degree, so keep the previous default.
    profile.degree ??= DEFAULT_DEGREE;
    profile.destination ??= profile.country;

    return { profile };
}
