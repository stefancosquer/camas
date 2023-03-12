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
