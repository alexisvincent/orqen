import type { SpritesClient, SpriteConfig } from "@fly/sprites";
import type { Sandbox } from "@orqen/sandbox-use";

const asString = (v: string | Buffer): string =>
  typeof v === "string" ? v : v.toString("utf8");

export type SpritesSandboxOptions = {
  client: SpritesClient;
  config?: (environment: string) => SpriteConfig | undefined;
};

export const spritesSandbox = (opts: SpritesSandboxOptions): Sandbox => ({
  create: async ({ description, environment }) => {
    const name = `sb-${crypto.randomUUID()}`;
    await opts.client.createSprite(name, opts.config?.(environment));
    return {
      id: name,
      environment,
      description,
    };
  },
  exec: async ({ sandboxId, cmd, args = [] }) => {
    const sprite = opts.client.sprite(sandboxId);
    const result = await sprite.execFile(cmd, args);
    return {
      stdout: asString(result.stdout),
      stderr: asString(result.stderr),
      exitCode: result.exitCode,
    };
  },
});
