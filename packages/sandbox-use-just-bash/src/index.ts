import type { Bash } from "just-bash";
import type { Sandbox, SandboxManager } from "@orqen/sandbox-use";

export const justBashSandbox = (bash: Bash): Sandbox => ({
  executeCommand: async (command) => {
    const { stdout, stderr, exitCode } = await bash.exec(command);
    return { stdout, stderr, exitCode };
  },
  readFile: async (path) => {
    const { stdout } = await bash.exec(`base64 < "${path}"`);
    return Buffer.from(stdout.trim(), "base64");
  },
  writeFiles: async (files) => {
    for (const { path, content } of files) {
      const dir = path.substring(0, path.lastIndexOf("/")) || ".";
      const b64 = content.toString("base64");
      const { exitCode, stderr } = await bash.exec(
        `mkdir -p "${dir}" && echo "${b64}" | base64 -d > "${path}"`,
      );
      if (exitCode !== 0) throw new Error(`writeFile failed for ${path}: ${stderr}`);
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
