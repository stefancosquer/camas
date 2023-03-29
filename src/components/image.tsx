import * as React from "react";
import { useSite } from "../hooks/site";
import { useCallback, useEffect, useRef, useState } from "react";
import { isImage } from "../utils";
import {
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlined from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { useModal } from "../hooks/modal";
import { Leaf } from "../model";
import { Upload } from "./upload";

const ToolBox = ({
  media,
  onSelect,
}: {
  media: Leaf[];
  onSelect: (path: string) => void;
}) => (
  <Grid sx={{ p: 2 }} spacing={2} container>
    <Grid item xs={12}>
      <Typography variant="h6">Edit Media</Typography>
    </Grid>
    <Grid item xs={12}>
      <TextField size="small" label="title" fullWidth />
    </Grid>
    <Grid item xs={12}>
      <TextField size="small" label="alt" fullWidth />
    </Grid>
    <Grid item xs={12}>
      <Divider />
    </Grid>
    <Grid
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      item
      xs={12}
    >
      <Typography variant="h6">Select Media</Typography>
      <Upload />
    </Grid>
    {media
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(({ path }) => (
        <Grid key={path} item xs={6}>
          <Button sx={{ p: 0 }} onClick={() => onSelect(path)} fullWidth>
            <Image path={path} />
          </Button>
        </Grid>
      ))}
  </Grid>
);

export const Image = ({
  path,
  content = false,
  onChange,
  onRemove,
}: {
  path?: string;
  content?: boolean;
  onChange?: (title: string, alt: string, path: string) => void;
  onRemove?: () => void;
}) => {
  const {
    loadMedia,
    listMedia,
    settings: { upload_dir, public_path },
  } = useSite();
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string>();
  const [realPath, setRealPath] = useState<string>();
  const { setModal } = useModal();
  const ref = useRef();
  useEffect(() => {
    if (path) {
      setRealPath(
        content
          ? `/${upload_dir.replace(/^\/|\/$/g, "")}/${path
              .replace(/^\/|\/$/g, "")
              .replace(
                new RegExp(`^${public_path.replace(/^\/|\/$/g, "")}`),
                ""
              )
              .replace(/^\/|\/$/g, "")}`
          : path
      );
    }
  }, [path]);
  const handle = useCallback(
    (entries) => {
      if (!visible && entries[0].isIntersecting) {
        setVisible(true);
      }
    },
    [visible]
  );
  useEffect(() => {
    const observer = new IntersectionObserver(handle);
    if (ref.current) observer.observe(ref.current);
    return () => ref.current && observer.unobserve(ref.current);
  }, [ref, visible]);
  useEffect(() => {
    if (visible && isImage(realPath)) {
      loadMedia(realPath).then(setSrc);
    }
  }, [realPath, visible]);
  const onEdit = () => {
    listMedia().then((media) => {
      setModal(
        <ToolBox
          media={media}
          onSelect={(path) => {
            const realPath = `/${public_path.replace(/^\/|\/$/g, "")}/${path
              .replace(/^\/|\/$/g, "")
              .replace(new RegExp(`^${upload_dir.replace(/^\/|\/$/g, "")}`), "")
              .replace(/^\/|\/$/g, "")}`;
            onChange("", "", realPath);
            setModal(null);
          }}
        />
      );
    });
  };
  return (
    <Box
      ref={ref}
      sx={{
        display: "block",
        position: "relative",
        border: 1,
        borderColor: "grey.300",
        bgcolor: "background.paper",
        width: "100%",
        pt: content ? "56.25%" : "100%",
      }}
    >
      <Box
        sx={{
          display: "block",
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          img: {
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
          },
        }}
      >
        {src ? <img src={src} alt="" /> : path}
      </Box>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          display: "block",
          position: "absolute",
          top: 0,
          right: 0,
          p: 2,
        }}
      >
        {onChange && (
          <IconButton
            sx={{
              bgcolor: "white",
              ":hover": { bgcolor: "white" },
              boxShadow: 2,
            }}
            size="small"
            onClick={onEdit}
          >
            <EditOutlinedIcon />
          </IconButton>
        )}
        {onRemove && (
          <IconButton
            sx={{
              bgcolor: "white",
              ":hover": { bgcolor: "white" },
              boxShadow: 2,
            }}
            size="small"
            onClick={onRemove}
          >
            <DeleteOutlineOutlined />
          </IconButton>
        )}
      </Stack>
    </Box>
  );
};
