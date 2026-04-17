import { serve } from "@hono/node-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { createSandboxMcpServer } from "@orqen/sandbox-use-mcp-server";
import type { Sandbox } from "@orqen/sandbox-use";
import { Hono } from "hono";
import { cors } from "hono/cors";

const sandbox: Sandbox = {
  exec: async ({ cmd, args = [] }) => ({
    stdout: `ran: ${cmd} ${args.join(" ")}`.trim(),
    stderr: "",
    exitCode: 0,
  }),
};

const server = createSandboxMcpServer(sandbox);
const transport = new WebStandardStreamableHTTPServerTransport();
await server.connect(transport);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "mcp-session-id", "Last-Event-ID", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.all("/mcp", (c) => transport.handleRequest(c.req.raw));

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
console.log(`MCP server listening on http://localhost:${port}/mcp`);
serve({ fetch: app.fetch, port });
