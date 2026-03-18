import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerOAuthRoutes } from "./oauth";
import { restApiRouter } from "../rest-api";

const app = express();

const PORT = Number(process.env.PORT || 8080);
const HOST = "0.0.0.0";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

registerOAuthRoutes(app);

app.use("/api", restApiRouter);

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, "public");

app.use(express.static(clientDistPath));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(PORT, HOST, () => {
  console.log(`[EWF Inventory] Server listening on http://${HOST}:${PORT}`);
  console.log(`[EWF Inventory] Static files: ${clientDistPath}`);
  if (!process.env.DATABASE_URL) {
    console.warn("[EWF Inventory] WARNING: DATABASE_URL is not set");
  }
});

export default app;
