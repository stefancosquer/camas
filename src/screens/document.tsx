import { Box, Divider, Typography } from "@mui/material";
import { useSite } from "../hooks/site";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export const Document = () => {
  const { "*": path } = useParams();
  const { loadDocument } = useSite();
  const [meta, setMeta] = useState({});
  const [body, setBody] = useState<string>();
  useEffect(() => {
    (async () => {
      const { meta, body } = await loadDocument(path);
      setMeta(meta);
      setBody(body);
    })();
  }, [path]);
  return (
    <Box
      sx={{
        p: 2,
      }}
    >
      <Box sx={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(meta, null, 2)}</Box>
      <Divider />
      <Typography dangerouslySetInnerHTML={{ __html: body }} />
    </Box>
  );
};
