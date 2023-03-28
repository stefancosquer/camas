import { Button } from "@mui/material";
import * as React from "react";

export const Upload = () => {
  const onChange = (event) => {
    console.log(event.target.files);
  };
  return (
    <Button component="label" size="small" variant="outlined">
      Upload
      <input hidden accept="image/*" multiple type="file" onChange={onChange} />
    </Button>
  );
};
