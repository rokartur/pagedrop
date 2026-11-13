import { expect, test } from "bun:test";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

process.env.POSTPLAN_TOKEN = "test-token";
process.env.DATA_DIR = await mkdtemp(join(tmpdir(), "postplan-"));
process.env.PUBLIC_URL = "https://postplan.example";
const server = (await import("./server.ts")).default;

const auth = { Authorization: "Bearer test-token" };
const call = (method: string, path: string, init: RequestInit = {}) =>
  server.fetch(new Request(`http://localhost${path}`, { method, ...init }));

test("upload without the token is rejected", async () => {
  const res = await call("PUT", "/", { body: "<p>x</p>", headers: { Authorization: "Bearer wrong" } });
  expect(res.status).toBe(401);
});

test("upload returns a URL that serves the same bytes in a sandbox", async () => {
  const res = await call("PUT", "/", { body: "<h1>plan</h1>", headers: auth });
  const url = (await res.text()).trim();
  expect(url).toMatch(/^https:\/\/postplan\.example\/[\w-]{8}$/);

  const page = await call("GET", new URL(url).pathname);
  expect(await page.text()).toBe("<h1>plan</h1>");
  expect(page.headers.get("Content-Security-Policy")).toBe(
    "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'unsafe-inline'; " +
      "style-src 'unsafe-inline' https:; img-src https: data:; font-src https: data:; media-src https: data:; frame-ancestors 'none'",
  );
});

test("uploads over 10 MB are rejected", async () => {
  const live = Bun.serve({ ...server, port: 0 });
  const res = await fetch(live.url, { method: "PUT", body: new Uint8Array(10 * 1024 * 1024 + 1), headers: auth });
  live.stop(true);
  expect(res.status).toBe(413);
});

test("upload to an existing id overwrites it", async () => {
  await call("PUT", "/q3-plan", { body: "v1", headers: auth });
  const res = await call("PUT", "/q3-plan", { body: "v2", headers: auth });
  expect(await res.text()).toBe("https://postplan.example/q3-plan\n");
  expect(await (await call("GET", "/q3-plan")).text()).toBe("v2");
});

test("paths outside a plain id are not found", async () => {
  expect((await call("GET", "/missing")).status).toBe(404);
  expect((await call("GET", "/..%2Fserver")).status).toBe(404);
  expect((await call("PUT", "/a/b", { body: "x", headers: auth })).status).toBe(404);
});
