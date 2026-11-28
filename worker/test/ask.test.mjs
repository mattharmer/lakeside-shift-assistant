import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { after, before, describe, it } from "node:test";
import { Miniflare } from "miniflare";
import {
  checkMinuteLimit,
  consumeDailyQuota,
  parseModelOutput,
  sanitizeHistory,
  jsonError,
} from "../src/index.js";

function memoryKv() {
  const store = new Map();
  return {
    async get(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      store.set(key, String(value));
    },
  };
}

function startMockAnthropic(handler) {
  const server = createServer((req, res) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        body = { _raw: raw };
      }
      handler({ req, body, res });
    });
  });
  return server;
}

function listen(server) {
  server.listen(0, "127.0.0.1");
  return once(server, "listening").then(() => {
    const { port } = server.address();
    return `http://127.0.0.1:${port}`;
  });
}

function anthropicMessage(text) {
  return {
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    usage: { input_tokens: 80, output_tokens: 40 },
  };
}

const MOCK_ANSWER = {
  answer:
    "1. Check the terminal is powered on and the cables are seated.\n2. Check paper and the last receipt before retrying.\n3. Restart that terminal only, then try another if needed.\n4. If every terminal is down, get the Duty Manager (ext. 201).",
  sources: ["Document 04 — POS, Network and AV Troubleshooting"],
};

function workerOptions(extraBindings = {}, extra = {}) {
  return {
    modules: true,
    scriptPath: "src/index.js",
    modulesRoot: ".",
    compatibilityDate: "2025-10-11",
    modulesRules: [{ type: "ESModule", include: ["**/*.js"] }],
    bindings: {
      ANTHROPIC_API_KEY: "test-key-not-real",
      ANTHROPIC_MODEL: "claude-haiku-5-5",
      QUESTION_MAX_CHARS: "500",
      MAX_TOKENS: "600",
      IP_DAILY_LIMIT: "50",
      GLOBAL_DAILY_CAP: "200",
      ...extraBindings,
    },
    kvNamespaces: ["ASK_LIMITS"],
    ratelimits: {
      ASK_PER_MINUTE: {
        namespace_id: "7011",
        simple: { limit: 10, period: 60 },
      },
    },
    ...extra,
  };
}

describe("parseModelOutput / history", () => {
  it("parses JSON answers and source lists", () => {
    const parsed = parseModelOutput(JSON.stringify(MOCK_ANSWER));
    assert.equal(parsed.answer.startsWith("1. Check the terminal"), true);
    assert.deepEqual(parsed.sources, MOCK_ANSWER.sources);
  });

  it("strips markdown fences", () => {
    const parsed = parseModelOutput("```json\n" + JSON.stringify(MOCK_ANSWER) + "\n```");
    assert.equal(parsed.answer, MOCK_ANSWER.answer);
  });

  it("falls back to Document N citations in plain text", () => {
    const parsed = parseModelOutput("Follow Document 02 then Document 02 again.");
    assert.deepEqual(parsed.sources, ["Document 02"]);
  });

  it("keeps the last six valid history turns", () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 ? "assistant" : "user",
      content: `turn ${i}`,
    }));
    const cleaned = sanitizeHistory(history);
    assert.equal(cleaned.length, 6);
    assert.equal(cleaned[0].content, "turn 4");
  });
});

describe("jsonError shape", () => {
  it("returns friendly JSON with a code", async () => {
    const res = jsonError(400, "Please type a question.", "missing_question", "http://localhost:8080");
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.deepEqual(body, { error: "Please type a question.", code: "missing_question" });
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:8080");
  });

  it("does not grant CORS to unknown origins", async () => {
    const res = jsonError(403, "no", "origin_not_allowed", "https://evil.example");
    assert.equal(res.headers.get("access-control-allow-origin"), null);
  });
});

describe("quota helpers", () => {
  it("enforces the per-IP daily cap", async () => {
    const env = { ASK_LIMITS: memoryKv(), IP_DAILY_LIMIT: "1", GLOBAL_DAILY_CAP: "10" };
    assert.equal((await consumeDailyQuota(env, "1.1.1.1")).ok, true);
    const blocked = await consumeDailyQuota(env, "1.1.1.1");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, "ip_daily_limit");
  });

  it("enforces the global daily cap", async () => {
    const env = { ASK_LIMITS: memoryKv(), IP_DAILY_LIMIT: "50", GLOBAL_DAILY_CAP: "1" };
    assert.equal((await consumeDailyQuota(env, "1.1.1.1")).ok, true);
    const blocked = await consumeDailyQuota(env, "8.8.8.8");
    assert.equal(blocked.ok, false);
    assert.equal(blocked.code, "global_daily_cap");
  });

  it("returns false when the per-minute limiter trips", async () => {
    const env = { ASK_PER_MINUTE: { async limit() { return { success: false }; } } };
    assert.equal(await checkMinuteLimit(env, "1.1.1.1"), false);
  });

  it("allows traffic when the limiter is missing", async () => {
    assert.equal(await checkMinuteLimit({}, "1.1.1.1"), true);
  });
});

