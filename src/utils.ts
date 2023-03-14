export const request = async (
  url: string,
  user: string,
  token: string
): Promise<any> =>
  (
    await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${token}`)}`,
      },
    })
  ).json();

export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isYaml = (path: string) =>
  path.endsWith(".yml") || path.endsWith(".yaml");

export const isImage = (path: string) =>
  path.endsWith(".png") ||
  path.endsWith(".jpg") ||
  path.endsWith(".jpeg") ||
  path.endsWith(".webp") ||
  path.endsWith(".gif");
