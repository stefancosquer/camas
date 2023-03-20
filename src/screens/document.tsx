import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Divider,
  FormControlLabel,
  IconButton,
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
import { Directory, Field, Settings, Template, Value } from "../model";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragHandleOutlinedIcon from "@mui/icons-material/DragHandleOutlined";
import { Image } from "../components/image";
import { isImage } from "../utils";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
      borderRadius: 1,
      borderColor: "grey.400",
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
      sx={{
        minHeight: "38px",
        height: "38px",
        width: "100%",
        ".MuiAccordionSummary-content": {
          display: "flex",
          overflow: "hidden",
          alignItems: "center",
          width: "100%",
        },
      }}
      expandIcon={<ExpandMoreIcon />}
    >
      {draggable && (
        <DragHandleOutlinedIcon
          fontSize="small"
          sx={{ mr: 2, ml: 0, color: "text.secondary" }}
        />
      )}
      <Typography
        sx={{
          flex: 1,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </Typography>
      {draggable && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <DeleteOutlineOutlined fontSize="small" />
        </IconButton>
      )}
    </AccordionSummary>
    <AccordionDetails>{children}</AccordionDetails>
  </Accordion>
);

const FIELDS: {
  [K in Field["type"]]?: FC<
    Extract<Field, { type: K }> &
      Extract<Value, { type: K }> & { settings: Settings }
  >;
} = {
  text: ({ label, description, config, value }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
      required={config?.required}
    />
  ),
  color: ({ label, description, config, value }) => (
    <Stack direction="row" spacing={1}>
      <TextField
        size="small"
        label={label}
        fullWidth
        helperText={description}
        value={value ?? ""}
        required={config?.required}
      />
      <Box
        sx={{
          bgcolor: value,
          width: "40px",
          borderColor: "grey.400",
          borderStyle: "solid",
          borderWidth: "1px",
          borderRadius: 1,
        }}
      ></Box>
    </Stack>
  ),
  number: ({ label, description, config, value }) => (
    <TextField
      type="number"
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
      required={config?.required}
    />
  ),
  textarea: ({ label, description, config, value }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      multiline
      rows={4}
      helperText={description}
      value={value ?? ""}
      required={config?.required}
    />
  ),
  datetime: ({ label, description, config, value }) => {
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
        required={config?.required}
      />
    );
  },
  select: ({
    label,
    config: {
      required,
      source: { type, section, file, path },
      options = [],
    },
    value = "",
    settings,
  }) => {
    if (type === "pages") {
      options = settings.templates
        .flatMap(({ pages = [] }) => pages)
        .filter((item, index, array) => array.indexOf(item) === index)
        .sort((a, b) => a.localeCompare(b));
    }
    return (
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
    );
  },
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
          {value?.map((item, index) => (
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
  list: ({ label, description, value }) => (
    <Group label={label}>
      <Stack sx={{ width: "100%" }} spacing={2}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            sx={{ ".MuiInputBase-input": { py: 0.5 } }}
          />
          <Button onClick={() => {}} size="small" variant="outlined">
            Add
          </Button>
        </Stack>
        {value?.map((v) => (
          <Stack
            key={v}
            direction="row"
            alignItems="center"
            sx={{
              px: 2,
              py: 1,
              borderColor: "grey.400",
              borderStyle: "solid",
              borderWidth: "1px",
              borderRadius: 1,
            }}
            spacing={2}
            draggable
          >
            <DragHandleOutlinedIcon
              fontSize="small"
              sx={{ color: "text.secondary", cursor: "pointer" }}
            />
            <Typography
              sx={{
                flex: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {v}
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <DeleteOutlineOutlined fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Group>
  ),
  file: ({ label, description, value }) => (
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
}) => {
  const { settings } = useSite();
  return (
    <Stack sx={{ width: "100%", maxWidth: "640px" }} spacing={2}>
      {fields.map((field) => {
        const Component: FC<any> = FIELDS[field.type];
        return Component ? (
          <Component
            key={field.name}
            value={
              field.type === "include"
                ? value
                : (value?.[field.name] as Record<string, unknown>)
            }
            settings={settings}
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
};

const generateTemplate = (data: object): Field[] =>
  Object.entries(data).map(([label, v]): Field => {
    if (Array.isArray(v)) {
      if (v.length > 0) {
        // TODO depends of item type
        console.log(typeof v[0]);
      }
      return {
        label,
        name: label,
        description: "",
        hidden: false,
        type: "field_group_list",
        fields: generateTemplate(v.reduce((a, v) => ({ ...a, ...v }), {})),
        config: {},
      };
    } else if (typeof v === "object") {
      return {
        label,
        name: label,
        description: "",
        hidden: false,
        type: "field_group",
        fields: generateTemplate(v),
      };
    } else if (typeof v === "boolean") {
      return {
        label,
        name: label,
        description: "",
        default: false,
        hidden: false,
        type: "boolean",
      };
    } else if (typeof v === "number") {
      return {
        label,
        name: label,
        description: "",
        hidden: false,
        type: "number",
        default: 0,
        config: {
          required: false,
        },
      };
    } else if (typeof v === "string") {
      if (isImage(v)) {
        return {
          label,
          name: label,
          description: "",
          hidden: false,
          type: "file",
          default: "",
          config: {},
        };
      } else if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        return {
          label,
          name: label,
          description: "",
          hidden: false,
          type: "color",
          default: "",
          config: { required: false, color_format: "RGB" },
        };
      } else {
        return {
          label,
          name: label,
          description: "",
          hidden: false,
          type: "text",
          default: "",
          config: {
            required: false,
          },
        };
      }
    }
  });

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
        <Typography variant="h6" sx={{ flex: 1 }}>
          Document
        </Typography>
        <Button onClick={() => {}} size="small" variant="outlined">
          Save
        </Button>
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
