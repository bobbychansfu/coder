"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import FilterPanel from "@/fe/shared/components/filters/FilterPanel";
import ListPageLayout from "@/fe/shared/components/layout/ListPageLayout";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import TabSwitcher from "@/fe/shared/components/ui/TabSwitcher";
import type { ContestListItem } from "@/fe/contests/data/contests";
import ContestSummaryCard from "@/fe/contests/components/ContestSummaryCard";
import sectionStyles from "@/fe/contests/styles/ContestsPage.module.css";
import gridStyles from "@/fe/shared/styles/Grid.module.css";
import layoutStyles from "@/fe/shared/styles/ListPageLayout.module.css";

const STATUS_FILTER_LABEL = "Status";
const DEFAULT_STATUS_FILTER = "All";
const BASE_STATUS_FILTERS = [
  { label: DEFAULT_STATUS_FILTER, active: true },
  { label: "Upcoming" },
  { label: "In Progress" },
  { label: "Closed" },
];

interface ContestsPageProps {
  initialContests: ContestListItem[];
  myContests?: ContestListItem[];
  availableContests?: ContestListItem[];
  isStudent?: boolean;
  showCreateContest: boolean;
  showManageContest: boolean;
  showViewAllSubmissions: boolean;
  pageErrorMessage?: string;
}

type ContestSectionMode = "registered" | "available";

function filterContests(
  contests: ContestListItem[],
  searchQuery: string,
  statusFilter: string,
) {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  return contests.filter((contest) => {
    const matchesQuery =
      normalizedQuery.length === 0 || contest.title.toLowerCase().includes(normalizedQuery);
    const matchesStatus = statusFilter === DEFAULT_STATUS_FILTER || contest.status === statusFilter;

    return matchesQuery && matchesStatus;
  });
}

function getRegisteredActionLabel(status: ContestListItem["status"]) {
  return status === "Closed" ? "View Contest" : "Enter Contest";
}

