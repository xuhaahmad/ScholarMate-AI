import { describe, expect, it } from "vitest";
import {
    matchLevel,
    deadlineText,
    officialLink,
    referenceLink,
    safeHttpUrl,
    formatCgpa
} from "./scholarshipDisplay";
import { countryOptions, filterScholarships, paginate } from "./resultsView";
import { scholarship, thirdPartyScholarship, legacyScholarship } from "../test/fixtures";

describe("scholarshipDisplay", () => {
    it("uses the backend match level and falls back for older results", () => {
        expect(matchLevel(scholarship())).toBe("verified");
        expect(matchLevel(legacyScholarship({ eligibilityStatus: "likely_match" }))).toBe("verified");
        expect(matchLevel(legacyScholarship({ eligibilityStatus: "not_a_match" }))).toBe("not_eligible");
        expect(matchLevel(legacyScholarship())).toBe("preliminary");
    });

    it("shows deadline status next to the date", () => {
        expect(deadlineText(scholarship())).toBe("15 November 2026 · Closing soon");
        expect(deadlineText(thirdPartyScholarship())).toBe("Deadline not specified");
        expect(deadlineText(legacyScholarship())).toBe("Deadline not specified");
    });

    it("only treats verified official URLs as official", () => {
        expect(officialLink(scholarship())).toEqual({ url: "https://www.daad.de/en/apply", isApplication: true });
        expect(officialLink(thirdPartyScholarship())).toBeNull();
        expect(officialLink(legacyScholarship()), "older results were never verified").toBeNull();
        expect(officialLink(scholarship({ officialUrl: "javascript:alert(1)" }))).toBeNull();
    });

    it("offers third-party pages only as clearly labelled references", () => {
        expect(referenceLink(scholarship())).toBeNull();
        expect(referenceLink(thirdPartyScholarship())).toEqual({
            url: "https://www.scholars4dev.com/germany",
            label: "Third-party website"
        });
        expect(referenceLink(legacyScholarship()).label).toBe("Source not verified");
    });

    it("never returns non-web links", () => {
        expect(safeHttpUrl("javascript:alert(1)")).toBeNull();
        expect(safeHttpUrl("data:text/html,x")).toBeNull();
        expect(safeHttpUrl("Not specified")).toBeNull();
        expect(safeHttpUrl("https://example.org/x")).toBe("https://example.org/x");
    });

    it("formats CGPA with its scale", () => {
        expect(formatCgpa({ cgpa: "3.7", cgpaScale: "4" })).toBe("3.7 / 4");
        expect(formatCgpa({ cgpa: "85" })).toBe("85");
        expect(formatCgpa({})).toBe("N/A");
    });
});

describe("resultsView", () => {
    const list = [
        scholarship({ id: "1", name: "DAAD A", country: "Germany" }),
        scholarship({ id: "2", name: "Eiffel", country: "France", university: "Sorbonne" }),
        legacyScholarship({ name: "No Country", country: undefined, university: undefined }),
        scholarship({ id: "4", name: "Unknown place", country: "Not specified" })
    ];

    it("lists countries without placeholders", () => {
        expect(countryOptions(list)).toEqual(["France", "Germany"]);
    });

    it("filters by text and country without crashing on missing fields", () => {
        expect(filterScholarships(list, { search: "sorbonne" }).map((item) => item.name)).toEqual(["Eiffel"]);
        expect(filterScholarships(list, { search: "zzz" })).toEqual([]);
        expect(filterScholarships(list, { country: "Germany" }).map((item) => item.name)).toEqual(["DAAD A"]);
        expect(filterScholarships(list, {})).toHaveLength(4);
    });

    it("paginates and keeps the page in range", () => {
        const items = Array.from({ length: 23 }, (_, index) => index);

        expect(paginate(items, 1)).toMatchObject({ page: 1, pageCount: 3 });
        expect(paginate(items, 3).items).toEqual([20, 21, 22]);
        expect(paginate(items, 99).page).toBe(3);
        expect(paginate(items, 0).page).toBe(1);
        expect(paginate([], 1)).toEqual({ items: [], page: 1, pageCount: 1 });
    });
});
