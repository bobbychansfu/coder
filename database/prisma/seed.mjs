import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const user = process.env.POSTGRES_USER ?? "postgres";
  const password = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB ?? "judge";
  const port = process.env.DB_PORT ?? "5432";

  if (!password) {
    throw new Error("Missing POSTGRES_PASSWORD. Set it in .env or set DATABASE_URL explicitly.");
  }

  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@localhost:${port}/${db}?schema=public`;
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function pick(values, index) {
  return values[index % values.length];
}

function computeSubmissionStatus(attemptIndex, participantIndex, problemIndex) {
  if (attemptIndex > 0) {
    return "ACCEPTED";
  }

  const statusPool = [
    "WRONG_ANSWER",
    "TIME_LIMIT_EXCEEDED",
    "RUNTIME_ERROR",
    "COMPILE_ERROR",
    "ACCEPTED",
  ];

  return pick(statusPool, participantIndex + problemIndex);
}

function scoreForStatus(status) {
  const scoreMap = {
    ACCEPTED: 100,
    WRONG_ANSWER: 35,
    TIME_LIMIT_EXCEEDED: 45,
    RUNTIME_ERROR: 20,
    COMPILE_ERROR: 0,
    PENDING: 0,
  };

  return scoreMap[status] ?? 0;
}

function toCodingLanguage(language) {
  const normalized = String(language).trim().toLowerCase();

  switch (normalized) {
    case "cpp":
    case "cplusplus":
    case "c++":
    case "c++17":
      return "CPLUSPLUS";
    case "java":
      return "JAVA";
    case "typescript":
      return "TYPESCRIPT";
    case "javascript":
      return "JAVASCRIPT";
    case "python":
    case "python3":
      return "PYTHON";
    case "c":
      return "CPLUSPLUS";
    default:
      return "PYTHON";
  }
}

function toFunctionName(problemCode) {
  return problemCode
    .split("-")
    .map((segment, index) =>
      index === 0 ? segment : `${segment[0].toUpperCase()}${segment.slice(1)}`,
    )
    .join("");
}

function buildStarterCodes(problemCode, title) {
  const functionName = toFunctionName(problemCode);
  const prompt = `Implement ${title}.`;

  return [
    {
      language: "CPLUSPLUS",
      code: [
        "#include <bits/stdc++.h>",
        "using namespace std;",
        "",
        `string ${functionName}(const string& input) {`,
        `  // ${prompt}`,
        '  return "";',
        "}",
        "",
        "int main() {",
        "  ios::sync_with_stdio(false);",
        "  cin.tie(nullptr);",
        "",
        "  string input;",
        "  string line;",
        "  bool first = true;",
        "  while (getline(cin, line)) {",
        "    if (!first) input += '\\n';",
        "    input += line;",
        "    first = false;",
        "  }",
        `  cout << ${functionName}(input);`,
        "  return 0;",
        "}",
      ].join("\n"),
      isAiGenerated: false,
      generatedFrom: null,
    },
    {
      language: "JAVA",
      code: [
        "import java.io.BufferedReader;",
        "import java.io.IOException;",
        "import java.io.InputStreamReader;",
        "",
        "public class Main {",
        `  private static String ${functionName}(String input) {`,
        `    // ${prompt}`,
        '    return "";',
        "  }",
        "",
        "  public static void main(String[] args) throws Exception {",
        "    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));",
        "    StringBuilder input = new StringBuilder();",
        "    String line;",
        "    while ((line = reader.readLine()) != null) {",
        "      if (input.length() > 0) input.append('\\n');",
        "      input.append(line);",
        "    }",
        `    System.out.print(${functionName}(input.toString()));`,
        "  }",
        "}",
      ].join("\n"),
      isAiGenerated: true,
      generatedFrom: "CPLUSPLUS",
    },
    {
      language: "TYPESCRIPT",
      code: [
        `function ${functionName}(input: string): string {`,
        `  // ${prompt}`,
        '  return "";',
        "}",
        "",
        "import * as fs from 'fs';",
        "",
        "const input = fs.readFileSync(0, 'utf8').trimEnd();",
        `process.stdout.write(${functionName}(input));`,
      ].join("\n"),
      isAiGenerated: true,
      generatedFrom: "CPLUSPLUS",
    },
    {
      language: "JAVASCRIPT",
      code: [
        `function ${functionName}(input) {`,
        `  // ${prompt}`,
        '  return "";',
        "}",
        "",
        "const fs = require('fs');",
        "const input = fs.readFileSync(0, 'utf8').trimEnd();",
        `process.stdout.write(${functionName}(input));`,
      ].join("\n"),
      isAiGenerated: true,
      generatedFrom: "CPLUSPLUS",
    },
    {
      language: "PYTHON",
      code: [
        `def ${functionName}(raw_input: str) -> str:`,
        `    # ${prompt}`,
        '    return ""',
        "",
        'if __name__ == "__main__":',
        "    import sys",
        "    print(",
        `        ${functionName}(sys.stdin.read().rstrip("\\n")),`,
        '        end="",',
        "    )",
      ].join("\n"),
      isAiGenerated: true,
      generatedFrom: "CPLUSPLUS",
    },
  ];
}