export default function ContestsPage({
  initialContests,
  myContests = [],
  availableContests = [],
  isStudent = false,
  showCreateContest,
  pageErrorMessage,
}: ContestsPageProps) {
  const router = useRouter();
  const [studentMyContests, setStudentMyContests] = useState(myContests);
  const [studentAvailableContests, setStudentAvailableContests] = useState(availableContests);
  const [studentView, setStudentView] = useState<ContestSectionMode>("registered");
  const [contestToConfirm, setContestToConfirm] = useState<ContestListItem | null>(null);
  const [pendingContestId, setPendingContestId] = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER);

  const handleRegister = async (contest: ContestListItem) => {
    setPendingContestId(contest.id);
    setRegisterError(null);

    try {
      const response = await fetch(`/api/s/contest/register/${contest.id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to register contest.");
      }

      setStudentAvailableContests((current) => current.filter((item) => item.id !== contest.id));
      setStudentMyContests((current) =>
        current.some((item) => item.id === contest.id) ? current : [contest, ...current],
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setRegisterError("Failed to register contest.");
    } finally {
      setPendingContestId(null);
    }
  };

  const handleConfirmRegistration = async () => {
    if (!contestToConfirm) {
      return;
    }

    const selectedContest = contestToConfirm;
    setContestToConfirm(null);
    await handleRegister(selectedContest);
  };

  const renderContestGrid = (contests: ContestListItem[], mode: ContestSectionMode) => {
    if (contests.length === 0) {
      return (
        <div className={sectionStyles.emptyState}>
          {mode === "registered"
            ? "You have not registered for any contests yet."
            : "No contests are currently open for registration."}
        </div>
      );
    }

    return (
      <div className={gridStyles.grid}>
        {contests.map((contest) => (
          <ContestSummaryCard
            key={contest.id}
            title={contest.title}
            status={contest.status}
            href={`/contests/${contest.id}`}
            actionLabel={
              mode === "registered"
                ? getRegisteredActionLabel(contest.status)
                : pendingContestId === contest.id
                  ? "Registering..."
                  : "Register"
            }
            actionKind={mode === "registered" ? "link" : "button"}
            actionVariant={mode === "registered" ? "secondary" : "primary"}
            onAction={mode === "available" ? () => setContestToConfirm(contest) : undefined}
            actionDisabled={mode === "available" && pendingContestId === contest.id}
          />
        ))}
      </div>
    );
  };

  const activeStudentContests =
    studentView === "registered" ? studentMyContests : studentAvailableContests;
  const allowedStatusOptions = useMemo(() => {
    if (isStudent && studentView === "available") {
      return BASE_STATUS_FILTERS.filter((option) => option.label !== "Closed");
    }

    return BASE_STATUS_FILTERS;
  }, [isStudent, studentView]);
  const normalizedStatusFilter = allowedStatusOptions.some((option) => option.label === statusFilter)
    ? statusFilter
    : DEFAULT_STATUS_FILTER;
  const filteredStudentContests = filterContests(
    activeStudentContests,
    searchQuery,
    normalizedStatusFilter,
  );
  const filteredInitialContests = filterContests(initialContests, searchQuery, normalizedStatusFilter);
  const activeStudentDescription =
    studentView === "registered"
      ? "Contests you have already joined through a Participation record."
      : "Published upcoming or active contests you can still register for.";
  const filterGroups = [
    {
      label: STATUS_FILTER_LABEL,
      options: allowedStatusOptions,
    },
  ];

  return (
    <ListPageLayout
      title="Contests"
      actionLabel={showCreateContest ? "Create Contest" : undefined}
      actionHref={showCreateContest ? "/contests/create" : undefined}
      sidebar={
        <FilterPanel
          groups={filterGroups}
          activeFilters={{ [STATUS_FILTER_LABEL]: normalizedStatusFilter }}
          onFilterChange={(group, option) => {
            if (group === STATUS_FILTER_LABEL) {
              setStatusFilter(option);
            }
          }}
        />
      }
    >
      {isStudent ? (
        <div className={sectionStyles.viewControls}>
          <TabSwitcher
            value={studentView}
            onChange={(value) => setStudentView(value as ContestSectionMode)}
            options={[
              { value: "registered", label: "My Contests" },
              { value: "available", label: "Available Contests" },
            ]}
            size="sm"
            ariaLabel="Student contest views"
            className={sectionStyles.viewSwitcher}
          />
        </div>
      ) : null}
      <div className={layoutStyles.searchBar}>
        <SearchInput
          placeholder="Search for ..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
      </div>
      {pageErrorMessage ? <p className={sectionStyles.registerError}>{pageErrorMessage}</p> : null}
      {registerError ? <p className={sectionStyles.registerError}>{registerError}</p> : null}
      {isStudent ? (
        <section className={sectionStyles.section}>
          <div className={sectionStyles.sectionHeader}>
            <h2 className={sectionStyles.sectionTitle}>
              {studentView === "registered" ? "My Contests" : "Available Contests"}
            </h2>
            <p className={sectionStyles.sectionDescription}>{activeStudentDescription}</p>
          </div>
          {renderContestGrid(filteredStudentContests, studentView)}
        </section>
      ) : (
        filteredInitialContests.length === 0 ? (
          <div className={sectionStyles.emptyState}>
            {pageErrorMessage
              ? "The instructor contests list could not be loaded during server-side rendering. Check the error message above for the exact reason."
              : "No contests are available for your current filters."}
          </div>
        ) : (
          <div className={gridStyles.grid}>
            {filteredInitialContests.map((contest) => (
              <ContestSummaryCard
                key={contest.id}
                title={contest.title}
                status={contest.status}
                href={`/contests/${contest.id}`}
                actionLabel={getRegisteredActionLabel(contest.status)}
                actionKind="link"
                actionVariant="secondary"
              />
            ))}
          </div>
        )
      )}
      <Dialog
        open={Boolean(contestToConfirm)}
        onClose={() => (pendingContestId ? null : setContestToConfirm(null))}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm registration</DialogTitle>
        <DialogContent>
          <Typography>
            Register for{" "}
            <strong>{contestToConfirm?.title}</strong>
            ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContestToConfirm(null)} disabled={Boolean(pendingContestId)}>
            Cancel
          </Button>
          <Button
            onClick={() => void handleConfirmRegistration()}
            variant="contained"
            color="error"
            disabled={Boolean(pendingContestId)}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </ListPageLayout>
  );
}
