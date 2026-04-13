"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArchiveOutlinedIcon from "@mui/icons-material/ArchiveOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Chip, CircularProgress, Typography } from "@mui/material";

import {
  DEFAULT_MANAGE_CONTENT_TAB,
  MANAGED_CONTEST_STATUS_LABELS,
  MANAGED_PROBLEM_STATUS_LABELS,
  MANAGE_CONTEST_STATUS_FILTERS,
  MANAGE_CONTENT_TABS,
  MANAGE_CONTENT_VIEW_CONFIG,
  MANAGE_PROBLEM_STATUS_FILTERS,
  type ManageContentTab,
  type ManagedContestStatus,
  type ManagedContestStatusFilter,
  type ManagedProblemDifficulty,
  type ManagedProblemStatus,
  type ManagedProblemStatusFilter,
} from "@/fe/shared/constants/manageContent";
import CompactStatCard from "@/fe/shared/components/CompactStatCard";
import PageHeader from "@/fe/shared/components/PageHeader";
import SearchInput from "@/fe/shared/components/forms/SearchInput";
import PillFilterBar from "@/fe/shared/components/ui/PillFilterBar";
import RowActionsMenu from "@/fe/shared/components/RowActionsMenu";
import ScrollbarHider from "@/fe/shared/components/ui/ScrollbarHider";
import UnderlineTabs from "@/fe/shared/components/ui/UnderlineTabs";
import { ROUTES } from "@/fe/shared/constants/routes";
import type { CompactStatTone, MenuActionItem } from "@/fe/shared/types/common";
import { trpc } from "@/lib/trpc/client";
import styles from "@/fe/instructor/styles/ManageContestsPage.module.css";

interface ManageContentStatSummary {
  id: string;
  label: string;
  value: number;
  icon: SvgIconComponent;
  tone: CompactStatTone;
}

interface ManagedContestRecord {
  id: string;
  title: string;
  owner: string;
  section: string;
  status: ManagedContestStatus;
  startAt: string;
  endAt: string;
  problemsCount: number;
  enrolledCount: number;
  submittedCount: number;
}

interface ManagedProblemRecord {
  id: string;
  title: string;
  points: number;
  status: ManagedProblemStatus;
  difficulty: ManagedProblemDifficulty;
  tags: string[];
}

const EMPTY_CONTESTS: ManagedContestRecord[] = [];
const EMPTY_PROBLEMS: ManagedProblemRecord[] = [];

function getInitialManageContentTab(tab: string | null): ManageContentTab {
  return tab === "contests" || tab === "problems" ? tab : DEFAULT_MANAGE_CONTENT_TAB;
}

