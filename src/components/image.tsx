import * as React from "react";
import { useSite } from "../hooks/site";
import { useCallback, useEffect, useRef, useState } from "react";
import { isImage } from "../utils";
import { Box } from "@mui/material";

export const Image = ({
  path,
  content = false,
}: {
  path?: string;
  content?: boolean;
}) => {
  const {
    loadMedia,
    settings: { upload_dir, public_path },
  } = useSite();
  const [visible, setVisible] = useState(false);
  const [src, setSrc] = useState<string>();
  const [realPath, setRealPath] = useState<string>();
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
  return (
    <Box
      ref={ref}
      component="span"
      sx={{
        display: "block",
        position: "relative",
        border: 1,
        borderColor: "grey.300",
        bgcolor: "background.paper",
        pt: content ? "56.25%" : "100%",
      }}
    >
      <Box
        component="span"
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
    </Box>
  );
};
