import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

export type Site = {
  name: string;
  url: string;
  backend: "azure" | "github" | "bitbucket";
  token: string;
  org: string;
  repository: string;
  project: string;
  branch: string;
};

const AppContext = createContext<{
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

export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const [site, setSite] = useState<Site>();
  const [sites, setSites] = useState<Site[]>(() => {
    const value = localStorage.getItem("sites");
    return value ? JSON.parse(value) : [];
  });
  useEffect(() => {
    localStorage.setItem("sites", JSON.stringify(sites));
  }, [sites]);
  const addSite = (site) => setSites([...sites, site]);
  const removeSite = (index) => setSites(sites.filter((_, i) => i !== index));
  return (
    <AppContext.Provider value={{ site, sites, setSite, addSite, removeSite }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
