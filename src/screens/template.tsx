import { Box } from "@mui/material";
import { useParams } from "react-router-dom";

export const Template = () => {
  const { template } = useParams();
  return <Box>Template : {template}</Box>;
};
