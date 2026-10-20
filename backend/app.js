import express from "express";
import cors from "cors";
import { tavily } from "@tavily/core";
import OpenAI from "openai";
import { validateProfile } from "./validation.js";
import { createRateLimiter } from "./rateLimit.js";
import { searchScholarships, ServiceError } from "./scholarshipSearch.js";
import { loadConfig } from "./config.js";
import { createCache } from "./cache.js";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const REQUIRED_ENV_VARS = ["TAVILY_API_KEY", "GROQ_API_KEY"];

const HOUR = 60 * 60 * 1000;

// The base URLs can be overridden so tests can point the real SDKs at a local mock server.
export function createTavilyClient(apiKey, { baseURL } = {}) {
    return tavily({ apiKey, apiBaseURL: baseURL });
}

export function createGroqClient(apiKey, { baseURL = GROQ_BASE_URL, timeout = 20000 } = {}) {
    return new OpenAI({
        apiKey,
        baseURL,
        timeout,
        // Automatic retries could start a new request after the deadline has passed.
        maxRetries: 0
    });
}

// Local development only: lets `npm run dev:mock` point the real SDKs at local
// mock providers. Ignored on Vercel, in production, and for non-local hosts.
export function localOverride(env, name) {
    const value = env[name];

    if (!value || env.VERCEL === "1" || env.NODE_ENV === "production") {
        return undefined;
    }

    try {
        const url = new URL(value);
        return ["127.0.0.1", "localhost"].includes(url.hostname) ? value.replace(/\/$/, "") : undefined;
    } catch {
        return undefined;
    }
}

// Rejects request bodies that are not JSON before they reach validation.
function requireJson(req, res, next) {
    if (!req.is("application/json")) {
        return res.status(415).json({
            error: "Content-Type must be application/json.",
            code: "UNSUPPORTED_MEDIA_TYPE"
        });
    }

    next();
}

// Profile fields that change the search or the matching (the name does not).
function resultCacheKey(profile) {
    const key = (value) => String(value ?? "").trim().toLowerCase();

    return JSON.stringify([
        key(profile.field), key(profile.degree), key(profile.nationality),
        key(profile.cgpa), key(profile.cgpaScale), key(profile.destination), key(profile.funding)
    ]);
}

