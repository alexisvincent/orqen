import { tool } from "ai";
import {
  ExecDescription,
  ExecInput,
  ExecTitle,
  type Sandbox,
} from "@orqen/sandbox-use";

export const sandboxTools = (sandbox: Sandbox) => ({
  [ExecTitle]: tool({
    description: ExecDescription,
    inputSchema: ExecInput,
    execute: (input) => sandbox.exec(input),
  }),
});
