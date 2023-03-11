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

export const theme = createTheme({
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
});
