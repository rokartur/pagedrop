import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { rename } from "node:fs/promises";

const token = process.env.PAGEDROP_TOKEN;
if (!token) throw new Error("PAGEDROP_TOKEN is not set");
const dataDir = process.env.DATA_DIR ?? "/data";
const publicUrl = process.env.PUBLIC_URL;

// No allow-same-origin: page scripts run with an opaque origin, so they cannot read *.rokartur.com cookies.
const csp = [
  "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox",
  "default-src 'none'",
  "script-src 'unsafe-inline'",
  "style-src 'unsafe-inline' https:",
  "img-src https: data:",
  "font-src https: data:",
  "media-src https: data:",
  "frame-ancestors 'none'",
].join("; ");

const pagePath = /^\/([\w-]{1,64})$/;

export default {
  port: Number(process.env.PORT ?? 3000),
  maxRequestBodySize: 10 * 1024 * 1024,
  fetch(req: Request) {
    const url = new URL(req.url);
    if (req.method === "GET" || req.method === "HEAD") return servePage(url.pathname);
    if (req.method === "PUT" || req.method === "POST") return savePage(req, url);
    return new Response("Method not allowed\n", { status: 405 });
  },
};

async function servePage(pathname: string) {
  const id = pathname.match(pagePath)?.[1];
  if (!id) return notFound();
  const file = Bun.file(`${dataDir}/${id}.html`);
  if (!(await file.exists())) return notFound();
  return new Response(file, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": csp,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
    },
  });
}

async function savePage(req: Request, url: URL) {
  if (!isAuthorized(req)) return new Response("Unauthorized\n", { status: 401 });
  const id = url.pathname === "/" ? randomBytes(6).toString("base64url") : url.pathname.match(pagePath)?.[1];
  if (!id) return notFound();
  // Write then rename, so a reader never streams a half-written page during an overwrite.
  const tmp = `${dataDir}/.${id}.${randomBytes(6).toString("hex")}.tmp`;
  await Bun.write(tmp, await req.arrayBuffer());
  await rename(tmp, `${dataDir}/${id}.html`);
  return new Response(`${publicUrl ?? url.origin}/${id}\n`);
}

function isAuthorized(req: Request) {
  const sent = createHash("sha256").update(req.headers.get("Authorization") ?? "").digest();
  const expected = createHash("sha256").update(`Bearer ${token}`).digest();
  return timingSafeEqual(sent, expected);
}

function notFound() {
  return new Response("Not found\n", { status: 404 });
}
