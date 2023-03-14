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

const SiteContext = createContext<{
  site?: Site;
  listMedia: () => Promise<File[]>;
  loadMedia: (path: string) => Promise<string>;
  sites: Site[];
  addSite: (site: Site) => void;
  removeSite: (index: number) => void;
  setSite: (site: Site) => void;
}>({
  sites: [],
  listMedia: () => void 0,
  loadMedia: () => void 0,
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
  return (
    <SiteContext.Provider
      value={{
        site,
        listMedia,
        loadMedia,
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
