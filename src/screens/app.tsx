import {
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  Link,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import { useSite } from "../hooks/site";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import FolderOpenOutlinedIcon from "@mui/icons-material/FolderOpenOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import DashboardCustomizeOutlinedIcon from "@mui/icons-material/DashboardCustomizeOutlined";
import SyncIcon from "@mui/icons-material/Sync";
import { Outlet, useMatch, useParams } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { darkTheme } from "../theme";
import * as React from "react";
import { useEffect, useState } from "react";
import { useBackend } from "../backends/backend";

const DrawerItem = ({
  label,
  href,
  Icon,
}: {
  label: string;
  href: string;
  Icon: typeof SvgIcon;
}) => {
  const selected = !!useMatch(href);
  return (
    <ListItem sx={{ py: 0, px: 1 }}>
      <ListItemButton
        component={Link}
        href={href}
        sx={{ py: 0, px: 1, borderRadius: 1 }}
        selected={selected}
      >
        <ListItemIcon sx={{ minWidth: "32px" }}>
          <Icon sx={{ color: "text.primary" }} fontSize="small" />
        </ListItemIcon>
        <ListItemText
          primaryTypographyProps={{ fontSize: "14px" }}
          primary={label}
        />
      </ListItemButton>
    </ListItem>
  );
};

export const App = () => {
  const { site, settings } = useSite();
  const { listBranches } = useBackend(site);
  const { slug } = useParams();
  const [branches, setBranches] = useState([]);
  useEffect(() => {
    (async () => {
      setBranches(await listBranches());
    })();
  }, [site?.repository]);
  if (!site) return null;
  return (
    <Box sx={{ height: "100vh", width: "100vw", display: "flex" }}>
      <ThemeProvider theme={darkTheme}>
        <Drawer
          sx={{
            "& .MuiDrawer-paper": { width: "240px" },
          }}
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
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: "medium" }}>
                    {site.name}
                  </Typography>
                }
                secondary={
                  <Link
                    sx={{
                      color: "text.secondary",
                      textDecoration: "none",
                      ":hover": { textDecoration: "underline" },
                    }}
                    href={`https://${site.url}`}
                    target="_blank"
                  >
                    {site.url}
                  </Link>
                }
              />
            </ListItem>
          </List>
          <Divider />
          <Stack
            sx={{ py: 1, px: 2 }}
            direction="row"
            alignItems="center"
            spacing={1}
          >
            <TextField
              sx={{
                flex: 1,
                ".MuiSelect-select": { py: 0, fontSize: "small" },
              }}
              size="small"
              variant="outlined"
              value={branches.length === 0 ? "" : site.branch}
              select
            >
              {branches.map((branch) => (
                <MenuItem key={branch} value={branch}>
                  {branch}
                </MenuItem>
              ))}
            </TextField>
            <IconButton size="small">
              <SyncIcon sx={{ color: "text.primary" }} fontSize="small" />
            </IconButton>
          </Stack>
          <Divider />
          <List sx={{ overflow: "auto", flexGrow: 1 }}>
            {settings?.sections?.map(({ type, label, path, ...item }, index) =>
              type === "heading" ? (
                <ListSubheader
                  sx={{ pt: 1, fontWeight: "normal" }}
                  key={index}
                  disableSticky
                >
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
              label="Templates"
              Icon={DashboardCustomizeOutlinedIcon}
              href={`/${slug}/templates`}
            />
            <DrawerItem
              label="Settings"
              Icon={SettingsOutlinedIcon}
              href={`/${slug}/settings`}
            />
          </List>
        </Drawer>
      </ThemeProvider>
      <Box
        component="main"
        sx={{
          pl: "240px",
          flexGrow: 1,
          width: "100vw",
          height: "100vh",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};
