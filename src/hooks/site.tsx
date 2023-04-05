import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import {
  fromSlate,
  isImage,
  isJson,
  isMarkdown,
  isYaml,
  slugify,
  toMeta,
  toSlate,
} from "../utils";
import { Leaf, Settings, Site, Template, Tree } from "../model";
import { useBackend } from "../backends/backend";
import { unified } from "unified";
import markdown from "remark-parse";
import frontmatter from "remark-frontmatter";
import { dump, load } from "js-yaml";
import { Descendant } from "slate";
import { toMarkdown } from "mdast-util-to-markdown";

const MAX_EDGE = 1200;

const SiteContext = createContext<{
  site?: Site;
  settings?: Settings;
  synchronize: () => Promise<void>;
  listFiles: (path: string) => Promise<Leaf[]>;
  listMedia: () => Promise<Leaf[]>;
  loadMedia: (path: string) => Promise<string>;
  loadDocument: (
    path: string
  ) => Promise<{ meta: Record<string, unknown>; body?: Descendant[] }>;
  saveDocument: (
    path: string,
    meta: Record<string, unknown>,
    body?: Descendant[]
  ) => Promise<void>;
  saveMedia: (file: File) => Promise<void>;
  sites: Site[];
  addSite: (site: Site) => void;
  removeSite: (index: number) => void;
  setSite: (site: Site) => void;
  modal?: ReactElement;
  setModal: (modal: ReactElement) => void;
  setBranch: (branch: string) => void;
}>({
  sites: [],
  synchronize: () => void 0,
  listFiles: () => void 0,
  listMedia: () => void 0,
  loadMedia: () => void 0,
  loadDocument: () => void 0,
  saveDocument: () => void 0,
  saveMedia: () => void 0,
  addSite: () => void 0,
  removeSite: () => void 0,
  setSite: () => void 0,
  setModal: () => void 0,
  setBranch: () => void 0,
});

const DEFAULT: Settings = {
  admin_path: "",
  auto_deploy: false,
  file_template: "",
  new_page_extension: "md",
  public_path: "/media",
  sections: [],
  templates: [],
  upload_dir: "",
  version: "",
  webhook_url: null,
};

