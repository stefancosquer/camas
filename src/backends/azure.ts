import { Backend } from "./backend";
import { load } from "js-yaml";
import { Site } from "../model";
import { isImage, isYaml } from "../utils";

let tree = null;

export const useAzure = (site: Site): Backend => {
  const syncTree = async () => {
    if (tree) return;
    const items =
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
      ).value ?? [];

    tree = {};

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
  };
  const loadFile = async <T extends string | object>(
    path: string
  ): Promise<T> => {
    await syncTree();
    const url = path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .reduce((a, v) => (a ? a[v] : undefined), tree)?.url;
    if (url) {
      const content = await fetch(url, {
        headers: {
          Authorization: `Basic ${btoa(`:${site.token}`)}`,
        },
      });
      if (path.endsWith(".json")) {
        return JSON.parse(await content.text());
      } else if (isYaml(path)) {
        return load(await content.text()) as T;
      } else if (isImage(path)) {
        return await new Promise(async (resolve) => {
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            // TODO add resize
            resolve(reader.result as T);
          });
          reader.readAsDataURL(await content.blob());
        });
      } else {
        return (await content.text()) as T;
      }
    }
    return null;
  };
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
    listFiles: async (path: string) => {
      if (!path) return [];
      await syncTree();
      const files = path
        .split("/")
        .reduce((a, v) => (a ? a[v] : undefined), tree);
      return Object.values(files ?? {})
        .filter(({ path }) => !!path)
        .map(
          ({
            path,
            latestProcessedChange: {
              author: { name: author, date },
            },
          }) => ({ path, author, date })
        );
    },
    loadSettings: async () => loadFile(".forestry/settings.yml"),
    loadFile: (path: string) => loadFile(path),
  };
};
