import dotenv from "dotenv";
import { createApp } from "./app.js";

// Loads a local .env file if one exists. On Vercel, variables come from the project settings.
dotenv.config({ quiet: true });

const app = createApp();

// Vercel (@vercel/node, see vercel.json) imports this file and calls the exported
// Express app as the request handler, so it must not start a server here.
// For local development, backend/local-server.js starts the listener.
export default app;

// Upper bound for one invocation on Vercel. A search is designed to finish in
// about 50 seconds (20 s web search + 30 s AI budget); see backend/config.js.
export const config = {
    maxDuration: 60
};
