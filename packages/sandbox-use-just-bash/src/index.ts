import type { Bash } from "just-bash";
import type { Sandbox } from "@orqen/sandbox-use";

const quoteArg = (s: string) => `'${s.replace(/'/g, "'\\''")}'`;

export type BashFactory = (environment: string) => Bash;

export const justBashSandbox = (factory: BashFactory): Sandbox => {
  const sandboxes = new Map<string, { bash: Bash; environment: string }>();

  return {
    create: async ({ description, environment }) => {
      const id = crypto.randomUUID();
      sandboxes.set(id, { bash: factory(environment), environment });
      return {
        id,
        environment,
        description,
      };
    },
    exec: async ({ sandboxId, cmd, args = [] }) => {
      const sandbox = sandboxes.get(sandboxId);
      if (!sandbox) {
        return {
          stdout: "",
          stderr: `no sandbox with id ${sandboxId}`,
          exitCode: 1,
        };
      }
      const line = args.length
        ? `${cmd} ${args.map(quoteArg).join(" ")}`
        : cmd;
      const { stdout, stderr, exitCode } = await sandbox.bash.exec(line);
      return { stdout, stderr, exitCode };
    },
  };
};
