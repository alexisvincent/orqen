export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface Sandbox {
  executeCommand(command: string): Promise<CommandResult>;
  readFile(path: string): Promise<Buffer>;
  writeFiles(files: Array<{ path: string; content: Buffer }>): Promise<void>;
}
