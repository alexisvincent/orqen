import { McpServer } from "@modelcontextprotocol/server";
import type { CallToolResult } from "@modelcontextprotocol/server";
import { toolSpecs, type SandboxService } from "@orqen/sandbox-use";

const asText = (result: unknown): CallToolResult => ({
  content: [{ type: "text", text: JSON.stringify(result) }],
});

export const createSandboxMcpServer = (sandbox: SandboxService): McpServer => {
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
    "executeCommand",
    {
      title: toolSpecs.executeCommand.title,
      description: toolSpecs.executeCommand.description,
      inputSchema: toolSpecs.executeCommand.inputSchema,
    },
    async ({ sandboxId, command }) =>
      asText(await sandbox.executeCommand(sandboxId, command)),
  );

  server.registerTool(
    "readFile",
    {
      title: toolSpecs.readFile.title,
      description: toolSpecs.readFile.description,
      inputSchema: toolSpecs.readFile.inputSchema,
    },
    async ({ sandboxId, path }) =>
      asText({ content: await sandbox.readFile(sandboxId, path) }),
  );

  server.registerTool(
    "writeFiles",
    {
      title: toolSpecs.writeFiles.title,
      description: toolSpecs.writeFiles.description,
      inputSchema: toolSpecs.writeFiles.inputSchema,
    },
    async ({ sandboxId, files }) => {
      await sandbox.writeFiles(sandboxId, files);
      return asText({});
    },
  );

  return server;
};
