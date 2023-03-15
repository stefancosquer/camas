import { useAzure } from "./azure";
import { useBitbucket } from "./bitbucket";
import { useGithub } from "./github";
import { Leaf, Site } from "../model";

export type Backend = {
  needOrg: boolean;
  needUser: boolean;
  listProjects: () => Promise<{ id: string; name: string }[]>;
  listRepositories: () => Promise<
    { id: string; name: string; branch: string }[]
  >;
  listBranches: () => Promise<string[]>;
  loadTree: () => Promise<Leaf[]>;
  loadContent: (url: string) => Promise<Response>;
};

const useDummy = (): Backend => {
  return {
    needOrg: false,
    needUser: false,
    listProjects: async () => [],
    listRepositories: async () => [],
    listBranches: async () => [],
    loadContent: async () => void 0,
    loadTree: async () => void 0,
  };
};

export const useBackend = (site: Site): Backend => {
  const current = site;
  switch (site?.backend) {
    case "azure":
      return useAzure(current);
    case "bitbucket":
      return useBitbucket(current);
    case "github":
      return useGithub(current);
    default:
      return useDummy();
  }
};