export const SiteContextProvider = ({ children }: PropsWithChildren) => {
  const [site, setSite] = useState<Site>();
  const [settings, setSettings] = useState<Settings>();
  const [modal, setModal] = useState<ReactElement>();
  const { loadContent, saveContent, loadTree } = useBackend(site);
  const { slug } = useParams();
  const [sites, setSites] = useState<Site[]>(() => {
    const value = localStorage.getItem("sites");
    return value ? JSON.parse(value) : [];
  });
  const [tree, setTree] = useState<Tree>();
  useEffect(() => {
    if (!slug) setSite(undefined);
    else setSite(sites.find(({ name }) => slug === slugify(name)));
  }, [slug]);
  useEffect(() => {
    localStorage.setItem("sites", JSON.stringify(sites));
  }, [sites]);
  const synchronize = async () => {
    setTree(undefined);
    if (site) {
      const leafs = await loadTree();
      const tree: Tree = {};
      for (const leaf of leafs) {
        if (!leaf.folder) {
          const parts = leaf.path.replace(/^\/|\/$/g, "").split("/");
          let current: Tree = tree;
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!current[part]) {
              if (i === parts.length - 1) {
                current[part] = leaf;
              } else {
                current[part] = {};
              }
            }
            current = current[part] as Tree;
          }
        }
      }
      setTree(tree);
    }
  };
  useEffect(() => {
    synchronize().then();
  }, [site]);
  useEffect(() => {
    (async () => {
      if (tree) {
        const settings: Settings =
          (await loadFile("/.forestry/settings.yml")) ?? DEFAULT;
        settings.templates = await Promise.all(
          (
            await listFiles("/.forestry/front_matter/templates")
          ).map(async ({ path }) => ({
            name: path.split("/").pop().split(".").shift(),
            ...(await loadFile<Template>(path)),
          }))
        );
        setSettings(settings);
      }
    })();
  }, [tree]);
  const addSite = (site) => setSites([...sites, site]);
  const removeSite = (index) => setSites(sites.filter((_, i) => i !== index));
  const listFiles = async (path: string): Promise<Leaf[]> => {
    if (!path) return [];
    const files = path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .reduce((a, v) => (a ? a[v] : undefined), tree);
    return Object.values(files ?? {}).filter(({ path }) => !!path);
  };
  const loadFile = async <T extends string | object>(
    path: string
  ): Promise<T> => {
    const url = path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .reduce((a, v) => (a ? a[v] : undefined), tree)?.url;
    if (url) {
      const content = await loadContent(url as string);
      if (isJson(path)) {
        return JSON.parse(await content.text());
      } else if (isYaml(path)) {
        return load(await content.text()) as T;
      } else if (isImage(path)) {
        return await new Promise(async (resolve) => {
          const reader = new FileReader();
          reader.addEventListener("load", () => {
            if (path.endsWith(".svg")) {
              resolve(
                reader.result
                  .toString()
                  .replace("text/plain", "image/svg+xml") as T
              );
            } else {
              const image = new Image();
              image.onload = async () => {
                const { width, height } =
                  image.width > image.height
                    ? {
                        width: Math.min(image.width, MAX_EDGE),
                        height:
                          (Math.min(image.width, MAX_EDGE) / image.width) *
                          image.height,
                      }
                    : {
                        width:
                          (Math.min(image.height, MAX_EDGE) / image.height) *
                          image.width,
                        height: Math.min(image.height, MAX_EDGE),
                      };
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const context = canvas.getContext("2d");
                context.imageSmoothingQuality = "high";
                context.drawImage(
                  image,
                  0,
                  0,
                  image.width,
                  image.height,
                  0,
                  0,
                  width,
                  height
                );
                resolve(canvas.toDataURL("image/webp") as T);
              };
              image.src = reader.result.toString();
            }
          });
          reader.readAsDataURL(await content.blob());
        });
      } else {
        return (await content.text()) as T;
      }
    }
    return null;
  };
  const listMedia = async () => {
    return listFiles(settings?.upload_dir);
  };
  const loadMedia = async (path: string) => {
    // TODO use cache
    return await loadFile<string>(path);
  };
  const loadDocument = async (path: string) => {
    // TODO attach template
    const content: string = await loadFile(path);
    if (isMarkdown(path)) {
      const { data, result } = await unified()
        .use(markdown)
        .use(toSlate)
        .use(frontmatter, ["yaml"])
        .use(toMeta)
        .process(content);
      console.log("LOADCONTENT", content);
      return { meta: data, body: result as Descendant[] };
    }
    return { meta: content as unknown as Record<string, unknown> };
  };
  const saveDocument = async (
    path: string,
    meta: Record<string, unknown>,
    body?: Descendant[]
  ) => {
    let content;
    if (isMarkdown(path)) {
      // TODO handle markdown without metadata
      content =
        "---\n" +
        dump(meta, { noRefs: true }) +
        "\n---\n" +
        toMarkdown(
          {
            type: "root",
            children: fromSlate(body as unknown as any[]),
          },
          { emphasis: "_" }
        );
    } else if (isYaml(path)) {
      content = dump(meta, { noRefs: true });
    } else if (isJson(path)) {
      content = JSON.stringify(meta, null, 2);
    } else {
      throw `Unhandled document type ${path}`;
    }
    if (content) {
      const encoded = encodeURIComponent(content).replace(
        /%([0-9A-F]{2})/g,
        (match, p1) => String.fromCharCode(parseInt(p1, 16))
      );
      console.log("SAVECONTENT", fromSlate(body as unknown as any[]), content);
      await saveContent(path, btoa(encoded), false);
    }
  };
  const saveMedia = async (file: File) => {
    const path = `${settings.upload_dir}/${file.name}`;
    const encoded = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.toString().split(",").pop());
      reader.onerror = (error) => reject(error);
    });
    const create = !path
      .replace(/^\/|\/$/g, "")
      .split("/")
      .reduce((a, v) => (a ? a[v] : undefined), tree);
    await saveContent(path, encoded, create);
  };
  const setBranch = (branch: string) => {
    setSite({ ...site, branch });
  };
  return (
    <SiteContext.Provider
      value={{
        site,
        settings,
        synchronize,
        listFiles,
        listMedia,
        loadMedia,
        loadDocument,
        saveDocument,
        saveMedia,
        sites,
        setSite,
        addSite,
        removeSite,
        modal,
        setModal,
        setBranch,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
