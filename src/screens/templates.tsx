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
import MoreVertIcon from "@mui/icons-material/MoreVert";
import * as React from "react";
import { useSite } from "../hooks/site";
import { slugify } from "../utils";

export const Templates = () => {
  const { slug } = useParams();
  const { settings } = useSite();
  if (!settings) return null;
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          alignItems: "center",
          height: "72px",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">Templates</Typography>
        <Button onClick={() => {}} size="small" variant="outlined">
          Add
        </Button>
      </Box>
      <Divider />
      <List sx={{ px: 2, py: 0, width: "100%", flex: 1, overflow: "auto" }}>
        {settings.templates.map(({ label }, index) => (
          <ListItem key={index} divider disablePadding>
            <ListItemButton
              component={Link}
              href={`/${slug}/templates/${slugify(label)}`}
              disableTouchRipple
            >
              <ListItemText primary={label} />
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
