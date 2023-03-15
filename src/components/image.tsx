import * as React from "react";
import { useSite } from "../hooks/site";
import { useEffect, useRef, useState } from "react";
import { isImage } from "../utils";
import { Box } from "@mui/material";

export const Image = ({ path }: { path: string }) => {
  const { loadMedia } = useSite();
  const [loaded, setLoaded] = useState(false);
  const [src, setSrc] = useState<string>();
  const ref = useRef();
  const handle = (entries) => {
    if (!loaded && entries[0].isIntersecting) {
      setLoaded(true);
      if (isImage(path)) {
        loadMedia(path).then(setSrc);
      }
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(handle);
    if (ref.current) observer.observe(ref.current);
    return () => ref.current && observer.unobserve(ref.current);
  }, [ref, loaded]);
  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        border: 1,
        borderColor: "grey.300",
        bgcolor: "background.paper",
        pt: "100%",
      }}
    >
      <Box
        sx={{
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
