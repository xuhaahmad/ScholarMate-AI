// Profile fields accepted from the frontend, with their maximum lengths.
// Anything else in the request body is ignored so it never reaches the AI prompt.
const PROFILE_FIELDS = {
    name: 100,
    field: 100,
    cgpa: 20,
    country: 100,
    funding: 100,
    degree: 50,
    destination: 100
};

const DEFAULT_DEGREE = "Bachelor";

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

    if (errors.length > 0) {
        return { errors };
    }

    // The profile form does not collect a degree yet, so keep the previous default.
    profile.degree ??= DEFAULT_DEGREE;
    profile.destination ??= profile.country;

    return { profile };
}
