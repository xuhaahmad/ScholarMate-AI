// Local mock versions of the Tavily and Groq APIs, for trying the full app
// without API keys or credits (`npm run dev:mock`). Everything here is fake
// test data marked "[MOCK]"; it is never used by the deployed app.
import http from "node:http";

const PAGES = [
    {
        url: "https://www.daad.de/en/mock-study-scholarships",
        title: "[MOCK] DAAD Study Scholarships for Graduates",
        text: [
            "[MOCK PAGE] DAAD Study Scholarships for Graduates of All Disciplines",
            "Supports international graduates who want to complete a master's degree programme in Germany.",
            "Applicants from all countries may apply. Applicants must hold a bachelor's degree in any field.",
            "Funding: 992 euros per month, health insurance and a travel allowance.",
            "Application deadline: 15 November 2026. Apply at https://www.daad.de/en/mock-apply"
        ].join("\n")
    },
    {
        url: "https://www.chevening.org/mock-scholarships",
        title: "[MOCK] Chevening Scholarships",
        text: [
            "[MOCK PAGE] Chevening Scholarships are the UK government's international awards programme.",
            "Chevening Scholarships fund a one-year master's degree in the United Kingdom.",
            "Applicants must be citizens of a Chevening-eligible country such as Pakistan, Kenya or Nigeria.",
            "Applications open on 5 August 2026 and close on 7 October 2026."
        ].join("\n")
    },
    {
        url: "https://www.scholars4dev.com/mock-europe-list",
        title: "[MOCK] Top Scholarships in Europe (blog)",
        text: [
            "[MOCK PAGE] Top Scholarships in Europe for International Students",
            "1. Eiffel Excellence Scholarship Programme - for master's and PhD students in France.",
            "2. Swedish Institute Scholarships for Global Professionals - master's study in Sweden.",
            "The Swedish Institute Scholarships for Global Professionals deadline is 20 February 2027."
        ].join("\n")
    }
];

const ITEMS = {
    "https://www.daad.de/en/mock-study-scholarships": [{
        name: "DAAD Study Scholarships for Graduates of All Disciplines",
        provider: "DAAD",
        country: "Germany",
        degreeLevels: ["master"],
        degreeEvidence: "complete a master's degree programme in Germany",
        fields: ["any field"],
        fieldsEvidence: "bachelor's degree in any field",
        nationality: { type: "any", countries: [], evidence: "Applicants from all countries may apply" },
        requirements: [{ text: "Bachelor's degree in any field", evidence: "Applicants must hold a bachelor's degree in any field" }],
        fundingType: "full",
        funding: "992 euros per month, health insurance and travel allowance",
        fundingEvidence: "Funding: 992 euros per month, health insurance and a travel allowance",
        deadline: { date: "2026-11-15", text: "15 November 2026", evidence: "Application deadline: 15 November 2026" },
        applicationUrl: "https://www.daad.de/en/mock-apply",
        summary: "[Mock] A scholarship for international graduates studying a master's in Germany.",
        assessment: { status: "likely_match", reason: "[Mock] The profile fits a master's in Germany." }
    }],
    "https://www.chevening.org/mock-scholarships": [{
        name: "Chevening Scholarships",
        provider: "UK government",
        country: "United Kingdom",
        degreeLevels: ["master"],
        degreeEvidence: "fund a one-year master's degree in the United Kingdom",
        nationality: { type: "specific", countries: ["Pakistan", "Kenya", "Nigeria"], evidence: "citizens of a Chevening-eligible country such as Pakistan, Kenya or Nigeria" },
        openingDate: { date: "2026-08-05", text: "5 August 2026", evidence: "Applications open on 5 August 2026" },
        deadline: { date: "2026-10-07", text: "7 October 2026", evidence: "close on 7 October 2026" },
        summary: "[Mock] UK government master's scholarships.",
        assessment: { status: "likely_match", reason: "[Mock] Master's study in the UK." }
    }],
    "https://www.scholars4dev.com/mock-europe-list": [{
        name: "Eiffel Excellence Scholarship Programme",
        country: "France",
        degreeLevels: ["master", "phd"],
        summary: "[Mock] French government scholarship listed on a blog.",
        assessment: { status: "unclear", reason: "[Mock] Details need checking on the official site." }
    }, {
        name: "Swedish Institute Scholarships for Global Professionals",
        country: "Sweden",
        degreeLevels: ["master"],
        deadline: { date: "2027-02-20", text: "20 February 2027", evidence: "Swedish Institute Scholarships for Global Professionals deadline is 20 February 2027" },
        summary: "[Mock] Swedish master's scholarship listed on a blog.",
        assessment: { status: "unclear", reason: "[Mock] Listed on a third-party site." }
    }, {
        name: "Invented Scholarship That Is Not On The Page",
        summary: "This should be removed by the grounding check.",
        assessment: { status: "likely_match", reason: "Fabricated." }
    }]
};

function readBody(req) {
    return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk;
        });
        req.on("end", () => resolve(body));
    });
}

function sendJson(res, status, body) {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
}

function tavilyHandler(req, res) {
    readBody(req).then(() => {
        sendJson(res, 200, {
            query: "mock",
            response_time: 0.1,
            images: [],
            usage: { credits: 1 },
            results: PAGES.map((page, index) => ({
                title: page.title,
                url: page.url,
                content: page.text.split("\n")[0],
                raw_content: page.text,
                score: 0.9 - index * 0.1
            }))
        });
    });
}

function groqHandler(req, res) {
    readBody(req).then((body) => {
        const request = JSON.parse(body || "{}");
        const prompt = request.messages?.find((message) => message.role === "user")?.content ?? "";
        const sourcesJson = prompt.slice(prompt.indexOf("Sources:") + 8, prompt.indexOf("Return a JSON object")).trim();
        let sources = [];

        try {
            sources = JSON.parse(sourcesJson);
        } catch {
            // Leave empty.
        }

        const scholarships = sources.flatMap((source) =>
            (ITEMS[source.url] ?? []).map((item) => ({ sourceId: source.sourceId, ...item })));

        sendJson(res, 200, {
            id: "mock-completion",
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: request.model,
            usage: { prompt_tokens: Math.round(prompt.length / 4), completion_tokens: 300, total_tokens: Math.round(prompt.length / 4) + 300 },
            choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: JSON.stringify({ scholarships }) } }]
        });
    });
}

function listen(handler, port) {
    return new Promise((resolve) => {
        const server = http.createServer(handler);
        server.listen(port, "127.0.0.1", () => resolve(server));
    });
}

export async function startMockProviders({ tavilyPort = 5101, groqPort = 5102 } = {}) {
    const tavilyServer = await listen(tavilyHandler, tavilyPort);
    const groqServer = await listen(groqHandler, groqPort);

    return {
        tavilyUrl: `http://127.0.0.1:${tavilyPort}`,
        groqUrl: `http://127.0.0.1:${groqPort}/openai/v1`,
        close() {
            tavilyServer.close();
            groqServer.close();
        }
    };
}
