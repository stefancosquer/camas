import { Box, Typography } from "@mui/material";

export const Welcome = () => (
  <Box
    sx={{
      display: "flex",
      height: "100vh",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Typography variant="h4">Welcome !</Typography>
  </Box>
);
