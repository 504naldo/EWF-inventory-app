import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const oauthServerUrl = process.env.OAUTH_SERVER_URL;
if (!oauthServerUrl) {
  console.warn("[config] OAUTH_SERVER_URL is not set; OAuth integrations are disabled.");
}

const PORT = Number(process.env.PORT || 8080);
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "public");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(clientDistPath));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    oauthConfigured: Boolean(oauthServerUrl),
    timestamp: new Date().toISOString(),
  });
});

app.get("/api", (_req, res) => {
  res.json({
    service: "EWF Inventory API",
    status: "running",
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});

export default app;