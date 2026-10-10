import app from "./server.js";

// Local development only. Vite proxies /api requests to this port (see vite.config.js).
const PORT = Number(process.env.API_PORT) || 5000;
const HOST = "127.0.0.1";

app.listen(PORT, HOST, (error) => {
    if (error) {
        console.error(`Could not start the backend on port ${PORT}:`, error.message);
        process.exit(1);
    }

    console.log(`ScholarMate AI backend running on http://${HOST}:${PORT}`);
});
