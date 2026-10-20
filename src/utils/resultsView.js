// Filtering and pagination for the Results page. The backend already ranks the
// scholarships, so the original order is kept.

export const PAGE_SIZE = 10;

const text = (value) => (typeof value === "string" ? value.toLowerCase() : "");

export function countryOptions(scholarships) {
    const countries = new Set();

    for (const scholarship of scholarships) {
        if (typeof scholarship.country === "string" && scholarship.country && scholarship.country !== "Not specified") {
            countries.add(scholarship.country);
        }
    }

    return [...countries].sort((a, b) => a.localeCompare(b));
}

export function filterScholarships(scholarships, { search = "", country = "" } = {}) {
    const query = search.trim().toLowerCase();

    return scholarships.filter((scholarship) => {
        if (country && scholarship.country !== country) {
            return false;
        }

        if (!query) {
            return true;
        }

        return [scholarship.name, scholarship.country, scholarship.university, scholarship.provider]
            .some((value) => text(value).includes(query));
    });
}

export function paginate(items, page, pageSize = PAGE_SIZE) {
    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const current = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);
    const start = (current - 1) * pageSize;

    return {
        items: items.slice(start, start + pageSize),
        page: current,
        pageCount
    };
}
