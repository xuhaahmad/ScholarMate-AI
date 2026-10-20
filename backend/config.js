import { MAX_QUERIES_HARD_LIMIT } from "./searchPlan.js";

// Search budget and limits. Every value can be lowered (or, within the hard
// limits, raised) with an environment variable; invalid values fall back to
// the default. See README "Configuration".
const LIMITS = {
    // Web search (Tavily, "basic" depth = 1 credit per query)
    maxQueries: { env: "SEARCH_MAX_QUERIES", default: 6, min: 1, max: MAX_QUERIES_HARD_LIMIT },
    resultsPerQuery: { env: "SEARCH_RESULTS_PER_QUERY", default: 8, min: 1, max: 10 },
    searchConcurrency: { env: "SEARCH_CONCURRENCY", default: 3, min: 1, max: 6 },
    searchQueryTimeoutMs: { env: "SEARCH_QUERY_TIMEOUT_MS", default: 12000, min: 2000, max: 30000 },
    searchStageBudgetMs: { env: "SEARCH_STAGE_BUDGET_MS", default: 20000, min: 3000, max: 60000 },

    // AI extraction (Groq)
    aiMaxSources: { env: "AI_MAX_SOURCES", default: 8, min: 1, max: 12 },
    aiBatchSize: { env: "AI_BATCH_SIZE", default: 4, min: 1, max: 6 },
    aiSourceCharLimit: { env: "AI_SOURCE_CHAR_LIMIT", default: 3000, min: 500, max: 8000 },
    aiMaxOutputTokens: { env: "AI_MAX_OUTPUT_TOKENS", default: 3000, min: 500, max: 8000 },
    aiRequestTimeoutMs: { env: "AI_REQUEST_TIMEOUT_MS", default: 20000, min: 3000, max: 60000 },
    aiStageBudgetMs: { env: "AI_STAGE_BUDGET_MS", default: 30000, min: 3000, max: 90000 },

    // Cost and abuse controls
    cacheTtlMs: { env: "CACHE_TTL_MS", default: 6 * 60 * 60 * 1000, min: 0, max: 24 * 60 * 60 * 1000 },
    cacheMaxEntries: { env: "CACHE_MAX_ENTRIES", default: 100, min: 0, max: 1000 },
    rateLimitMax: { env: "RATE_LIMIT_MAX", default: 6, min: 1, max: 100 },
    rateLimitWindowMs: { env: "RATE_LIMIT_WINDOW_MS", default: 15 * 60 * 1000, min: 60 * 1000, max: 24 * 60 * 60 * 1000 },
    maxSearchesPerHour: { env: "SEARCH_MAX_PER_HOUR", default: 60, min: 1, max: 10000 }
};

export function loadConfig(env = process.env, overrides = {}) {
    const config = {};

    for (const [name, limit] of Object.entries(LIMITS)) {
        const raw = Number(env[limit.env]);
        const value = env[limit.env] !== undefined && env[limit.env] !== "" && Number.isFinite(raw)
            ? Math.min(limit.max, Math.max(limit.min, Math.floor(raw)))
            : limit.default;

        config[name] = value;
    }

    // "markdown" keeps link targets so application URLs can be checked against
    // the page; set TAVILY_RAW_CONTENT=false to only use Tavily's short snippets.
    config.rawContent = env.TAVILY_RAW_CONTENT === "false" ? false : "markdown";

    return { ...config, ...overrides };
}

export const CONFIG_LIMITS = LIMITS;
