import { Box, Divider, Typography } from "@mui/material";
import * as React from "react";

export const Settings = () => (
  <Box>
    <Box
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        height: "72px",
        justifyContent: "space-between",
      }}
    >
      <Typography variant="h6">Settings</Typography>
    </Box>
    <Divider />
  </Box>
);
