import { tool } from "ai";
import { toolSpecs, type Sandbox } from "@orqen/sandbox-use";

export const sandboxTools = (sandbox: Sandbox) =>
  Object.fromEntries(
    Object.entries(toolSpecs).map(([name, spec]) => [
      name,
      tool({
        description: spec.description,
        inputSchema: spec.inputSchema,
        execute: (input) => (sandbox as any)[name](input),
      }),
    ]),
  );