async function main() {
  await prisma.contestProblemSession.deleteMany();
  await prisma.contestExperimentGroup.deleteMany();
  await prisma.problemStarterCode.deleteMany();
  await prisma.practiceRunRecord.deleteMany();
  await prisma.practiceSession.deleteMany();
  await prisma.problemStatus.deleteMany();
  await prisma.hint.deleteMany();
  await prisma.participation.deleteMany();
  await prisma.topic.deleteMany();
  await prisma.userActivity.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.contestProblem.deleteMany();
  await prisma.contest.deleteMany();
  await prisma.problem.deleteMany();
  await prisma.user.deleteMany();

  const baseUsers = [
    {
      computingId: "admin",
      email: "admin@sfu.ca",
      firstName: "System",
      lastName: "Admin",
      role: "ADMIN",
    },
    {
      computingId: "sjohnson",
      email: "sarah.johnson@sfu.ca",
      firstName: "Sarah",
      lastName: "Johnson",
      role: "INSTRUCTOR",
    },
    {
      computingId: "mchen",
      email: "michael.chen@sfu.ca",
      firstName: "Michael",
      lastName: "Chen",
      role: "INSTRUCTOR",
    },
    {
      computingId: "ewong",
      email: "emily.wong@sfu.ca",
      firstName: "Emily",
      lastName: "Wong",
      role: "INSTRUCTOR",
    },
    {
      computingId: "dpatel",
      email: "dev.patel@sfu.ca",
      firstName: "Dev",
      lastName: "Patel",
      role: "TA",
    },
  ];

  const studentFirstNames = [
    "Amy",
    "Ben",
    "Cora",
    "Dylan",
    "Eva",
    "Felix",
    "Grace",
    "Henry",
    "Iris",
    "Jason",
    "Kay",
    "Liam",
    "Maya",
    "Noah",
    "Olive",
    "Parker",
    "Quinn",
    "Ryan",
    "Sophia",
    "Theo",
    "Uma",
    "Vince",
    "Wendy",
    "Xavier",
  ];

  const studentRecords = studentFirstNames.map((firstName, index) => {
    const suffix = String(index + 1).padStart(2, "0");
    return {
      computingId: `student${suffix}`,
      email: `${firstName.toLowerCase()}.${suffix}@sfu.ca`,
      firstName,
      lastName: "Student",
      role: "STUDENT",
    };
  });

  await prisma.user.createMany({
    data: [...baseUsers, ...studentRecords],
  });

  const users = await prisma.user.findMany();
  const userByComputingId = new Map(users.map((user) => [user.computingId, user]));

  const problemDetails = {
    "two-sum": {
      inputFormat: "First line: integer n (size of array). Second line: n space-separated integers. Third line: integer target.",
      outputFormat: "Two space-separated 0-based indices i and j (i < j) such that nums[i] + nums[j] == target.",
      constraints: "2 <= n <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9\nExactly one valid answer exists.",
      exampleInput: "4\n2 7 11 15\n9",
      exampleOutput: "0 1",
      exampleExplanation: "nums[0] + nums[1] = 2 + 7 = 9 == target.",
    },
    "valid-palindrome": {
      inputFormat: "A single string s consisting of printable ASCII characters.",
      outputFormat: "Print true if s is a palindrome after keeping only alphanumeric characters and lowercasing; otherwise print false.",
      constraints: "1 <= s.length <= 2 * 10^5\ns consists of printable ASCII characters.",
      exampleInput: "A man, a plan, a canal: Panama",
      exampleOutput: "true",
      exampleExplanation: "After filtering and lowercasing: \"amanaplanacanalpanama\", which reads the same forwards and backwards.",
    },
    "binary-tree-traversal": {
      inputFormat: "Level-order representation of the binary tree as space-separated integers, with -1 representing null nodes.",
      outputFormat: "Three lines: preorder, inorder, and postorder traversals, each as space-separated integers.",
      constraints: "0 <= number of nodes <= 100\n-100 <= node value <= 100",
      exampleInput: "1 2 3 4 5 -1 -1",
      exampleOutput: "1 2 4 5 3\n4 2 5 1 3\n4 5 2 3 1",
      exampleExplanation: "Tree has root 1, left child 2 (with children 4 and 5), and right child 3.",
    },
    "graphs-shortest-path": {
      inputFormat: "First line: n (nodes) and m (edges). Next m lines: u v w (edge from u to v with weight w). Last line: source node s.",
      outputFormat: "n space-separated integers: shortest distance from s to each node 0..n-1. Print -1 if unreachable.",
      constraints: "1 <= n <= 10^4\n0 <= m <= 5 * 10^4\n1 <= w <= 10^4\nNodes are 0-indexed.",
      exampleInput: "4 4\n0 1 1\n0 2 4\n1 2 2\n2 3 1\n0",
      exampleOutput: "0 1 3 4",
      exampleExplanation: "From source 0: to 1 costs 1, to 2 costs 1+2=3, to 3 costs 3+1=4.",
    },
    "dynamic-programming-fundamentals": {
      inputFormat: "First line: integer n. Second line: n space-separated positive integers representing weights.",
      outputFormat: "Maximum sum of a non-adjacent subsequence.",
      constraints: "1 <= n <= 10^5\n1 <= weights[i] <= 10^4",
      exampleInput: "5\n3 2 7 10 12",
      exampleOutput: "22",
      exampleExplanation: "Picking elements at indices 0, 2, 4: 3 + 7 + 12 = 22.",
    },
    "merge-k-sorted-lists": {
      inputFormat: "First line: k (number of lists). Next k lines: each starts with n_i (length) followed by n_i sorted integers.",
      outputFormat: "All integers from all lists merged and sorted in ascending order on a single line.",
      constraints: "0 <= k <= 10^4\n0 <= n_i <= 500\n-10^4 <= node value <= 10^4\nTotal nodes across all lists <= 10^4.",
      exampleInput: "3\n3 1 4 5\n3 1 3 4\n2 2 6",
      exampleOutput: "1 1 2 3 4 4 5 6",
      exampleExplanation: "Merging [1,4,5], [1,3,4], [2,6] into one sorted list.",
    },
    "segment-tree-range-query": {
      inputFormat: "First line: n and q. Second line: n integers (initial array). Next q lines: op l r [val] where op=1 means range-sum query [l,r], op=2 means point update at index l to val.",
      outputFormat: "For each query of type 1, print the sum on a new line.",
      constraints: "1 <= n, q <= 10^5\n-10^9 <= array[i] <= 10^9\nIndices are 1-based.",
      exampleInput: "5 3\n1 3 5 7 9\n1 1 3\n2 3 6\n1 1 3",
      exampleOutput: "9\n10",
      exampleExplanation: "Initial sum [1,3] = 1+3+5=9. After updating index 3 to 6, sum [1,3] = 1+3+6=10.",
    },
    "strings-kmp": {
      inputFormat: "First line: text string T. Second line: pattern string P.",
      outputFormat: "All 0-based starting indices where P occurs in T, space-separated. Print -1 if no match.",
      constraints: "1 <= |T| <= 10^6\n1 <= |P| <= 10^4\nStrings contain only lowercase English letters.",
      exampleInput: "aabxaabaab\naab",
      exampleOutput: "0 5 7",
      exampleExplanation: "Pattern \"aab\" starts at positions 0, 5, and 7 in the text.",
    },
    "longest-increasing-subsequence": {
      inputFormat: "First line: integer n. Second line: n space-separated integers.",
      outputFormat: "Length of the longest strictly increasing subsequence.",
      constraints: "1 <= n <= 2500\n-10^4 <= nums[i] <= 10^4",
      exampleInput: "8\n10 9 2 5 3 7 101 18",
      exampleOutput: "4",
      exampleExplanation: "One LIS is [2, 3, 7, 101] with length 4.",
    },
    "reverse-linked-list": {
      inputFormat: "First line: n (number of nodes). Second line: n space-separated integers (node values).",
      outputFormat: "Node values of the reversed list, space-separated.",
      constraints: "0 <= n <= 5000\n-5000 <= node value <= 5000",
      exampleInput: "5\n1 2 3 4 5",
      exampleOutput: "5 4 3 2 1",
      exampleExplanation: "Reversing [1→2→3→4→5] gives [5→4→3→2→1].",
    },
    "maximum-subarray-sum": {
      inputFormat: "First line: integer n. Second line: n space-separated integers (may be negative).",
      outputFormat: "The maximum subarray sum.",
      constraints: "1 <= n <= 10^5\n-10^4 <= nums[i] <= 10^4",
      exampleInput: "9\n-2 1 -3 4 -1 2 1 -5 4",
      exampleOutput: "6",
      exampleExplanation: "Subarray [4, -1, 2, 1] has the largest sum = 6.",
    },
    "word-ladder": {
      inputFormat: "First line: beginWord. Second line: endWord. Third line: n. Next n lines: word list entries.",
      outputFormat: "Length of the shortest transformation sequence, or 0 if none exists.",
      constraints: "1 <= word length <= 5\n1 <= word list size <= 500\nAll words consist of lowercase English letters.",
      exampleInput: "hit\ncog\n6\nhot\ndot\ndog\nlot\nlog\ncog",
      exampleOutput: "5",
      exampleExplanation: "hit → hot → dot → dog → cog is 5 steps.",
    },
    "valid-parentheses": {
      inputFormat: "A single string containing only '(', ')', '{', '}', '[', and ']'.",
      outputFormat: "Print true if the brackets are valid; otherwise false.",
      constraints: "1 <= s.length <= 10^4",
      exampleInput: "()[]{} ",
      exampleOutput: "true",
      exampleExplanation: "Each bracket is properly opened and closed.",
    },
    "course-schedule": {
      inputFormat: "First line: n (courses 0..n-1) and m (prerequisites). Next m lines: a b meaning course a requires course b.",
      outputFormat: "Print true if all courses can be finished; false if there is a cycle.",
      constraints: "1 <= n <= 2000\n0 <= m <= 5000\nNo duplicate prerequisites.",
      exampleInput: "4 4\n1 0\n2 0\n3 1\n3 2",
      exampleOutput: "true",
      exampleExplanation: "Topological order 0→1→2→3 (or 0→2→1→3) is valid; no cycle exists.",
    },
    "serialize-binary-tree": {
      inputFormat: "Level-order representation of the binary tree as space-separated integers, with 'null' for missing nodes.",
      outputFormat: "Serialize the tree to a string, then deserialize it back. Print the level-order of the reconstructed tree.",
      constraints: "0 <= number of nodes <= 10^4\n-1000 <= node value <= 1000",
      exampleInput: "1 2 3 null null 4 5",
      exampleOutput: "1 2 3 null null 4 5",
      exampleExplanation: "After serialize then deserialize the tree is identical to the input.",
    },
    "climbing-stairs": {
      inputFormat: "A single integer n.",
      outputFormat: "Number of distinct ways to reach the top.",
      constraints: "1 <= n <= 45",
      exampleInput: "5",
      exampleOutput: "8",
      exampleExplanation: "Ways include (1+1+1+1+1), (1+1+1+2), (1+1+2+1), (1+2+1+1), (2+1+1+1), (1+2+2), (2+1+2), (2+2+1).",
    },
    "house-robber": {
      inputFormat: "First line: n. Second line: n non-negative integers.",
      outputFormat: "Maximum amount that can be robbed.",
      constraints: "1 <= n <= 100\n0 <= nums[i] <= 400",
      exampleInput: "5\n2 7 9 3 1",
      exampleOutput: "12",
      exampleExplanation: "Rob houses at indices 0, 2, 4: 2 + 9 + 1 = 12.",
    },
    "n-queens-problem": {
      inputFormat: "A single integer n.",
      outputFormat: "All distinct solutions. Each solution is printed as n lines of length n using '.' and 'Q', with a blank line between solutions.",
      constraints: "1 <= n <= 9",
      exampleInput: "4",
      exampleOutput: ".Q..\n...Q\nQ...\n..Q.\n\n..Q.\nQ...\n...Q\n.Q..",
      exampleExplanation: "There are exactly 2 distinct solutions for n=4.",
    },
    "missing-number": {
      inputFormat: "First line: n. Second line: n space-separated distinct integers from the range [0, n].",
      outputFormat: "The single missing integer.",
      constraints: "1 <= n <= 10^4\n0 <= nums[i] <= n\nAll numbers are distinct.",
      exampleInput: "4\n3 0 1 4",
      exampleOutput: "2",
      exampleExplanation: "The complete range is [0,1,2,3,4]. The number 2 is missing.",
    },
    "coin-change": {
      inputFormat: "First line: m (number of coin denominations). Second line: m space-separated denominations. Third line: amount.",
      outputFormat: "Minimum number of coins needed to make amount, or -1 if impossible.",
      constraints: "1 <= m <= 12\n1 <= coins[i] <= 2^31 - 1\n0 <= amount <= 10^4",
      exampleInput: "3\n1 5 6\n11",
      exampleOutput: "2",
      exampleExplanation: "11 = 5 + 6, using 2 coins.",
    },
    "trapping-rain-water": {
      inputFormat: "First line: n. Second line: n non-negative integers representing heights.",
      outputFormat: "Total units of water trapped.",
      constraints: "1 <= n <= 2 * 10^4\n0 <= heights[i] <= 10^5",
      exampleInput: "12\n0 1 0 2 1 0 1 3 2 1 2 1",
      exampleOutput: "6",
      exampleExplanation: "6 units of water are trapped between the bars.",
    },
    "best-time-to-buy-stock": {
      inputFormat: "First line: n. Second line: n space-separated integers (prices on each day).",
      outputFormat: "Maximum profit from one buy-sell transaction. Print 0 if no profit is possible.",
      constraints: "1 <= n <= 10^5\n0 <= prices[i] <= 10^4",
      exampleInput: "6\n7 1 5 3 6 4",
      exampleOutput: "5",
      exampleExplanation: "Buy on day 2 (price=1), sell on day 5 (price=6), profit = 5.",
    },
    "longest-common-subsequence": {
      inputFormat: "First line: string s1. Second line: string s2.",
      outputFormat: "Length of the longest common subsequence.",
      constraints: "1 <= |s1|, |s2| <= 1000\nStrings contain only lowercase English letters.",
      exampleInput: "abcde\nace",
      exampleOutput: "3",
      exampleExplanation: "LCS is \"ace\" with length 3.",
    },
    "edit-distance": {
      inputFormat: "First line: string word1. Second line: string word2.",
      outputFormat: "Minimum edit distance (number of insert/delete/replace operations).",
      constraints: "0 <= |word1|, |word2| <= 500\nStrings contain only lowercase English letters.",
      exampleInput: "horse\nros",
      exampleOutput: "3",
      exampleExplanation: "horse → rorse (replace h→r) → rose (remove r) → ros (remove e): 3 operations.",
    },
    "merge-intervals": {
      inputFormat: "First line: n. Next n lines: two integers start_i and end_i per interval.",
      outputFormat: "Merged intervals, one per line as two space-separated integers.",
      constraints: "1 <= n <= 10^4\n0 <= start_i <= end_i <= 10^4",
      exampleInput: "4\n1 3\n2 6\n8 10\n15 18",
      exampleOutput: "1 6\n8 10\n15 18",
      exampleExplanation: "[1,3] and [2,6] overlap and merge to [1,6]. The other intervals are disjoint.",
    },
    "longest-substring-without-repeating": {
      inputFormat: "A single string s.",
      outputFormat: "Length of the longest substring without repeating characters.",
      constraints: "0 <= s.length <= 5 * 10^4\ns consists of printable ASCII characters.",
      exampleInput: "pwwkew",
      exampleOutput: "3",
      exampleExplanation: "\"wke\" is the longest substring without repeats, length 3.",
    },
    "find-median-data-stream": {
      inputFormat: "First line: q. Next q lines: either 'add x' to insert x, or 'median' to query the current median.",
      outputFormat: "For each 'median' query, print the median. If even number of elements, print the average as a decimal.",
      constraints: "1 <= q <= 5 * 10^4\n-10^5 <= x <= 10^5",
      exampleInput: "5\nadd 1\nadd 2\nmedian\nadd 3\nmedian",
      exampleOutput: "1.5\n2.0",
      exampleExplanation: "After [1,2] median is 1.5. After [1,2,3] median is 2.",
    },
    "contains-duplicate": {
      inputFormat: "First line: n. Second line: n space-separated integers.",
      outputFormat: "Print true if any value appears at least twice; otherwise false.",
      constraints: "1 <= n <= 10^5\n-10^9 <= nums[i] <= 10^9",
      exampleInput: "5\n1 2 3 1 5",
      exampleOutput: "true",
      exampleExplanation: "The value 1 appears at indices 0 and 3.",
    },
    "product-of-array-except-self": {
      inputFormat: "First line: n. Second line: n space-separated integers.",
      outputFormat: "n space-separated integers where output[i] is the product of all elements except nums[i].",
      constraints: "2 <= n <= 10^5\n-30 <= nums[i] <= 30\nThe product of any prefix/suffix fits in a 32-bit integer.\nDivision is NOT allowed.",
      exampleInput: "4\n1 2 3 4",
      exampleOutput: "24 12 8 6",
      exampleExplanation: "output[0]=2*3*4=24, output[1]=1*3*4=12, output[2]=1*2*4=8, output[3]=1*2*3=6.",
    },
    "alien-dictionary": {
      inputFormat: "First line: n (number of words). Next n lines: one word each (sorted in the alien language's lexicographic order).",
      outputFormat: "A string of unique characters in the derived lexicographic order. If no valid order exists, print \"\".",
      constraints: "1 <= n <= 100\n1 <= word length <= 100\nWords contain only lowercase English letters.",
      exampleInput: "4\nwrt\nwrf\ner\nett",
      exampleOutput: "wertf",
      exampleExplanation: "Comparing adjacent words: t<f, w<e, r<t, e<r. Topological sort gives w→e→r→t→f.",
    },
  };

  const problemRecords = [
    { code: "two-sum", title: "Two Sum", statement: "Given an array of integers and a target sum, find the indices of the two numbers that add up to the target. You may assume that each input has exactly one solution and you may not use the same element twice.", difficulty: "Easy", points: 100, ...problemDetails["two-sum"] },
    { code: "valid-palindrome", title: "Valid Palindrome", statement: "A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.", difficulty: "Easy", points: 100, ...problemDetails["valid-palindrome"] },
    { code: "binary-tree-traversal", title: "Binary Tree Traversal", statement: "Given the root of a binary tree, return its preorder, inorder, and postorder traversals. Implement all three traversals without using built-in traversal functions.", difficulty: "Medium", points: 200, ...problemDetails["binary-tree-traversal"] },
    { code: "graphs-shortest-path", title: "Graph Shortest Path", statement: "Given a directed weighted graph with n nodes, compute the shortest distance from a source node s to all other nodes using Dijkstra's algorithm. Nodes with no path from s should report -1.", difficulty: "Medium", points: 200, ...problemDetails["graphs-shortest-path"] },
    { code: "dynamic-programming-fundamentals", title: "Dynamic Programming Fundamentals", statement: "Given an array of positive integers, find the maximum sum of a subsequence such that no two elements are adjacent. This is the classic House Robber / Maximum Non-Adjacent Sum problem.", difficulty: "Medium", points: 250, ...problemDetails["dynamic-programming-fundamentals"] },
    { code: "merge-k-sorted-lists", title: "Merge K Sorted Lists", statement: "You are given k sorted linked lists. Merge all the lists into one sorted linked list and return its head. Aim for O(n log k) time complexity using a min-heap.", difficulty: "Hard", points: 300, ...problemDetails["merge-k-sorted-lists"] },
    { code: "segment-tree-range-query", title: "Segment Tree Range Query", statement: "Build a segment tree that supports range sum queries and point updates in O(log n) time. Given an array and a series of queries, answer each range sum query and apply each point update.", difficulty: "Hard", points: 400, ...problemDetails["segment-tree-range-query"] },
    { code: "strings-kmp", title: "KMP String Matching", statement: "Implement the Knuth-Morris-Pratt (KMP) string matching algorithm. Given a text string and a pattern string, find all starting indices where the pattern occurs in the text. Your solution must run in O(|T| + |P|) time.", difficulty: "Medium", points: 250, ...problemDetails["strings-kmp"] },
    { code: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", statement: "Given an integer array nums, return the length of the longest strictly increasing subsequence. A subsequence is derived from the array by deleting some or no elements without changing the relative order of the remaining elements.", difficulty: "Medium", points: 250, ...problemDetails["longest-increasing-subsequence"] },
    { code: "reverse-linked-list", title: "Reverse Linked List", statement: "Given the head of a singly linked list, reverse the list and return the new head. Implement the solution iteratively in O(n) time and O(1) space.", difficulty: "Easy", points: 100, ...problemDetails["reverse-linked-list"] },
    { code: "maximum-subarray-sum", title: "Maximum Subarray Sum", statement: "Given an integer array nums (which may contain negative numbers), find the contiguous subarray with the largest sum and return that sum. Use Kadane's algorithm for an O(n) solution.", difficulty: "Medium", points: 200, ...problemDetails["maximum-subarray-sum"] },
    { code: "word-ladder", title: "Word Ladder", statement: "Given two words beginWord and endWord, and a dictionary wordList, return the number of words in the shortest transformation sequence from beginWord to endWord. Each step changes exactly one letter, and each intermediate word must be in wordList.", difficulty: "Hard", points: 350, ...problemDetails["word-ladder"] },
    { code: "valid-parentheses", title: "Valid Parentheses", statement: "Given a string s containing only the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Brackets must close in the correct order and every open bracket must have a matching close bracket.", difficulty: "Easy", points: 100, ...problemDetails["valid-parentheses"] },
    { code: "course-schedule", title: "Course Schedule", statement: "There are n courses labeled 0 to n-1. You are given an array of prerequisite pairs where [a, b] means you must take course b before course a. Determine if it is possible to finish all courses (i.e., no circular dependency exists).", difficulty: "Medium", points: 250, ...problemDetails["course-schedule"] },
    { code: "serialize-binary-tree", title: "Serialize Binary Tree", statement: "Design an algorithm to serialize a binary tree to a string and deserialize that string back to the original tree structure. Your codec should work for any valid binary tree.", difficulty: "Hard", points: 300, ...problemDetails["serialize-binary-tree"] },
    { code: "climbing-stairs", title: "Climbing Stairs", statement: "You are climbing a staircase with n steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top? This is a classic Fibonacci-style DP problem.", difficulty: "Easy", points: 100, ...problemDetails["climbing-stairs"] },
    { code: "house-robber", title: "House Robber", statement: "You are a robber planning to rob houses along a street. Adjacent houses have a security system — you cannot rob two adjacent houses in the same night. Given an array of non-negative integers representing the amount of money in each house, return the maximum amount you can rob.", difficulty: "Medium", points: 200, ...problemDetails["house-robber"] },
    { code: "n-queens-problem", title: "N-Queens Problem", statement: "The n-queens puzzle asks you to place n queens on an n×n chessboard so that no two queens threaten each other (same row, column, or diagonal). Return all distinct solutions. Each solution represents a board configuration.", difficulty: "Hard", points: 400, ...problemDetails["n-queens-problem"] },
    { code: "missing-number", title: "Missing Number", statement: "Given an array nums containing n distinct numbers in the range [0, n], return the only number in the range that is missing from the array. Aim for O(n) time and O(1) extra space.", difficulty: "Easy", points: 100, ...problemDetails["missing-number"] },
    { code: "coin-change", title: "Coin Change", statement: "You are given an integer array of coin denominations and a total amount. Return the fewest number of coins needed to make up the amount. If the amount cannot be made, return -1. You may use each coin denomination an unlimited number of times.", difficulty: "Medium", points: 250, ...problemDetails["coin-change"] },
    { code: "trapping-rain-water", title: "Trapping Rain Water", statement: "Given n non-negative integers representing an elevation map where each bar has width 1, compute how much water it can trap after raining. Use the two-pointer technique for an O(n) solution.", difficulty: "Hard", points: 350, ...problemDetails["trapping-rain-water"] },
    { code: "best-time-to-buy-stock", title: "Best Time to Buy and Sell Stock", statement: "You are given an array prices where prices[i] is the price of a stock on day i. You want to maximize profit by choosing a single day to buy and a later day to sell. Return the maximum profit achievable, or 0 if no profit is possible.", difficulty: "Easy", points: 100, ...problemDetails["best-time-to-buy-stock"] },
    { code: "longest-common-subsequence", title: "Longest Common Subsequence", statement: "Given two strings text1 and text2, return the length of their longest common subsequence. A common subsequence is a sequence that appears in both strings in the same relative order, but not necessarily contiguously.", difficulty: "Medium", points: 250, ...problemDetails["longest-common-subsequence"] },
    { code: "edit-distance", title: "Edit Distance", statement: "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2. Allowed operations: insert a character, delete a character, or replace a character.", difficulty: "Hard", points: 350, ...problemDetails["edit-distance"] },
    { code: "merge-intervals", title: "Merge Intervals", statement: "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals and return an array of non-overlapping intervals that cover all the intervals in the input.", difficulty: "Medium", points: 200, ...problemDetails["merge-intervals"] },
    { code: "longest-substring-without-repeating", title: "Longest Substring Without Repeating", statement: "Given a string s, find the length of the longest substring that does not contain repeating characters. Use a sliding window approach for an O(n) solution.", difficulty: "Medium", points: 250, ...problemDetails["longest-substring-without-repeating"] },
    { code: "find-median-data-stream", title: "Find Median in Data Stream", statement: "Design a data structure that supports two operations: addNum(int num) inserts a number into the data structure, and findMedian() returns the median of all current elements. Use two heaps to achieve O(log n) insertion and O(1) median retrieval.", difficulty: "Hard", points: 400, ...problemDetails["find-median-data-stream"] },
    { code: "contains-duplicate", title: "Contains Duplicate", statement: "Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.", difficulty: "Easy", points: 100, ...problemDetails["contains-duplicate"] },
    { code: "product-of-array-except-self", title: "Product of Array Except Self", statement: "Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i]. You must solve it in O(n) time without using the division operation.", difficulty: "Medium", points: 200, ...problemDetails["product-of-array-except-self"] },
    { code: "alien-dictionary", title: "Alien Dictionary", statement: "You are given a list of words from an alien language's dictionary, sorted lexicographically by the rules of this language. Derive the order of characters in the alien alphabet using topological sort. Return an empty string if no valid ordering exists.", difficulty: "Hard", points: 450, ...problemDetails["alien-dictionary"] },
  ];

  await prisma.problem.createMany({
    data: problemRecords.map((problem) => ({
      ...problem,
      source: "BOTH",
    })),
  });

  const problems = await prisma.problem.findMany();
  const problemByCode = new Map(problems.map((problem) => [problem.code, problem]));

  await prisma.problemStarterCode.createMany({
    data: problems.flatMap((problem) =>
      buildStarterCodes(problem.code, problem.title).map((starterCode) => ({
        problemId: problem.id,
        ...starterCode,
      })),
    ),
  });

  const topicsByCode = {
    "two-sum": ["arrays", "hash-table"],
    "valid-palindrome": ["strings", "two-pointers"],
    "binary-tree-traversal": ["trees", "recursion", "dfs"],
    "graphs-shortest-path": ["graphs", "bfs", "dijkstra"],
    "dynamic-programming-fundamentals": ["dynamic-programming"],
    "merge-k-sorted-lists": ["linked-list", "divide-conquer", "heap"],
    "segment-tree-range-query": ["trees", "segment-tree"],
    "strings-kmp": ["strings", "kmp"],
    "longest-increasing-subsequence": ["dynamic-programming", "binary-search"],
    "reverse-linked-list": ["linked-list"],
    "maximum-subarray-sum": ["arrays", "dynamic-programming"],
    "word-ladder": ["graphs", "bfs", "strings"],
    "valid-parentheses": ["strings", "stacks"],
    "course-schedule": ["graphs", "topological-sort"],
    "serialize-binary-tree": ["trees", "dfs", "bfs"],
    "climbing-stairs": ["dynamic-programming"],
    "house-robber": ["dynamic-programming"],
    "n-queens-problem": ["backtracking"],
    "missing-number": ["arrays", "math"],
    "coin-change": ["dynamic-programming"],
    "trapping-rain-water": ["arrays", "two-pointers", "stacks"],
    "best-time-to-buy-stock": ["arrays", "greedy"],
    "longest-common-subsequence": ["dynamic-programming", "strings"],
    "edit-distance": ["dynamic-programming", "strings"],
    "merge-intervals": ["arrays", "sorting"],
    "longest-substring-without-repeating": ["strings", "sliding-window", "hash-table"],
    "find-median-data-stream": ["heap", "sorting"],
    "contains-duplicate": ["arrays", "hash-table"],
    "product-of-array-except-self": ["arrays"],
    "alien-dictionary": ["graphs", "topological-sort", "strings"],
  };

  const topicRows = [];
  for (const [code, tags] of Object.entries(topicsByCode)) {
    const problem = problemByCode.get(code);
    if (!problem) continue;
    tags.forEach((tag) => topicRows.push({ name: tag, problemId: problem.id }));
  }
  await prisma.topic.createMany({ data: topicRows });

  const contestRecords = [
    {
      slug: "week-3-lab-contest",
      name: "Week 3 Lab Contest",
      classSection: "Section A",
      status: "UPCOMING",
      visibility: "PRIVATE",
      startsAt: new Date("2026-01-25T09:00:00.000Z"),
      durationMinutes: 120,
      participants: 0,
      aiHintEnabled: true,
      instructorId: userByComputingId.get("sjohnson")?.id ?? null,
    },
    {
      slug: "trees-graphs-challenge",
      name: "Trees & Graphs Challenge",
      classSection: "Section B",
      status: "ACTIVE",
      visibility: "PUBLIC",
      startsAt: new Date("2026-01-23T09:00:00.000Z"),
      durationMinutes: 180,
      participants: 0,
      aiHintEnabled: true,
      instructorId: userByComputingId.get("mchen")?.id ?? null,
    },
    {
      slug: "arrays-strings-basics",
      name: "Arrays and Strings Basics",
      classSection: "Section A",
      status: "ENDED",
      visibility: "PRIVATE",
      startsAt: new Date("2026-01-18T09:00:00.000Z"),
      durationMinutes: 120,
      participants: 0,
      aiHintEnabled: true,
      instructorId: userByComputingId.get("sjohnson")?.id ?? null,
    },
    {
      slug: "sorting-algorithms-sprint",
      name: "Sorting Algorithms Sprint",
      classSection: "Section B",
      status: "ENDED",
      visibility: "PRIVATE",
      startsAt: new Date("2026-01-11T09:00:00.000Z"),
      durationMinutes: 150,
      participants: 0,
      instructorId: userByComputingId.get("mchen")?.id ?? null,
    },
    {
      slug: "dynamic-programming-intensive",
      name: "Dynamic Programming Intensive",
      classSection: "Section C",
      status: "DRAFT",
      visibility: "COURSE_ONLY",
      startsAt: new Date("2026-02-02T09:00:00.000Z"),
      durationMinutes: 180,
      participants: 0,
      instructorId: userByComputingId.get("ewong")?.id ?? null,
    },
    {
      slug: "graph-algorithms-week",
      name: "Graph Algorithms Week",
      classSection: "Section C",
      status: "UPCOMING",
      visibility: "PUBLIC",
      startsAt: new Date("2026-02-10T09:00:00.000Z"),
      durationMinutes: 120,
      participants: 0,
      instructorId: userByComputingId.get("ewong")?.id ?? null,
    },
  ];

  await prisma.contest.createMany({ data: contestRecords });

  const contests = await prisma.contest.findMany();
  const contestBySlug = new Map(contests.map((contest) => [contest.slug, contest]));

  const contestProblemMap = {
    "week-3-lab-contest": ["two-sum", "valid-palindrome"],
    "trees-graphs-challenge": ["binary-tree-traversal", "graphs-shortest-path", "merge-k-sorted-lists"],
    "arrays-strings-basics": ["two-sum", "strings-kmp", "valid-palindrome"],
    "sorting-algorithms-sprint": ["segment-tree-range-query", "strings-kmp"],
    "dynamic-programming-intensive": ["dynamic-programming-fundamentals", "segment-tree-range-query"],
    "graph-algorithms-week": ["graphs-shortest-path", "binary-tree-traversal"],
  };

  const contestProblems = [];
  for (const [slug, problemCodes] of Object.entries(contestProblemMap)) {
    const contestId = contestBySlug.get(slug)?.id;
    if (!contestId) {
      continue;
    }

    problemCodes.forEach((problemCode, orderingIndex) => {
      const problemId = problemByCode.get(problemCode)?.id;
      if (!problemId) {
        return;
      }

      contestProblems.push({
        contestId,
        problemId,
        ordering: orderingIndex + 1,
      });
    });
  }

  await prisma.contestProblem.createMany({
    data: contestProblems,
  });

  const experimentGroupRows = contests
    .filter((contest) => contest.aiHintEnabled)
    .flatMap((contest) => [
      {
        contestId: contest.id,
        groupName: "A",
        aiHintEnabled: true,
        hintDelayMinutes: 10,
      },
      {
        contestId: contest.id,
        groupName: "B",
        aiHintEnabled: true,
        hintDelayMinutes: 20,
      },
      {
        contestId: contest.id,
        groupName: "C",
        aiHintEnabled: false,
        hintDelayMinutes: null,
      },
    ]);

  await prisma.contestExperimentGroup.createMany({
    data: experimentGroupRows,
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "Platform Maintenance",
        message: "Maintenance window on Sunday from 2:00 AM to 4:00 AM PST.",
        scope: "PLATFORM",
        authorId: userByComputingId.get("admin")?.id ?? null,
      },
      {
        title: "Research Analytics Enabled",
        message: "Instructor analytics dashboards are available for Spring term.",
        scope: "PLATFORM",
        authorId: userByComputingId.get("admin")?.id ?? null,
      },
      {
        title: "Week 3 Lab Reminder",
        message: "Week 3 Lab Contest opens tomorrow at 9:00 AM.",
        scope: "CONTEST",
        contestId: contestBySlug.get("week-3-lab-contest")?.id ?? null,
        authorId: userByComputingId.get("sjohnson")?.id ?? null,
      },
      {
        title: "Graphs Challenge Live",
        message: "Trees & Graphs Challenge is now active.",
        scope: "CONTEST",
        contestId: contestBySlug.get("trees-graphs-challenge")?.id ?? null,
        authorId: userByComputingId.get("mchen")?.id ?? null,
      },
    ],
  });

  const studentUsers = users.filter((user) => user.role === "STUDENT");
  const contestsWithProblems = contests.filter(
    (contest) => contest.status === "ACTIVE" || contest.status === "ENDED",
  );

  const contestExperimentGroups = await prisma.contestExperimentGroup.findMany();
  const hintDelayByContestGroup = new Map(
    contestExperimentGroups.map((group) => [
      `${group.contestId}:${group.groupName}`,
      group.aiHintEnabled ? group.hintDelayMinutes : null,
    ]),
  );

  const languagePool = ["CPLUSPLUS", "JAVA", "PYTHON", "JAVASCRIPT", "TYPESCRIPT"];
  const submissionRows = [];
  const participantSetByContestId = new Map();
  const participantMetaByContestUser = new Map();

  contestsWithProblems.forEach((contest, contestIndex) => {
    const problemLinks = contestProblems.filter((link) => link.contestId === contest.id);
    const participantCount = contest.status === "ACTIVE" ? 14 : 18;

    for (let participantIndex = 0; participantIndex < participantCount; participantIndex += 1) {
      const student = studentUsers[(contestIndex * 7 + participantIndex) % studentUsers.length];
      if (!student) {
        continue;
      }

      if (!participantSetByContestId.has(contest.id)) {
        participantSetByContestId.set(contest.id, new Set());
      }
      participantSetByContestId.get(contest.id).add(student.id);

      const experimentGroup = contest.aiHintEnabled ? pick(["A", "B", "C"], participantIndex) : null;
      const assignmentMethod = contest.aiHintEnabled
        ? contestIndex % 2 === 0
          ? "RATIO_RANDOM"
          : "RANDOM"
        : "MANUAL";

      participantMetaByContestUser.set(`${contest.id}:${student.id}`, {
        experimentGroup,
        assignmentMethod,
      });

      problemLinks.forEach((problemLink, problemIndex) => {
        const attempts = 1 + ((contestIndex + participantIndex + problemIndex) % 2);

        for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex += 1) {
          const status = computeSubmissionStatus(attemptIndex, participantIndex, problemIndex);
          const score = scoreForStatus(status);
          const minutesOffset = (participantIndex + 1) * 3 + problemIndex * 5 + attemptIndex * 2;
          const createdAt = new Date(contest.startsAt.getTime() + minutesOffset * 60_000);

          submissionRows.push({
            userId: student.id,
            contestId: contest.id,
            problemId: problemLink.problemId,
            language: pick(languagePool, participantIndex + problemIndex + attemptIndex),
            status,
            score,
            judgeOutput: status === "ACCEPTED" ? "All hidden test cases passed." : `${status} on contest seed data`,
            createdAt,
          });
        }
      });
    }
  });

  await prisma.submission.createMany({
    data: submissionRows,
  });

  const participationRows = [];
  for (const [contestId, studentIds] of participantSetByContestId.entries()) {
    for (const userId of studentIds) {
      const participantMeta = participantMetaByContestUser.get(`${contestId}:${userId}`) ?? {};
      participationRows.push({
        userId,
        contestId,
        role: "contestant",
        experimentGroup: participantMeta.experimentGroup ?? null,
        assignmentMethod: participantMeta.assignmentMethod ?? null,
      });
    }
  }

  await prisma.participation.createMany({
    data: participationRows,
  });

  const contestById = new Map(contests.map((contest) => [contest.id, contest]));
  const groupedContestSubmissions = new Map();
  for (const row of submissionRows) {
    const key = `${row.userId}:${row.contestId}:${row.problemId}`;
    if (!groupedContestSubmissions.has(key)) {
      groupedContestSubmissions.set(key, []);
    }
    groupedContestSubmissions.get(key).push(row);
  }

  const contestProblemSessionRows = [];
  const hintRows = [];

  for (const [key, rows] of groupedContestSubmissions.entries()) {
    const [userId, contestId, problemId] = key.split(":");
    const sortedRows = [...rows].sort((left, right) => left.createdAt - right.createdAt);
    const firstSubmission = sortedRows[0];
    const solvedSubmission = sortedRows.find((row) => row.status === "ACCEPTED") ?? null;
    const participantMeta = participantMetaByContestUser.get(`${contestId}:${userId}`) ?? {};
    const contest = contestById.get(contestId);
    const hintDelayMinutes =
      participantMeta.experimentGroup == null
        ? null
        : hintDelayByContestGroup.get(`${contestId}:${participantMeta.experimentGroup}`) ?? null;

    const hintEligibleAt =
      contest && hintDelayMinutes != null
        ? new Date(contest.startsAt.getTime() + hintDelayMinutes * 60_000)
        : null;
    const hintTriggeredAt =
      hintEligibleAt &&
      (!solvedSubmission || solvedSubmission.createdAt >= hintEligibleAt)
        ? new Date(hintEligibleAt.getTime() + 60_000)
        : null;

    contestProblemSessionRows.push({
      userId,
      contestId,
      problemId,
      startedAt: new Date(firstSubmission.createdAt.getTime() - 5 * 60_000),
      firstRunAt: new Date(firstSubmission.createdAt.getTime() - 2 * 60_000),
      firstSubmitAt: firstSubmission.createdAt,
      hintEligibleAt,
      hintTriggeredAt,
      solvedAt: solvedSubmission?.createdAt ?? null,
      selectedLang: firstSubmission.language,
      solved: Boolean(solvedSubmission),
    });

    if (hintTriggeredAt) {
      hintRows.push({
        userId,
        problemId,
        code: "// contest hint context",
        feedback: "Break the problem into smaller invariants before refining the full solution.",
        validation: "Seeded experiment hint",
        hintNum: 1,
        createdAt: hintTriggeredAt,
      });
    }
  }

  await prisma.contestProblemSession.createMany({
    data: contestProblemSessionRows,
  });

  await prisma.hint.createMany({
    data: hintRows,
  });

  for (const contest of contests) {
    const participants = participantSetByContestId.get(contest.id)?.size ?? 0;
    await prisma.contest.update({
      where: { id: contest.id },
      data: { participants },
    });
  }

  // ── Practice Sessions & Run Records ─────────────────────────────────────────
  // Each entry: { studentId, problemCode, runs: [{ verdict, language, runtimeMs?, daysAgo }] }
  const BASE_NOW = new Date("2026-03-07T10:00:00.000Z");
  function daysAgo(n) {
    return new Date(BASE_NOW.getTime() - n * 86_400_000);
  }
  function minsAgo(n, base = BASE_NOW) {
    return new Date(base.getTime() - n * 60_000);
  }

  const practicePlan = [
    // Amy (student01) — solved two-sum and climbing-stairs, struggling with coin-change
    {
      computingId: "student01",
      problemCode: "two-sum",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(5) },
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: minsAgo(30, daysAgo(5)) },
        { verdict: "Accepted",     language: "cpp", runtimeMs: 42,   at: minsAgo(10, daysAgo(5)) },
      ],
    },
    {
      computingId: "student01",
      problemCode: "climbing-stairs",
      runs: [
        { verdict: "Wrong Answer", language: "python", runtimeMs: null, at: daysAgo(3) },
        { verdict: "Accepted",     language: "python", runtimeMs: 28,   at: minsAgo(20, daysAgo(3)) },
      ],
    },
    {
      computingId: "student01",
      problemCode: "coin-change",
      runs: [
        { verdict: "Wrong Answer", language: "python", runtimeMs: null, at: daysAgo(1) },
        { verdict: "Wrong Answer", language: "python", runtimeMs: null, at: minsAgo(40, daysAgo(1)) },
      ],
    },

    // Ben (student02) — solved multiple easy/medium problems
    {
      computingId: "student02",
      problemCode: "two-sum",
      runs: [
        { verdict: "Accepted", language: "java", runtimeMs: 55, at: daysAgo(7) },
      ],
    },
    {
      computingId: "student02",
      problemCode: "valid-palindrome",
      runs: [
        { verdict: "Wrong Answer", language: "java", runtimeMs: null, at: daysAgo(6) },
        { verdict: "Accepted",     language: "java", runtimeMs: 38,   at: minsAgo(15, daysAgo(6)) },
      ],
    },
    {
      computingId: "student02",
      problemCode: "reverse-linked-list",
      runs: [
        { verdict: "Accepted", language: "java", runtimeMs: 31, at: daysAgo(4) },
      ],
    },
    {
      computingId: "student02",
      problemCode: "maximum-subarray-sum",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(2) },
        { verdict: "Accepted",     language: "cpp", runtimeMs: 47,   at: minsAgo(25, daysAgo(2)) },
      ],
    },
    {
      computingId: "student02",
      problemCode: "merge-intervals",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(1) },
      ],
    },

    // Cora (student03) — tried trees/graphs, none accepted yet
    {
      computingId: "student03",
      problemCode: "binary-tree-traversal",
      runs: [
        { verdict: "Wrong Answer",  language: "python", runtimeMs: null, at: daysAgo(4) },
        { verdict: "Runtime Error", language: "python", runtimeMs: null, at: minsAgo(50, daysAgo(4)) },
        { verdict: "Wrong Answer",  language: "python", runtimeMs: null, at: minsAgo(20, daysAgo(4)) },
      ],
    },
    {
      computingId: "student03",
      problemCode: "graphs-shortest-path",
      runs: [
        { verdict: "Wrong Answer", language: "python", runtimeMs: null, at: daysAgo(2) },
        { verdict: "Wrong Answer", language: "python", runtimeMs: null, at: minsAgo(30, daysAgo(2)) },
      ],
    },

    // Dylan (student04) — high scorer, solved everything attempted
    {
      computingId: "student04",
      problemCode: "two-sum",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 22, at: daysAgo(10) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "valid-palindrome",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 18, at: daysAgo(9) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "climbing-stairs",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 15, at: daysAgo(8) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "contains-duplicate",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 19, at: daysAgo(7) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "missing-number",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 12, at: daysAgo(6) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "best-time-to-buy-stock",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 25, at: daysAgo(5) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "house-robber",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(4) },
        { verdict: "Accepted",     language: "cpp", runtimeMs: 33,   at: minsAgo(20, daysAgo(4)) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "longest-increasing-subsequence",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(3) },
        { verdict: "Accepted",     language: "cpp", runtimeMs: 44,   at: minsAgo(30, daysAgo(3)) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "coin-change",
      runs: [
        { verdict: "Accepted", language: "cpp", runtimeMs: 51, at: daysAgo(2) },
      ],
    },
    {
      computingId: "student04",
      problemCode: "word-ladder",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(1) },
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: minsAgo(45, daysAgo(1)) },
        { verdict: "Accepted",     language: "cpp", runtimeMs: 78,   at: minsAgo(10, daysAgo(1)) },
      ],
    },

    // Eva (student05) — solved two-sum, currently working on LCS
    {
      computingId: "student05",
      problemCode: "two-sum",
      runs: [
        { verdict: "Wrong Answer", language: "javascript", runtimeMs: null, at: daysAgo(6) },
        { verdict: "Accepted",     language: "javascript", runtimeMs: 60,   at: minsAgo(20, daysAgo(6)) },
      ],
    },
    {
      computingId: "student05",
      problemCode: "longest-common-subsequence",
      runs: [
        { verdict: "Wrong Answer", language: "javascript", runtimeMs: null, at: daysAgo(1) },
      ],
    },

    // Felix (student06) — working on hard problems
    {
      computingId: "student06",
      problemCode: "merge-k-sorted-lists",
      runs: [
        { verdict: "Runtime Error", language: "cpp", runtimeMs: null, at: daysAgo(3) },
        { verdict: "Wrong Answer",  language: "cpp", runtimeMs: null, at: minsAgo(60, daysAgo(3)) },
        { verdict: "Accepted",      language: "cpp", runtimeMs: 112,  at: minsAgo(15, daysAgo(3)) },
      ],
    },
    {
      computingId: "student06",
      problemCode: "trapping-rain-water",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: daysAgo(1) },
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: minsAgo(30, daysAgo(1)) },
      ],
    },
    {
      computingId: "student06",
      problemCode: "n-queens-problem",
      runs: [
        { verdict: "Wrong Answer", language: "cpp", runtimeMs: null, at: BASE_NOW },
      ],
    },
  ];

  // Build a sample snippet per verdict/language for the code column
  function sampleCode(language, verdict) {
    const codingLanguage = toCodingLanguage(language);
    const snippets = {
      CPLUSPLUS: verdict === "Accepted"
        ? "#include <bits/stdc++.h>\nusing namespace std;\nint main() { /* accepted */ return 0; }"
        : "#include <bits/stdc++.h>\nusing namespace std;\nint main() { /* attempt */ return 0; }",
      PYTHON: verdict === "Accepted"
        ? "# accepted\ndef solve():\n    pass"
        : "# attempt\ndef solve():\n    pass",
      JAVA: verdict === "Accepted"
        ? "class Solution { public void solve() { /* accepted */ } }"
        : "class Solution { public void solve() { /* attempt */ } }",
      JAVASCRIPT: verdict === "Accepted"
        ? "function solve() { /* accepted */ }"
        : "function solve() { /* attempt */ }",
      TYPESCRIPT: verdict === "Accepted"
        ? "function solve(input: string): string { /* accepted */ return input; }"
        : "function solve(input: string): string { /* attempt */ return input; }",
    };
    return snippets[codingLanguage] ?? "# starter";
  }

  for (const plan of practicePlan) {
    const student = userByComputingId.get(plan.computingId);
    if (!student) continue;
    const problem = problemByCode.get(plan.problemCode);
    if (!problem) continue;

    const sortedRuns = [...plan.runs].sort((a, b) => a.at - b.at);
    const firstRunAt = sortedRuns[0]?.at ?? null;
    const firstSubmitAt = sortedRuns[0] ? new Date(sortedRuns[0].at.getTime() + 60_000) : null;
    const firstAccepted = sortedRuns.find((run) => run.verdict === "Accepted");
    const solvedAt = firstAccepted ? new Date(firstAccepted.at.getTime() + 60_000) : null;
    const selectedLang = sortedRuns[sortedRuns.length - 1]
      ? toCodingLanguage(sortedRuns[sortedRuns.length - 1].language)
      : null;

    const session = await prisma.practiceSession.create({
      data: {
        userId: student.id,
        problemId: problem.id,
        startedAt: new Date(sortedRuns[0].at.getTime() - 60_000),
        firstRunAt,
        firstSubmitAt,
        solvedAt,
        selectedLang,
        runCount: plan.runs.length,
        submitCount: plan.runs.length,
      },
    });

    for (const run of sortedRuns) {
      const codingLanguage = toCodingLanguage(run.language);
      await prisma.practiceRunRecord.create({
        data: {
          sessionId: session.id,
          isSubmit: false,
          language: codingLanguage,
          code: sampleCode(run.language, run.verdict),
          verdict: run.verdict,
          compilePassed: run.verdict !== "Compile Error",
          stdout: run.verdict === "Accepted" ? "All test cases passed." : null,
          stderr: run.verdict === "Runtime Error" ? "Segmentation fault (core dumped)" : null,
          runtimeMs: run.runtimeMs ?? null,
          createdAt: run.at,
        },
      });

      await prisma.practiceRunRecord.create({
        data: {
          sessionId: session.id,
          isSubmit: true,
          language: codingLanguage,
          code: sampleCode(run.language, run.verdict),
          verdict: run.verdict,
          compilePassed: run.verdict !== "Compile Error",
          stdout: run.verdict === "Accepted" ? "All test cases passed." : null,
          stderr: run.verdict === "Runtime Error" ? "Segmentation fault (core dumped)" : null,
          runtimeMs: run.runtimeMs ?? null,
          createdAt: new Date(run.at.getTime() + 60_000),
        },
      });
    }
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.contest.count(),
    prisma.problem.count(),
    prisma.contestProblem.count(),
    prisma.contestExperimentGroup.count(),
    prisma.contestProblemSession.count(),
    prisma.announcement.count(),
    prisma.submission.count(),
    prisma.problemStarterCode.count(),
    prisma.participation.count(),
    prisma.hint.count(),
    prisma.practiceSession.count(),
    prisma.practiceRunRecord.count(),
  ]);

  console.log("Seed complete");
  console.log(`Users: ${counts[0]}`);
  console.log(`Contests: ${counts[1]}`);
  console.log(`Problems: ${counts[2]}`);
  console.log(`ContestProblems: ${counts[3]}`);
  console.log(`ContestExperimentGroups: ${counts[4]}`);
  console.log(`ContestProblemSessions: ${counts[5]}`);
  console.log(`Announcements: ${counts[6]}`);
  console.log(`Submissions: ${counts[7]}`);
  console.log(`ProblemStarterCodes: ${counts[8]}`);
  console.log(`Participations: ${counts[9]}`);
  console.log(`Hints: ${counts[10]}`);
  console.log(`PracticeSessions: ${counts[11]}`);
  console.log(`PracticeRunRecords: ${counts[12]}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
