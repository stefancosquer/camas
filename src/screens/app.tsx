import {
  Avatar,
  Box,
  Divider,
  Drawer,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  SvgIcon,
} from "@mui/material";
import { useSite } from "../hooks/site";
import { useBackend } from "../backends/backend";
import { useEffect, useState } from "react";
import { Settings } from "../model";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import { Outlet, useParams } from "react-router-dom";

const DrawerItem = ({
  label,
  href,
  Icon,
}: {
  label: string;
  href: string;
  Icon: typeof SvgIcon;
}) => (
  <ListItem sx={{ py: 0, px: 1 }}>
    <ListItemButton
      component={Link}
      href={href}
      sx={{ py: 0, px: 1, borderRadius: 2 }}
    >
      <ListItemIcon sx={{ minWidth: "32px" }}>
        <Icon fontSize="small" />
      </ListItemIcon>
      <ListItemText
        primaryTypographyProps={{ fontSize: "14px" }}
        primary={label}
      />
    </ListItemButton>
  </ListItem>
);

export const App = () => {
  const { site } = useSite();
  const { slug } = useParams();
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
        <List disablePadding>
          <ListItem>
            <ListItemAvatar>
              <Avatar
                src={`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${site.url}&size=128`}
              />
            </ListItemAvatar>
            <ListItemText primary={site.name} secondary={site.url} />
          </ListItem>
        </List>
        <Divider />
        <List sx={{ overflow: "auto", flexGrow: 1 }}>
          {settings?.sections?.map(({ type, label, path, ...item }, index) =>
            type === "heading" ? (
              <ListSubheader sx={{ pt: 1 }} key={index} disableSticky>
                {label}
              </ListSubheader>
            ) : (
              <DrawerItem
                key={index}
                label={label}
                href={`/${slug}/${
                  type === "directory" ? "dir" : "doc"
                }/${path}`}
                Icon={
                  type === "directory"
                    ? FolderOpenOutlinedIcon
                    : DescriptionOutlinedIcon
                }
              />
            )
          )}
        </List>
        <Divider />
        <List>
          <DrawerItem
            label="Media"
            Icon={ImageOutlinedIcon}
            href={`/${slug}/media`}
          />
          <DrawerItem
            label="Types"
            Icon={DashboardCustomizeOutlinedIcon}
            href={`/${slug}/types`}
          />
          <DrawerItem
            label="Settings"
            Icon={SettingsOutlinedIcon}
            href={`/${slug}/settings`}
          />
        </List>
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
        <Outlet />
      </Box>
    </Box>
  );
};
