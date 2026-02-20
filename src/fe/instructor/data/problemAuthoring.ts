export interface ProblemAuthoringCopy {
  backButtonLabel: string;
  pageTitle: string;
  pageSubtitle: string;
  saveDraftLabel: string;
  importCsvLabel: string;
  previewLabel: string;
  publishLabel: string;
  addTestCasesLabel: string;
  problemStatusTitle: string;
  assignTitle: string;
  assignDescription: string;
  assignmentTypeLabel: string;
  assignmentTypePlaceholder: string;
  guidelinesTitle: string;
  statementMarkdownHint: string;
  examplesInfoBanner: string;
  addAnotherExampleLabel: string;
  nextStatementLabel: string;
  nextExamplesLabel: string;
  nextTestCasesLabel: string;
  backMetadataLabel: string;
  backStatementLabel: string;
  backExamplesLabel: string;
  optionalTestCasesTitle: string;
  optionalTestCasesDescription: string;
  testCasesEmptyTitle: string;
  testCasesEmptyDescription: string;
  addFirstTestCaseLabel: string;
  addAnotherTestCaseLabel: string;
  testCaseDescriptionLabel: string;
  testCaseInputLabel: string;
  testCaseExpectedOutputLabel: string;
  testCaseOptionalBadge: string;
  myDraftsTitle: string;
  myDraftsDescription: string;
  statusNewLabel: string;
  examplesCountLabel: string;
  testCasesCountLabel: string;
  testCasesNoneSuffix: string;
  previewModalTitle: string;
  previewModalSubtitle: string;
  previewStatementTitle: string;
  previewInputTitle: string;
  previewOutputTitle: string;
  previewConstraintsTitle: string;
  previewExamplesTitle: string;
  previewExplanationPrefix: string;
}

export interface ProblemAuthoringTab {
  value: "metadata" | "statement" | "examples" | "test-cases";
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ProblemMetadataDraft {
  title: string;
  difficulty: string;
  points: string;
  timeComplexity: string;
  spaceComplexity: string;
  tags: string;
  visibility: string;
}

export interface ProblemGuideline {
  id: string;
  text: string;
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

export interface ProblemTestCaseDraft {
  id: string;
  description: string;
  input: string;
  expectedOutput: string;
}

export interface ProblemDraftRecord {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  date: string;
  examplesCount: number;
  testCasesCount: number;
}

export const problemAuthoringCopy: ProblemAuthoringCopy = {
  backButtonLabel: "Back",
  pageTitle: "Create Problem",
  pageSubtitle: "Author a new competitive programming problem",
  saveDraftLabel: "Save Draft",
  importCsvLabel: "Import CSV",
  previewLabel: "Preview",
  publishLabel: "Publish Problem",
  addTestCasesLabel: "Add Test Cases",
  problemStatusTitle: "Problem Status",
  assignTitle: "Assign to Contest",
  assignDescription: "Add this problem to a contest or practice set",
  assignmentTypeLabel: "Assignment Type",
  assignmentTypePlaceholder: "Select type",
  guidelinesTitle: "Authoring Guidelines",
  statementMarkdownHint: "Supports Markdown formatting",
  examplesInfoBanner:
    "Provide at least one example to help students understand the problem. Each example should have an input, expected output, and optionally an explanation.",
  addAnotherExampleLabel: "Add Another Example",
  nextStatementLabel: "Next: Statement",
  nextExamplesLabel: "Next: Examples",
  nextTestCasesLabel: "Next: Test Cases",
  backMetadataLabel: "Back: Metadata",
  backStatementLabel: "Back: Statement",
  backExamplesLabel: "Back: Examples",
  optionalTestCasesTitle: "Optional: Test Cases",
  optionalTestCasesDescription:
    "Add input/output test cases for automated judging. These are hidden from students and used to verify submissions. You can always add test cases later.",
  testCasesEmptyTitle: "No test cases yet",
  testCasesEmptyDescription:
    "Test cases are used for automated judging of student submissions",
  addFirstTestCaseLabel: "Add First Test Case",
  addAnotherTestCaseLabel: "Add Another Test Case",
  testCaseDescriptionLabel: "Description (Optional)",
  testCaseInputLabel: "Input *",
  testCaseExpectedOutputLabel: "Expected Output *",
  testCaseOptionalBadge: "Optional",
  myDraftsTitle: "My Drafts",
  myDraftsDescription: "Previously saved draft problems",
  statusNewLabel: "New",
  examplesCountLabel: "Examples",
  testCasesCountLabel: "Test Cases",
  testCasesNoneSuffix: "(none)",
  previewModalTitle: "Problem Preview",
  previewModalSubtitle: "This is how students will see the problem",
  previewStatementTitle: "Problem Statement",
  previewInputTitle: "Input Format",
  previewOutputTitle: "Output Format",
  previewConstraintsTitle: "Constraints",
  previewExamplesTitle: "Examples",
  previewExplanationPrefix: "Explanation:",
};

export const problemAuthoringTabs: ProblemAuthoringTab[] = [
  { value: "metadata", label: "Metadata" },
  { value: "statement", label: "Statement" },
  { value: "examples", label: "Examples" },
  { value: "test-cases", label: "Test Cases" },
];

export const difficultyOptions: SelectOption[] = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

export const visibilityOptions: SelectOption[] = [
  { value: "course-only", label: "course-only" },
  { value: "public", label: "public" },
  { value: "private", label: "private" },
];

export const assignmentTypeOptions: SelectOption[] = [
  { value: "lab-contest", label: "Lab Contest" },
  { value: "homework", label: "Homework" },
  { value: "practice-set", label: "Practice Set" },
];

export const problemMetadataDraft: ProblemMetadataDraft = {
  title: "",
  difficulty: "medium",
  points: "100",
  timeComplexity: "",
  spaceComplexity: "",
  tags: "",
  visibility: "",
};

export const authoringGuidelines: ProblemGuideline[] = [
  { id: "clear", text: "Write clear, unambiguous problem statements" },
  { id: "examples", text: "Include at least 2-3 examples with explanations" },
  { id: "constraints", text: "Specify all constraints clearly" },
  { id: "edge-cases", text: "Test with multiple edge cases" },
];

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

export const problemTestCasesDraft: ProblemTestCaseDraft[] = [];

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
