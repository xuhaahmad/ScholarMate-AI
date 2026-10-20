// Sample API data in the current backend format (see backend/scholarshipSearch.js).

export function scholarship(overrides = {}) {
    return {
        id: "abc123",
        name: "DAAD Study Scholarships",
        provider: "DAAD",
        institution: null,
        university: "Not specified",
        country: "Germany",
        degreeLevel: "Master",
        degreeLevels: ["master"],
        eligibility: ["Bachelor's degree"],
        funding: "992 euros per month",
        fundingType: "full",
        deadline: "15 November 2026",
        deadlineDate: "2026-11-15",
        applicationStatus: "closing_soon",
        applicationLink: "https://www.daad.de/en/apply",
        applicationLinkStatus: "official",
        officialUrl: "https://www.daad.de/en/apply",
        referenceUrl: null,
        sourceUrl: "https://www.daad.de/en/scholarship",
        sourceType: "official_program",
        sourceLabel: "Official scholarship programme",
        retrievedAt: "2026-10-20T10:00:00.000Z",
        evidence: [{ field: "deadline", quote: "Application deadline: 15 November 2026" }],
        description: "A DAAD scholarship for master's study in Germany.",
        explanation: "The student wants a master's in Germany.",
        eligibilityStatus: "likely_match",
        match: {
            level: "verified",
            label: "Meets verified requirements",
            eligibilityStatus: "likely_match",
            checks: [
                { criterion: "degree", status: "met", basis: "source", detail: "Open to master students.", hard: true },
                { criterion: "nationality", status: "met", basis: "source", detail: "Open to all nationalities.", hard: true },
                { criterion: "destination", status: "met", basis: "ai", detail: "In your preferred destination.", hard: false }
            ]
        },
        ...overrides
    };
}

export function thirdPartyScholarship(overrides = {}) {
    return scholarship({
        id: "blog1",
        name: "Heinrich Boll Foundation Scholarships",
        provider: "Not specified",
        applicationLink: "Not specified",
        applicationLinkStatus: "unavailable",
        officialUrl: null,
        sourceUrl: "https://www.scholars4dev.com/germany",
        sourceType: "third_party",
        sourceLabel: "Third-party website",
        eligibility: [],
        funding: "Not specified",
        deadline: "Not specified",
        deadlineDate: null,
        applicationStatus: "unknown",
        eligibilityStatus: "unclear",
        match: { level: "preliminary", label: "Preliminary match", eligibilityStatus: "unclear", checks: [] },
        ...overrides
    });
}

// A result in the format produced before the backend upgrade.
export function legacyScholarship(overrides = {}) {
    return {
        name: "Legacy Scholarship",
        eligibilityStatus: "unclear",
        degreeLevel: "Bachelor",
        country: "France",
        university: "Not specified",
        eligibility: ["Some requirement"],
        deadline: "Not specified",
        funding: "Fully funded",
        applicationLink: "https://example.org/apply",
        sourceUrl: "https://example.org/list",
        explanation: "Looks relevant.",
        ...overrides
    };
}
