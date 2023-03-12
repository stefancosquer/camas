import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useParams } from "react-router-dom";
import { slugify } from "../utils";
import { Site } from "../model";

const SiteContext = createContext<{
  site?: Site;
  sites: Site[];
  addSite: (site: Site) => void;
  removeSite: (index: number) => void;
  setSite: (site: Site) => void;
}>({
  sites: [],
  addSite: () => void 0,
  removeSite: () => void 0,
  setSite: () => void 0,
});

export const SiteContextProvider = ({ children }: PropsWithChildren) => {
  const [site, setSite] = useState<Site>();
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
  const addSite = (site) => setSites([...sites, site]);
  const removeSite = (index) => setSites(sites.filter((_, i) => i !== index));
  return (
    <SiteContext.Provider value={{ site, sites, setSite, addSite, removeSite }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
