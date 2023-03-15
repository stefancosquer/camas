import { Backend } from "./backend";
import { Site } from "../model";

export const useAzure = (site: Site): Backend => ({
  needOrg: true,
  needUser: false,
  listProjects: async () =>
    (
      await (
        await fetch(
          `https://dev.azure.com/${site.org}/_apis/projects?api-version=6.0`,
          {
            headers: {
              Authorization: `Basic ${btoa(`:${site.token}`)}`,
            },
          }
        )
      ).json()
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name }) => ({ id, name })) ?? [],
  listRepositories: async () =>
    (
      await (
        await fetch(
          `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories?api-version=6.0`,
          {
            headers: {
              Authorization: `Basic ${btoa(`:${site.token}`)}`,
            },
          }
        )
      ).json()
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name, defaultBranch }) => ({
        id,
        name,
        branch: defaultBranch,
      })) ?? [],
  listBranches: async () =>
    (
      await (
        await fetch(
          `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/refs?api-version=6.0&filter=heads%2F`,
          {
            headers: {
              Authorization: `Basic ${btoa(`:${site.token}`)}`,
            },
          }
        )
      ).json()
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name }) => name.replace("refs/heads/", "")) ?? [],
  loadContent: (url: string) =>
    fetch(url as string, {
      headers: {
        Authorization: `Basic ${btoa(`:${site.token}`)}`,
      },
    }),
  loadTree: async () =>
    (
      (
        await (
          await fetch(
            `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/items?recursionLevel=full&version=${site.branch}&latestProcessedChange=true&api-version=6.0`,
            {
              headers: {
                Authorization: `Basic ${btoa(`:${site.token}`)}`,
              },
            }
          )
        ).json()
      ).value ?? []
    ).map(({ url, path, latestProcessedChange, isFolder: folder }) => ({
      url,
      path,
      author: latestProcessedChange?.author?.name,
      date: latestProcessedChange?.author?.date,
      folder,
    })),
});
