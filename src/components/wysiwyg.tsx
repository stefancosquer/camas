import * as React from "react";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  Editable,
  ReactEditor,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  useSlateStatic,
  withReact,
} from "slate-react";
import { withHistory } from "slate-history";
import {
  BaseElement,
  createEditor,
  Descendant,
  Editor,
  Element,
  Text,
  Transforms,
} from "slate";
import {
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Link,
  Stack,
  SvgIcon,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FormatSizeIcon from "@mui/icons-material/FormatSize";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatStrikethroughIcon from "@mui/icons-material/FormatStrikethrough";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import LinkIcon from "@mui/icons-material/Link";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import FormatQuoteOutlinedIcon from "@mui/icons-material/FormatQuoteOutlined";
import IntegrationInstructionsOutlinedIcon from "@mui/icons-material/IntegrationInstructionsOutlined";
import { Image } from "./image";

const isMarkActive = (editor: Editor, format: string) =>
  !!Editor.marks(editor)?.[format];

const isBlockActive = (editor: Editor, format) => {
  const { selection } = editor;
  if (!selection) return false;
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n["type"] === format,
    })
  );
  return !!match;
};

const toggleMark = (editor: Editor, format: string) =>
  isMarkActive(editor, format)
    ? Editor.removeMark(editor, format)
    : Editor.addMark(editor, format, true);

const LISTS = ["ol", "ul"];
const INLINES = ["a"];
const VOIDS = ["img"];

const toggleBlock = (editor, type) => {
  const isActive = isBlockActive(editor, type);
  const isList = LISTS.includes(type);
  const isInline = INLINES.includes(type);
  const isVoid = VOIDS.includes(type);
  if (isVoid) {
    if (!isActive) {
      Transforms.insertNodes(editor, {
        type,
        children: [{ text: "" }],
      } as BaseElement);
    }
  } else if (isInline) {
    if (isActive) {
      Transforms.unwrapNodes(editor, {
        match: (n) =>
          !Editor.isEditor(n) && Element.isElement(n) && n["type"] === type,
      });
    } else {
      Transforms.wrapNodes(editor, { type, children: [] } as BaseElement, {
        split: true,
      });
      Transforms.collapse(editor, { edge: "end" });
    }
  } else {
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) &&
        Element.isElement(n) &&
        LISTS.includes(n["type"]),
      split: true,
    });
    Transforms.setNodes<Element>(editor, {
      type: isActive ? "p" : isList ? "li" : type,
    } as Partial<BaseElement>);
    if (!isActive && isList) {
      const block = { type, children: [] };
      Transforms.wrapNodes(editor, block);
    }
  }
};

