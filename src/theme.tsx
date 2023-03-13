import { createTheme } from "@mui/material/styles";
import { LinkProps as MuiLinkProps } from "@mui/material";
import { forwardRef } from "react";
import { Link, LinkProps } from "react-router-dom";

const LinkBehavior = forwardRef<
  HTMLAnchorElement,
  Omit<LinkProps, "to"> & { href: LinkProps["to"] }
>((props, ref) => {
  const { href, ...other } = props;
  return <Link ref={ref} to={href} {...other} />;
});

const base = {
  components: {
    MuiLink: {
      defaultProps: {
        component: LinkBehavior,
      } as MuiLinkProps,
    },
    MuiButtonBase: {
      defaultProps: {
        LinkComponent: LinkBehavior,
      },
    },
  },
};

export const theme = createTheme(base);
export const darkTheme = createTheme(
  {
    palette: {
      mode: "dark",
      background: { paper: "#0d1117" },
      text: { primary: "#c9d1d9" },
    },
  },
  base
);
