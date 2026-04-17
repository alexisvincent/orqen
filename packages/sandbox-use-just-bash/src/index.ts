import type { Bash } from "just-bash";
import type { Sandbox, SandboxManager } from "@orqen/sandbox-use";

export const justBashSandbox = (bash: Bash): Sandbox => ({
  executeCommand: async (command) => {
    const { stdout, stderr, exitCode } = await bash.exec(command);
    return { stdout, stderr, exitCode };
  },
  readFile: (path) => bash.readFile(path),
  writeFiles: async (files) => {
    for (const { path, content } of files) {
      await bash.writeFile(path, content);
    }
  },
});

export type BashFactory = (environment: string) => Bash;

export const justBashSandboxManager = (
  factory: BashFactory,
): SandboxManager => {
  const sandboxes = new Map<string, Sandbox>();

  return {
    create: async ({ environment }) => {
      const id = crypto.randomUUID();
      sandboxes.set(id, justBashSandbox(factory(environment)));
      return id;
    },
    get: async (id) => {
      const sandbox = sandboxes.get(id);
      if (!sandbox) {
        throw new Error(`no sandbox with id ${id}`);
      }
      return sandbox;
    },
  };
};
