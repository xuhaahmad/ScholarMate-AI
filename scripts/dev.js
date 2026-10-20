// Starts the Express backend and the Vite frontend together for local development.
// With --mock, the backend talks to local mock providers instead of Tavily and
// Groq, so the whole app can be tried without API keys or credits.
import { spawn } from "node:child_process";

const useMock = process.argv.includes("--mock");

let backendEnv = process.env;
let mock = null;

if (useMock) {
    const { startMockProviders } = await import("./mock-providers.js");
    mock = await startMockProviders();

    // Explicit values win over .env (dotenv never overrides existing variables).
    backendEnv = {
        ...process.env,
        TAVILY_API_KEY: "mock-key",
        GROQ_API_KEY: "mock-key",
        TAVILY_API_BASE_URL: mock.tavilyUrl,
        GROQ_API_BASE_URL: mock.groqUrl
    };

    console.log("Mock mode: using local mock providers. Results are fake test data marked [MOCK].");
}

const commands = [
    { args: ["--watch", "backend/local-server.js"], env: backendEnv },
    { args: ["node_modules/vite/bin/vite.js"], env: process.env }
];

const children = commands.map(({ args, env }) =>
    spawn(process.execPath, args, { stdio: "inherit", env })
);

let shuttingDown = false;

function shutdown(code) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    process.exitCode = code;
    mock?.close();

    for (const child of children) {
        if (child.exitCode === null) {
            child.kill();
        }
    }
}

// If either process stops, stop the other one too.
for (const child of children) {
    child.on("exit", (code) => shutdown(code ?? 0));
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
