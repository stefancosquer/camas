import { visit } from "unist-util-visit";
import { load } from "js-yaml";
import { Plugin } from "unified";

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
  path && (path.endsWith(".yml") || path.endsWith(".yaml"));

export const isImage = (path: string) =>
  path &&
  (path.endsWith(".png") ||
    path.endsWith(".jpg") ||
    path.endsWith(".jpeg") ||
    path.endsWith(".webp") ||
    path.endsWith(".gif"));

export const toMeta = () => (tree, file) => {
  visit(tree, "yaml", (node): void => {
    file.data = load(node.value) as Record<string, unknown>;
  });
};

const mdastToSlate = ({
  type,
  children,
  value,
  url,
  alt,
  lang,
  ordered,
  depth,
  title,
}) => {
  switch (type) {
    case "yaml":
      return null;
    case "paragraph":
      return {
        type: "p",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "blockquote":
      return {
        type: "quote",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "heading":
      return {
        type: `h${depth}`,
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "list":
      return {
        type: ordered ? "ol" : "ul",
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "listItem":
      return {
        type: "li",
        children: children
          .flatMap(({ children }) => children.flatMap(mdastToSlate))
          .filter((v) => !!v),
      };
    case "image":
      return { type: "img", url, alt, title, children: [{ text: "" }] };
    case "link":
      return {
        type: "a",
        url,
        title,
        children: children.flatMap(mdastToSlate).filter((v) => !!v),
      };
    case "text":
      return { text: value };
    case "break":
      return { text: "\n" };
    case "code":
      return { type: "code", lang, children: [{ text: value }] };
    case "inlineCode":
      return { code: true, text: value };
    case "strong":
      return children
        .flatMap(({ value }) => ({ bold: true, text: value }))
        .filter((v) => !!v);
    case "emphasis":
      return children
        .flatMap(({ value }) => ({ italic: true, text: value }))
        .filter((v) => !!v);
    default:
      console.warn("Unhandled md type", type);
      return null;
  }
};

export const toSlate: Plugin<[]> = function () {
  // @ts-ignore
  this.Compiler = (node: { children }) =>
    node.children.map(mdastToSlate).filter((v) => !!v);
};
