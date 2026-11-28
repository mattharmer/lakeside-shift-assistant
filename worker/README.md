# Lakeside Ask Worker

A small Cloudflare Worker that sits between the GitHub Pages app and the Anthropic Messages API. The demo UI never sees the API key.

```
Browser (GitHub Pages / localhost:8080)
        POST { question, history? }
                ↓
     Cloudflare Worker  /ask
                ↓
     Anthropic Messages API (Claude)
                ↓
     { answer, sources[] }
```

## What it does

- `POST /ask` accepts `{ "question": "...", "history": [{ "role": "user"|"assistant", "content": "..." }] }`.
- It answers **only from the bundled Lakeside documents** (the boxed rules in `docs/00-Custom-Instructions.md`, plus documents 01–16).
- It cites the document it used. If the docs do not cover the question, it tells staff to ask the Duty Manager (ext. 201). For danger, it says to call **000** first.
- CORS is allowed only from `https://mattharmer.github.io` and `http://localhost:8080`.
- Abuse limits:
  - Question length: 500 characters (`QUESTION_MAX_CHARS`).
  - Model output: about 600 tokens (`MAX_TOKENS`).
  - **10 requests per IP per minute** via the Workers **Rate Limiting** binding (`ASK_PER_MINUTE`, 10 requests / 60 seconds). Cloudflare only allows 10s or 60s windows on that binding, so a day-long cap cannot live there.
  - **50 requests per IP per UTC day** and a **global daily cap** (`GLOBAL_DAILY_CAP`, default 200) via the `ASK_LIMITS` **KV** namespace.

Friendly JSON errors look like `{ "error": "Please type a question.", "code": "missing_question" }`.

The API key is the Wrangler secret `ANTHROPIC_API_KEY`. It is not in this repository.

## One-time setup (no code changes needed after this)

You need a free [Cloudflare](https://dash.cloudflare.com/sign-up) account and an [Anthropic](https://console.anthropic.com/) API key. Set a **monthly spend limit** in the Anthropic console before you test.

From your computer, in a terminal:

```bash
npm i -g wrangler
wrangler login
cd worker
npm install
npm run build
```

`npm run build` runs `build-docs.mjs`, which concatenates `docs/*.md` into `src/docs.js` so the Worker can cache that block on Anthropic’s prompt cache.

Create the KV namespace used for daily caps and paste the id into `wrangler.toml` where it says `id = "00000000000000000000000000000001"`:

```bash
npx wrangler kv namespace create ASK_LIMITS
```

Store the API key on Cloudflare (you will be prompted; do not paste it into a file in this repo):

```bash
npx wrangler secret put ANTHROPIC_API_KEY
```

Deploy:

```bash
npx wrangler deploy
```

Copy the `*.workers.dev` URL Wrangler prints, then paste it into `ASK_URL` at the top of `index.html` (no trailing slash). After that file is on GitHub Pages, the Ask screen will call this Worker.

Local try-out (optional):

```bash
cp .dev.vars.example .dev.vars
# put a test key in .dev.vars — never commit that file
npm run dev
```

Then run the app with `python3 -m http.server 8080` from the repo root and set `ASK_URL` to `http://localhost:8787`.

## Tests

```bash
cd worker
npm install
npm test
```

The tests start Miniflare (the same local runtime Wrangler uses) and a fake Anthropic server. They do not call Anthropic and they do not need a Cloudflare account.

## Cost

Do not treat this demo as free. Each question sends the venue documents to Anthropic (prompt caching makes repeats cheaper once the docs block is cached). Check [Anthropic’s current Messages API pricing](https://docs.anthropic.com/en/docs/about-claude/pricing) for the model in `ANTHROPIC_MODEL` before you turn it on, and set a monthly spend limit in the Anthropic console. Cloudflare Workers has its own free tier and paid limits — check Cloudflare’s current Workers pricing if the demo gets busy.

Change the model without a code edit by setting `ANTHROPIC_MODEL` in `wrangler.toml` (default `claude-haiku-5-5`) and redeploying.
