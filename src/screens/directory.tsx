import {
  Box,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useSite } from "../hooks/site";
import { useBackend } from "../backends/backend";
import { useEffect, useState } from "react";
import { File } from "../model";

export const Directory = () => {
  const { slug, "*": path } = useParams();
  const { site } = useSite();
  const { listFiles } = useBackend(site);
  const [files, setFiles] = useState<File[]>([]);
  useEffect(() => {
    listFiles(path).then(setFiles);
  }, [path]);
  return (
    <Box
      sx={{
        p: 2,
        display: "flex",
        height: "100vh",
      }}
    >
      <List sx={{ width: "100%" }}>
        {files.map(({ path, author, date }, index) => (
          <ListItem key={index} divider disablePadding>
            <ListItemButton component={Link} href={`/${slug}/doc${path}`}>
              <ListItemText primary={path} secondary={`${author}-${date}`} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
