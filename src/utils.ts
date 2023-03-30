import { visit } from "unist-util-visit";
import { load } from "js-yaml";
import { Plugin } from "unified";
import { Content } from "mdast-util-to-markdown/lib/types";

export const request = async (
  url: string,
  user: string,
  token: string,
  method: "get" | "post" = "get",
  body?: string
): Promise<any> =>
  (
    await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${user}:${token}`)}`,
        ...(method === "post" && { "Content-Type": "application/json" }),
      },
      method,
      ...(body && { body }),
    })
  ).json();

export const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const isMarkdown = (path: string) => path && path.endsWith(".md");

export const isYaml = (path: string) =>
  path && (path.endsWith(".yml") || path.endsWith(".yaml"));

export const isJson = (path: string) => path && path.endsWith(".json");

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
      // TODO better handling of nested lists
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
      console.log("Unhandled md type", type);
      return null;
  }
};

const slateToMdast = ({
  type,
  text,
  url,
  lang,
  title,
  alt,
  children,
  code,
  bold,
  italic,
}): Content => {
  switch (type) {
    case "p":
      return {
        type: "paragraph",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "quote":
      return {
        type: "blockquote",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6":
      return {
        type: "heading",
        depth: parseInt(/^h(\d+)$/.exec(type)[1]) as 1 | 2 | 3 | 4 | 5 | 6,
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "ol":
    case "ul":
      return {
        type: "list",
        ordered: type === "ol",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "li":
      return {
        type: "listItem",
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "a":
      return {
        type: "link",
        url,
        title,
        children: children.map(slateToMdast).filter((v) => !!v),
      };
    case "img":
      return {
        type: "image",
        url,
        title,
        alt,
      };
    case "code":
      return {
        type: "code",
        lang,
        value: children.map(({ text }) => text).join(),
      };
    case undefined:
      return {
        type: code ? "inlineCode" : "text",
        value: text,
      };
    default:
      console.log("Unhandled slate type", type);
      return null;
  }
};

export const fromSlate = (nodes: any[]): Content[] =>
  nodes.map(slateToMdast).filter((v) => !!v);

export const toSlate: Plugin<[]> = function () {
  // @ts-ignore
  this.Compiler = (node: { children }) =>
    node.children.map(mdastToSlate).filter((v) => !!v);
};
