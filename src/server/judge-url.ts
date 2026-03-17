const DEFAULT_JUDGE_URL = "http://127.0.0.1";

export function getJudgeUrl(): string {
  const configuredUrl = process.env.JUDGE_URL?.trim();
  const baseUrl = configuredUrl && configuredUrl.length > 0 ? configuredUrl : DEFAULT_JUDGE_URL;
  return baseUrl.replace(/\/+$/, "");
}
