import { z } from "zod";

export const ExecInput = z.object({
  cmd: z.string(),
  args: z.array(z.string()).optional(),
});

export const ExecOutput = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number(),
});

export const ExecTitle = "exec"
export const ExecDescription = "exec"

export type Sandbox = {
  exec: (input: z.infer<typeof ExecInput>) => Promise<z.infer<typeof ExecOutput>>;
};