const ELEMENTS: Record<string, FC<RenderElementProps>> = {
  h1: ({ attributes, children, element }) => (
    <Typography
      variant="h1"
      sx={{ fontSize: "48px", mt: 3, mb: 2 }}
      {...attributes}
    >
      {children}
    </Typography>
  ),
  h2: ({ attributes, children, element }) => (
    <Typography
      variant="h2"
      sx={{ fontSize: "36px", mt: 3, mb: 2 }}
      {...attributes}
    >
      {children}
    </Typography>
  ),
  h3: ({ attributes, children, element }) => (
    <Typography
      variant="h3"
      sx={{ fontSize: "28px", mt: 3, mb: 2 }}
      {...attributes}
    >
      {children}
    </Typography>
  ),
  h4: ({ attributes, children, element }) => (
    <Typography
      variant="h4"
      sx={{ fontSize: "18px", mt: 3, mb: 2 }}
      {...attributes}
    >
      {children}
    </Typography>
  ),
  p: ({ attributes, children, element }) => (
    <Typography component="div" variant="body1" sx={{ mb: 2 }} {...attributes}>
      {children}
    </Typography>
  ),
  ol: ({ attributes, children, element }) => (
    <Typography component="ol" variant="body1" sx={{ my: 2 }} {...attributes}>
      {children}
    </Typography>
  ),
  ul: ({ attributes, children, element }) => (
    <Typography component="ul" variant="body1" sx={{ my: 2 }} {...attributes}>
      {children}
    </Typography>
  ),
  li: ({ attributes, children, element }) => (
    <Typography component="li" variant="body1" {...attributes} sx={{ mb: 0.5 }}>
      {children}
    </Typography>
  ),
  code: ({ attributes, children, element }) => (
    <Typography
      className="language-javascript"
      component="code"
      sx={{
        display: "block",
        fontFamily: '"Roboto Mono", monospace',
        whiteSpace: "pre-wrap",
        bgcolor: "grey.100",
        p: 1.5,
        border: 1,
        borderColor: "divider",
        my: 2,
      }}
      variant="body1"
      {...attributes}
    >
      {children}
    </Typography>
  ),
  quote: ({ attributes, children, element }) => (
    <Typography
      component="blockquote"
      sx={{
        display: "block",
        whiteSpace: "pre-wrap",
        pl: 1.5,
        pr: 1,
        py: 1,
        my: 2,
        borderLeft: 4,
        borderColor: "divider",
        bgcolor: "grey.100",
      }}
      variant="body1"
      {...attributes}
    >
      {children}
    </Typography>
  ),
  img: ({ attributes, element, children }) => {
    const editor = useSlateStatic();
    const onRemove = () => {
      const at = ReactEditor.findPath(editor as ReactEditor, element);
      Transforms.removeNodes(editor, { at });
    };
    return (
      <Box sx={{ my: 2 }} {...attributes} contentEditable={false}>
        {children}
        <Image
          path={element["url"]}
          content
          onChange={console.log}
          onRemove={onRemove}
        />
      </Box>
    );
  },
  a: ({ attributes, children, element }) => {
    const editor = useSlate();
    const [anchor, setAnchor] = useState<null | HTMLElement>(null);
    const at = ReactEditor.findPath(editor as ReactEditor, element);
    const togglePopper = (event) => {
      setAnchor(event.currentTarget);
    };
    return (
      <Tooltip
        open={!!anchor}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        arrow
        PopperProps={{
          sx: {
            ".MuiTooltip-arrow": {
              color: "white",
            },
            ".MuiTooltip-tooltip": {
              bgcolor: "transparent",
              boxShadow: 10,
              p: 0,
            },
          },
        }}
        title={
          <ClickAwayListener onClickAway={() => setAnchor(null)}>
            <Stack
              sx={{ p: 2, bgcolor: "white" }}
              spacing={1}
              contentEditable={false}
            >
              <TextField
                size="small"
                label="title"
                defaultValue={element["title"] ?? ""}
                onChange={(event) =>
                  Transforms.setNodes(
                    editor,
                    {
                      title: event.target.value,
                    } as any,
                    { at }
                  )
                }
                fullWidth
              />
              <TextField
                size="small"
                label="url"
                defaultValue={element["url"] ?? ""}
                onChange={(event) =>
                  Transforms.setNodes(
                    editor,
                    {
                      url: event.target.value,
                    } as any,
                    { at }
                  )
                }
                fullWidth
              />
            </Stack>
          </ClickAwayListener>
        }
      >
        <Link href={element["url"]} {...attributes} onClick={togglePopper}>
          {children}
        </Link>
      </Tooltip>
    );
  },
  default: ({ attributes, children, element }) => (
    <div {...attributes}>
      Unknown ({element["type"]}) {children}
    </div>
  ),
};

const MarkButton = ({
  format,
  Icon,
  block,
}: {
  format: string;
  Icon: typeof SvgIcon;
  block?: boolean;
}) => {
  const editor = useSlate();
  return (
    <ToggleButton
      size="small"
      value={format}
      selected={
        block ? isBlockActive(editor, format) : isMarkActive(editor, format)
      }
      sx={{ borderRadius: 1, border: 0 }}
      onMouseDown={(event: any) => {
        event.preventDefault();
        block ? toggleBlock(editor, format) : toggleMark(editor, format);
      }}
    >
      <Icon />
    </ToggleButton>
  );
};

