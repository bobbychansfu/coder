"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import RemoveRedEyeOutlinedIcon from "@mui/icons-material/RemoveRedEyeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import ChecklistPanel from "@/fe/instructor/components/ChecklistPanel";
import DraftRecordItem from "@/fe/instructor/components/DraftRecordItem";
import InstructorSubpageHeader from "@/fe/instructor/components/InstructorSubpageHeader";
import SubpageActionButtons, {
  type SubpageActionButtonItem,
} from "@/fe/instructor/components/SubpageActionButtons";
import StatusSummaryCard, {
  type StatusSummaryRow,
} from "@/fe/instructor/components/StatusSummaryCard";
import {
  contestAuthoringCopy,
  contestDrafts,
  contestFormDraft,
  contestProblemsDraft,
  contestRules,
  contestVisibilityOptions,
  type ContestFormDraft,
} from "@/fe/instructor/data/contestAuthoring";
import PageHeader from "@/fe/shared/components/PageHeader";
import { ROUTES } from "@/fe/shared/constants/routes";
import subpageStyles from "@/fe/instructor/styles/InstructorSubpageHeader.module.css";
import styles from "@/fe/instructor/styles/InstructorCreateContestPage.module.css";

const statusChipStyles = {
  backgroundColor: "#fefce8",
  color: "#a65f00",
  border: "1px solid #ffdf20",
};

