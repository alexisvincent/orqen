import { z } from "zod";

export const toolSpecs = {
  exec: {
    title: "exec",
    description: "exec",
    inputSchema: z.object({
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