const withEditor = (editor: ReactEditor) => {
  const { insertData, insertText, isInline, isVoid, normalizeNode } = editor;

  editor.isInline = (element) =>
    INLINES.includes(element["type"]) || isInline(element);

  editor.isVoid = (element) => {
    return VOIDS.includes(element["type"]) || isVoid(element);
  };

  editor.insertText = (text) => {
    insertText(text);
  };

  editor.insertData = (data) => {
    insertData(data);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;
    if (Element.isElement(node)) {
      for (let i = 0; i < node.children.length; i++) {
        if (i > 1) {
          const prev = node.children[i - 2];
          const text = node.children[i - 1];
          const current = node.children[i];
          if (
            Element.isElement(prev) &&
            editor.isInline(prev) &&
            Text.isText(text) &&
            text.text === "" &&
            Element.isElement(current) &&
            editor.isInline(current) &&
            prev["type"] === current["type"]
          ) {
            Transforms.insertNodes(editor, current.children, {
              at: path.concat(i - 2, prev.children.length),
            });
            Transforms.removeNodes(editor, { at: path.concat(i) });
            return;
          }
        }
      }
    }
    /*
    if (Element.isElement(node)) {
      const children = node.children
        .filter(({ text }: any) => text !== "")
        .reduce((a, current, i, array) => {
          if (a.length === 0) {
            a.push(current);
          } else {
            const last = a.pop();
            if (editor.isInline(last) && editor.isInline(current)) {
              console.log("LAST", last);
              let same = true;
              for (const prop in last) {
                if (prop !== "children" && last[prop] !== current[prop]) {
                  same = false;
                }
              }
              if (same) {
                a.push({
                  ...last,
                  children: [...last["children"], ...current["children"]],
                });
              } else {
                a.push(last, current);
              }
            }
          }
          return a;
        }, []);
      console.log("normalize", node, node.children, children);
      Transforms.setNodes(
        editor,
        {
          children: [],
        },
        { at: path }
      );
      return;
    }*/
    normalizeNode(entry);
  };
  return editor;
};

export const Wysiwyg = ({
  value: initialValue,
  onChange,
}: {
  value: Descendant[];
  onChange: (value: string) => void;
}) => {
  const editor = useMemo(
    () => withEditor(withReact(withHistory(createEditor()))),
    []
  );
  const [value, setValue] = useState(initialValue);
  useEffect(() => onChange(value as any), [value]);

  const renderElement = useCallback((props: RenderElementProps) => {
    const Component = ELEMENTS[props.element["type"]] ?? ELEMENTS.default;
    return <Component {...props} />;
  }, []);

  const renderLeaf = useCallback(
    ({ attributes, children, leaf }: RenderLeafProps) => (
      <Typography
        component="span"
        variant="inherit"
        sx={{
          fontWeight: leaf["bold"] ? "bold" : "normal",
          fontStyle: leaf["italic"] ? "italic" : "normal",
          textDecoration: leaf["strikeThrough"] ? "line-through" : "none",
          fontFamily: leaf["code"] ? '"Roboto Mono", monospace' : "inherit",
          bgcolor: leaf["code"] ? "grey.100" : "transparent",
          py: leaf["code"] ? 0.05 : 0,
          px: leaf["code"] ? 0.25 : 0,
        }}
        {...attributes}
      >
        {children}
      </Typography>
    ),
    []
  );

  return (
    <Slate
      editor={editor}
      value={value}
      onChange={(value: any) => {
        setValue(value);
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack sx={{ p: 0.5 }} direction="row" spacing={0.25}>
          <Button
            sx={{ color: "text.secondary" }}
            variant="text"
            size="small"
            endIcon={<ExpandMoreIcon />}
          >
            <FormatSizeIcon />
          </Button>
          <Divider flexItem orientation="vertical" />
          <MarkButton format="bold" Icon={FormatBoldIcon} />
          <MarkButton format="italic" Icon={FormatItalicIcon} />
          <MarkButton format="strikeThrough" Icon={FormatStrikethroughIcon} />
          <MarkButton format="code" Icon={CodeIcon} />
          <Divider flexItem orientation="vertical" />
          <MarkButton format="a" Icon={LinkIcon} block />
          <MarkButton format="img" Icon={ImageOutlinedIcon} block />
          <Divider flexItem orientation="vertical" />
          <MarkButton format="quote" Icon={FormatQuoteOutlinedIcon} block />
          <MarkButton
            format="code"
            Icon={IntegrationInstructionsOutlinedIcon}
            block
          />
          <MarkButton format="ul" Icon={FormatListBulletedIcon} block />
          <MarkButton format="ol" Icon={FormatListNumberedIcon} block />
        </Stack>
        <Divider />
        <Box
          sx={{
            flex: 1,
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="Start writing..."
            style={{ padding: "16px", minHeight: "100%" }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.shiftKey) {
                event.preventDefault();
                editor.insertText("\n");
              }
            }}
          />
        </Box>
      </Stack>
    </Slate>
  );
};
