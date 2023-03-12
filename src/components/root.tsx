import * as React from "react";
import { SiteContextProvider } from "../hooks/site";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "../theme";
import CssBaseline from "@mui/material/CssBaseline";
import { Outlet } from "react-router-dom";

export const Root = () => (
  <SiteContextProvider>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
    </ThemeProvider>
  </SiteContextProvider>
);
