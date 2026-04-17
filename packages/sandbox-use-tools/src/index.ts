import { tool } from "ai";
import { toolSpecs, type Sandbox } from "@orqen/sandbox-use";

export const sandboxTools = (sandbox: Sandbox) => ({
  create: tool({
    description: toolSpecs.create.description,
    inputSchema: toolSpecs.create.inputSchema,
    execute: (input) => sandbox.create(input),
  }),
  exec: tool({
    description: toolSpecs.exec.description,
    inputSchema: toolSpecs.exec.inputSchema,
    execute: (input) => sandbox.exec(input),
  }),
});