describe("Worker /ask with mocked Anthropic (Miniflare)", () => {
  let mock;
  let lastRequest;
  let mf;

  before(async () => {
    mock = startMockAnthropic(({ req, body, res }) => {
      lastRequest = { url: req.url, method: req.method, headers: req.headers, body };
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(anthropicMessage(JSON.stringify(MOCK_ANSWER))));
    });
    const mockUrl = await listen(mock);
    mock.unref();
    try {
      mf = new Miniflare(workerOptions({ ANTHROPIC_BASE_URL: mockUrl }));
      await mf.ready;
    } catch (err) {
      mock.close();
      throw err;
    }
  });

  after(async () => {
    if (mf) await mf.dispose();
    if (mock) mock.close();
  });

  async function ask(body, headers = {}) {
    return mf.dispatchFetch("http://localhost/ask", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  }

  it("returns 404 JSON for unknown paths", async () => {
    const res = await mf.dispatchFetch("http://localhost/");
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.code, "not_found");
  });

  it("returns 400 when the question is missing", async () => {
    const res = await ask({});
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "missing_question");
  });

  it("returns 400 when the question is over 500 characters", async () => {
    const res = await ask({ question: "x".repeat(501) });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.code, "question_too_long");
  });

  it("rejects a disallowed Origin", async () => {
    const res = await ask(
      { question: "What is the house spec for an Espresso Martini?" },
      { Origin: "https://evil.example" }
    );
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.code, "origin_not_allowed");
  });

  it("answers from the mocked model and cites sources", async () => {
    const res = await ask(
      { question: "The EFTPOS terminal won't connect. What do I check?" },
      { Origin: "http://localhost:8080" }
    );
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("access-control-allow-origin"), "http://localhost:8080");
    const body = await res.json();
    assert.equal(body.answer, MOCK_ANSWER.answer);
    assert.deepEqual(body.sources, MOCK_ANSWER.sources);
    assert.equal(lastRequest.method, "POST");
    assert.equal(lastRequest.url, "/v1/messages");
    assert.equal(lastRequest.headers["x-api-key"], "test-key-not-real");
    const docsBlock = lastRequest.body.system.find((block) =>
      String(block.text).includes("===== 01-Opening-and-Closing-Checklist.md =====")
    );
    assert.ok(docsBlock, "docs bundle should be in the system prompt");
    assert.deepEqual(docsBlock.cache_control, { type: "ephemeral" });
    assert.equal(lastRequest.body.model, "claude-haiku-5-5");
    assert.equal(lastRequest.body.max_tokens, 600);
  });

  it("allows CORS preflight from GitHub Pages", async () => {
    const res = await mf.dispatchFetch("http://localhost/ask", {
      method: "OPTIONS",
      headers: {
        Origin: "https://mattharmer.github.io",
        "Access-Control-Request-Method": "POST",
      },
    });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get("access-control-allow-origin"), "https://mattharmer.github.io");
  });

  it("returns 429 when the per-IP daily cap is reached", async () => {
    const tight = new Miniflare(workerOptions({
      IP_DAILY_LIMIT: "1",
      ANTHROPIC_BASE_URL: (await mf.getBindings()).ANTHROPIC_BASE_URL,
    }));
    try {
      const first = await tight.dispatchFetch("http://localhost/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Espresso Martini spec?" }),
      });
      assert.equal(first.status, 200);
      const second = await tight.dispatchFetch("http://localhost/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Espresso Martini spec again?" }),
      });
      assert.equal(second.status, 429);
      const body = await second.json();
      assert.equal(body.code, "ip_daily_limit");
    } finally {
      await tight.dispose();
    }
  });

  it("returns a friendly 503 when the API key is missing", async () => {
    const offline = new Miniflare(workerOptions({
      ANTHROPIC_API_KEY: "",
      ANTHROPIC_BASE_URL: (await mf.getBindings()).ANTHROPIC_BASE_URL,
    }));
    try {
      const res = await offline.dispatchFetch("http://localhost/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Close checklist?" }),
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.code, "not_configured");
      assert.match(body.error, /offline/i);
    } finally {
      await offline.dispose();
    }
  });
});
