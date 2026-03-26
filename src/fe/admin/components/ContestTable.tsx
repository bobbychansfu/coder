import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import type { AdminContest, AdminContestStatus, AdminContestVisibility } from "@/fe/admin/data";
import styles from "@/fe/admin/styles/ContestTable.module.css";

const statusChipConfig: Record<AdminContestStatus, { label: string; className: string }> = {
  upcoming: { label: "Upcoming", className: styles.statusChipUpcoming },
  active: { label: "In Progress", className: styles.statusChipActive },
  ended: { label: "Closed", className: styles.statusChipEnded },
};

const visibilityChipConfig: Record<AdminContestVisibility, { label: string; className: string }> =
  {
    public: { label: "public", className: styles.visibilityChipPublic },
    private: { label: "private", className: styles.visibilityChipPrivate },
  };

interface ContestTableProps {
  contests: AdminContest[];
}

export default function ContestTable({ contests }: ContestTableProps) {
  return (
    <Box className={styles.tableCard}>
      <TableContainer className={styles.tableScroll}>
        <Table className={styles.table}>
          <TableHead>
            <TableRow>
              <TableCell className={styles.headCell}>Contest Name</TableCell>
              <TableCell className={styles.headCell}>Class/Section</TableCell>
              <TableCell className={styles.headCell}>Instructor</TableCell>
              <TableCell className={styles.headCell}>Start Date</TableCell>
              <TableCell className={styles.headCell}>Duration</TableCell>
              <TableCell className={styles.headCell}>Status</TableCell>
              <TableCell className={styles.headCell}>Participants</TableCell>
              <TableCell className={styles.headCell}>Visibility</TableCell>
              <TableCell className={styles.headCellRight}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {contests.map((contest) => {
              const statusConfig = statusChipConfig[contest.status];
              const visibilityConfig = visibilityChipConfig[contest.visibility];

              return (
                <TableRow key={contest.id} className={styles.bodyRow}>
                  <TableCell className={styles.bodyCellTitle}>{contest.name}</TableCell>
                  <TableCell className={styles.bodyCell}>{contest.classSection}</TableCell>
                  <TableCell className={styles.bodyCell}>{contest.instructor}</TableCell>
                  <TableCell className={styles.bodyCell}>
                    <Box className={styles.metaInline}>
                      <CalendarTodayOutlinedIcon className={styles.metaIcon} />
                      {contest.startDate}
                    </Box>
                  </TableCell>
                  <TableCell className={styles.bodyCell}>
                    <Box className={styles.metaInline}>
                      <AccessTimeOutlinedIcon className={styles.metaIcon} />
                      {contest.duration}
                    </Box>
                  </TableCell>
                  <TableCell className={styles.bodyCell}>
                    <Chip
                      label={statusConfig.label}
                      size="small"
                      className={`${styles.statusChip} ${statusConfig.className}`}
                    />
                  </TableCell>
                  <TableCell className={styles.bodyCell}>
                    <Box className={styles.metaInline}>
                      <GroupOutlinedIcon className={styles.metaIcon} />
                      {contest.participants}
                    </Box>
                  </TableCell>
                  <TableCell className={styles.bodyCell}>
                    <Chip
                      label={visibilityConfig.label}
                      size="small"
                      className={`${styles.visibilityChip} ${visibilityConfig.className}`}
                    />
                  </TableCell>
                  <TableCell className={styles.bodyCellRight}>
                    <Box className={styles.rowActions}>
                      <IconButton
                        className={styles.rowActionButton}
                        aria-label={`View ${contest.name}`}
                      >
                        <VisibilityOutlinedIcon className={styles.rowActionIcon} />
                      </IconButton>
                      <IconButton
                        className={styles.rowActionButton}
                        aria-label={`Edit ${contest.name}`}
                      >
                        <EditOutlinedIcon className={styles.rowActionIcon} />
                      </IconButton>
                      <IconButton
                        className={styles.rowActionButton}
                        aria-label={`Delete ${contest.name}`}
                      >
                        <DeleteOutlineRoundedIcon
                          className={`${styles.rowActionIcon} ${styles.rowActionDelete}`}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