export default function InstructorCreateContestPage() {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ContestFormDraft>(contestFormDraft);
  const [selectedProblems] = useState(contestProblemsDraft);
  const headerActions: SubpageActionButtonItem[] = [
    {
      id: "save-draft",
      label: contestAuthoringCopy.saveDraftLabel,
      icon: SaveOutlinedIcon,
    },
    {
      id: "preview",
      label: contestAuthoringCopy.previewLabel,
      icon: RemoveRedEyeOutlinedIcon,
    },
  ];
  const statusDuration = useMemo(() => {
    if (!formValues.durationMinutes.trim()) {
      return "-";
    }

    return `${formValues.durationMinutes} min`;
  }, [formValues.durationMinutes]);

  const statusSchedule = useMemo(() => {
    if (!formValues.startDate || !formValues.endDate) {
      return "-";
    }

    const start = formValues.startTime
      ? `${formValues.startDate} ${formValues.startTime}`
      : formValues.startDate;
    const end = formValues.endTime
      ? `${formValues.endDate} ${formValues.endTime}`
      : formValues.endDate;

    return `${start} - ${end}`;
  }, [formValues.endDate, formValues.endTime, formValues.startDate, formValues.startTime]);

  const contestStatusRows: StatusSummaryRow[] = [
    {
      id: "status",
      label: "Status",
      value: (
        <Chip
          size="small"
          label={contestAuthoringCopy.statusNewLabel}
          className={styles.statusChip}
          sx={statusChipStyles}
        />
      ),
    },
    {
      id: "problems",
      label: contestAuthoringCopy.statusProblemsLabel,
      value: <Typography className={styles.statusValue}>{selectedProblems.length}</Typography>,
    },
    {
      id: "duration",
      label: contestAuthoringCopy.statusDurationLabel,
      value: <Typography className={styles.statusValue}>{statusDuration}</Typography>,
    },
    {
      id: "schedule",
      label: contestAuthoringCopy.statusScheduleLabel,
      value: <Typography className={styles.statusValueSmall}>{statusSchedule}</Typography>,
    },
    {
      id: "drafts",
      label: contestAuthoringCopy.statusDraftsLabel,
      value: <Typography className={styles.statusValue}>{contestDrafts.length}</Typography>,
    },
  ];

  const updateField = (field: keyof ContestFormDraft, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box className={styles.page}>
      <PageHeader
        onBack={() => router.push(ROUTES.contests)}
        backLabel={contestAuthoringCopy.backButtonLabel}
        backButtonClassName={subpageStyles.backButton}
      />

      <InstructorSubpageHeader
        title={contestAuthoringCopy.pageTitle}
        subtitle={contestAuthoringCopy.pageSubtitle}
        actions={
          <SubpageActionButtons
            items={headerActions}
            containerClassName={styles.headerActions}
            buttonClassName={styles.secondaryAction}
            iconClassName={styles.actionIcon}
          />
        }
      />

      <Box className={styles.contentGrid}>
        <Box className={styles.leftColumn}>
          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>{contestAuthoringCopy.basicInfoTitle}</Typography>
                <Typography className={styles.sectionDescription}>
                  {contestAuthoringCopy.basicInfoDescription}
                </Typography>
              </Box>

              <Box className={styles.fieldBlock}>
                <Typography className={styles.fieldLabel}>{contestAuthoringCopy.contestNameLabel}</Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={contestAuthoringCopy.contestNamePlaceholder}
                  value={formValues.contestName}
                  onChange={(event) => updateField("contestName", event.target.value)}
                  className={styles.inputField}
                />
              </Box>

              <Box className={styles.fieldBlock}>
                <Typography className={styles.fieldLabel}>{contestAuthoringCopy.descriptionLabel}</Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  placeholder={contestAuthoringCopy.descriptionPlaceholder}
                  value={formValues.description}
                  onChange={(event) => updateField("description", event.target.value)}
                  className={`${styles.inputField} ${styles.textAreaField}`}
                />
              </Box>
            </CardContent>
          </Card>

          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>{contestAuthoringCopy.scheduleTitle}</Typography>
                <Typography className={styles.sectionDescription}>
                  {contestAuthoringCopy.scheduleDescription}
                </Typography>
              </Box>

              <Box className={styles.fieldBlock}>
                <Box className={styles.fieldLabelRow}>
                  <EventOutlinedIcon className={styles.fieldLabelIcon} />
                  <Typography className={styles.fieldLabel}>{contestAuthoringCopy.startLabel}</Typography>
                </Box>
                <Box className={styles.twoColumnGrid}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formValues.startDate}
                    onChange={(event) => updateField("startDate", event.target.value)}
                    className={styles.inputField}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={formValues.startTime}
                    onChange={(event) => updateField("startTime", event.target.value)}
                    className={styles.inputField}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Box className={styles.fieldBlock}>
                <Box className={styles.fieldLabelRow}>
                  <EventOutlinedIcon className={styles.fieldLabelIcon} />
                  <Typography className={styles.fieldLabel}>{contestAuthoringCopy.endLabel}</Typography>
                </Box>
                <Box className={styles.twoColumnGrid}>
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    value={formValues.endDate}
                    onChange={(event) => updateField("endDate", event.target.value)}
                    className={styles.inputField}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="time"
                    value={formValues.endTime}
                    onChange={(event) => updateField("endTime", event.target.value)}
                    className={styles.inputField}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Box className={styles.dividerRow}>
                <Box className={styles.dividerLine} />
                <Typography className={styles.dividerText}>{contestAuthoringCopy.scheduleDividerLabel}</Typography>
                <Box className={styles.dividerLine} />
              </Box>

              <Box className={styles.fieldBlock}>
                <Box className={styles.fieldLabelRow}>
                  <AccessTimeOutlinedIcon className={styles.fieldLabelIcon} />
                  <Typography className={styles.fieldLabel}>{contestAuthoringCopy.durationLabel}</Typography>
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  placeholder={contestAuthoringCopy.durationPlaceholder}
                  value={formValues.durationMinutes}
                  onChange={(event) => updateField("durationMinutes", event.target.value)}
                  className={styles.inputField}
                />
                <Box className={styles.helperRow}>
                  <InfoOutlinedIcon className={styles.helperIcon} />
                  <Typography className={styles.helperText}>{contestAuthoringCopy.scheduleHint}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Box className={styles.sectionHeaderRow}>
                <Box className={styles.sectionHeader}>
                  <Typography className={styles.sectionTitle}>{contestAuthoringCopy.contestProblemsTitle}</Typography>
                  <Typography className={styles.sectionDescription}>
                    {contestAuthoringCopy.contestProblemsDescription}
                  </Typography>
                </Box>
                <Button
                  className={styles.addProblemsButton}
                  variant="outlined"
                  startIcon={<AddRoundedIcon className={styles.actionIcon} />}
                >
                  {contestAuthoringCopy.addProblemsLabel}
                </Button>
              </Box>

              {selectedProblems.length === 0 ? (
                <Box className={styles.emptyState}>
                  <EmojiEventsOutlinedIcon className={styles.emptyStateIcon} />
                  <Typography className={styles.emptyStateTitle}>
                    {contestAuthoringCopy.emptyProblemsTitle}
                  </Typography>
                  <Typography className={styles.emptyStateBody}>
                    {contestAuthoringCopy.emptyProblemsDescription}
                  </Typography>
                </Box>
              ) : null}
            </CardContent>
          </Card>

          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Box className={styles.sectionHeader}>
                <Typography className={styles.sectionTitle}>{contestAuthoringCopy.draftsTitle}</Typography>
                <Typography className={styles.sectionDescription}>
                  {contestAuthoringCopy.draftsDescription}
                </Typography>
              </Box>

              <Box className={styles.draftsList}>
                {contestDrafts.map((draft) => (
                  <DraftRecordItem
                    key={draft.id}
                    title={draft.title}
                    topMeta={
                      <Box className={styles.draftMetaTop}>
                        <Chip size="small" label={draft.status} className={styles.draftStatusChip} />
                        <Typography className={styles.draftDate}>{draft.date}</Typography>
                      </Box>
                    }
                    bottomMeta={
                      <Typography className={styles.draftMetaBottom}>
                        {`${draft.problemsCount} problem(s)`}
                        {"   "}
                        {`${draft.durationMinutes} min`}
                      </Typography>
                    }
                    itemClassName={styles.draftItem}
                    mainClassName={styles.draftMain}
                    titleClassName={styles.draftTitle}
                    actionsClassName={styles.draftActions}
                    iconButtonClassName={styles.draftIconButton}
                    editIconClassName={styles.draftActionIcon}
                    deleteIconClassName={styles.draftActionIconDanger}
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        <Box className={styles.rightColumn}>
          <StatusSummaryCard
            title={contestAuthoringCopy.contestStatusTitle}
            rows={contestStatusRows}
            dividerAfterRowIds={["schedule"]}
            cardClassName={styles.card}
            contentClassName={styles.cardContent}
            titleClassName={styles.sideTitle}
            rowsContainerClassName={styles.statusRows}
            rowClassName={styles.statusRow}
            labelClassName={styles.statusLabel}
            dividerClassName={styles.statusDivider}
          />

          <Card className={styles.card} elevation={0}>
            <CardContent className={styles.cardContent}>
              <Typography className={styles.sideTitle}>{contestAuthoringCopy.visibilityTitle}</Typography>
              <Typography className={styles.sectionDescription}>{contestAuthoringCopy.visibilityDescription}</Typography>

              <Box className={styles.fieldBlock}>
                <Typography className={styles.fieldLabel}>{contestAuthoringCopy.visibilityLabel}</Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={formValues.visibility}
                  onChange={(event) => updateField("visibility", event.target.value)}
                  className={styles.inputField}
                  SelectProps={{ IconComponent: KeyboardArrowDownRoundedIcon }}
                >
                  {contestVisibilityOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
            </CardContent>
          </Card>

          <ChecklistPanel
            title={contestAuthoringCopy.contestRulesTitle}
            items={contestRules.map((rule) => rule.text)}
            cardClassName={styles.card}
            contentClassName={styles.cardContent}
            titleClassName={styles.sideTitle}
            listClassName={styles.rulesList}
            itemClassName={styles.ruleItem}
            iconClassName={styles.ruleCheckIcon}
            textClassName={styles.ruleText}
          />

          <Box className={styles.actionStack}>
            <Button className={styles.publishButton} variant="contained">
              {contestAuthoringCopy.publishLabel}
            </Button>
            <Button className={styles.scheduleButton} variant="outlined">
              {contestAuthoringCopy.scheduleLaterLabel}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
