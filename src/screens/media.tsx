import { Box, Button, Divider, Grid, Typography } from "@mui/material";
import { useSite } from "../hooks/site";
import * as React from "react";
import { useEffect, useState } from "react";
import { Image } from "../components/image";

export const Media = () => {
  const { listMedia } = useSite();
  const [media, setMedia] = useState<{ path: string; date: string }[]>([]);
  useEffect(() => {
    listMedia().then(setMedia);
  }, [listMedia]);
  return (
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
        <Typography variant="h6">Media</Typography>
        <Button onClick={() => {}} size="small" variant="outlined">
          Upload
        </Button>
      </Box>
      <Divider />
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
  );
};
