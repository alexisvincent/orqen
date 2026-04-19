import { z } from "zod";
import type { CommandResult } from "./sandbox";
import type { SandboxManager } from "./sandbox-manager";

function bufferToContent(buf: Buffer): { content: string; encoding: "utf8" | "base64" } {
  if (buf.includes(0)) {
    return { content: buf.toString("base64"), encoding: "base64" };
  }
  try {
    const content = new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return { content, encoding: "utf8" };
  } catch {
    return { content: buf.toString("base64"), encoding: "base64" };
  }
}

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
  executeCommand: {
    title: "executeCommand",
    description: "Execute a command inside a sandbox.",
    inputSchema: z.object({
      sandboxId: z.string().describe("The id returned by create."),
      command: z.string().describe("The command to execute."),
    }),
    outputSchema: z.object({
      stdout: z.string(),
      stderr: z.string(),
      exitCode: z.number(),
    }),
  },
  readFile: {
    title: "readFile",
    description: "Read a file from inside a sandbox.",
    inputSchema: z.object({
      sandboxId: z.string().describe("The id returned by create."),
      path: z.string().describe("Path of the file to read."),
    }),
    outputSchema: z.object({
      content: z.string(),
      encoding: z.enum(["utf8", "base64"]),
    }),
  },
  writeFiles: {
    title: "writeFiles",
    description: "Write one or more files inside a sandbox.",
    inputSchema: z.object({
      sandboxId: z.string().describe("The id returned by create."),
      files: z
        .array(
          z.object({
            path: z.string(),
            content: z.string(),
          }),
        )
        .describe("Files to write."),
    }),
    outputSchema: z.object({}),
  },
} as const;

export type ToolSpecs = typeof toolSpecs;

export class SandboxService {
  constructor(private manager: SandboxManager) {}

  async create({
    description,
    environment,
  }: {
    description: string;
    environment: string;
  }): Promise<{ id: string; environment: string; description: string }> {
    const id = await this.manager.create({ description, environment });
    return { id, environment, description };
  }

  async executeCommand(id: string, command: string): Promise<CommandResult> {
    const sandbox = await this.manager.get(id);
    return sandbox.executeCommand(command);
  }

  async readFile(id: string, path: string): Promise<{ content: string; encoding: "utf8" | "base64" }> {
    const sandbox = await this.manager.get(id);
    return bufferToContent(await sandbox.readFile(path));
  }

  async writeFiles(
    id: string,
    files: Array<{ path: string; content: string }>,
  ): Promise<void> {
    const sandbox = await this.manager.get(id);
    return sandbox.writeFiles(
      files.map(({ path, content }) => ({ path, content: Buffer.from(content, "utf8") })),
    );
  }
}
