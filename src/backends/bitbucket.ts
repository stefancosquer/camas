import { Backend } from "./backend";
import { request } from "../utils";
import { Site } from "../model";

export const useBitbucket = (site: Site): Backend => {
  return {
    needOrg: false,
    needUser: true,
    listProjects: async () =>
      (
        (
          await request(
            `https://api.bitbucket.org/2.0/workspaces`,
            site.user,
            site.token
          )
        ).values ?? []
      )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, uuid }) => ({ name, id: uuid })),
    listRepositories: async () =>
      (
        (
          await request(
            `https://api.bitbucket.org/2.0/repositories/${site.project}`,
            site.user,
            site.token
          )
        ).values ?? []
      )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, uuid, mainbranch: { name: branch } }) => ({
          name,
          id: uuid,
          branch,
        })),
    listBranches: async () =>
      (
        (
          await request(
            `https://api.bitbucket.org/2.0/repositories/${site.project}/${site.repository}/refs`,
            site.user,
            site.token
          )
        ).values ?? []
      )
        .filter(({ type }) => type === "branch")
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name }) => name),
    loadSettings: async () => void 0,
    loadFile: async () => void 0,
  };
};
