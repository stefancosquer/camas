import {
  Avatar,
  Box,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import { useSite } from "../hooks/site";
import { useBackend } from "../backends/backend";
import { useEffect, useState } from "react";
import { Settings } from "../model";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

export const App = () => {
  const { site } = useSite();
  const [settings, setSettings] = useState<Settings>();
  const { listFiles } = useBackend(site);
  useEffect(() => {
    if (site) listFiles().then(setSettings);
  }, [site]);
  if (!site) return null;
  return (
    <Box sx={{ height: "100vh", width: "100vw", display: "flex" }}>
      <Drawer
        sx={{ "& .MuiDrawer-paper": { width: "280px" } }}
        variant="permanent"
        open
      >
        <List>
          <ListItem>
            <ListItemAvatar>
              <Avatar></Avatar>
            </ListItemAvatar>
            <ListItemText primary={site.name} secondary={site.url} />
          </ListItem>
          <Divider />
          {settings?.sections?.map(({ type, label, ...item }, index) =>
            type === "heading" ? (
              <ListSubheader key={index} disableSticky>
                {label}
              </ListSubheader>
            ) : (
              <ListItem sx={{ py: 0, px: 1 }} key={index}>
                <ListItemButton sx={{ py: 0, px: 1, borderRadius: 2 }}>
                  <ListItemIcon sx={{ minWidth: "32px" }}>
                    {type === "directory" ? (
                      <FolderOpenOutlinedIcon />
                    ) : (
                      <DescriptionOutlinedIcon />
                    )}
                  </ListItemIcon>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>
        <Divider />
        <ListItem sx={{ px: 1 }}>
          <ListItemButton sx={{ py: 0, px: 1, borderRadius: 2 }}>
            <ListItemIcon sx={{ minWidth: "32px" }}>
              <SettingsOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </Drawer>
      <Box
        component="main"
        sx={{
          pl: "280px",
          flexGrow: 1,
          height: "100vh",
          overflow: "auto",
        }}
      >
        Hello
      </Box>
    </Box>
  );
};
