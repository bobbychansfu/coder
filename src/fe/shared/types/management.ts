export interface ManagementAction<T = string> {
  id: string;
  title: string;
  description: string;
  tone: T;
}

export interface ManagementStat<T = string> {
  id: string;
  label: string;
  value: string;
  caption: string;
  tone: T;
  valueAccent?: "positive" | "neutral";
  captionAccent?: "positive" | "neutral";
}
