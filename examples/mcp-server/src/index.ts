import { serve } from "@hono/node-server";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { createSandboxMcpServer } from "@orqen/sandbox-use-mcp-server";
import {
  SandboxService,
  routingSandboxManager,
  type SandboxManager,
} from "@orqen/sandbox-use";
import { justBashSandboxManager } from "@orqen/sandbox-use-just-bash";
import { spritesSandboxManager } from "@orqen/sandbox-use-sprites";
import { dockerSandboxManager } from "@orqen/sandbox-use-docker";
import { SpritesClient } from "@fly/sprites";
import { DockerClient } from "@docker/node-sdk";
import { Bash } from "just-bash";
import { Hono } from "hono";
import { cors } from "hono/cors";

const environments: Record<string, SandboxManager> = {
  bash: justBashSandboxManager(() => new Bash()),
};

const spriteApiToken = process.env.SPRITE_API_TOKEN;
if (spriteApiToken) {
  const client = new SpritesClient(spriteApiToken, {
    baseURL: process.env.SPRITE_API_URL,
  });
  environments.sprite = spritesSandboxManager({ client });
  console.log("sprite environment enabled");
} else {
  console.log("SPRITE_API_TOKEN not set — sprite environment disabled");
}

try {
  const docker = await DockerClient.fromDockerConfig();
  const dockerImage = process.env.DOCKER_IMAGE ?? "alpine:latest";
  environments.docker = dockerSandboxManager({
    docker,
    createContainer: async () => {
      await docker.imageCreate({ fromImage: dockerImage }).wait();
      const { Id } = await docker.containerCreate({
        Image: dockerImage,
        Cmd: ["sleep", "infinity"],
        Tty: false,
      });
      await docker.containerStart(Id);
      return Id;
    },
  });
  console.log(`docker environment enabled (${dockerImage})`);
} catch (err) {
  console.log(
    `docker environment disabled: ${err instanceof Error ? err.message : err}`,
  );
}

const manager = routingSandboxManager({ environments });
const sandbox = new SandboxService(manager);

const server = createSandboxMcpServer(sandbox);
const transport = new WebStandardStreamableHTTPServerTransport();
await server.connect(transport);

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "mcp-session-id", "Last-Event-ID", "mcp-protocol-version"],
    exposeHeaders: ["mcp-session-id", "mcp-protocol-version"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));
app.all("/mcp", (c) => transport.handleRequest(c.req.raw));

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 3000;
console.log(`MCP server listening on http://localhost:${port}/mcp`);
serve({ fetch: app.fetch, port });
