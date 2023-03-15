import {
  Box,
  Button,
  Divider,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { useFiles } from "../hooks/files";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import * as React from "react";

export const Directory = () => {
  const { slug, "*": path } = useParams();
  const files = useFiles(path);
  return (
    <Box>
      <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
        <Typography variant="h6">Directory</Typography>
        <Button onClick={() => {}} size="small" variant="outlined">
          Add
        </Button>
      </Box>
      <Divider />
      <List sx={{ px: 2, py: 0, width: "100%" }}>
        {files.map(({ path, author, date }, index) => (
          <ListItem key={index} divider disablePadding>
            <ListItemButton
              component={Link}
              href={`/${slug}/doc${path}`}
              disableTouchRipple
            >
              <ListItemText
                primary={path.split("/").pop()}
                secondary={`${author}-${date}`}
              />
              <IconButton
                edge="end"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
              >
                <MoreVertIcon />
              </IconButton>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};
