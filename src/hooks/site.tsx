import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { slugify } from "../utils";
import { File, Settings, Site } from "../model";
import { useBackend } from "../backends/backend";
import { unified } from "unified";
import parse from "remark-parse";
import frontmatter from "remark-frontmatter";
import { visit } from "unist-util-visit";
import { load } from "js-yaml";
import html from "remark-html";

const SiteContext = createContext<{
  site?: Site;
  listMedia: () => Promise<File[]>;
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
  const { loadSettings, listFiles, loadFile } = useBackend(site);
  const { slug } = useParams();
  const [sites, setSites] = useState<Site[]>(() => {
    const value = localStorage.getItem("sites");
    return value ? JSON.parse(value) : [];
  });
  useEffect(() => {
    if (!slug) setSite(undefined);
    else setSite(sites.find(({ name }) => slug === slugify(name)));
  }, [slug]);
  useEffect(() => {
    localStorage.setItem("sites", JSON.stringify(sites));
  }, [sites]);
  useEffect(() => {
    if (site) loadSettings().then(setSettings);
  }, [site]);
  const addSite = (site) => setSites([...sites, site]);
  const removeSite = (index) => setSites(sites.filter((_, i) => i !== index));
  const listMedia = async () => {
    //TODO should be better place outside
    const settings = await loadSettings();
    return listFiles(settings?.upload_dir);
  };
  const loadMedia = async (path: string) => {
    // TODO use cache
    return await loadFile(path);
  };
  const loadDocument = async (path: string) => {
    // TODO attach template
    const content = await loadFile(path);
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
