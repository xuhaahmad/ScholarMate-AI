import { isIP } from "node:net";

const UNKNOWN_CLIENT = "unknown";

function parseIp(value) {
    if (typeof value !== "string") {
        return null;
    }

    const first = value.split(",")[0].trim();

    // Treat IPv4-mapped IPv6 addresses (::ffff:1.2.3.4) as the IPv4 address.
    const ip = first.startsWith("::ffff:") && isIP(first.slice(7)) === 4
        ? first.slice(7)
        : first;

    return isIP(ip) ? ip : null;
}

// Returns the client IP used for rate limiting, or null if it cannot be determined.
//
// Forwarding headers are only read on Vercel. Vercel documents that it overwrites
// X-Forwarded-For with the client's public IP and does not forward client-supplied
// values, to prevent IP spoofing (https://vercel.com/docs/headers/request-headers).
// Everywhere else (local development, tests) the header is ignored because any
// client can set it, and the TCP peer address is used instead.
export function getClientIp(req, { trustVercelHeaders = false } = {}) {
    if (trustVercelHeaders) {
        return parseIp(req.headers?.["x-forwarded-for"]);
    }

    return parseIp(req.socket?.remoteAddress);
}

// Simple fixed-window, per-IP rate limiter kept in memory.
// This is NOT a global limit: on Vercel every function instance has its own
// memory, so each instance counts separately and counts reset on cold starts.
export function createRateLimiter({
    windowMs,
    max,
    trustVercelHeaders = false,
    logger = console,
    maxKeys = 10000
}) {
    const hits = new Map();
    let warnedUnknownClient = false;

    function prune(now) {
        for (const [key, entry] of hits) {
            if (entry.resetAt <= now) {
                hits.delete(key);
            }
        }

        if (hits.size >= maxKeys) {
            hits.clear();
        }
    }

    return function rateLimit(req, res, next) {
        const now = Date.now();
        let key = getClientIp(req, { trustVercelHeaders });

        // Requests without a usable IP share one bucket, so they are still limited
        // rather than bypassing the limiter.
        if (!key) {
            key = UNKNOWN_CLIENT;

            if (!warnedUnknownClient) {
                warnedUnknownClient = true;
                logger.error("Rate limiter could not determine the client IP; using a shared bucket.");
            }
        }

        let entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            if (hits.size >= maxKeys) {
                prune(now);
            }

            entry = { count: 0, resetAt: now + windowMs };
            hits.set(key, entry);
        }

        entry.count += 1;

        if (entry.count > max) {
            res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));

            return res.status(429).json({
                error: "Too many searches. Please wait a few minutes and try again.",
                code: "RATE_LIMITED"
            });
        }

        next();
    };
}
