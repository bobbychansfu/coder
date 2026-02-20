import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Card, CardContent, Typography } from "@mui/material";

interface ChecklistPanelProps {
  title: string;
  items: string[];
  cardClassName: string;
  contentClassName: string;
  titleClassName: string;
  listClassName: string;
  itemClassName: string;
  iconClassName: string;
  textClassName: string;
}

export default function ChecklistPanel({
  title,
  items,
  cardClassName,
  contentClassName,
  titleClassName,
  listClassName,
  itemClassName,
  iconClassName,
  textClassName,
}: ChecklistPanelProps) {
  return (
    <Card className={cardClassName} elevation={0}>
      <CardContent className={contentClassName}>
        <Typography className={titleClassName}>{title}</Typography>
        <Box component="ul" className={listClassName}>
          {items.map((item, index) => (
            <Box component="li" key={`${item}-${index}`} className={itemClassName}>
              <CheckRoundedIcon className={iconClassName} />
              <Typography className={textClassName}>{item}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
