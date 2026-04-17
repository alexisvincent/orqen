import { z } from "zod";

export const toolSpecs = {
  create: {
    title: "create",
    description: "Create a new sandbox to run commands in.",
    inputSchema: z.object({
      description: z
        .string()
        .describe("What this sandbox will be used for."),
      environment: z
        .string()
        .describe("The kind of environment to create."),
    }),
    outputSchema: z.object({
      id: z.string(),
      environment: z.string(),
      description: z.string(),
    }),
  },
  exec: {
    title: "exec",
    description: "Run a command inside a sandbox.",
    inputSchema: z.object({
      sandboxId: z.string().describe("The id returned by create."),
      cmd: z.string(),
      args: z.array(z.string()).optional(),
    }),
    outputSchema: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
    }),
  },
} as const;

export type ToolSpecs = typeof toolSpecs;

export type Sandbox = {
  [K in keyof ToolSpecs]: (
    input: z.infer<ToolSpecs[K]["inputSchema"]>,
  ) => Promise<z.infer<ToolSpecs[K]["outputSchema"]>>;
};

export {
  routingSandbox,
  type SandboxState,
  type SandboxStore,
} from "./routing";
