import { CodingLanguage } from "@prisma/client";

export const APP_LANGUAGES = ["cplusplus", "java", "typescript", "javascript", "python"] as const;

export type AppLanguage = (typeof APP_LANGUAGES)[number];

const APP_TO_DB_LANGUAGE: Record<AppLanguage, CodingLanguage> = {
  cplusplus: "CPLUSPLUS",
  java: "JAVA",
  typescript: "TYPESCRIPT",
  javascript: "JAVASCRIPT",
  python: "PYTHON",
};

const DB_TO_APP_LANGUAGE: Record<CodingLanguage, AppLanguage> = {
  CPLUSPLUS: "cplusplus",
  JAVA: "java",
  TYPESCRIPT: "typescript",
  JAVASCRIPT: "javascript",
  PYTHON: "python",
};

const DB_TO_LABEL: Record<CodingLanguage, string> = {
  CPLUSPLUS: "C++",
  JAVA: "Java",
  TYPESCRIPT: "TypeScript",
  JAVASCRIPT: "JavaScript",
  PYTHON: "Python",
};

const APP_TO_JUDGE_LANGUAGE: Record<AppLanguage, string> = {
  cplusplus: "C++17",
  java: "Java17",
  typescript: "NodeJS",
  javascript: "NodeJS",
  python: "py3",
};

export function parseAppLanguage(value: string): AppLanguage | null {
  const normalized = value.trim().toLowerCase();
  return APP_LANGUAGES.includes(normalized as AppLanguage)
    ? (normalized as AppLanguage)
    : null;
}

export function appLanguageToCodingLanguage(value: string): CodingLanguage | null {
  const language = parseAppLanguage(value);
  return language ? APP_TO_DB_LANGUAGE[language] : null;
}

export function codingLanguageToAppLanguage(language: CodingLanguage): AppLanguage {
  return DB_TO_APP_LANGUAGE[language];
}

export function codingLanguageToLabel(language: CodingLanguage): string {
  return DB_TO_LABEL[language];
}

export function appLanguageToJudgeLanguage(value: string): string | null {
  const language = parseAppLanguage(value);
  return language ? APP_TO_JUDGE_LANGUAGE[language] : null;
}
