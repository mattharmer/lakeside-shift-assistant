import { CUSTOM_INSTRUCTIONS, VENUE_DOCS } from "./docs.js";

const ALLOWED_ORIGINS = new Set([
  "https://mattharmer.github.io",
  "http://localhost:8080",
]);

const OUTPUT_RULES = `You are answering through the Lakeside on-shift web app.

Follow the custom instructions above exactly.

Additional rules for this API:
- Answer only from the venue documents provided below. Do not use outside knowledge to invent procedures, recipes, prices, contacts, legal rules, or licence conditions.
- Cite the document number and title you relied on.
- If the documents do not cover the question, say so clearly, tell them to ask the Duty Manager (ext. 201), and do not guess.
- If anyone is in danger, injured, or there is violence, fire, or a medical emergency: tell staff to call 000 first, then get the Duty Manager (ext. 201).
- Reply with JSON only, and no markdown fences: {"answer":"staff-facing answer in plain Australian English, short numbered steps","sources":["Document 04 — POS, Network and AV Troubleshooting"]}
- The answer field is what staff read on the floor. Keep it brief.`;

export function jsonResponse(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders(origin),
  });
}

export function jsonError(status, error, code, origin) {
  return jsonResponse(status, { error, code }, origin);
}

export function corsHeaders(origin) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
    headers["access-control-allow-methods"] = "POST, OPTIONS";
    headers["access-control-allow-headers"] = "content-type";
    headers["access-control-max-age"] = "86400";
  }
  return headers;
}

export function clientIp(request) {
  const cf = request.headers.get("CF-Connecting-IP");
  if (cf) return cf.trim();
  const forwarded = (request.headers.get("X-Forwarded-For") || "").split(",")[0].trim();
  return forwarded || "local";
}

export function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const item of history.slice(-6)) {
    if (!item || (item.role !== "user" && item.role !== "assistant")) continue;
    const content = String(item.content || "").slice(0, 500);
    if (!content) continue;
    out.push({ role: item.role, content });
  }
  return out;
}

export function parseModelOutput(text) {
  const stripped = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(stripped);
    if (parsed && typeof parsed.answer === "string") {
      const sources = Array.isArray(parsed.sources)
        ? parsed.sources.map((item) => String(item).trim()).filter(Boolean)
        : [];
      return { answer: parsed.answer.trim(), sources };
    }
  } catch {
    // Fall through and treat the model text as the answer.
  }
  const sources = [
    ...new Set(
      [...stripped.matchAll(/Document\s+\d+/gi)].map((match) =>
        match[0].replace(/\s+/g, " ")
      )
    ),
  ];
  return { answer: stripped, sources };
}

export async function checkMinuteLimit(env, ip) {
  const limiter = env.ASK_PER_MINUTE;
  if (!limiter || typeof limiter.limit !== "function") return true;
  const { success } = await limiter.limit({ key: ip });
  return success !== false;
}

export async function consumeDailyQuota(env, ip) {
  const store = env.ASK_LIMITS;
  if (!store || typeof store.get !== "function") return { ok: true };

  const day = new Date().toISOString().slice(0, 10);
  const ipLimit = Number(env.IP_DAILY_LIMIT || 50);
  const globalLimit = Number(env.GLOBAL_DAILY_CAP || 200);
  const ipKey = `ip:${ip}:${day}`;
  const globalKey = `global:${day}`;
  const ttl = 172800;

  const ipCount = Number(await store.get(ipKey)) || 0;
  if (ipCount >= ipLimit) {
    return {
      ok: false,
      error:
        "Daily limit for this device reached. Try again tomorrow, or ask the Duty Manager (ext. 201).",
      code: "ip_daily_limit",
    };
  }

  const globalCount = Number(await store.get(globalKey)) || 0;
  if (globalCount >= globalLimit) {
    return {
      ok: false,
      error:
        "The live assistant has reached today's demo cap. Try the Claude Project, or ask the Duty Manager (ext. 201).",
      code: "global_daily_cap",
    };
  }

  await store.put(ipKey, String(ipCount + 1), { expirationTtl: ttl });
  await store.put(globalKey, String(globalCount + 1), { expirationTtl: ttl });
  return { ok: true };
}

