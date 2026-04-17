import { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { toolSpecs, type Sandbox } from "@orqen/sandbox-use";

export const createSandboxMcpServer = (sandbox: Sandbox): McpServer => {
  const server = new McpServer({
    name: "sandbox-use",
    version: "0.0.0",
  });

  for (const [name, spec] of Object.entries(toolSpecs)) {
    server.registerTool(
      name,
      {
        title: spec.title,
        description: spec.description,
        inputSchema: spec.inputSchema,
      },
      async (input): Promise<CallToolResult> => {
        const result = await (sandbox as any)[name](input);
        return {
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );
  }

  return server;
};
