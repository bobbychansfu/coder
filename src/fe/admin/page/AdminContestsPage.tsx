"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { Box, Button } from "@mui/material";

import { adminContests, adminContestStatusOptions } from "@/fe/admin/data";
import ContestFiltersBar from "@/fe/admin/components/ContestFiltersBar";
import ContestTable from "@/fe/admin/components/ContestTable";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import styles from "@/fe/admin/styles/AdminContestsPage.module.css";

export default function AdminContestsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<
    (typeof adminContestStatusOptions)[number]["value"]
  >("all");

  const filteredContests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return adminContests.filter((contest) => {
      const matchesStatus = selectedStatus === "all" || contest.status === selectedStatus;

      if (!matchesStatus) return false;
      if (!query) return true;

      return (
        contest.name.toLowerCase().includes(query) ||
        contest.classSection.toLowerCase().includes(query) ||
        contest.instructor.toLowerCase().includes(query)
      );
    });
  }, [search, selectedStatus]);

  const stats = useMemo(() => {
    const total = adminContests.length;
    const active = adminContests.filter((c) => c.status === "active").length;
    const upcoming = adminContests.filter((c) => c.status === "upcoming").length;
    const completed = adminContests.filter((c) => c.status === "ended").length;
    return { total, active, upcoming, completed };
  }, []);

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.admin)}
        backLabel="Back"
        backButtonClassName={subpageStyles.backButton}
      />

      <SubpageHeader
        title="Contest Management"
        subtitle="Manage all contests across the platform"
        actions={
          <Button
            className={styles.createButton}
            variant="contained"
            startIcon={<AddRoundedIcon className={styles.createButtonIcon} />}
          >
            Create Contest
          </Button>
        }
      />

      <Box className={styles.statsGrid}>
        <StatCard
          label="Total Contests"
          value={String(stats.total)}
          className={`${styles.statCard} ${styles.statCardDefault}`}
          headerClassName={styles.statHeader}
          labelClassName={styles.statLabel}
          contentClassName={styles.statContent}
          valueClassName={styles.statValue}
        />
        <StatCard
          label="Active Now"
          value={String(stats.active)}
          className={`${styles.statCard} ${styles.statCardActive}`}
          headerClassName={styles.statHeader}
          labelClassName={`${styles.statLabel} ${styles.statLabelActive}`}
          contentClassName={styles.statContent}
          valueClassName={`${styles.statValue} ${styles.statValueActive}`}
        />
        <StatCard
          label="Upcoming"
          value={String(stats.upcoming)}
          className={`${styles.statCard} ${styles.statCardUpcoming}`}
          headerClassName={styles.statHeader}
          labelClassName={`${styles.statLabel} ${styles.statLabelUpcoming}`}
          contentClassName={styles.statContent}
          valueClassName={`${styles.statValue} ${styles.statValueUpcoming}`}
        />
        <StatCard
          label="Completed"
          value={String(stats.completed)}
          className={`${styles.statCard} ${styles.statCardDefault}`}
          headerClassName={styles.statHeader}
          labelClassName={styles.statLabel}
          contentClassName={styles.statContent}
          valueClassName={styles.statValue}
        />
      </Box>

      <ContestFiltersBar
        search={search}
        onSearchChange={setSearch}
        selectedStatus={selectedStatus}
        onStatusChange={(value) =>
          setSelectedStatus(value as (typeof adminContestStatusOptions)[number]["value"])
        }
        statusOptions={adminContestStatusOptions}
      />

      <ContestTable contests={filteredContests} />
    </Box>
  );
}
