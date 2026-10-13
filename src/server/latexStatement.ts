import katex from "katex";

// Renders the LaTeX subset used by Kattis-style problem statements
// (problem_statement/problem.tex on the judge) to HTML. All text is escaped
// and math goes through KaTeX, so the output is safe to inject. Unknown
// commands render their arguments, so authoring macros degrade to plain text.

type LatexNode =
  | { kind: "text"; value: string }
  | { kind: "math"; tex: string; display: boolean }
  | { kind: "command"; name: string; args: LatexNode[][] }
  | { kind: "group"; children: LatexNode[] }
  | { kind: "environment"; name: string; body: LatexNode[]; raw?: string }
  | { kind: "paragraphBreak" }
  | { kind: "lineBreak" }
  | { kind: "cellBreak" };

type StopAt = { kind: "brace" } | { kind: "environment"; name: string } | null;

const COMMAND_ARITY: Record<string, number> = {
  problemname: 1,
  section: 1,
  subsection: 1,
  subsubsection: 1,
  textbf: 1,
  emph: 1,
  textit: 1,
  texttt: 1,
  underline: 1,
  item: 0,
  hline: 0,
};

const HEADING_TAGS: Record<string, string> = {
  section: "h3",
  subsection: "h4",
  subsubsection: "h5",
};

const INLINE_TAGS: Record<string, string> = {
  textbf: "strong",
  emph: "em",
  textit: "em",
  texttt: "code",
  underline: "u",
};

const TEXT_SYMBOLS: Record<string, string> = {
  ldots: "…",
  dots: "…",
  cdots: "⋯",
  textbackslash: "\\",
  LaTeX: "LaTeX",
  TeX: "TeX",
  quad: " ",
  qquad: "  ",
};

const LIST_TAGS: Record<string, string> = { itemize: "ul", enumerate: "ol" };
const RAW_ENVIRONMENTS = new Set(["verbatim"]);
const MATH_ENVIRONMENTS = new Set([
  "equation",
  "equation*",
  "displaymath",
  "align",
  "align*",
  "gather",
  "gather*",
]);

class LatexParser {
  private pos = 0;

  constructor(private readonly src: string) {}

  parse(): LatexNode[] {
    return this.parseUntil(null);
  }

  private parseUntil(stop: StopAt): LatexNode[] {
    const nodes: LatexNode[] = [];
    let text = "";
    const flush = () => {
      if (text) {
        nodes.push({ kind: "text", value: text });
        text = "";
      }
    };

    while (this.pos < this.src.length) {
      const ch = this.src[this.pos];

      if (ch === "%") {
        // A comment also swallows its newline and the next line's indentation
        const end = this.src.indexOf("\n", this.pos);
        this.pos = end < 0 ? this.src.length : end + 1;
        this.skipSpaces();
      } else if (ch === "}") {
        this.pos += 1;
        if (stop?.kind === "brace") {
          flush();
          return nodes;
        }
      } else if (ch === "{") {
        flush();
        this.pos += 1;
        nodes.push({ kind: "group", children: this.parseUntil({ kind: "brace" }) });
      } else if (ch === "$") {
        flush();
        nodes.push(this.parseDollarMath());
      } else if (ch === "&") {
        flush();
        nodes.push({ kind: "cellBreak" });
        this.pos += 1;
      } else if (ch === "~") {
        text += " ";
        this.pos += 1;
      } else if (ch === "\n") {
        const blankLine = /\n[ \t]*\n\s*/y;
        blankLine.lastIndex = this.pos;
        if (blankLine.test(this.src)) {
          flush();
          nodes.push({ kind: "paragraphBreak" });
          this.pos = blankLine.lastIndex;
        } else {
          text += " ";
          this.pos += 1;
        }
      } else if (ch === "\\") {
        const next = this.src[this.pos + 1] ?? "";
        if (/[A-Za-z]/.test(next)) {
          const name = this.readCommandName();
          if (name === "begin") {
            flush();
            nodes.push(this.parseEnvironment(this.readRawGroup()));
          } else if (name === "end") {
            const environment = this.readRawGroup();
            if (stop?.kind === "environment" && stop.name === environment) {
              flush();
              return nodes;
            }
          } else if (name === "par") {
            flush();
            nodes.push({ kind: "paragraphBreak" });
          } else {
            flush();
            nodes.push(this.parseCommandArgs(name));
          }
        } else {
          this.pos += 2;
          if (next === "\\") {
            flush();
            nodes.push({ kind: "lineBreak" });
            this.skipOptionalArg();
          } else if (next === "[") {
            flush();
            nodes.push({ kind: "math", tex: this.readUntil("\\]"), display: true });
          } else if (next === "(") {
            flush();
            nodes.push({ kind: "math", tex: this.readUntil("\\)"), display: false });
          } else if (next === ",") {
            text += " ";
          } else if (next === " " || next === "\n" || next === ";" || next === ":") {
            text += " ";
          } else if (next !== "!") {
            // \% \$ \& \_ \# \{ \} and other escaped characters
            text += next;
          }
        }
      } else {
        text += ch;
        this.pos += 1;
      }
    }

    flush();
    return nodes;
  }

