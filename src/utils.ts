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
