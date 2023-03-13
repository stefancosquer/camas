import { Box, Typography } from "@mui/material";
import { useBackend } from "../backends/backend";
import { useSite } from "../hooks/site";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const Document = () => {
  const { "*": path } = useParams();
  const { site } = useSite();
  const { loadFile } = useBackend(site);
  const [content, setContent] = useState<string>();
  useEffect(() => {
    loadFile(path).then(setContent);
  }, [path]);
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography>{JSON.stringify(content, null, 2)}</Typography>
    </Box>
  );
};
