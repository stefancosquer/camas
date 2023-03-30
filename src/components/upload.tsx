import * as React from "react";
import { LoadingButton } from "@mui/lab";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";

export const Upload = ({ saving = false }: { saving?: boolean }) => {
  const onChange = (event) => {
    console.log(event.target.files);
  };
  return (
    <LoadingButton
      component="label"
      loading={saving}
      loadingPosition="start"
      startIcon={<DriveFolderUploadOutlinedIcon />}
      size="small"
      variant="outlined"
    >
      Upload
      <input hidden accept="image/*" multiple type="file" onChange={onChange} />
    </LoadingButton>
  );
};
