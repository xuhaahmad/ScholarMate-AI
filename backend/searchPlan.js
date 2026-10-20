import { resolveDestination, resolveCountry, countryName, DESTINATIONS } from "./countries.js";
import { intakeYear } from "./dates.js";
import { EXCLUDED_SEARCH_DOMAINS } from "./sources.js";

export const MAX_QUERIES_HARD_LIMIT = 6;

const DEGREE_TERMS = {
    bachelor: "bachelor's undergraduate",
    master: "master's",
    phd: "PhD doctoral"
};

// Keeps profile text safe and short inside search queries.
function clean(value, maxLength = 60) {
    return String(value ?? "")
        .replace(/[^\p{L}\p{N}\s&'+.-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maxLength);
}

export function normalizeDegree(value) {
    const key = String(value ?? "").toLowerCase();

    if (/ph\.?d|doctor/.test(key)) return "phd";
    if (/master|msc|m\.sc|mba|\bma\b|postgrad/.test(key)) return "master";
    if (/bachelor|undergrad|bsc|b\.sc|\bba\b/.test(key)) return "bachelor";

    return null;
}

function fundingWords(funding) {
    const key = String(funding ?? "").toLowerCase();

    if (/full/.test(key)) return "fully funded";
    if (/partial|tuition/.test(key)) return "tuition";

    return "";
}

function query(text, options = {}, purpose = "") {
    return {
        query: text.replace(/\s+/g, " ").trim().slice(0, 380),
        options: { excludeDomains: EXCLUDED_SEARCH_DOMAINS, ...options },
        purpose
    };
}

// Builds up to `maxQueries` distinct web searches for one student profile.
// Each query targets a different angle (government programmes, universities,
// official portals, nationality-specific and funding-specific schemes) so the
// results cover more than the top hits of a single search.
export function planSearch(profile, { now = new Date(), maxQueries = MAX_QUERIES_HARD_LIMIT } = {}) {
    const limit = Math.max(1, Math.min(MAX_QUERIES_HARD_LIMIT, Math.floor(maxQueries) || MAX_QUERIES_HARD_LIMIT));

    const field = clean(profile.field);
    const degreeKey = normalizeDegree(profile.degree) ?? "bachelor";
    const degree = DEGREE_TERMS[degreeKey];
    const year = intakeYear(now);
    const nationalityCode = resolveCountry(profile.nationality);
    const nationality = nationalityCode ? countryName(nationalityCode) : clean(profile.nationality, 40);
    const funding = fundingWords(profile.funding);
    const destination = resolveDestination(profile.destination ?? profile.country);

    const queries = [];

    if (destination?.kind === "country") {
        const place = destination.name;
        const countryOption = destination.tavilyCountry ? { country: destination.tavilyCountry } : {};

        queries.push(query(`${field} ${degree} scholarships for international students in ${place} ${year}`, countryOption, "field and destination"));
        queries.push(query(`${place} government scholarship for international ${degree} students ${year}`, countryOption, "government programmes"));

        if (destination.officialDomains?.length) {
            queries.push(query(`${degree} scholarship international students ${field}`, { includeDomains: destination.officialDomains.slice(0, 10) }, "official portals"));
        }

        queries.push(query(`university scholarships in ${place} for international ${degree} students ${field} tuition fee waiver`, countryOption, "university scholarships"));

        if (nationality) {
            queries.push(query(`scholarships for ${nationality} students to study ${degree} in ${place}`, {}, "nationality-specific"));
        }

        queries.push(query(`${funding || "fully funded"} ${degree} scholarship ${field} ${place} application deadline ${year}`, countryOption, "funding and deadlines"));
    } else if (destination?.kind === "region") {
        const place = destination.name;
        const officialDomains = destination.codes.flatMap((code) => DESTINATIONS[code]?.officialDomains ?? []);

        queries.push(query(`${field} ${degree} scholarships for international students in ${place} ${year}`, {}, "field and region"));
        queries.push(query(`government scholarships in ${place} for international ${degree} students ${year}`, {}, "government programmes"));
        queries.push(query(`${degree} scholarship international students ${field}`, { includeDomains: officialDomains.slice(0, 20) }, "official portals"));
        queries.push(query(`university scholarships in ${place} for international ${degree} students ${field}`, {}, "university scholarships"));

        if (nationality) {
            queries.push(query(`scholarships for ${nationality} students ${degree} in ${place}`, {}, "nationality-specific"));
        }

        queries.push(query(`${funding || "fully funded"} ${degree} scholarships ${place} ${field} deadline ${year}`, {}, "funding and deadlines"));
    } else {
        // No preference: spread queries across the main study regions.
        const place = destination?.kind === "text" ? ` in ${clean(destination.name)}` : "";

        queries.push(query(`${field} ${degree} scholarships for international students${place} ${year}`, {}, "field"));

        if (!place) {
            queries.push(query(`fully funded ${degree} scholarships in Europe Germany UK France for international students ${field}`, {}, "Europe"));
            queries.push(query(`${degree} scholarships in USA and Canada for international students ${field} ${year}`, {}, "North America"));
            queries.push(query(`government scholarships Korea Japan China Turkey international ${degree} students ${year}`, {}, "Asia"));
            queries.push(query(`${degree} scholarships Australia New Zealand international students ${field}`, {}, "Oceania"));
        } else {
            queries.push(query(`government scholarship${place} international ${degree} students ${year}`, {}, "government programmes"));
            queries.push(query(`university scholarships${place} international ${degree} students ${field}`, {}, "university scholarships"));
        }

        if (nationality) {
            queries.push(query(`scholarships for ${nationality} students to study ${degree} abroad ${year}`, {}, "nationality-specific"));
        }

        queries.push(query(`${funding || "fully funded"} ${degree} scholarship ${field} application deadline ${year}`, {}, "funding and deadlines"));
    }

    // Remove duplicates and keep the budget.
    const seen = new Set();
    const unique = queries.filter((item) => {
        const key = `${item.query.toLowerCase()}|${JSON.stringify(item.options.includeDomains ?? [])}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });

    return {
        destination,
        degree: degreeKey,
        nationalityCode,
        queries: unique.slice(0, limit)
    };
}
