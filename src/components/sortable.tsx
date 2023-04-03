import { FC, HTMLAttributes, Key, useEffect, useState } from "react";
import { Box, Stack } from "@mui/material";

export const Sortable = <T,>({
  values,
  onChange,
  Component,
}: {
  values: T[];
  onChange: (values: T[]) => void;
  Component: FC<
    HTMLAttributes<any> & {
      value: T;
      dragged: boolean;
      onChange?: (value: T) => void;
      onRemove?: () => void;
    }
  >;
}) => {
  const [dragging, setDragging] = useState<Key>(null);
  const [hovered, setHovered] = useState<Key>(null);
  useEffect(() => {
    if (dragging !== null && hovered !== null && dragging !== hovered) {
      [values[hovered], values[dragging]] = [values[dragging], values[hovered]];
      onChange(values);
      setDragging(hovered);
    }
  }, [dragging, hovered]);
  return (
    <Stack sx={{ width: "100%" }} spacing={2}>
      {values?.map((value, index) => (
        <Box
          key={index}
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = "move";
          }}
          onDrag={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (dragging === null) setDragging(index);
          }}
          onDragOver={() => {
            setHovered(index);
          }}
          onDragEnd={(event) => {
            event.preventDefault();
            event.stopPropagation();
            setDragging(null);
            setHovered(null);
          }}
          draggable
        >
          <Component
            value={value}
            dragged={dragging === index}
            onRemove={() => {
              values.splice(index, 1);
              onChange(values);
            }}
            onChange={(itemValue) => {
              values[index] = itemValue;
              onChange(values);
            }}
          />
        </Box>
      ))}
    </Stack>
  );
};
