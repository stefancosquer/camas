import { useAzure } from "./azure";
import { Site, useSite } from "../hooks/site";
import { useBitbucket } from "./bitbucket";
import { useGithub } from "./github";

export type Backend = {
  needOrg: boolean;
  needUser: boolean;
  listProjects: () => Promise<{ id: string; name: string }[]>;
  listRepositories: () => Promise<
    { id: string; name: string; branch: string }[]
  >;
  listBranches: () => Promise<string[]>;
  listFiles: () => Promise<void>;
};

const useDummy = (): Backend => {
  return {
    needOrg: false,
    needUser: false,
    listProjects: async () => [],
    listRepositories: async () => [],
    listBranches: async () => [],
    listFiles: async () => void 0,
  };
};

export const useBackend = (site?: Site): Backend => {
  const current = site ?? useSite().site;
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
