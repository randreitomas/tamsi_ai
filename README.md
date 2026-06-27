# Tamsi

AI academic co-pilot for FEU Tech students. Upload SOLAR grade screenshots, review extracted records, then get deterministic GWA, scholarship standing, Latin honors, and ChatGPT-powered advice.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## User flow

1. **Connect ChatGPT** — device OAuth for Vision extraction and advisor copy
2. **Upload grades** — multi-screenshot SOLAR extraction
3. **Review & confirm** — edit courses, pick scholarship tier
4. **Dashboard** — GWA chart, standing gauge, status cards, AI advice

## Privacy & storage

- Grades and preferences are kept in **sessionStorage** only (this browser tab).
- Closing the tab clears Tamsi data. Use **Start over** on upload or dashboard to reset mid-session.
- Tamsi does **not** persist academic records on the server.
- ChatGPT OAuth tokens are stored in HTTP-only cookies for AI calls only.

## ChatGPT OAuth

Tamsi uses [ai-sdk-provider-chatgpt-oauth](https://github.com/ben-vargas/ai-sdk-provider-chatgpt-oauth) with OpenAI's Codex OAuth client. The web app uses **device-code login** because the public OAuth client only accepts `http://127.0.0.1:1455/auth/callback` for browser redirects—not port 3000.

Copy `.env.example` to `apps/web/.env.local` and set:

- `CHATGPT_OAUTH_*`
- `CHATGPT_OAUTH_API_BASE_URL`
- `GPT_MODEL`
- `NEXT_PUBLIC_APP_URL` (your deployed URL on Vercel)

For local UI development without OAuth:

```bash
TAMSI_USE_MOCK_AI=true npm run dev
```

## Deploy on Vercel

1. Import [github.com/randreitomas/tamsi_ai](https://github.com/randreitomas/tamsi_ai)
2. Set **Root Directory** to `apps/web`
3. Add environment variables from `.env.example`
4. Deploy

## Monorepo layout

| Path | Purpose |
|------|---------|
| `apps/web` | Next.js 15 app |
| `packages/academic-engine` | GWA, honors, scholarship logic |
| `packages/ai` | Vision extraction & advisor prompts |
| `packages/types` | Shared Zod schemas |

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## License

MIT — see [LICENSE](LICENSE).