export default function ManageContestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = trpc.useUtils();
  const [selectedTab, setSelectedTab] = useState<ManageContentTab>(() =>
    getInitialManageContentTab(searchParams.get("tab")),
  );
  const [contestSearchQuery, setContestSearchQuery] = useState("");
  const [problemSearchQuery, setProblemSearchQuery] = useState("");
  const [selectedContestStatus, setSelectedContestStatus] =
    useState<ManagedContestStatusFilter>("all");
  const [selectedProblemStatus, setSelectedProblemStatus] =
    useState<ManagedProblemStatusFilter>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.instructorManageContent.getManageContent.useQuery(
    undefined,
    {
      retry: false,
      refetchOnWindowFocus: true,
      refetchInterval: 60_000,
      refetchIntervalInBackground: false,
    },
  );

  const contestStatusMutation = trpc.instructorManageContent.updateContestManageStatus.useMutation({
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
      ]);
    },
    onError: (mutationError) => {
      setActionError(mutationError.message);
    },
  });

  const problemStatusMutation = trpc.instructorManageContent.updateProblemManageStatus.useMutation({
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        utils.instructorManageContent.getManageContent.invalidate(),
        utils.instructorManageContent.getInstructorOverview.invalidate(),
      ]);
    },
    onError: (mutationError) => {
      setActionError(mutationError.message);
    },
  });

  const contestRecords = (data?.contests ?? EMPTY_CONTESTS) as ManagedContestRecord[];
  const problemRecords = (data?.problems ?? EMPTY_PROBLEMS) as ManagedProblemRecord[];

  const stats = useMemo<ManageContentStatSummary[]>(
    () => [
      {
        id: "total-contests",
        label: "Total Contests",
        value: contestRecords.length,
        icon: EmojiEventsOutlinedIcon,
        tone: "red",
      },
      {
        id: "total-problems",
        label: "Your Problems",
        value: problemRecords.length,
        icon: CodeRoundedIcon,
        tone: "blue",
      },
      {
        id: "public-problems",
        label: "Your Public Problems",
        value: problemRecords.filter((problem) => problem.status === "public").length,
        icon: CodeRoundedIcon,
        tone: "orange",
      },
      {
        id: "archived",
        label: "Archived",
        value:
          contestRecords.filter((contest) => contest.status === "archived").length +
          problemRecords.filter((problem) => problem.status === "archived").length,
        icon: ArchiveOutlinedIcon,
        tone: "gray",
      },
    ],
    [contestRecords, problemRecords],
  );

  const filteredContests = useMemo(() => {
    const normalizedQuery = contestSearchQuery.trim().toLowerCase();

    return contestRecords.filter((contest) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        contest.title.toLowerCase().includes(normalizedQuery) ||
        contest.owner.toLowerCase().includes(normalizedQuery) ||
        contest.section.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        selectedContestStatus === "all" || contest.status === selectedContestStatus;

      return matchesSearch && matchesStatus;
    });
  }, [contestRecords, contestSearchQuery, selectedContestStatus]);

  const filteredProblems = useMemo(() => {
    const normalizedQuery = problemSearchQuery.trim().toLowerCase();

    return problemRecords.filter((problem) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        problem.title.toLowerCase().includes(normalizedQuery) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));
      const matchesStatus =
        selectedProblemStatus === "all" || problem.status === selectedProblemStatus;

      return matchesSearch && matchesStatus;
    });
  }, [problemRecords, problemSearchQuery, selectedProblemStatus]);

  const handleArchiveContest = async (contestId: string) => {
    setActionError(null);
    await contestStatusMutation.mutateAsync({ contestId, manageStatus: "ARCHIVED" });
  };

  const handleArchiveProblem = async (problemId: string) => {
    setActionError(null);
    await problemStatusMutation.mutateAsync({ problemId, manageStatus: "ARCHIVED" });
  };

  const getContestStatusClassName = (status: ManagedContestStatus) => {
    switch (status) {
      case "active":
        return styles.statusActive;
      case "upcoming":
        return styles.statusUpcoming;
      case "draft":
        return styles.statusDraft;
      case "ended":
        return styles.statusEnded;
      case "archived":
        return styles.statusArchived;
      default:
        return "";
    }
  };

  const getProblemStatusClassName = (status: ManagedProblemStatus) => {
    switch (status) {
      case "public":
        return styles.statusPublic;
      case "contest-only":
        return styles.statusContestOnly;
      case "draft":
        return styles.statusDraft;
      case "archived":
        return styles.statusArchived;
      default:
        return "";
    }
  };

  const getDifficultyClassName = (difficulty: ManagedProblemDifficulty) => {
    switch (difficulty) {
      case "easy":
        return styles.difficultyEasy;
      case "medium":
        return styles.difficultyMedium;
      case "hard":
        return styles.difficultyHard;
      default:
        return "";
    }
  };

  const currentSearchQuery = selectedTab === "contests" ? contestSearchQuery : problemSearchQuery;
  const currentStatusFilter =
    selectedTab === "contests" ? selectedContestStatus : selectedProblemStatus;
  const currentStatusOptions =
    selectedTab === "contests" ? MANAGE_CONTEST_STATUS_FILTERS : MANAGE_PROBLEM_STATUS_FILTERS;
  const currentViewConfig = MANAGE_CONTENT_VIEW_CONFIG[selectedTab];
  const isContestUpdatePending = (contestId: string) =>
    contestStatusMutation.isPending && contestStatusMutation.variables?.contestId === contestId;
  const isProblemUpdatePending = (problemId: string) =>
    problemStatusMutation.isPending && problemStatusMutation.variables?.problemId === problemId;
  const pageError = error?.message ?? actionError;

  return (
    <>
      <ScrollbarHider />
      <Box className={styles.page}>
        <PageHeader onBack={() => router.push(ROUTES.instructor)} backLabel="Back" />

        <Box className={styles.hero}>
          <Typography className={styles.pageTitle}>Manage Your Problems &amp; Contests</Typography>
          <Typography className={styles.pageSubtitle}>
            Review the real publishing state of your problems and contests
          </Typography>
        </Box>

        <Box className={styles.statsGrid}>
          {stats.map((stat) => (
            <CompactStatCard
              key={stat.id}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              tone={stat.tone}
            />
          ))}
        </Box>

        <Box className={styles.surface}>
          <UnderlineTabs
            value={selectedTab}
            options={MANAGE_CONTENT_TABS}
            onChange={(value) => setSelectedTab(value as ManageContentTab)}
            className={styles.tabs}
          />

          {pageError ? (
            <Box className={styles.errorBanner}>
              <Typography className={styles.errorText}>{pageError}</Typography>
            </Box>
          ) : null}

          <Box className={styles.controlsRow}>
            <div className={styles.searchWrap}>
              <SearchInput
                placeholder={currentViewConfig.searchPlaceholder}
                value={currentSearchQuery}
                onChange={(value) => {
                  if (selectedTab === "contests") {
                    setContestSearchQuery(value);
                    return;
                  }

                  setProblemSearchQuery(value);
                }}
              />
            </div>

            <PillFilterBar
              value={currentStatusFilter}
              options={currentStatusOptions}
              onChange={(value) => {
                if (selectedTab === "contests") {
                  setSelectedContestStatus(value as ManagedContestStatusFilter);
                  return;
                }

                setSelectedProblemStatus(value as ManagedProblemStatusFilter);
              }}
              className={styles.filterPills}
            />
          </Box>

          <Box className={styles.tableCard}>
            {isLoading ? (
              <Box className={styles.loadingState}>
                <CircularProgress size={28} />
              </Box>
            ) : selectedTab === "contests" ? (
              filteredContests.length > 0 ? (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {MANAGE_CONTENT_VIEW_CONFIG.contests.tableHeaders.map((header, index) => (
                        <th
                          key={header}
                          className={`${styles.headerCell} ${
                            index === MANAGE_CONTENT_VIEW_CONFIG.contests.tableHeaders.length - 1
                              ? styles.actionsHeader
                              : ""
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContests.map((contest) => (
                      <tr key={contest.id} className={styles.tableRow}>
                        <td className={`${styles.bodyCell} ${styles.contestCell}`}>
                          <Typography className={styles.mobileCellLabel}>Contest</Typography>
                          <Box className={styles.contestPrimary}>
                            <Typography className={styles.contestTitle}>{contest.title}</Typography>
                            <Box className={styles.contestMetaRow}>
                              <PersonOutlineRoundedIcon className={styles.inlineIcon} />
                              <Typography className={styles.contestMeta}>
                                {contest.owner} | {contest.section}
                              </Typography>
                            </Box>
                          </Box>
                        </td>

                        <td className={styles.bodyCell}>
                          <Typography className={styles.mobileCellLabel}>Status</Typography>
                          <Chip
                            size="small"
                            label={MANAGED_CONTEST_STATUS_LABELS[contest.status]}
                            className={`${styles.statusChip} ${getContestStatusClassName(contest.status)}`}
                          />
                        </td>

                        <td className={styles.bodyCell}>
                          <Typography className={styles.mobileCellLabel}>Schedule</Typography>
                          <Box className={styles.scheduleStack}>
                            <Box className={styles.scheduleLine}>
                              <CalendarTodayOutlinedIcon className={styles.inlineIcon} />
                              <Typography className={styles.scheduleText}>{contest.startAt}</Typography>
                            </Box>
                            <Typography className={styles.scheduleSubtext}>
                              Ends {contest.endAt}
                            </Typography>
                          </Box>
                        </td>

                        <td className={styles.bodyCell}>
                          <Typography className={styles.mobileCellLabel}>Enrolled</Typography>
                          <Typography className={styles.scheduleText}>{contest.enrolledCount}</Typography>
                        </td>

                        <td className={styles.bodyCell}>
                          <Typography className={styles.mobileCellLabel}>Submitted</Typography>
                          <Typography className={styles.scheduleText}>{contest.submittedCount}</Typography>
                        </td>

                        <td className={`${styles.bodyCell} ${styles.actionsCell}`}>
                          <Typography className={styles.mobileCellLabel}>Actions</Typography>
                          <RowActionsMenu
                            triggerAriaLabel={`Open actions for ${contest.title}`}
                            actions={[
                              {
                                id: "edit",
                                label: "Edit Contest",
                                icon: EditOutlinedIcon,
                                disabled:
                                  contest.status === "archived" ||
                                  isContestUpdatePending(contest.id),
                                onClick: () =>
                                  router.push(
                                    `${ROUTES.instructorCreateContest}?contestId=${contest.id}`,
                                  ),
                              },
                              {
                                id: "archive",
                                label: "Archive",
                                icon: ArchiveOutlinedIcon,
                                disabled:
                                  contest.status === "archived" ||
                                  isContestUpdatePending(contest.id),
                                onClick: () => void handleArchiveContest(contest.id),
                              },
                            ] satisfies MenuActionItem[]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Box className={styles.emptyState}>
                  <Typography className={styles.emptyTitle}>
                    {MANAGE_CONTENT_VIEW_CONFIG.contests.emptyTitle}
                  </Typography>
                  <Typography className={styles.emptyDescription}>
                    {MANAGE_CONTENT_VIEW_CONFIG.contests.emptyDescription}
                  </Typography>
                </Box>
              )
            ) : filteredProblems.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    {MANAGE_CONTENT_VIEW_CONFIG.problems.tableHeaders.map((header, index) => (
                      <th
                        key={header}
                        className={`${styles.headerCell} ${
                          index === MANAGE_CONTENT_VIEW_CONFIG.problems.tableHeaders.length - 1
                            ? styles.actionsHeader
                            : ""
                        }`}
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.map((problem) => (
                    <tr key={problem.id} className={styles.tableRow}>
                      <td className={`${styles.bodyCell} ${styles.problemCell}`}>
                        <Typography className={styles.mobileCellLabel}>Problem</Typography>
                        <Box className={styles.problemPrimary}>
                          <Typography className={styles.problemTitle}>{problem.title}</Typography>
                          <Typography className={styles.problemPoints}>
                            {problem.points} pts
                          </Typography>
                        </Box>
                      </td>

                      <td className={styles.bodyCell}>
                        <Typography className={styles.mobileCellLabel}>Status</Typography>
                        <Chip
                          size="small"
                          label={MANAGED_PROBLEM_STATUS_LABELS[problem.status]}
                          className={`${styles.statusChip} ${getProblemStatusClassName(problem.status)}`}
                        />
                      </td>

                      <td className={styles.bodyCell}>
                        <Typography className={styles.mobileCellLabel}>Difficulty</Typography>
                        <Chip
                          size="small"
                          label={problem.difficulty}
                          className={`${styles.statusChip} ${getDifficultyClassName(problem.difficulty)}`}
                        />
                      </td>

                      <td className={styles.bodyCell}>
                        <Typography className={styles.mobileCellLabel}>Tags</Typography>
                        <Box className={styles.tagsRow}>
                          {problem.tags.map((tag) =>
                            tag.startsWith("+") ? (
                              <Typography key={tag} className={styles.extraTagsText}>
                                {tag}
                              </Typography>
                            ) : (
                              <span key={tag} className={styles.tagChip}>
                                {tag}
                              </span>
                            ),
                          )}
                        </Box>
                      </td>

                      <td className={`${styles.bodyCell} ${styles.actionsCell}`}>
                        <Typography className={styles.mobileCellLabel}>Actions</Typography>
                        <RowActionsMenu
                          triggerAriaLabel={`Open actions for ${problem.title}`}
                          actions={[
                            {
                              id: "edit",
                              label: "Edit Problem",
                              icon: EditOutlinedIcon,
                              disabled:
                                problem.status === "archived" ||
                                isProblemUpdatePending(problem.id),
                              onClick: () =>
                                router.push(
                                  `${ROUTES.instructorCreateProblem}?problemId=${problem.id}`,
                                ),
                            },
                            {
                              id: "archive",
                              label: "Archive",
                              icon: ArchiveOutlinedIcon,
                              disabled:
                                problem.status === "archived" ||
                                isProblemUpdatePending(problem.id),
                              onClick: () => void handleArchiveProblem(problem.id),
                            },
                          ] satisfies MenuActionItem[]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <Box className={styles.emptyState}>
                <Typography className={styles.emptyTitle}>
                  {MANAGE_CONTENT_VIEW_CONFIG.problems.emptyTitle}
                </Typography>
                <Typography className={styles.emptyDescription}>
                  {MANAGE_CONTENT_VIEW_CONFIG.problems.emptyDescription}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}
