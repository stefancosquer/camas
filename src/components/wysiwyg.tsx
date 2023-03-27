import * as React from "react";
import { FC, useCallback, useMemo, useState } from "react";
import {
  Editable,
  RenderElementProps,
  RenderLeafProps,
  Slate,
  useSlate,
  withReact,
} from "slate-react";
import { withHistory } from "slate-history";
import {
  BaseElement,
  createEditor,
  Descendant,
  Editor,
  Element,
  Transforms,
} from "slate";
import {
  Box,
  Button,
  Divider,
  Link,
  Menu,
  Portal,
  Stack,
  SvgIcon,
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
    <Typography variant="body1" sx={{ mb: 2 }} {...attributes}>
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
    <Typography
      component="li"
      variant="body1"
      {...attributes}
      sx={{ ".MuiTypography-root": { mb: 0 } }}
    >
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
  img: ({ attributes, element, children }) => (
    <Box component="span" {...attributes} contentEditable={false}>
      {children}
      <Image path={element["url"]} content />
    </Box>
  ),
  a: ({ attributes, children, element }) => (
    <Link
      href={element["url"]}
      {...attributes}
      onFocus={() => console.log("focused")}
      onBlur={() => console.log("blurred")}
    >
      {children}
    </Link>
  ),
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

const withEditor = (editor) => {
  const { insertData, insertText, isInline, isVoid } = editor;

  editor.isInline = (element) =>
    INLINES.includes(element.type) || isInline(element);

  editor.isVoid = (element) => {
    return VOIDS.includes(element.type) || isVoid(element);
  };

  editor.insertText = (text) => {
    insertText(text);
  };

  editor.insertData = (data) => {
    insertData(data);
  };
  return editor;
};

export const Wysiwyg = ({ value: initialValue }: { value: Descendant[] }) => {
  const editor = useMemo(
    () => withEditor(withReact(withHistory(createEditor()))),
    []
  );
  const [value, setValue] = useState(initialValue);

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
          />
        </Box>
      </Stack>
    </Slate>
  );
};
