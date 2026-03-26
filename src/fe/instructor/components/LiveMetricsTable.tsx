"use client";

import type { ReactNode } from "react";
import styles from "@/fe/instructor/styles/LiveInstructorAnalyticsCard.module.css";

interface LiveMetricsTableColumn<Row> {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
}

interface LiveMetricsTableProps<Row> {
  rows: Row[];
  visibleRows: Row[];
  rowKey: (row: Row) => string;
  columns: Array<LiveMetricsTableColumn<Row>>;
}

export default function LiveMetricsTable<Row>({
  rows,
  visibleRows,
  rowKey,
  columns,
}: LiveMetricsTableProps<Row>) {
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > visibleRows.length ? <div className={styles.tableFade} /> : null}
    </div>
  );
}
