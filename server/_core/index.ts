import express from 'express';

const app = express();

const oauthServerUrl = process.env.OAUTH_SERVER_URL;
if (!oauthServerUrl) {
  console.warn('[config] OAUTH_SERVER_URL is not set; OAuth integrations are disabled.');
}

const PORT = Number(process.env.PORT || 8080);
const HOST = '0.0.0.0';

app.get('/', (_req, res) => {
  res.send('EWF Inventory API running');
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, oauthConfigured: Boolean(oauthServerUrl) });
});

app.listen(PORT, HOST, () => {
  console.log(`Server listening on ${HOST}:${PORT}`);
});

export default app;