import { Fragment, type ReactNode } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

export interface StatusSummaryRow {
  id: string;
  label: string;
  value: ReactNode;
}

interface StatusSummaryCardProps {
  title: string;
  rows: StatusSummaryRow[];
  dividerAfterRowIds?: string[];
  rowsContainerClassName?: string;
  footer?: ReactNode;
  cardClassName: string;
  contentClassName: string;
  titleClassName: string;
  rowClassName: string;
  labelClassName: string;
  dividerClassName: string;
}

export default function StatusSummaryCard({
  title,
  rows,
  dividerAfterRowIds = [],
  rowsContainerClassName,
  footer,
  cardClassName,
  contentClassName,
  titleClassName,
  rowClassName,
  labelClassName,
  dividerClassName,
}: StatusSummaryCardProps) {
  return (
    <Card className={cardClassName} elevation={0}>
      <CardContent className={contentClassName}>
        <Typography className={titleClassName}>{title}</Typography>
        <Box className={rowsContainerClassName}>
          {rows.map((row) => (
            <Fragment key={row.id}>
              <Box className={rowClassName}>
                <Typography className={labelClassName}>{row.label}</Typography>
                {row.value}
              </Box>
              {dividerAfterRowIds.includes(row.id) ? (
                <Box className={dividerClassName} />
              ) : null}
            </Fragment>
          ))}
        </Box>
        {footer}
      </CardContent>
    </Card>
  );
}
