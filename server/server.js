import { createServer } from "node:http";

const port = Number(process.env.PORT || 8787);
const maxLength = Number(process.env.MAX_TEXT_LENGTH || 2000);
const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    original: { type: "string" }, reading: { type: "string" }, translation: { type: "string" },
    pieces: { type: "array", items: { type: "object", properties: { text: { type: "string" }, reading: { type: "string" }, role: { type: "string" }, explanation: { type: "string" } }, required: ["text", "role", "explanation"], additionalProperties: false } },
    grammarPoints: { type: "array", items: { type: "object", properties: { pattern: { type: "string" }, meaning: { type: "string" }, example: { type: "string" } }, required: ["pattern", "meaning", "example"], additionalProperties: false } },
    vocabulary: { type: "array", items: { type: "object", properties: { word: { type: "string" }, reading: { type: "string" }, meaning: { type: "string" } }, required: ["word", "reading", "meaning"], additionalProperties: false } },
    pitfalls: { type: "array", items: { type: "string" } }
  }, required: ["original", "reading", "translation", "pieces", "grammarPoints", "vocabulary", "pitfalls"], additionalProperties: false
};

function send(response, status, data, origin = "") {
  const allowedOrigin = origin.startsWith("chrome-extension://") ? origin : "null";
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": allowedOrigin, "Access-Control-Allow-Headers": "Content-Type, X-OpenAI-API-Key", "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin" });
  response.end(JSON.stringify(data));
}

const server = createServer(async (request, response) => {
  const origin = request.headers.origin || "";
  if (request.method === "OPTIONS") return send(response, 204, {}, origin);
  if (request.method !== "POST" || request.url !== "/analyze") return send(response, 404, { error: "Not found" }, origin);
  const apiKey = request.headers["x-openai-api-key"] || process.env.OPENAI_API_KEY;
  if (!apiKey) return send(response, 503, { error: "Add your OpenAI API key in the extension settings." }, origin);

  try {
    let raw = "";
    for await (const chunk of request) {
      raw += chunk;
      if (raw.length > 32_000) return send(response, 413, { error: "Request is too large." }, origin);
    }
    const { text } = JSON.parse(raw);
    if (typeof text !== "string" || !text.trim()) return send(response, 400, { error: "Text is required." }, origin);
    if (text.length > maxLength) return send(response, 400, { error: `Text must be ${maxLength} characters or fewer.` }, origin);

    const completion = await fetch(process.env.LLM_API_URL || "https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.LLM_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a patient Japanese grammar tutor. Explain Japanese for an English-speaking learner. Be precise about particles, phrase roles, and conjugation; note ambiguity rather than guessing. Return only the requested structured analysis." },
          { role: "user", content: `Analyze the text below. Give its kana reading, natural English translation, phrase-by-phrase breakdown with each phrase's role and explanation, grammar patterns with examples, vocabulary, and common learner pitfalls. Keep the explanation clear and concise.\n\n${text}` }
        ],
        response_format: { type: "json_schema", json_schema: { name: "japanese_analysis", strict: true, schema: responseSchema } }
      })
    });
    const payload = await completion.json();
    if (!completion.ok) return send(response, 502, { error: payload.error?.message || "The language model request failed." }, origin);
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return send(response, 502, { error: "The language model returned an empty response." }, origin);
    return send(response, 200, JSON.parse(content), origin);
  } catch (error) {
    console.error(error);
    return send(response, 500, { error: error instanceof SyntaxError ? "Invalid JSON request or model response." : "Analysis failed. Check the server logs." }, origin);
  }
});

server.listen(port, () => console.log(`Oshiete analysis server listening on http://localhost:${port}`));