  private parseDollarMath(): LatexNode {
    if (this.src.startsWith("$$", this.pos)) {
      this.pos += 2;
      return { kind: "math", tex: this.readUntil("$$"), display: true };
    }
    this.pos += 1;
    return { kind: "math", tex: this.readUntil("$"), display: false };
  }

  // Reads raw source up to an unescaped delimiter and consumes the delimiter.
  private readUntil(delimiter: string): string {
    const start = this.pos;
    while (this.pos < this.src.length) {
      if (this.src.startsWith(delimiter, this.pos)) {
        const raw = this.src.slice(start, this.pos);
        this.pos += delimiter.length;
        return raw;
      }
      this.pos += this.src[this.pos] === "\\" ? 2 : 1;
    }
    return this.src.slice(start);
  }

  private readCommandName(): string {
    const match = /\\([A-Za-z]+)\*?/y;
    match.lastIndex = this.pos;
    const result = match.exec(this.src);
    this.pos = match.lastIndex;
    return result?.[1] ?? "";
  }

  private parseCommandArgs(name: string): LatexNode {
    const arity = COMMAND_ARITY[name];
    const args: LatexNode[][] = [];
    // Unknown commands take every brace group that follows them
    while ((arity === undefined || args.length < arity) && this.peekGroup()) {
      this.skipSpaces();
      this.pos += 1;
      args.push(this.parseUntil({ kind: "brace" }));
    }
    if (args.length === 0) {
      this.skipSpaces();
    }
    return { kind: "command", name, args };
  }

  private parseEnvironment(name: string): LatexNode {
    if (RAW_ENVIRONMENTS.has(name) || MATH_ENVIRONMENTS.has(name)) {
      return { kind: "environment", name, body: [], raw: this.readUntil(`\\end{${name}}`) };
    }
    if (name === "tabular") {
      this.skipOptionalArg();
      if (this.peekGroup()) {
        this.readRawGroup();
      }
    }
    return { kind: "environment", name, body: this.parseUntil({ kind: "environment", name }) };
  }

  private peekGroup(): boolean {
    const match = /[ \t]*\{/y;
    match.lastIndex = this.pos;
    return match.test(this.src);
  }

  private readRawGroup(): string {
    this.skipSpaces();
    if (this.src[this.pos] !== "{") {
      return "";
    }
    this.pos += 1;
    const start = this.pos;
    let depth = 1;
    while (this.pos < this.src.length && depth > 0) {
      const ch = this.src[this.pos];
      if (ch === "\\") {
        this.pos += 2;
        continue;
      }
      if (ch === "{") depth += 1;
      if (ch === "}") depth -= 1;
      this.pos += 1;
    }
    return this.src.slice(start, this.pos - 1);
  }

  private skipOptionalArg() {
    const match = /[ \t]*\[[^\]]*\]/y;
    match.lastIndex = this.pos;
    if (match.test(this.src)) {
      this.pos = match.lastIndex;
    }
  }

