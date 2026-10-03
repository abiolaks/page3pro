import { Hono } from "hono";

const api = new Hono<{ Bindings: Env }>();

api.get("/api/health", (context) => context.json({ status: "ok" }));

export default {
  fetch(request, env, executionContext) {
    const { pathname } = new URL(request.url);

    if (pathname === "/api" || pathname.startsWith("/api/")) {
      return api.fetch(request, env, executionContext);
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
