import { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { toolSpecs, type Sandbox } from "@orqen/sandbox-use";

const asText = (result: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(result) }],
});

export const createSandboxMcpServer = (sandbox: Sandbox): McpServer => {
  const server = new McpServer({
    name: "sandbox-use",
    version: "0.0.0",
  });

  server.registerTool(
    "create",
    {
      title: toolSpecs.create.title,
      description: toolSpecs.create.description,
      inputSchema: toolSpecs.create.inputSchema,
    },
    async (input) => asText(await sandbox.create(input)),
  );

  server.registerTool(
    "exec",
    {
      title: toolSpecs.exec.title,
      description: toolSpecs.exec.description,
      inputSchema: toolSpecs.exec.inputSchema,
    },
    async (input) => asText(await sandbox.exec(input)),
  );

  return server;
};
