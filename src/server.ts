import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";

const PORT = Number(process.env.PORT ?? 3000);
const DATA_DIR = process.env.DATA_DIR ?? path.join(__dirname, "..", "datasources");

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

async function serveWholeFile(res: http.ServerResponse, fileName: string): Promise<void> {
  const raw = await readFile(path.join(DATA_DIR, fileName), "utf-8");
  sendJson(res, 200, JSON.parse(raw));
}

async function servePagedResource(
  res: http.ServerResponse,
  dir: string,
  filePrefix: string,
  page: number
): Promise<void> {
  const fileName = `${filePrefix}_${String(page).padStart(2, "0")}.json`;
  try {
    const raw = await readFile(path.join(DATA_DIR, dir, fileName), "utf-8");
    sendJson(res, 200, JSON.parse(raw));
  } catch {
    sendJson(res, 404, { error: `page ${page} not found` });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const page = Number(url.searchParams.get("page") ?? "1") || 1;

  switch (url.pathname) {
    case "/categories":
      void serveWholeFile(res, "categories.json");
      return;
    case "/promotions":
      void serveWholeFile(res, "promotions.json");
      return;
    case "/affiliates":
      void serveWholeFile(res, "affiliates.json");
      return;
    case "/profiles":
      void servePagedResource(res, "cdp_customer_profiles", "cdp_profiles_page", page);
      return;
    case "/products":
      void servePagedResource(res, "products_catalog", "products_page", page);
      return;
    case "/orders":
      void servePagedResource(res, "orders", "orders_page", page);
      return;
    case "/health":
      sendJson(res, 200, { status: "ok" });
      return;
    default:
      sendJson(res, 404, { error: "not found" });
  }
});

server.listen(PORT, () => {
  console.log(`ecomm-data listening on :${PORT} (DATA_DIR=${DATA_DIR})`);
});
