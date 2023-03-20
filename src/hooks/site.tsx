import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { isImage, isYaml, slugify } from "../utils";
import { Leaf, Settings, Site, Template, Tree } from "../model";
import { useBackend } from "../backends/backend";
import { unified } from "unified";
import parse from "remark-parse";
import frontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import { load } from "js-yaml";
import html from "remark-html";

const SiteContext = createContext<{
  site?: Site;
  settings?: Settings;
  listFiles: (path: string) => Promise<Leaf[]>;
  listMedia: () => Promise<Leaf[]>;
  loadMedia: (path: string) => Promise<string>;
  loadDocument: (
    path: string
  ) => Promise<{ meta: Record<string, unknown>; body?: string }>;
  sites: Site[];
  addSite: (site: Site) => void;
  removeSite: (index: number) => void;
  setSite: (site: Site) => void;
}>({
  sites: [],
  listFiles: () => void 0,
  listMedia: () => void 0,
  loadMedia: () => void 0,
  loadDocument: () => void 0,
  addSite: () => void 0,
  removeSite: () => void 0,
  setSite: () => void 0,
});

export const SiteContextProvider = ({ children }: PropsWithChildren) => {
  const [site, setSite] = useState<Site>();
  const [settings, setSettings] = useState<Settings>();
  const { loadContent, loadTree } = useBackend(site);
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
  useEffect(() => {
    if (site) {
      (async () => {
        setTree(undefined);
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
      })();
    }
  }, [site]);
  useEffect(() => {
    (async () => {
      if (tree) {
        const settings = await loadFile<Settings>("/.forestry/settings.yml");
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
    if (path.endsWith(".md")) {
      const { data, value } = await unified()
        .use(parse)
        .use(frontmatter, ["yaml"])
        .use(() => (tree, file) => {
          visit(tree, "yaml", (node): void => {
            file.data = load(node.value) as Record<string, unknown>;
          });
        })
        .use(html)
        .process(content);
      return { meta: data, body: value };
    }
    return { meta: content as unknown as Record<string, unknown> };
  };
  return (
    <SiteContext.Provider
      value={{
        site,
        settings,
        listFiles,
        listMedia,
        loadMedia,
        loadDocument,
        sites,
        setSite,
        addSite,
        removeSite,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
