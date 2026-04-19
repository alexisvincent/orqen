import { DockerClient } from "@docker/node-sdk";
import { Writable, Readable } from "node:stream";
import { extract, type Headers } from "tar-stream";
import type { Sandbox, SandboxManager } from "@orqen/sandbox-use";

export const dockerSandbox = (
  docker: DockerClient,
  containerId: string,
): Sandbox => ({
  executeCommand: async (command) => {
    const { Id: execId } = await docker.containerExec(containerId, {
      Cmd: ["sh", "-c", command],
      AttachStdout: true,
      AttachStderr: true,
    });

    let stdout = "";
    let stderr = "";

    const stdoutStream = new Writable({
      write(chunk, _, callback) {
        stdout += chunk.toString();
        callback();
      },
    });

    const stderrStream = new Writable({
      write(chunk, _, callback) {
        stderr += chunk.toString();
        callback();
      },
    });

    await docker.execStart(execId, stdoutStream, stderrStream);
    const inspect = await docker.execInspect(execId);
    return { stdout, stderr, exitCode: inspect.ExitCode ?? 0 };
  },

  readFile: async (path) => {
    const chunks: Uint8Array[] = [];
    const writableStream = new WritableStream({
      write(chunk) {
        chunks.push(chunk);
      },
    });
    await docker.containerArchive(containerId, path, writableStream);
    const tarBuffer = Buffer.concat(chunks);

    return new Promise<Buffer>((resolve, reject) => {
      const extractor = extract();
      let content = Buffer.alloc(0);
      extractor.on(
        "entry",
        (_header: Headers, stream: Readable, next: () => void) => {
          const fileChunks: Buffer[] = [];
          stream.on("data", (chunk: Buffer) => fileChunks.push(chunk));
          stream.on("end", () => {
            content = Buffer.concat(fileChunks);
            next();
          });
          stream.resume();
        },
      );
      extractor.on("finish", () => resolve(content));
      extractor.on("error", reject);
      extractor.write(tarBuffer);
      extractor.end();
    });
  },

  writeFiles: async (files) => {
    for (const { path, content } of files) {
      const dir = path.substring(0, path.lastIndexOf("/")) || "/";
      const b64 = content.toString("base64");

      const { Id: execId } = await docker.containerExec(containerId, {
        Cmd: [
          "sh",
          "-c",
          `mkdir -p "${dir}" && echo "${b64}" | base64 -d > "${path}"`,
        ],
        AttachStdout: true,
        AttachStderr: true,
      });

      let stderr = "";
      const stderrStream = new Writable({
        write(chunk, _, callback) {
          stderr += chunk.toString();
          callback();
        },
      });

      await docker.execStart(
        execId,
        new Writable({ write(_, __, cb) { cb(); } }),
        stderrStream,
      );

      const inspect = await docker.execInspect(execId);
      if (inspect.ExitCode !== 0) {
        throw new Error(`writeFile failed for ${path}: ${stderr}`);
      }
    }
  },
});

export type DockerContainerFactory = (args: {
  environment: string;
  description: string;
}) => Promise<string>;

export type DockerSandboxManagerOptions = {
  docker: DockerClient;
  createContainer: DockerContainerFactory;
};

export const dockerSandboxManager = (
  opts: DockerSandboxManagerOptions,
): SandboxManager => ({
  create: (args) => opts.createContainer(args),
  get: async (id) => dockerSandbox(opts.docker, id),
});
