import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Button } from "@mui/material";

export interface SubpageActionButtonItem {
  id: string;
  label: string;
  icon: SvgIconComponent;
  onClick?: () => void;
}

interface SubpageActionButtonsProps {
  items: SubpageActionButtonItem[];
  containerClassName: string;
  buttonClassName: string;
  iconClassName: string;
}

export default function SubpageActionButtons({
  items,
  containerClassName,
  buttonClassName,
  iconClassName,
}: SubpageActionButtonsProps) {
  return (
    <Box className={containerClassName}>
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <Button
            key={item.id}
            className={buttonClassName}
            variant="outlined"
            startIcon={<Icon className={iconClassName} />}
            onClick={item.onClick}
          >
            {item.label}
          </Button>
        );
      })}
    </Box>
  );
}
