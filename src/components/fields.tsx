import * as React from "react";
import { FC, PropsWithChildren, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DragHandleOutlinedIcon from "@mui/icons-material/DragHandleOutlined";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import { Field, Settings, Value } from "../model";
import { Image } from "./image";
import { useSite } from "../hooks/site";
import { Sortable } from "./sortable";

const Group = ({
  label,
  children,
  sortable,
  dragged,
  onRemove,
}: PropsWithChildren<{
  label: string;
  sortable?: boolean;
  dragged?: boolean;
  onRemove?: () => void;
}>) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <Accordion
      variant="outlined"
      TransitionProps={{ unmountOnExit: true }}
      disableGutters
      sx={{
        borderRadius: 1,
        borderColor: dragged ? "background.paper" : "grey.400",
        bgcolor: dragged ? "background.paper" : "background.default",
        width: "100%",
        ":before": { display: "none" },
        transition: "none",
      }}
      expanded={expanded}
      onChange={(_, expanded) => setExpanded(expanded)}
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
          opacity: dragged ? 0 : 1,
        }}
        expandIcon={<ExpandMoreIcon />}
      >
        {sortable && (
          <DragHandleOutlinedIcon
            fontSize="small"
            sx={{
              mr: 2,
              ml: 0,
              color: "text.secondary",
            }}
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
        {onRemove && (
          <IconButton
            size="small"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
          >
            <DeleteOutlineOutlined fontSize="small" />
          </IconButton>
        )}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          opacity: dragged ? 0 : 1,
        }}
      >
        {children}
      </AccordionDetails>
    </Accordion>
  );
};

const FIELDS: {
  [K in Field["type"]]?: FC<
    Extract<Field, { type: K }> &
      Extract<Value, { type: K }> & {
        onChange: (value: Extract<Value, { type: K }>["value"]) => void;
      } & {
        settings: Settings;
      }
  >;
} = {
  text: ({ label, description, config, value, onChange }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
      required={config?.required}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  color: ({ label, description, config, value, onChange }) => (
    <Stack direction="row" spacing={1}>
      <TextField
        size="small"
        label={label}
        fullWidth
        helperText={description}
        value={value ?? ""}
        required={config?.required}
        onChange={(event) => onChange(event.target.value)}
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
  number: ({ label, description, config, value, onChange }) => (
    <TextField
      type="number"
      size="small"
      label={label}
      fullWidth
      helperText={description}
      value={value ?? ""}
      required={config?.required}
      onChange={(event) => onChange(parseInt(event.target.value) || undefined)}
    />
  ),
  textarea: ({ label, description, config, value, onChange }) => (
    <TextField
      size="small"
      label={label}
      fullWidth
      multiline
      rows={4}
      helperText={description}
      value={value ?? ""}
      required={config?.required}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
  datetime: ({ label, description, config, value, onChange }) => {
    const datetime = new Date(value);
    datetime.setMinutes(datetime.getMinutes() - datetime.getTimezoneOffset());
    return (
      <TextField
        type="datetime-local"
        size="small"
        label={label}
        fullWidth
        helperText={description}
        value={value ? datetime.toISOString().slice(0, 16) : ""}
        required={config?.required}
        onChange={(event) => onChange(event.target.value)}
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
    onChange,
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
        onChange={(event) => onChange(event.target.value)}
      >
        {options?.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    );
  },
  boolean: ({ label, value, onChange }) => (
    <FormControlLabel
      control={
        <Switch checked={value} onChange={(_, checked) => onChange(checked)} />
      }
      label={label}
    />
  ),
  field_group: ({ label, fields, value, onChange }) => (
    <Group label={label}>
      <Fields fields={fields} value={value} onChange={onChange} />
    </Group>
  ),
  field_group_list: ({
    label,
    description,
    fields,
    config,
    value,
    onChange,
  }) => {
    return (
      <Group label={label}>
        <Stack alignItems="flex-start" spacing={2}>
          <Button
            onClick={() => onChange([{}, ...value])}
            size="small"
            variant="outlined"
          >
            Add
          </Button>
          <Sortable
            values={value}
            onChange={onChange}
            Component={({ value, dragged, onChange, onRemove }) => (
              <Group
                dragged={dragged}
                onRemove={onRemove}
                label={
                  (value[config?.labelField] ??
                    value["title"] ??
                    value["label"] ??
                    value["name"]) as string
                }
                sortable
              >
                <Fields fields={fields} value={value} onChange={onChange} />
              </Group>
            )}
          ></Sortable>
        </Stack>
      </Group>
    );
  },
  list: ({ label, description, value, onChange }) => {
    const [newValue, setNewValue] = useState("");
    return (
      <Group label={label}>
        <Stack sx={{ width: "100%" }} spacing={2}>
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              size="small"
              sx={{ ".MuiInputBase-input": { py: 0.5 } }}
              value={newValue}
              onChange={(event) => setNewValue(event.target.value)}
            />
            <Button
              onClick={() => {
                onChange([newValue, ...value]);
                setNewValue("");
              }}
              size="small"
              variant="outlined"
              disabled={newValue.length === 0}
            >
              Add
            </Button>
          </Stack>
          <Sortable
            values={value}
            onChange={onChange}
            Component={({ value, dragged, onRemove }) => (
              <Stack
                direction="row"
                alignItems="center"
                sx={{
                  px: 2,
                  py: 1,
                  borderColor: dragged ? "background.paper" : "grey.400",
                  bgcolor: dragged ? "background.paper" : "background.default",
                  borderStyle: "solid",
                  borderWidth: "1px",
                  borderRadius: 1,
                }}
                spacing={2}
              >
                <DragHandleOutlinedIcon
                  fontSize="small"
                  sx={{
                    color: "text.secondary",
                    cursor: "pointer",
                    opacity: dragged ? 0 : 1,
                  }}
                />
                <Typography
                  sx={{
                    flex: 1,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    opacity: dragged ? 0 : 1,
                  }}
                >
                  {value}
                </Typography>
                <IconButton
                  sx={{ opacity: dragged ? 0 : 1 }}
                  size="small"
                  onClick={onRemove}
                >
                  <DeleteOutlineOutlined fontSize="small" />
                </IconButton>
              </Stack>
            )}
          />
        </Stack>
      </Group>
    );
  },
  file: ({ label, description, value, onChange }) => (
    <Image
      label={label}
      path={value}
      content
      onChange={(title, alt, path) => onChange(path)}
      onRemove={() => onChange("")}
    />
  ),
  include: ({ name, template, value, onChange }) => {
    const { settings } = useSite();
    return (
      <Fields
        fields={
          settings.templates.find(({ name }) => name === template)?.fields ?? []
        }
        value={value}
        onChange={onChange}
      />
    );
  },
};

export const Fields = ({
  fields,
  value,
  onChange,
}: {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
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
            onChange={(fieldValue) =>
              onChange(
                field.type === "include"
                  ? { ...value, ...fieldValue }
                  : { ...value, [field.name]: fieldValue }
              )
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
};
