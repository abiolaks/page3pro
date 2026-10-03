import { env } from "cloudflare:workers";
import { expect, it } from "vitest";
import { createScopedDataAccess } from "../worker/scoped-data-access";

it("returns only the Person held by the scope, not merely the first row", async () => {
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO person (id, name, phone, created_at) VALUES (?, ?, ?, ?)",
    ).bind("person-a", "Amina", "+2348000000001", "2026-10-01T00:00:00.000Z"),
    env.DB.prepare(
      "INSERT INTO person (id, name, phone, created_at) VALUES (?, ?, ?, ?)",
    ).bind("person-b", "Bola", "+2348000000002", "2026-10-01T00:00:00.000Z"),
  ]);

  // Scope to the second inserted Person. An unscoped read would return
  // person-a, the first row, so this assertion is what proves the
  // WHERE id = ? clause actually applies the scope.
  const access = createScopedDataAccess(env.DB, { personId: "person-b" });
  const profile = await access.getPersonProfile();

  expect(profile).toEqual({
    id: "person-b",
    name: "Bola",
    phone: "+2348000000002",
    photo_key: null,
    bank_account: null,
    next_of_kin: null,
    guarantor: null,
    created_at: "2026-10-01T00:00:00.000Z",
  });
});
