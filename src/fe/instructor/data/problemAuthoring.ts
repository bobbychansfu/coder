import { LANGUAGE_OPTIONS } from "@/fe/shared/constants/options";

export interface ProblemAuthoringCopy {
  backButtonLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  saveDraftLabel: string;
  importCsvLabel: string;
  previewLabel: string;
  publishLabel: string;
  publishHint: string;
  problemStatusTitle: string;
  myDraftsTitle: string;
  myDraftsDescription: string;
  statusNewLabel: string;
  examplesCountLabel: string;
  testCasesCountLabel: string;
  testCasesNoneSuffix: string;
  supportedLanguagesLabel: string;
  statementMarkdownHint: string;
  examplesInfoBanner: string;
  nextStatementLabel: string;
  nextExamplesLabel: string;
  nextStarterCodeLabel: string;
  backMetadataLabel: string;
  backStatementLabel: string;
  backExamplesLabel: string;
  starterCodeTitle: string;
  starterCodeDescription: string;
  baseLanguageLabel: string;
  baseLanguageHint: string;
  generateOtherLanguagesLabel: string;
  starterCodeChecklist: string[];
  previewModalTitle: string;
  previewModalSubtitle: string;
  previewStatementTitle: string;
  previewInputTitle: string;
  previewOutputTitle: string;
  previewConstraintsTitle: string;
  previewExamplesTitle: string;
  importCsvTitle: string;
  importCsvSubtitle: string;
  importCsvFormatTitle: string;
  importCsvColumnsExample: string;
  importCsvRequiredColumnsLabel: string;
  importCsvRequiredColumnsValue: string;
  importCsvTagsFormatLabel: string;
  importCsvTagsFormatValue: string;
  importCsvComplexityLabel: string;
  importCsvComplexityValue: string;
  importCsvChooseFileLabel: string;
  importCsvDropLabel: string;
  importCsvTemplatePrompt: string;
  importCsvTemplateLabel: string;
}

export interface ProblemAuthoringTab {
  value: "metadata" | "statement" | "examples" | "starter-code";
  label: string;
}

export interface ProblemMetadataDraft {
  title: string;
  difficulty: string;
  points: string;
  tags: string[];
  visibility: string;
}

export interface ProblemStatementDraft {
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
}

export interface ProblemExampleDraft {
  id: string;
  input: string;
  output: string;
  explanation: string;
}

export interface ProblemDraftRecord {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  date: string;
  examplesCount: number;
  testCasesCount: number;
}

export type StarterLanguage = (typeof LANGUAGE_OPTIONS)[number]["value"];

export const problemAuthoringCopy: ProblemAuthoringCopy = {
  backButtonLabel: "Back",
  pageTitle: "Create Problem",
  pageSubtitle: "Author a new competitive programming problem",
  saveDraftLabel: "Save Draft",
  importCsvLabel: "Import CSV",
  previewLabel: "Preview",
  publishLabel: "Publish Problem",
  publishHint: "Add starter code to all 5 languages to publish",
  problemStatusTitle: "Problem Status",
  myDraftsTitle: "My Drafts",
  myDraftsDescription: "Previously saved draft problems",
  statusNewLabel: "New",
  examplesCountLabel: "Examples",
  testCasesCountLabel: "Test Cases",
  testCasesNoneSuffix: "(none)",
  supportedLanguagesLabel: "Supported Languages",
  statementMarkdownHint: "Supports Markdown formatting",
  examplesInfoBanner:
    "Provide one example to help students understand the problem. The current authoring flow supports a single persisted example with input, expected output, and an optional explanation.",
  nextStatementLabel: "Next: Statement",
  nextExamplesLabel: "Next: Examples",
  nextStarterCodeLabel: "Next: Starter Code",
  backMetadataLabel: "Back: Metadata",
  backStatementLabel: "Back: Statement",
  backExamplesLabel: "Back: Examples",
  starterCodeTitle: "Starter Code",
  starterCodeDescription:
    "Provide starter code for the supported languages. You can write one base version and generate the others with AI.",
  baseLanguageLabel: "Base Language",
  baseLanguageHint:
    "Write your starter code in this language, then generate the rest.",
  generateOtherLanguagesLabel: "Generate Other Languages",
  starterCodeChecklist: [
    "One starter code per language",
    "Use function-style templates",
    "AI-generated code should be reviewed before publishing",
  ],
  previewModalTitle: "Problem Preview",
  previewModalSubtitle: "This is how students will see the problem",
  previewStatementTitle: "Problem Statement",
  previewInputTitle: "Input Format",
  previewOutputTitle: "Output Format",
  previewConstraintsTitle: "Constraints",
  previewExamplesTitle: "Examples",
  importCsvTitle: "Import Problem from CSV",
  importCsvSubtitle: "Upload a CSV file to quickly populate problem details",
  importCsvFormatTitle: "Expected CSV Format:",
  importCsvColumnsExample:
    "title,difficulty,points,tags,statement,inputFormat,outputFormat,constraints,visibility",
  importCsvRequiredColumnsLabel: "Required columns:",
  importCsvRequiredColumnsValue: "title, difficulty, points",
  importCsvTagsFormatLabel: "Tags format:",
  importCsvTagsFormatValue: "Separate multiple tags with | (pipe symbol)",
  importCsvComplexityLabel: "Difficulty values:",
  importCsvComplexityValue: "easy, medium, hard",
  importCsvChooseFileLabel: "Choose CSV File",
  importCsvDropLabel: "or drag and drop your CSV file here",
  importCsvTemplatePrompt: "Need a template?",
  importCsvTemplateLabel: "Download Example CSV Template",
};

export const problemAuthoringTabs: ProblemAuthoringTab[] = [
  { value: "metadata", label: "Metadata" },
  { value: "statement", label: "Statement" },
  { value: "examples", label: "Examples" },
  { value: "starter-code", label: "Starter Code" },
];

export const problemMetadataDraft: ProblemMetadataDraft = {
  title: "",
  difficulty: "medium",
  points: "100",
  tags: [],
  visibility: "course-only",
};

export const problemStatementDraft: ProblemStatementDraft = {
  statement: "",
  inputFormat: "",
  outputFormat: "",
  constraints: "",
};

export const problemExamplesDraft: ProblemExampleDraft[] = [
  {
    id: "example-1",
    input: "",
    output: "",
    explanation: "",
  },
];

export const starterCodeDraft: Record<StarterLanguage, string> = {
  cplusplus: "",
  java: "",
  python: "",
  typescript:
    "// TypeScript starter code\nfunction solve(nums: number[]): number[] {\n  // Your code here\n  return [];\n}",
  javascript: "",
};

export const savedProblemDrafts: ProblemDraftRecord[] = [
  {
    id: "draft-binary-search",
    title: "Binary Search Implementation",
    difficulty: "medium",
    date: "2/19/2026",
    examplesCount: 2,
    testCasesCount: 5,
  },
  {
    id: "draft-linked-list",
    title: "Linked List Reversal",
    difficulty: "easy",
    date: "2/18/2026",
    examplesCount: 1,
    testCasesCount: 0,
  },
];
