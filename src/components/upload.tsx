import * as React from "react";
import { LoadingButton } from "@mui/lab";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useSite } from "../hooks/site";

export const Upload = ({ saving = false }: { saving?: boolean }) => {
  const { saveMedia, synchronize } = useSite();
  const onChange = async (event) => {
    if (event.target.files.length > 0) {
      await saveMedia(event.target.files[0]);
      await synchronize();
    }
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