  private skipSpaces() {
    while (this.src[this.pos] === " " || this.src[this.pos] === "\t") {
      this.pos += 1;
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function renderText(value: string): string {
  return escapeHtml(
    value
      .replace(/---/g, "—")
      .replace(/--/g, "–")
      .replace(/``/g, "“")
      .replace(/''/g, "”")
      .replace(/`/g, "‘")
      .replace(/'/g, "’"),
  );
}

function renderMath(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false });
}

function isBlock(node: LatexNode): boolean {
  if (node.kind === "environment") {
    return !MATH_ENVIRONMENTS.has(node.name);
  }
  return node.kind === "command" && (node.name in HEADING_TAGS || node.name === "problemname");
}

function splitNodes(nodes: LatexNode[], isSeparator: (node: LatexNode) => boolean): LatexNode[][] {
  const parts: LatexNode[][] = [[]];
  for (const node of nodes) {
    if (isSeparator(node)) {
      parts.push([]);
    } else {
      parts[parts.length - 1].push(node);
    }
  }
  return parts;
}

function renderInline(nodes: LatexNode[]): string {
  return nodes
    .map((node) => {
      switch (node.kind) {
        case "text":
          return renderText(node.value);
        case "math":
          return renderMath(node.tex, node.display);
        case "group":
          return renderInline(node.children);
        case "lineBreak":
          return "<br>";
        case "paragraphBreak":
        case "cellBreak":
          return " ";
        case "environment":
          return renderBlock(node);
        case "command": {
          if (isBlock(node)) {
            return renderBlock(node);
          }
          const tag = INLINE_TAGS[node.name];
          if (tag) {
            return `<${tag}>${renderInline(node.args[0] ?? [])}</${tag}>`;
          }
          const symbol = TEXT_SYMBOLS[node.name];
          if (symbol !== undefined) {
            return escapeHtml(symbol);
          }
          return node.args.map(renderInline).join("");
        }
      }
    })
    .join("");
}

function renderBlock(node: LatexNode): string {
  if (node.kind === "command") {
    const tag = HEADING_TAGS[node.name];
    // The page already shows the problem name as its title
    return tag ? `<${tag}>${renderInline(node.args[0] ?? [])}</${tag}>` : "";
  }

  if (node.kind !== "environment") {
    return renderInline([node]);
  }

  if (node.raw !== undefined) {
    if (!MATH_ENVIRONMENTS.has(node.name)) {
      return `<pre>${escapeHtml(node.raw.replace(/^\n/, ""))}</pre>`;
    }
    const plainDisplay = ["equation", "equation*", "displaymath"].includes(node.name);
    return renderMath(plainDisplay ? node.raw : `\\begin{${node.name}}${node.raw}\\end{${node.name}}`, true);
  }

  const listTag = LIST_TAGS[node.name];
  if (listTag) {
    const items = splitNodes(
      node.body,
      (child) => child.kind === "command" && child.name === "item",
    ).slice(1);
    return `<${listTag}>${items.map((item) => `<li>${renderBlocks(item)}</li>`).join("")}</${listTag}>`;
  }

  if (node.name === "tabular") {
    const rows = splitNodes(node.body, (child) => child.kind === "lineBreak")
      .map((row) =>
        splitNodes(
          row.filter((child) => !(child.kind === "command" && child.name === "hline")),
          (child) => child.kind === "cellBreak",
        ).map((cell) => renderInline(cell).trim()),
      )
      .filter((cells) => cells.some((cell) => cell.length > 0));
    const body = rows
      .map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
      .join("");
    return `<div class="statement-table"><table><tbody>${body}</tbody></table></div>`;
  }

  if (node.name === "center") {
    return `<div class="statement-center">${renderBlocks(node.body)}</div>`;
  }

  return renderBlocks(node.body);
}

function renderBlocks(nodes: LatexNode[]): string {
  const html: string[] = [];
  let paragraph: LatexNode[] = [];
  const flushParagraph = () => {
    const content = renderInline(paragraph).trim();
    if (content) {
      html.push(`<p>${content}</p>`);
    }
    paragraph = [];
  };

  for (const node of nodes) {
    if (node.kind === "paragraphBreak") {
      flushParagraph();
    } else if (isBlock(node)) {
      flushParagraph();
      html.push(renderBlock(node));
    } else {
      paragraph.push(node);
    }
  }
  flushParagraph();

  return html.join("");
}

function plainText(nodes: LatexNode[]): string {
  return nodes
    .map((node) => {
      if (node.kind === "text") return node.value;
      if (node.kind === "group") return plainText(node.children);
      if (node.kind === "command") return node.args.map(plainText).join("");
      return "";
    })
    .join("");
}

// Sample explanations and notes, which the page shows after the samples as on Codeforces
const NOTES_HEADING = /^(explanation|notes?)\b/i;

export function renderLatexStatement(source: string): { statement: string; notes: string } {
  const nodes = new LatexParser(source).parse();
  const notesStart = nodes.findIndex(
    (node) =>
      node.kind === "command" &&
      node.name in HEADING_TAGS &&
      NOTES_HEADING.test(plainText(node.args[0] ?? []).trim()),
  );

  if (notesStart < 0) {
    return { statement: renderBlocks(nodes), notes: "" };
  }
  return {
    statement: renderBlocks(nodes.slice(0, notesStart)),
    notes: renderBlocks(nodes.slice(notesStart)),
  };
}
