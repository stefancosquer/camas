import { Backend } from "./backend";
import { Site } from "../context";

export const useAzure = (site: Site): Backend => {
  return {
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
    listFiles: async () => {
      const items =
        (
          await (
            await fetch(
              `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/items?recursionLevel=full&version=${site.branch}&api-version=6.0`,
              {
                headers: {
                  Authorization: `Basic ${btoa(`:${site.token}`)}`,
                },
              }
            )
          ).json()
        ).value ?? [];

      const tree = {};

      for (const item of items) {
        if (!item.isFolder) {
          const parts = item.path.split("/");
          let current = tree;
          for (let i = 1; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
              if (i === parts.length - 1) {
                current[part] = item;
              } else {
                current[part] = {};
              }
            }
            current = current[part];
          }
        }
      }
      console.log(tree);
      const content = await (
        await fetch(tree[".forestry"]["settings.yml"].url, {
          headers: {
            Authorization: `Basic ${btoa(`:${site.token}`)}`,
          },
        })
      ).text();
      console.log("settings", content);
    },
  };
};
