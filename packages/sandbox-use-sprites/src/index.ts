import type { Sprite, SpriteConfig, SpritesClient } from "@fly/sprites";
import type { Sandbox, SandboxManager } from "@orqen/sandbox-use";

const asString = (v: string | Buffer): string =>
  typeof v === "string" ? v : v.toString("utf8");

export const spritesSandbox = (sprite: Sprite): Sandbox => {
  const fs = sprite.filesystem();
  return {
    executeCommand: async (command) => {
      const result = await sprite.execFile("sh", ["-c", command]);
      return {
        stdout: asString(result.stdout),
        stderr: asString(result.stderr),
        exitCode: result.exitCode,
      };
    },
    readFile: (path) => fs.readFile(path, "utf8"),
    writeFiles: async (files) => {
      await Promise.all(
        files.map(async ({ path, content }) => {
          const dir = path.substring(0, path.lastIndexOf("/"));
          if (dir) await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(path, content);
        }),
      );
    },
  };
};

export type SpritesSandboxManagerOptions = {
  client: SpritesClient;
  config?: (environment: string) => SpriteConfig | undefined;
};

export const spritesSandboxManager = (
  opts: SpritesSandboxManagerOptions,
): SandboxManager => ({
  create: async ({ environment }) => {
    const name = `sb-${crypto.randomUUID()}`;
    await opts.client.createSprite(name, opts.config?.(environment));
    return name;
  },
  get: async (id) => spritesSandbox(opts.client.sprite(id)),
});