function anthropicBase(env) {
  return String(env.ANTHROPIC_BASE_URL || "https://api.anthropic.com").replace(/\/$/, "");
}

export async function callAnthropic(env, question, history) {
  const key = env.ANTHROPIC_API_KEY;
  if (!key) {
    const err = new Error("not_configured");
    err.status = 503;
    err.code = "not_configured";
    err.friendly = "The live assistant is offline. Try the Claude Project demo.";
    throw err;
  }

  const messages = [...sanitizeHistory(history), { role: "user", content: question }];
  const body = {
    model: env.ANTHROPIC_MODEL || "claude-haiku-5-5",
    max_tokens: Number(env.MAX_TOKENS || 600),
    system: [
      { type: "text", text: `${CUSTOM_INSTRUCTIONS}\n\n${OUTPUT_RULES}` },
      {
        type: "text",
        text: `Venue documents (answer only from these):\n\n${VENUE_DOCS}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  };

  const response = await fetch(`${anthropicBase(env)}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error("upstream");
    err.status = response.status >= 500 ? 502 : 502;
    err.code = "upstream_error";
    err.friendly = "The live assistant could not answer just now. Try again, or ask the Duty Manager (ext. 201).";
    err.upstream = payload;
    throw err;
  }

  const text = Array.isArray(payload.content)
    ? payload.content
        .filter((block) => block && block.type === "text")
        .map((block) => block.text)
        .join("\n")
    : "";
  return parseModelOutput(text);
}

export async function handleRequest(request, env) {
  const origin = request.headers.get("Origin") || "";
  const url = new URL(request.url);

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    if (request.method === "OPTIONS") {
      return jsonError(403, "This assistant only answers from the Lakeside demo app.", "origin_not_allowed", origin);
    }
    return jsonError(403, "This assistant only answers from the Lakeside demo app.", "origin_not_allowed", origin);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(origin) });
  }

  if (url.pathname !== "/ask") {
    return jsonError(404, "Nothing here. POST /ask with a question.", "not_found", origin);
  }

  if (request.method !== "POST") {
    return jsonError(405, "Use POST /ask with a JSON body: {\"question\":\"...\"}.", "method_not_allowed", origin);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError(400, "Send JSON like {\"question\":\"The EFTPOS terminal won't connect. What do I check?\"}.", "invalid_json", origin);
  }

  const question = typeof payload?.question === "string" ? payload.question.trim() : "";
  const maxChars = Number(env.QUESTION_MAX_CHARS || 500);
  if (!question) {
    return jsonError(400, "Please type a question.", "missing_question", origin);
  }
  if (question.length > maxChars) {
    return jsonError(400, `Please keep questions to ${maxChars} characters.`, "question_too_long", origin);
  }

  const ip = clientIp(request);
  const minuteOk = await checkMinuteLimit(env, ip);
  if (!minuteOk) {
    return jsonError(429, "Too many questions. Wait a minute and try again.", "rate_limit", origin);
  }

  const daily = await consumeDailyQuota(env, ip);
  if (!daily.ok) {
    return jsonError(429, daily.error, daily.code, origin);
  }

  try {
    const { answer, sources } = await callAnthropic(env, question, payload.history);
    if (!answer) {
      return jsonError(502, "The live assistant could not answer just now. Try again, or ask the Duty Manager (ext. 201).", "empty_answer", origin);
    }
    return jsonResponse(200, { answer, sources }, origin);
  } catch (err) {
    if (err && err.friendly) {
      return jsonError(err.status || 502, err.friendly, err.code || "upstream_error", origin);
    }
    return jsonError(502, "The live assistant could not answer just now. Try again, or ask the Duty Manager (ext. 201).", "upstream_error", origin);
  }
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
};
