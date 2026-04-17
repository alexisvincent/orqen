import {
  adjectives,
  animals,
  uniqueNamesGenerator,
} from "unique-names-generator";
import type { Sandbox } from "./sandbox";

export interface SandboxManager {
  create(args: { environment: string; description: string }): Promise<string>;
  get(id: string): Promise<Sandbox>;
}

export type SandboxManagerState = {
  environment: string;
  description: string;
  backingId: string;
};

export type SandboxManagerStore = {
  get: (id: string) => Promise<SandboxManagerState | undefined>;
  set: (id: string, state: SandboxManagerState) => Promise<void>;
};

export type IdGenerator = () => string;

const inMemoryStore = (): SandboxManagerStore => {
  const map = new Map<string, SandboxManagerState>();
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
  store: SandboxManagerStore,
  generate: IdGenerator,
): Promise<string> => {
  for (let i = 0; i < 100; i++) {
    const id = generate();
    if (!(await store.get(id))) return id;
  }
  throw new Error("could not generate a unique sandbox id");
};

export const routingSandboxManager = (opts: {
  environments: Record<string, SandboxManager>;
  store?: SandboxManagerStore;
  generateId?: IdGenerator;
}): SandboxManager => {
  const store = opts.store ?? inMemoryStore();
  const generate = opts.generateId ?? defaultIdGenerator;

  return {
    create: async ({ environment, description }) => {
      const backing = opts.environments[environment];
      if (!backing) {
        throw new Error(`unknown environment: ${environment}`);
      }
      const id = await uniqueId(store, generate);
      const backingId = await backing.create({ environment, description });
      await store.set(id, { environment, description, backingId });
      return id;
    },
    get: async (id) => {
      const state = await store.get(id);
      if (!state) {
        throw new Error(`no sandbox with id ${id}`);
      }
      const backing = opts.environments[state.environment];
      if (!backing) {
        throw new Error(
          `unknown environment '${state.environment}' for sandbox ${id}`,
        );
      }
      return backing.get(state.backingId);
    },
  };
};
