import { practiceProblems, PracticeProblem } from "@/fe/practice/data/practiceProblems";

export const getPracticeProblems = async (): Promise<PracticeProblem[]> => {
  // Simulate API delay
  // await new Promise((resolve) => setTimeout(resolve, 500));
  return practiceProblems;
};