// Options exist so tests can inject fake API clients and settings.
export function createApp(options = {}) {
    const env = options.env ?? process.env;
    const logger = options.logger ?? console;
    const config = loadConfig(env, options.config);

    const createSearchClient = options.createSearchClient ??
        ((apiKey) => createTavilyClient(apiKey, { baseURL: localOverride(env, "TAVILY_API_BASE_URL") }));

    const createAiClient = options.createAiClient ??
        ((apiKey) => createGroqClient(apiKey, {
            baseURL: localOverride(env, "GROQ_API_BASE_URL") ?? GROQ_BASE_URL,
            timeout: config.aiRequestTimeoutMs
        }));

    // Caches are per function instance (see cache.js).
    const resultCache = createCache({ maxEntries: config.cacheMaxEntries, ttlMs: config.cacheTtlMs });
    const queryCache = createCache({ maxEntries: config.cacheMaxEntries * 6, ttlMs: config.cacheTtlMs });

    // Searches that reached the providers in the last hour (per instance).
    const providerSearches = [];

    function reserveProviderSearch() {
        const cutoff = Date.now() - HOUR;

        while (providerSearches.length > 0 && providerSearches[0] < cutoff) {
            providerSearches.shift();
        }

        if (providerSearches.length >= config.maxSearchesPerHour) {
            logger.error("Hourly search budget reached for this instance.");
            throw new ServiceError(503, "SEARCH_BUDGET_REACHED", "ScholarMate AI has reached its search limit for now. Please try again later.");
        }

        providerSearches.push(Date.now());
    }

    // Clients are created on first use so a missing key returns an error
    // response instead of crashing the whole server at startup.
    let clients;

    function getClients() {
        const missing = REQUIRED_ENV_VARS.filter((name) => !env[name]);

        if (missing.length > 0) {
            logger.error(`Missing environment variables: ${missing.join(", ")}`);

            throw new ServiceError(503, "SERVICE_NOT_CONFIGURED", "Scholarship search is temporarily unavailable. Please try again later.");
        }

        clients ??= {
            searchClient: createSearchClient(env.TAVILY_API_KEY),
            aiClient: createAiClient(env.GROQ_API_KEY)
        };

        return clients;
    }

    const app = express();

    app.disable("x-powered-by");

    // Only on Vercel are forwarding headers set by the platform rather than the
    // client (see getClientIp in rateLimit.js). VERCEL=1 is a Vercel system
    // environment variable, available at runtime when system environment
    // variables are exposed in the project settings.
    const trustVercelHeaders = options.trustVercelHeaders ?? env.VERCEL === "1";

    // The frontend calls the API from the same origin (Vite proxy locally, Vercel
    // routes in production), so cross-origin access is off unless explicitly allowed.
    // CORS is not access control: non-browser clients ignore it.
    const allowedOrigins = (env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    if (allowedOrigins.length > 0) {
        app.use("/api", cors({ origin: allowedOrigins, methods: ["POST"] }));
    }

    app.use("/api", (req, res, next) => {
        res.set("Cache-Control", "no-store");
        res.set("X-Content-Type-Options", "nosniff");
        next();
    });

    app.use(express.json({ limit: "10kb" }));

    app.get("/", (req, res) => {
        res.json({
            message: "ScholarMate AI backend is running"
        });
    });

    app.post("/api/profile", requireJson, (req, res) => {
        const { profile, errors } = validateProfile(req.body);

        if (errors) {
            return res.status(400).json({
                error: `Please check your profile: ${errors.join(" ")}`,
                code: "INVALID_PROFILE"
            });
        }

        res.json({
            message: "Profile received successfully",
            profile: profile
        });
    });

    app.post(
        "/api/search-scholarships",
        requireJson,
        createRateLimiter({
            max: options.rateLimit?.max ?? config.rateLimitMax,
            windowMs: options.rateLimit?.windowMs ?? config.rateLimitWindowMs,
            trustVercelHeaders,
            logger
        }),
        async (req, res) => {
            const { profile, errors } = validateProfile(req.body);

            if (errors) {
                return res.status(400).json({
                    error: `Please check your profile: ${errors.join(" ")}`,
                    code: "INVALID_PROFILE"
                });
            }

            const { searchClient, aiClient } = getClients();

            const { value, cached } = await resultCache.getOrLoad(resultCacheKey(profile), async () => {
                reserveProviderSearch();

                const result = await searchScholarships({
                    profile,
                    searchClient,
                    aiClient,
                    config,
                    queryCache,
                    logger
                });

                const { usage } = result.coverage;
                logger.log(
                    `Search finished in ${result.coverage.durationMs} ms: ${usage.searchQueries} web searches` +
                    `${usage.tavilyCredits !== null ? ` (${usage.tavilyCredits} credits)` : ""}, ` +
                    `${usage.aiRequests} AI requests, ${usage.aiInputTokens}+${usage.aiOutputTokens} tokens, ` +
                    `${result.scholarships.length} scholarships.`
                );

                return result;
            });

            res.json(cached ? { ...value, coverage: { ...value.coverage, cached: true } } : value);
        }
    );

    app.all(["/api/profile", "/api/search-scholarships"], (req, res) => {
        res.set("Allow", "POST");
        res.status(405).json({
            error: "Method not allowed.",
            code: "METHOD_NOT_ALLOWED"
        });
    });

    app.use("/api", (req, res) => {
        res.status(404).json({
            error: "Not found.",
            code: "NOT_FOUND"
        });
    });

    // Express 5 forwards rejected async handlers here. Never send stack traces
    // or provider error details to the client.
    // eslint-disable-next-line no-unused-vars
    app.use((error, req, res, next) => {
        if (error instanceof ServiceError) {
            return res.status(error.status).json({
                error: error.message,
                code: error.code
            });
        }

        if (error?.type === "entity.parse.failed") {
            return res.status(400).json({
                error: "Request body must be valid JSON.",
                code: "INVALID_JSON"
            });
        }

        if (error?.type === "entity.too.large") {
            return res.status(413).json({
                error: "Request body is too large.",
                code: "PAYLOAD_TOO_LARGE"
            });
        }

        if (error?.type === "charset.unsupported" || error?.type === "encoding.unsupported") {
            return res.status(415).json({
                error: "Request body must be UTF-8 JSON without unsupported content encoding.",
                code: "UNSUPPORTED_MEDIA_TYPE"
            });
        }

        // Any other client error from request parsing keeps its 4xx status,
        // with a generic message instead of the parser's internal details.
        const status = error?.status ?? error?.statusCode;

        if (Number.isInteger(status) && status >= 400 && status < 500) {
            return res.status(status).json({
                error: "The request could not be processed.",
                code: "BAD_REQUEST"
            });
        }

        logger.error("Unexpected server error:", error?.name ?? "Error");

        res.status(500).json({
            error: "Something went wrong. Please try again.",
            code: "INTERNAL_ERROR"
        });
    });

    return app;
}
