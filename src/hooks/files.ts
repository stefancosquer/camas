import { useSite } from "./site";
import { useEffect, useState } from "react";
import { Leaf } from "../model";

export const useFiles = (path: string) => {
  const { listFiles } = useSite();
  const [files, setFiles] = useState<Leaf[]>([]);
  useEffect(() => {
    listFiles(path).then(setFiles);
  }, [path]);
  return files;
};
