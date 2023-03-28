import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import { useSite } from "../hooks/site";
import * as React from "react";
import { useEffect, useState } from "react";
import { Image } from "../components/image";
import { Upload } from "../components/upload";

export const Media = () => {
  const { listMedia } = useSite();
  const [media, setMedia] = useState<{ path: string; date: string }[]>([]);
  useEffect(() => {
    listMedia().then(setMedia);
  }, [listMedia]);
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
          justifyContent: "space-between",
          height: "72px",
        }}
      >
        <Typography variant="h6">Media</Typography>
        <Upload />
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Grid sx={{ p: 2 }} spacing={2} container>
          {media
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map(({ path }) => (
              <Grid key={path} item xs={12} sm={6} md={4} lg={3}>
                <Image path={path} />
              </Grid>
            ))}
        </Grid>
      </Box>
    </Box>
  );
};
