import {
  Box,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useFiles } from "../hooks/files";

export const Directory = () => {
  const { slug, "*": path } = useParams();
  const files = useFiles(path);
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
              <ListItemText
                primary={path.split("/").pop()}
                secondary={`${author}-${date}`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
