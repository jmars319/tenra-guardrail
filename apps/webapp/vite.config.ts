import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {
  acknowledgeExternalReviewDecision,
  attachExternalReviewDecision,
  createExternalReviewDecision,
  exportExternalReviewDecisions,
  exportExternalReviewQueue,
  importExternalReviewPayload
} from "./src/external-review-api";

function readRequestBody(request: import("node:http").IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

const defaultSuiteAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5176",
  "http://127.0.0.1:5176",
  "http://localhost:3000",
  "http://127.0.0.1:3000"
];

function readSuiteAllowedOrigins() {
  return (process.env.GUARDRAIL_SUITE_ALLOWED_ORIGINS ?? defaultSuiteAllowedOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function applyCors(request: import("node:http").IncomingMessage, response: import("node:http").ServerResponse) {
  const origin = request.headers.origin;
  const allowedOrigins = readSuiteAllowedOrigins();
  const originAllowed = !origin || allowedOrigins.includes(origin);

  if (origin && originAllowed) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
  }
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  return originAllowed;
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: "guardrail-external-review-api",
      configureServer(server) {
        server.middlewares.use("/api/external-reviews", async (request, response, next) => {
          const originAllowed = applyCors(request, response);
          if (request.method === "OPTIONS") {
            response.statusCode = originAllowed ? 204 : 403;
            response.end();
            return;
          }
          if (request.method !== "GET" && request.method !== "POST") {
            next();
            return;
          }
          if (!originAllowed) {
            response.statusCode = 403;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: ["Origin is not allowed for Guardrail external reviews."] }));
            return;
          }

          try {
            const body = request.method === "POST" ? await readRequestBody(request) : "";
            const payload = request.method === "POST" ? JSON.parse(body || "{}") : undefined;
            const result =
              request.method === "GET"
                ? exportExternalReviewQueue()
                : importExternalReviewPayload(payload);

            response.statusCode = result.ok ? 200 : 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(result, null, 2));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: [error instanceof Error ? error.message : "Review API failed."] }));
          }
        });

        server.middlewares.use("/api/external-review-decisions", async (request, response, next) => {
          const originAllowed = applyCors(request, response);
          if (request.method === "OPTIONS") {
            response.statusCode = originAllowed ? 204 : 403;
            response.end();
            return;
          }
          if (request.method !== "GET" && request.method !== "POST") {
            next();
            return;
          }
          if (!originAllowed) {
            response.statusCode = 403;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: ["Origin is not allowed for Guardrail decisions."] }));
            return;
          }

          try {
            if (request.method === "GET") {
              const result = exportExternalReviewDecisions();
              response.statusCode = 200;
              response.setHeader("Content-Type", "application/json; charset=utf-8");
              response.end(JSON.stringify(result, null, 2));
              return;
            }

            const body = await readRequestBody(request);
            const payload = JSON.parse(body || "{}");
            const traceId = typeof payload.requestTraceId === "string" ? payload.requestTraceId : "";
            const result =
              payload.schema === "tenra-guardrail.external-action-decision.v1"
                ? attachExternalReviewDecision(traceId, payload)
                : createExternalReviewDecision({
                    traceId,
                    decision: payload.decision,
                    reason: typeof payload.reason === "string" ? payload.reason : undefined,
                    reviewerLabel: typeof payload.reviewerLabel === "string" ? payload.reviewerLabel : undefined,
                    callbackUrl: typeof payload.callbackUrl === "string" ? payload.callbackUrl : undefined
                  });
            response.statusCode = result.ok ? 200 : 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(result, null, 2));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: [error instanceof Error ? error.message : "Decision API failed."] }));
          }
        });

        server.middlewares.use("/api/external-review-callbacks", async (request, response, next) => {
          const originAllowed = applyCors(request, response);
          if (request.method === "OPTIONS") {
            response.statusCode = originAllowed ? 204 : 403;
            response.end();
            return;
          }
          if (request.method !== "POST") {
            next();
            return;
          }
          if (!originAllowed) {
            response.statusCode = 403;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: ["Origin is not allowed for Guardrail callbacks."] }));
            return;
          }

          try {
            const body = await readRequestBody(request);
            const payload = JSON.parse(body || "{}");
            const result = await acknowledgeExternalReviewDecision(
              typeof payload.requestTraceId === "string" ? payload.requestTraceId : "",
              typeof payload.callbackUrl === "string" ? payload.callbackUrl : undefined
            );
            response.statusCode = result.ok ? 200 : 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(result, null, 2));
          } catch (error) {
            response.statusCode = 400;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ ok: false, errors: [error instanceof Error ? error.message : "Decision callback failed."] }));
          }
        });
      }
    }
  ]
});
