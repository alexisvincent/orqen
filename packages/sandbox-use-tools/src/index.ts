import { tool } from "ai";
import { toolSpecs, type SandboxService } from "@orqen/sandbox-use";

export const sandboxTools = (sandbox: SandboxService) => ({
  create: tool({
    description: toolSpecs.create.description,
    inputSchema: toolSpecs.create.inputSchema,
    execute: (input) => sandbox.create(input),
  }),
  executeCommand: tool({
    description: toolSpecs.executeCommand.description,
    inputSchema: toolSpecs.executeCommand.inputSchema,
    execute: ({ sandboxId, command }) =>
      sandbox.executeCommand(sandboxId, command),
  }),
  readFile: tool({
    description: toolSpecs.readFile.description,
    inputSchema: toolSpecs.readFile.inputSchema,
    execute: async ({ sandboxId, path }) => ({
      content: await sandbox.readFile(sandboxId, path),
    }),
  }),
  writeFiles: tool({
    description: toolSpecs.writeFiles.description,
    inputSchema: toolSpecs.writeFiles.inputSchema,
    execute: async ({ sandboxId, files }) => {
      await sandbox.writeFiles(sandboxId, files);
      return {};
    },
  }),
});
