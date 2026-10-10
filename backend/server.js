import dotenv from "dotenv";
import { createApp } from "./app.js";

// Loads a local .env file if one exists. On Vercel, variables come from the project settings.
dotenv.config({ quiet: true });

const app = createApp();

// Vercel (@vercel/node, see vercel.json) imports this file and calls the exported
// Express app as the request handler, so it must not start a server here.
// For local development, backend/local-server.js starts the listener.
export default app;
