import { Box, Divider, Typography } from "@mui/material";
import { useBackend } from "../backends/backend";
import { useSite } from "../hooks/site";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { unified } from "unified";
import parse from "remark-parse";
import frontmatter from "remark-frontmatter";
import html from "remark-html";
import { visit } from "unist-util-visit";
import { load } from "js-yaml";

export const Document = () => {
  const { "*": path } = useParams();
  const { site } = useSite();
  const { loadFile } = useBackend(site);
  const [meta, setMeta] = useState({});
  const [body, setBody] = useState<string>();
  useEffect(() => {
    loadFile(path).then(async (content) => {
      const { data, value } = await unified()
        .use(parse)
        .use(frontmatter, ["yaml"])
        .use(() => (tree, file) => {
          visit(tree, "yaml", (node): void => {
            file.data = load(node.value) as Record<string, unknown>;
          });
        })
        .use(html)
        .process(content);
      setMeta(data);
      setBody(value);
    });
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
