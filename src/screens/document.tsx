import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSite } from "../hooks/site";
import * as React from "react";
import { FC, PropsWithChildren, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Directory, Field, Template } from "../model";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragHandleOutlinedIcon from "@mui/icons-material/DragHandleOutlined";
import { Image } from "../components/image";

const Group = ({
  label,
  children,
  draggable,
}: PropsWithChildren<{ label: string; draggable?: boolean }>) => (
  <Accordion
    variant="outlined"
    TransitionProps={{ unmountOnExit: true }}
    disableGutters
    sx={{
      bgcolor: "background.default",
      width: "100%",
      ":before": { display: "none" },
    }}
    draggable={draggable}
    onDrag={() => console.log("dragging")}
    onDragStart={() => console.log("start dragging")}
    onDragEnd={() => console.log("stop dragging")}
  >
    <AccordionSummary
      sx={{ minHeight: "38px", height: "38px" }}
      expandIcon={<ExpandMoreIcon />}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {draggable && (
          <DragHandleOutlinedIcon
            fontSize="small"
            sx={{ mr: 2, ml: 0, color: "text.secondary" }}
          />
        )}
        <Typography>{label}</Typography>
      </Box>
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const FIELDS: {
  [K in Field["type"]]?: FC<Extract<Field, { type: K }>>;
} = {
  text: ({ label, description, value }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
    />
  ),
  number: ({ label, description, value }) => (
    <TextField
      type="number"
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
    />
  ),
  textarea: ({ label, description, value }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      multiline
      rows={4}
      helperText={description}
      value={value ?? ""}
    />
  ),
  datetime: ({ label, description, value }) => {
    const datetime = new Date(value);
    datetime.setMinutes(datetime.getMinutes() - datetime.getTimezoneOffset());
    return (
      <TextField
        type="datetime-local"
        size="small"
        label={label}
        fullWidth
        helperText={description}
        value={datetime.toISOString().slice(0, 16)}
      />
    );
  },
  select: ({
    label,
    config: {
      required,
      source: { type },
      options,
    },
    value = "",
  }) => (
    <TextField
      select
      fullWidth
      label={label}
      size="small"
      value={value}
      required={required}
    >
      {options?.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  ),
  boolean: ({ label, value }) => (
    <FormControlLabel control={<Switch checked={value} />} label={label} />
  ),
  field_group: ({ label, fields, value }) => (
    <Group label={label}>
      <Fields fields={fields} value={value} />
    </Group>
  ),
  field_group_list: ({ label, description, fields, config, value }) => (
    <Group label={label}>
      <Stack alignItems="flex-start" spacing={2}>
        <Button onClick={() => {}} size="small" variant="outlined">
          Add
        </Button>
        <Stack sx={{ width: "100%" }} spacing={2}>
          {value.map((item, index) => (
            <Group
              key={index}
              label={
                (item[config?.labelField] ??
                  item["title"] ??
                  item["label"] ??
                  item["name"]) as string
              }
              draggable
            >
              <Fields fields={fields} value={item} />
            </Group>
          ))}
        </Stack>
      </Stack>
    </Group>
  ),
  list: ({ label, value }) => (
    <Group label={`${label} (not implemented)`}>
      {value?.map((v) => (
        <Box key={v}>{v}</Box>
      ))}
    </Group>
  ),
  file: ({ label, value }) => (
    <>
      <Image path={value} content />
      <Button variant="contained" component="label">
        Upload
        <input hidden accept="image/*" multiple type="file" />
      </Button>
    </>
  ),
  include: ({ name, template, value }) => {
    const { settings } = useSite();
    return (
      <Fields
        fields={
          settings.templates.find(({ name }) => name === template)?.fields ?? []
        }
        value={value}
      />
    );
  },
};

const Fields = ({
  fields,
  value,
}: {
  fields: Field[];
  value: Record<string, unknown>;
}) => (
  <Stack sx={{ width: "100%", maxWidth: "640px" }} spacing={2}>
    {fields.map((field, index) => {
      const Component: FC<Field> = FIELDS[field.type];
      return Component ? (
        <Component
          key={field.name}
          value={
            field.type === "include"
              ? value
              : (value?.[field.name] as Record<string, unknown>)
          }
          {...field}
        />
      ) : (
        <Box key={field.name}>
          Undefined {field.name} {field.type}
        </Box>
      );
    })}
  </Stack>
);

export const Document = () => {
  const { "*": path } = useParams();
  const { loadDocument, settings } = useSite();
  const [template, setTemplate] = useState<Template>();
  const [meta, setMeta] = useState<Record<string, unknown>>();
  const [body, setBody] = useState<string>();
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
        if (!template) {
          // TODO template from content
          template = {
            name: "generated",
            hide_body: !path.endsWith(".md"),
            label: "Generated",
            fields: [],
            pages: [path],
          };
        }
        setTemplate(template);
        const { meta, body } = await loadDocument(path);
        setMeta(meta);
        setBody(body);
        console.log(template);
      })();
    }
  }, [path, settings]);
  if (!template || !meta) return null;
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
        <Typography variant="h6">Document</Typography>
        <Button onClick={() => {}} size="small" variant="outlined">
          Save
        </Button>
      </Box>
      <Divider />
      <Stack
        sx={{ flex: 1, justifyContent: "center", overflow: "hidden" }}
        direction="row"
      >
        <Box
          sx={{
            px: 2,
            py: 4,
            display: "flex",
            flex: 2,
            overflow: "auto",
            justifyContent: "center",
          }}
        >
          <Fields fields={template.fields} value={meta} />
        </Box>
        {!template.hide_body && (
          <>
            <Divider orientation="vertical" flexItem />
            <Box
              sx={{
                p: 2,
                flex: 3,
                overflow: "auto",
                "pre, code": {
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                },
              }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </>
        )}
      </Stack>
    </Box>
  );
};
