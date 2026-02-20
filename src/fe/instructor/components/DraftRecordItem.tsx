import type { ReactNode } from "react";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { Box, Button, Typography } from "@mui/material";

interface DraftRecordItemProps {
  title: string;
  topMeta: ReactNode;
  bottomMeta: ReactNode;
  itemClassName: string;
  mainClassName: string;
  titleClassName: string;
  actionsClassName: string;
  iconButtonClassName: string;
  editIconClassName: string;
  deleteIconClassName: string;
}

export default function DraftRecordItem({
  title,
  topMeta,
  bottomMeta,
  itemClassName,
  mainClassName,
  titleClassName,
  actionsClassName,
  iconButtonClassName,
  editIconClassName,
  deleteIconClassName,
}: DraftRecordItemProps) {
  return (
    <Box className={itemClassName}>
      <Box className={mainClassName}>
        <Typography className={titleClassName}>{title}</Typography>
        {topMeta}
        {bottomMeta}
      </Box>
      <Box className={actionsClassName}>
        <Button className={iconButtonClassName} aria-label="Edit draft">
          <EditOutlinedIcon className={editIconClassName} />
        </Button>
        <Button className={iconButtonClassName} aria-label="Delete draft">
          <DeleteOutlineRoundedIcon className={deleteIconClassName} />
        </Button>
      </Box>
    </Box>
  );
}
