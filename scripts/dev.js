// Starts the Express backend and the Vite frontend together for local development.
import { spawn } from "node:child_process";

const commands = [
    ["--watch", "backend/local-server.js"],
    ["node_modules/vite/bin/vite.js"]
];

const children = commands.map((args) =>
    spawn(process.execPath, args, { stdio: "inherit" })
);

let shuttingDown = false;

function shutdown(code) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    process.exitCode = code;

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
