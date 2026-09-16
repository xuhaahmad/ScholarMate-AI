import "dotenv/config";
import express from "express";
import cors from "cors";
import { tavily } from "@tavily/core";
import OpenAI from "openai";

const app = express();

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY
});
const groqClient = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "ScholarMate AI backend is running"
    });
});
app.post("/api/profile", (req, res) => {
    const profile = req.body;

    console.log("Received student profile:", profile);

    res.json({
        message: "Profile received successfully",
        profile: profile
    });
});
app.post("/api/search-scholarships", async (req, res) => {
    try {
        const profile = req.body;

        const searchQuery = `
    ${profile.field}
    undergraduate scholarships
    international students
    ${profile.destination ? `in ${profile.destination}` : ""}
    2026 2027
`.replace(/\s+/g, " ").trim();

        console.log("Scholarship search:", searchQuery);

        // Search the web with Tavily
        const tavilyStart = Date.now();
        const response = await tavilyClient.search(searchQuery, {
            maxResults: 5
        }); 
        console.log("TAVILY TIME:", Date.now() - tavilyStart, "ms");
        console.log("Tavily results:", response);
        const officialDomains = [
            "daad.de",
            "study-in-germany.de",
            "uni-assist.de"
        ];

        const isOfficial = (url) =>
            officialDomains.some((domain) => url.includes(domain));

        const results = response.results.sort((a, b) => {
            return Number(isOfficial(b.url)) - Number(isOfficial(a.url));
        });
        const aiResults = results.slice(0, 3).map((result) => ({
            title: result.title,
            url: result.url,
            content: result.content?.slice(0, 1500) || "Not specified"
        }));

        // Send the search results to Groq for analysis
        const prompt = `
You are ScholarMate AI, a scholarship research assistant.

Student profile:
${JSON.stringify(profile, null, 2)}

Scholarship search results:
${JSON.stringify(aiResults, null, 2)}

Analyze the scholarship search results for the student.
Return ONLY valid JSON.

Use this exact structure:

{
  "scholarships": [
    {
      "name": "string",
      "eligibilityStatus": "likely_match",
      "degreeLevel": "string",
      "eligibility": ["string"],
      "deadline": "string",
      "funding": "string",
      "applicationLink": "string",
      "sourceUrl": "string",
      "explanation": "string"
    }
  ]
}

Rules:
- eligibilityStatus must be likely_match, not_a_match, or unclear.
- Compare the scholarship degree level with the student's degree.
- If the student is a Bachelor student and the scholarship is for Master's or PhD study, mark it as "not_a_match".
- If the student is a Master's student and the scholarship is only for Bachelor study, mark it as "not_a_match".
- If the degree level cannot be determined, use "unclear".
- Use only information from the provided results.
- Never invent information.
- If information is missing, use "Not specified".
- Keep the original source URL.
- Return only the JSON object.
`;
        const aiStart = Date.now();
        const aiResponse = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-20b",
            reasoning_effort: "low",

            response_format: {
                type: "json_object"
            },

            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });
        console.log("GROQ TIME:", Date.now() - aiStart, "ms");
        console.log("RAW GROQ RESPONSE:");
        console.log(aiResponse.choices[0].message.content);

        const analysis = JSON.parse(
            aiResponse.choices[0].message.content
        );

        res.json({
            query: searchQuery,
            scholarships: analysis.scholarships
        });

    } catch (error) {
        console.error("Scholarship search error:", error);

        res.status(500).json({
            error: "Scholarship search failed"
        });
    }
});
app.get("/api/test-grok", async (req, res) => {
    try {
        const response = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-20b",
            messages: [
                {
                    role: "user",
                    content: "Reply with exactly: Grok is connected."
                }
            ]
        });

        res.json({
            message: response.choices[0].message.content
        });

    } catch (error) {
        console.error("Grok API error:", error);

        res.status(500).json({
            error: "Grok API failed"
        });
    }
});
app.post("/api/test-analysis", async (req, res) => {
    try {
        const { profile, results } = req.body;

        const prompt = `
You are ScholarMate AI, a scholarship research assistant.

Student profile:
${JSON.stringify(profile, null, 2)}

Scholarship search results:
${JSON.stringify(results, null, 2)}

Analyze the scholarship search results for the student.

Return ONLY valid JSON in exactly this structure:

{
  "scholarships": [
    {
      "name": "Scholarship name",
      "eligibilityStatus": "likely_match",
      "degreeLevel": "Bachelor",
      "eligibility": [
        "Requirement 1",
        "Requirement 2"
      ],
      "deadline": "Deadline or Not specified",
      "funding": "Funding details or Not specified",
      "applicationLink": "Official application link or Not specified",
      "sourceUrl": "URL of the source result",
      "explanation": "Short explanation of why this scholarship may or may not match the student"
    }
  ]
}

Rules:
- "eligibilityStatus" must be exactly one of:
  "likely_match", "not_a_match", or "unclear"
- Use the student's profile when evaluating eligibility.
- Only use information present in the provided search results.
- Do not invent eligibility requirements, deadlines, funding, links, or scholarship details.
- If information is missing, write "Not specified".
- Preserve the original source URL in "sourceUrl".
- Prefer official application links when they are available in the source.
- Include potentially relevant scholarships even if some information is missing.
- Return ONLY the JSON object. Do not include markdown, explanations, or code fences.
`;

        const response = await groqClient.chat.completions.create({
            model: "openai/gpt-oss-20b",
            response_format: {
                type: "json_object"
            },
            reasoning_format: "hidden",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        res.json({
            analysis: response.choices[0].message.content
        });

    } catch (error) {
        console.error("AI analysis error:", error);

        res.status(500).json({
            error: "AI analysis failed"
        });
    }
});
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`ScholarMate AI backend running on port ${PORT}`);
});