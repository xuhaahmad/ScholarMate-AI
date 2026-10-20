// Small in-memory cache with expiry and a size limit (least recently used is
// evicted first). On Vercel each function instance has its own copy, so this
// reduces repeated provider calls but is not shared between instances.
export function createCache({ maxEntries = 100, ttlMs = 6 * 60 * 60 * 1000, now = () => Date.now() } = {}) {
    const entries = new Map();
    const inFlight = new Map();

    function get(key) {
        const entry = entries.get(key);

        if (!entry) {
            return undefined;
        }

        if (entry.expiresAt <= now()) {
            entries.delete(key);
            return undefined;
        }

        // Move to the end so it counts as recently used.
        entries.delete(key);
        entries.set(key, entry);

        return entry.value;
    }

    function set(key, value) {
        entries.delete(key);
        entries.set(key, { value, expiresAt: now() + ttlMs });

        while (entries.size > maxEntries) {
            entries.delete(entries.keys().next().value);
        }
    }

    // Returns the cached value, or runs `load` once even if several callers ask
    // for the same key at the same time. Failures are not cached.
    async function getOrLoad(key, load) {
        const cached = get(key);

        if (cached !== undefined) {
            return { value: cached, cached: true };
        }

        if (inFlight.has(key)) {
            return { value: await inFlight.get(key), cached: true };
        }

        const promise = (async () => {
            try {
                const value = await load();
                set(key, value);
                return value;
            } finally {
                inFlight.delete(key);
            }
        })();

        inFlight.set(key, promise);

        return { value: await promise, cached: false };
    }

    return {
        get,
        set,
        getOrLoad,
        get size() {
            return entries.size;
        }
    };
}
