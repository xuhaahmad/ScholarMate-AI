// Reads official scholarship pages at search time.
//
// Pages are first requested directly (free). Sites that block automated
// requests are read through Tavily Extract instead (basic depth, about one
// credit per five pages). Results are cached like search results.

const USER_AGENT = "ScholarMateAI/2.0 (+https://github.com/xuhaahmad/ScholarMate-AI)";
const MAX_HTML_BYTES = 2_000_000;

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", ndash: "–", mdash: "—", hellip: "…", eacute: "é", uuml: "ü", ouml: "ö", auml: "ä" };

function decodeEntities(text) {
    return text
        .replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)))
        .replace(/&#x([0-9a-f]+);/gi, (match, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&([a-z]+);/gi, (match, name) => ENTITIES[name.toLowerCase()] ?? " ");
}

// Turns HTML into readable text with markdown-style links, so the rest of the
// pipeline (excerpts, quote checks, link checks) works the same as for
// Tavily's markdown page content.
export function htmlToText(html, baseUrl) {
    let body = String(html ?? "");
    const main = body.match(/<main[\s\S]*?<\/main>/i)?.[0];

    if (main && main.length > 500) {
        body = main;
    }

    // Line breaks inside HTML source carry no meaning; block tags add them below.
    body = body
        .replace(/\s+/g, " ")
        .replace(/<!--[\s\S]*?-->/g, " ")
        .replace(/<(script|style|noscript|svg|template|iframe|form)[\s\S]*?<\/\1>/gi, " ")
        .replace(/<(nav|footer|header)[\s\S]*?<\/\1>/gi, " ");

    // Keep links as [text](absolute URL).
    body = body.replace(/<a\s[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (match, href, inner) => {
        const text = inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        let absolute;

        try {
            absolute = new URL(decodeEntities(href), baseUrl).href;
        } catch {
            return ` ${text} `;
        }

        return /^https?:/.test(absolute) && text ? ` [${text}](${absolute}) ` : ` ${text} `;
    });

    return decodeEntities(
        body
            .replace(/<\/(p|div|li|h[1-6]|tr|section|article|table|ul|ol|dt|dd)>|<br\s*\/?>/gi, "\n")
            .replace(/<(h[1-6])[^>]*>/gi, "\n## ")
            .replace(/<[^>]+>/g, " ")
    )
        .split("\n")
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter((line) => line.length > 1)
        .join("\n");
}

async function fetchDirect(url, timeoutMs, fetchImpl) {
    const response = await fetchImpl(url, {
        headers: { "User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml", "Accept-Language": "en" },
        redirect: "follow",
        signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const type = response.headers.get("content-type") ?? "";

    if (!/text\/html|application\/xhtml/i.test(type)) {
        throw new Error("Not an HTML page");
    }

    const html = (await response.text()).slice(0, MAX_HTML_BYTES);

    // Bot-protection pages ("Just a moment...") are not the real content.
    if (/<title>\s*(just a moment|attention required|access denied)/i.test(html)) {
        throw new Error("Blocked by bot protection");
    }

    const text = htmlToText(html, response.url || url);

    if (text.length < 300) {
        throw new Error("Page has too little text");
    }

    return { url, finalUrl: response.url || url, text, method: "direct" };
}

// Reads a set of official pages. Returns { pages: Map(url -> page), credits, failed: [url] }.
export async function fetchOfficialPages(entries, { searchClient, timeoutMs = 6000, cache, logger = console, fetchImpl = fetch }) {
    const pages = new Map();
    const needExtract = [];
    let credits = 0;

    await Promise.all(entries.map(async (entry) => {
        const cached = cache?.get(`page:${entry.url}`);

        if (cached) {
            pages.set(entry.url, { ...cached, cached: true });
            return;
        }

        if (entry.fetch === "extract") {
            needExtract.push(entry);
            return;
        }

        try {
            const page = await fetchDirect(entry.url, timeoutMs, fetchImpl);
            pages.set(entry.url, page);
            cache?.set(`page:${entry.url}`, page);
        } catch (error) {
            logger.error(`Official page could not be read directly (${entry.id}): ${error.message}`);
            needExtract.push(entry);
        }
    }));

    if (needExtract.length > 0 && typeof searchClient?.extract === "function") {
        try {
            const result = await searchClient.extract(needExtract.map((entry) => entry.url), {
                extractDepth: "basic",
                format: "markdown",
                includeUsage: true,
                timeout: Math.ceil(timeoutMs / 1000) + 4
            });

            credits += Number(result?.usage?.credits) || 0;

            for (const item of result?.results ?? []) {
                const entry = needExtract.find((candidate) => candidate.url === item.url);

                if (entry && typeof item.rawContent === "string" && item.rawContent.length >= 300) {
                    const page = { url: entry.url, finalUrl: entry.url, text: item.rawContent, method: "extract" };
                    pages.set(entry.url, page);
                    cache?.set(`page:${entry.url}`, page);
                }
            }
        } catch (error) {
            logger.error(`Tavily Extract failed: ${error?.name ?? "Error"}`);
        }
    }

    const failed = entries.filter((entry) => !pages.has(entry.url)).map((entry) => entry.url);

    return { pages, credits, failed };
}
