import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Environment variables
const oauthServerUrl = process.env.OAUTH_SERVER_URL;
if (!oauthServerUrl) {
  console.warn("[config] OAUTH_SERVER_URL is not set; OAuth integrations are disabled.");
}

// Railway port handling
const PORT = Number(process.env.PORT || 8080);
const HOST = "0.0.0.0";

// Needed for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to built frontend (Vite build output)
const clientDistPath = path.resolve(__dirname, "public");

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(clientDistPath));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    oauthConfigured: Boolean(oauthServerUrl),
    timestamp: new Date().toISOString(),
  });
});

// Root API check
app.get("/api", (_req, res) => {
  res.json({
    service: "EWF Inventory API",
    status: "running",
  });
});

// React/Vite SPA fallback
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Start server
app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

export default app;