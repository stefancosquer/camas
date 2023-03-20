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
    loadContent: async (url) => {
      const commit = (
        await request(
          `https://api.bitbucket.org/2.0/repositories/${site.project}/${site.repository}/refs/branches/${site.branch}`,
          site.user,
          site.token
        )
      ).target.hash;
      return fetch(
        `https://api.bitbucket.org/2.0/repositories/${site.project}/${site.repository}/src/${commit}/${url}`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${site.user}:${site.token}`)}`,
          },
        }
      );
    },
    loadTree: async () => {
      const commit = (
        await request(
          `https://api.bitbucket.org/2.0/repositories/${site.project}/${site.repository}/refs/branches/${site.branch}`,
          site.user,
          site.token
        )
      ).target.hash;
      const files = [];
      let next = `https://api.bitbucket.org/2.0/repositories/${site.project}/${site.repository}/src/${commit}/?max_depth=100&pagelen=100`;
      let values;
      do {
        ({ values = [], next } = await request(next, site.user, site.token));
        files.push(...values);
      } while (next);
      return files.map(({ path, type }) => ({
        url: path,
        path,
        author: "author",
        date: "",
        folder: type === "commit_directory",
      }));
    },
  };
};
