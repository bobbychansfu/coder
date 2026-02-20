"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PersonAddOutlinedIcon from "@mui/icons-material/PersonAddOutlined";
import { Box, Button } from "@mui/material";

import { adminRoleOptions, adminUsers } from "@/fe/admin/data";
import UserFiltersBar from "@/fe/admin/components/UserFiltersBar";
import UserTable from "@/fe/admin/components/UserTable";
import PageHeader from "@/fe/shared/components/PageHeader";
import SubpageHeader from "@/fe/shared/components/SubpageHeader";
import StatCard from "@/fe/shared/components/StatCard";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/shared/styles/SubpageHeader.module.css";
import styles from "@/fe/admin/styles/AdminUserManagementPage.module.css";

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<(typeof adminRoleOptions)[number]["value"]>("all");

  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      const matchesRole = selectedRole === "all" || user.role === selectedRole;
      const query = search.trim().toLowerCase();

      if (!matchesRole) return false;
      if (!query) return true;

      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    });
  }, [search, selectedRole]);

  const stats = useMemo(() => {
    const totalUsers = adminUsers.length;
    const studentCount = adminUsers.filter((u) => u.role === "student").length;
    const instructorCount = adminUsers.filter((u) => u.role === "instructor").length;
    const taCount = adminUsers.filter((u) => u.role === "ta").length;

    return [
      { id: "total-users", label: "Total Users", value: String(totalUsers) },
      { id: "students", label: "Students", value: String(studentCount) },
      { id: "instructors", label: "Instructors", value: String(instructorCount) },
      { id: "tas", label: "TAs", value: String(taCount) },
    ];
  }, []);

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.admin)}
        backLabel="Back to Admin Hub"
        backButtonClassName={subpageStyles.backButton}
      />

      <SubpageHeader
        title="User Management"
        subtitle="Manage instructors, TAs, and admin roles. Students authenticate via SFU FAS."
        actions={
          <Button
            className={styles.addButton}
            variant="contained"
            startIcon={<PersonAddOutlinedIcon className={styles.addButtonIcon} />}
          >
            Add Staff/Admin
          </Button>
        }
      />

      <Box className={styles.statsGrid}>
        {stats.map((stat) => (
          <StatCard
            key={stat.id}
            label={stat.label}
            value={stat.value}
            className={styles.statCard}
            headerClassName={styles.statHeader}
            labelClassName={styles.statLabel}
            contentClassName={styles.statContent}
            valueClassName={styles.statValue}
          />
        ))}
      </Box>

      <UserFiltersBar
        search={search}
        onSearchChange={setSearch}
        selectedRole={selectedRole}
        onRoleChange={(value) =>
          setSelectedRole(value as (typeof adminRoleOptions)[number]["value"])
        }
        roleOptions={adminRoleOptions}
      />

      <UserTable users={filteredUsers} />
    </Box>
  );
}
