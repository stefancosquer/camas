import { Box, Drawer, List, ListItem, ListItemText } from "@mui/material";
import { useSite } from "../hooks/site";

export const App = () => {
  const { site } = useSite();
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
            <ListItemText primary={site.name} secondary={site.url} />
          </ListItem>
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
        Hello
      </Box>
    </Box>
  );
};
