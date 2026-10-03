import { SELF } from "cloudflare:test";
import { expect, it } from "vitest";

it("serves a health response from the Worker API", async () => {
  const response = await SELF.fetch("https://example.com/api/health");

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

it("serves the built front end at the root", async () => {
  const response = await SELF.fetch("https://example.com/");

  expect(response.status).toBe(200);
  expect(await response.text()).toContain("<!DOCTYPE html>");
});
