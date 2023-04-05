import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import { useSite } from "../hooks/site";
import * as React from "react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Directory, Template } from "../model";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { Wysiwyg } from "../components/wysiwyg";
import { Descendant } from "slate";
import { Fields } from "../components/fields";
import { LoadingButton } from "@mui/lab";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { generateTemplate } from "../utils";

export const Document = () => {
  const { "*": path } = useParams();
  const { loadDocument, saveDocument, settings } = useSite();
  const [template, setTemplate] = useState<Template>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meta, setMeta] = useState<Record<string, unknown>>();
  const [body, setBody] = useState<Descendant[]>();
  useEffect(() => {
    if (path && settings) {
      (async () => {
        let template = settings.templates.find(
          ({ pages }) => pages?.indexOf(path) >= 0
        );
        if (!template) {
          const dir = path
            .replace(/^\/|\/$/g, "")
            .split("/")
            .slice(0, -1)
            .join("/");
          template = settings.templates.find(
            ({ name }) =>
              name ===
              settings.sections
                .filter(
                  (section): section is Directory =>
                    section.type === "directory"
                )
                .find(({ path }) => path === dir)?.templates?.[0]
          );
        }
        const { meta, body } = await loadDocument(path);
        if (!template) {
          template = {
            name: "_",
            label: "_",
            hide_body: !path.endsWith(".md"),
            fields: generateTemplate(Array.isArray(meta) ? { _: meta } : meta),
            pages: [path],
          };
        }
        // TODO Merge templates ?
        setTemplate(template);
        setMeta(
          Array.isArray(meta) && template.fields.length === 1
            ? { [template.fields[0].name]: meta }
            : meta
        );
        setBody(body);
        setDirty(false);
        setSaving(false);
      })();
    }
  }, [path, settings]);
  const onSave = async () => {
    setSaving(true);
    await saveDocument(path, meta, body);
    setSaving(false);
    setDirty(false);
  };
  if (!template || !meta) return null;
  console.log(meta, body);
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
          height: "72px",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" sx={{ flex: 1 }}>
          Document
        </Typography>
        <LoadingButton
          loading={saving}
          loadingPosition="start"
          startIcon={<SaveOutlinedIcon />}
          onClick={onSave}
          size="small"
          variant="outlined"
          disabled={!dirty}
        >
          Save
        </LoadingButton>
        <IconButton
          edge="end"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <MoreVertIcon />
        </IconButton>
      </Box>
      <Divider />
      <Stack
        sx={{ flex: 1, justifyContent: "center", overflow: "hidden" }}
        direction="row"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            px: 2,
            py: 4,
            flex: 2,
            overflow: "auto",
            alignItems: "center",
          }}
        >
          <Fields
            fields={template.fields}
            value={meta}
            onChange={(value) => {
              setDirty(true);
              setMeta(value);
            }}
          />
        </Box>
        {!template.hide_body && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 3, height: "100%", overflow: "hidden" }}>
              <Wysiwyg
                value={body}
                onChange={(value) => {
                  setDirty(true);
                  setBody(value);
                }}
              />
            </Box>
          </>
        )}
      </Stack>
    </Box>
  );
};
