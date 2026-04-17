import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import type { Sandbox } from "./index";

export type SandboxState = {
  environment: string;
  description: string;
  backingId: string;
};

export type SandboxStore = {
  get: (id: string) => Promise<SandboxState | undefined>;
  set: (id: string, state: SandboxState) => Promise<void>;
};

export type IdGenerator = () => string;

const inMemoryStore = (): SandboxStore => {
  const map = new Map<string, SandboxState>();
  return {
    get: async (id) => map.get(id),
    set: async (id, state) => {
      map.set(id, state);
    },
  };
};

const defaultIdGenerator: IdGenerator = () =>
  uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: "-",
    length: 2,
  });

const uniqueId = async (
  store: SandboxStore,
  generate: IdGenerator,
): Promise<string> => {
  for (let i = 0; i < 100; i++) {
    const id = generate();
    if (!(await store.get(id))) return id;
  }
  throw new Error("could not generate a unique sandbox id");
};

export const routingSandbox = (opts: {
  environments: Record<string, Sandbox>;
  store?: SandboxStore;
  generateId?: IdGenerator;
}): Sandbox => {
  const store = opts.store ?? inMemoryStore();
  const generate = opts.generateId ?? defaultIdGenerator;

  return {
    create: async ({ description, environment }) => {
      const backing = opts.environments[environment];
      if (!backing) {
        throw new Error(`unknown environment: ${environment}`);
      }
      const id = await uniqueId(store, generate);
      const result = await backing.create({ description, environment });
      await store.set(id, {
        environment: result.environment,
        description: result.description,
        backingId: result.id,
      });
      return {
        id,
        environment: result.environment,
        description: result.description,
      };
    },
    exec: async ({ sandboxId, ...rest }) => {
      const state = await store.get(sandboxId);
      if (!state) {
        return {
          stdout: "",
          stderr: `no sandbox with id ${sandboxId}`,
          exitCode: 1,
        };
      }
      const backing = opts.environments[state.environment];
      if (!backing) {
        return {
          stdout: "",
          stderr: `unknown environment '${state.environment}' for sandbox ${sandboxId}`,
          exitCode: 1,
        };
      }
      return backing.exec({ ...rest, sandboxId: state.backingId });
    },
  };
};
