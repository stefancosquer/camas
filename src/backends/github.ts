import { Backend } from "./backend";
import { request } from "../utils";
import { Site } from "../model";

export const useGithub = (site: Site): Backend => {
  return {
    needOrg: false,
    needUser: false,
    listProjects: async () => {
      const projects = [];
      const { name, login } = await request(
        `https://api.github.com/user`,
        "",
        site.token
      );
      projects.push({ name, id: `users/${login}` });
      projects.push(
        ...(await request(`https://api.github.com/user/orgs`, "", site.token))
          .sort((a, b) => a.login.localeCompare(b.login))
          .map(({ login }) => ({ name: login, id: `orgs/${login}` }))
      );
      return projects;
    },
    listRepositories: async () =>
      (
        await request(
          `https://api.github.com/${site.project}/repos`,
          "",
          site.token
        )
      )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name, default_branch }) => ({
          name,
          id: name,
          branch: default_branch,
        })),
    listBranches: async () =>
      (
        await request(
          `https://api.github.com/repos/${site.project.split("/")[1]}/${
            site.repository
          }/branches`,
          "",
          site.token
        )
      )
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(({ name }) => name),
    listFiles: async () => [],
    loadSettings: async () => void 0,
    loadFile: async () => void 0,
  };
};
