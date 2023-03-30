import { Backend } from "./backend";
import { Site } from "../model";
import { request } from "../utils";

export const useAzure = (site: Site): Backend => ({
  needOrg: true,
  needUser: false,
  listProjects: async () =>
    (
      await request(
        `https://dev.azure.com/${site.org}/_apis/projects?api-version=6.0`,
        "",
        site.token
      )
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name }) => ({ id, name })) ?? [],
  listRepositories: async () =>
    (
      await request(
        `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories?api-version=6.0`,
        "",
        site.token
      )
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ id, name, defaultBranch }) => ({
        id,
        name,
        branch: defaultBranch.replace("refs/heads/", ""),
      })) ?? [],
  listBranches: async () =>
    (
      await request(
        `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/refs?api-version=6.0&filter=heads%2F`,
        "",
        site.token
      )
    ).value
      ?.sort((a, b) => a.name.localeCompare(b.name))
      .map(({ name }) => name.replace("refs/heads/", "")) ?? [],
  loadContent: (url) =>
    fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`:${site.token}`)}`,
      },
    }),
  saveContent: async (path, content, create) =>
    push(site, create ? "add" : "edit", path, content),
  deleteContent: async (path) => push(site, "delete", path),
  loadTree: async () =>
    (
      (
        await request(
          `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/items?recursionLevel=full&version=${site.branch}&latestProcessedChange=true&api-version=6.0`,
          "",
          site.token
        )
      ).value ?? []
    ).map(({ url, path, latestProcessedChange, isFolder: folder }) => ({
      url,
      path,
      author: latestProcessedChange?.author?.name,
      date: latestProcessedChange?.author?.date,
      folder,
    })),
});

const push = async (
  site: Site,
  change: "add" | "edit" | "delete",
  path: string,
  content?: string
) => {
  const oldObjectId = (
    await request(
      `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/commits?api-version=6.0&branch=${site.branch}&$top=1`,
      site.user,
      site.token
    )
  )?.value?.[0]?.commitId;
  const newObjectId = (
    await request(
      `https://dev.azure.com/${site.org}/${site.project}/_apis/git/repositories/${site.repository}/pushes?api-version=6.0`,
      "",
      site.token,
      "post",
      JSON.stringify({
        refUpdates: [
          {
            name: `refs/heads/${site.branch}`,
            oldObjectId,
          },
        ],
        commits: [
          {
            comment: "Update from Forestry.io",
            changes: [
              {
                changeType: change,
                item: { path },
                ...(content && {
                  newContent: {
                    content,
                    contentType: "base64Encoded",
                  },
                }),
              },
            ],
          },
        ],
      })
    )
  )?.commits?.[0]?.commitId;
};
