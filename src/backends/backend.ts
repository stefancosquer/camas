import { useAzure } from "./azure";
import { Site, useAppContext } from "../context";

export type Backend = {
  listProjects: () => Promise<{ id: string; name: string }[]>;
  listRepositories: () => Promise<
    { id: string; name: string; branch: string }[]
  >;
  listBranches: () => Promise<string[]>;
  listFiles: () => Promise<void>;
};

const useDummy = (): Backend => {
  return {
    listProjects: async () => [],
    listRepositories: async () => [],
    listBranches: async () => [],
    listFiles: async () => void 0,
  };
};

export const useBackend = (site?: Site): Backend => {
  const current = site ?? useAppContext().site;
  switch (site?.backend) {
    case "azure":
      return useAzure(current);
    default:
      return useDummy();
  }
};
