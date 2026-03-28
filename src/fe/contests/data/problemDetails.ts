import type { ContestProblem } from "@/fe/contests/data/contestDetails";

export interface ProblemTestCase {
  id: string;
  input: string;
  expected: string;
  sample?: boolean;
}

export interface ProblemExample {
  input: string[];
  output: string[];
  explanation: string;
}

export interface ProblemNarrative {
  id?: string;
  timeLimit: string;
  memory: string;
  statement: string[];
  inputFormat: string[];
  outputFormat: string[];
  constraints: string[];
  example: ProblemExample;
  testCases: ProblemTestCase[];
  hiddenCount: number;
  starterCodes?: Partial<Record<"cplusplus" | "java" | "typescript" | "javascript" | "python", string>>;
  submissions: SubmissionRecord[];
  editorial: EditorialDetail;
}

export type ProblemDetail = ContestProblem & ProblemNarrative;

export interface SubmissionRecord {
  id: string;
  status: "accepted" | "wrong" | "tle";
  language: string;
  runtime: string;
  memory: string;
  submitted: string;
}

export interface EditorialDetail {
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
  note: string;
}

const defaultStarterCodes: NonNullable<ProblemNarrative["starterCodes"]> = {
  cplusplus: `#include <iostream>
#include <vector>
using namespace std;

int main() {
  // TODO: read input, solve the problem, and print the answer.
  return 0;
}
`,
  java: `import java.io.*;
import java.util.*;

public class Main {
  public static void main(String[] args) throws Exception {
    // TODO: read input, solve the problem, and print the answer.
  }
}
`,
  python: `def solve() -> None:
    # TODO: read input, solve the problem, and print the answer.
    pass


if __name__ == "__main__":
    solve()
`,
  typescript: `function solve(input: string): string {
  // TODO: parse input, solve the problem, and return the answer.
  return "";
}

import * as fs from "fs";
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
  javascript: `function solve(input) {
  // TODO: parse input, solve the problem, and return the answer.
  return "";
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
};

const starterCodesByCode: Record<string, NonNullable<ProblemNarrative["starterCodes"]>> = {
  a: {
    cplusplus: `#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
  // TODO: return the two indices whose values sum to target.
  return {};
}

int main() {
  int n = 0;
  int target = 0;
  cin >> n >> target;
  vector<int> nums(n);
  for (int i = 0; i < n; ++i) cin >> nums[i];
  vector<int> answer = twoSum(nums, target);
  if (answer.size() == 2) cout << answer[0] << " " << answer[1] << "\\n";
  return 0;
}
`,
    java: `import java.io.*;
import java.util.*;

public class Main {
  static int[] twoSum(int[] nums, int target) {
    // TODO: return the two indices whose values sum to target.
    return new int[0];
  }

  public static void main(String[] args) throws Exception {
    BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
    StringTokenizer firstLine = new StringTokenizer(reader.readLine());
    int n = Integer.parseInt(firstLine.nextToken());
    int target = Integer.parseInt(firstLine.nextToken());
    StringTokenizer values = new StringTokenizer(reader.readLine());
    int[] nums = new int[n];
    for (int i = 0; i < n; i++) nums[i] = Integer.parseInt(values.nextToken());
    int[] answer = twoSum(nums, target);
    if (answer.length == 2) System.out.println(answer[0] + " " + answer[1]);
  }
}
`,
    python: `from typing import List


def two_sum(nums: List[int], target: int) -> List[int]:
    # TODO: return the two indices whose values sum to target.
    return []


def solve() -> None:
    n, target = map(int, input().split())
    nums = list(map(int, input().split()))
    answer = two_sum(nums, target)
    if len(answer) == 2:
        print(answer[0], answer[1])


if __name__ == "__main__":
    solve()
`,
    typescript: `function twoSum(nums: number[], target: number): number[] {
  // TODO: return the two indices whose values sum to target.
  return [];
}

function solve(input: string): string {
  const [firstLine = "", secondLine = ""] = input.trim().split(/\\r?\\n/);
  const [n, target] = firstLine.split(" ").map(Number);
  const nums = secondLine.split(" ").slice(0, n).map(Number);
  const answer = twoSum(nums, target);
  return answer.length === 2 ? \`\${answer[0]} \${answer[1]}\` : "";
}

import * as fs from "fs";
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
    javascript: `function twoSum(nums, target) {
  // TODO: return the two indices whose values sum to target.
  return [];
}

function solve(input) {
  const [firstLine = "", secondLine = ""] = input.trim().split(/\\r?\\n/);
  const [n, target] = firstLine.split(" ").map(Number);
  const nums = secondLine.split(" ").slice(0, n).map(Number);
  const answer = twoSum(nums, target);
  return answer.length === 2 ? \`\${answer[0]} \${answer[1]}\` : "";
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
  },
  b: {
    cplusplus: `#include <iostream>
#include <vector>
using namespace std;

int main() {
  // TODO: build the tree and print preorder, inorder, and postorder traversals.
  return 0;
}
`,
    java: `import java.io.*;
import java.util.*;

public class Main {
  public static void main(String[] args) throws Exception {
    // TODO: build the tree and print preorder, inorder, and postorder traversals.
  }
}
`,
    python: `def solve() -> None:
    # TODO: build the tree and print preorder, inorder, and postorder traversals.
    pass


if __name__ == "__main__":
    solve()
`,
    typescript: `function solve(input: string): string {
  // TODO: build the tree and return the preorder, inorder, and postorder traversals.
  return "";
}

import * as fs from "fs";
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
    javascript: `function solve(input) {
  // TODO: build the tree and return the preorder, inorder, and postorder traversals.
  return "";
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
  },
  c: {
    cplusplus: `#include <iostream>
#include <queue>
#include <vector>
using namespace std;

int main() {
  // TODO: merge the sorted lists and print the merged result.
  return 0;
}
`,
    java: `import java.io.*;
import java.util.*;

public class Main {
  public static void main(String[] args) throws Exception {
    // TODO: merge the sorted lists and print the merged result.
  }
}
`,
    python: `def solve() -> None:
    # TODO: merge the sorted lists and print the merged result.
    pass


if __name__ == "__main__":
    solve()
`,
    typescript: `function solve(input: string): string {
  // TODO: merge the sorted lists and return the merged result.
  return "";
}

import * as fs from "fs";
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
    javascript: `function solve(input) {
  // TODO: merge the sorted lists and return the merged result.
  return "";
}

const fs = require("fs");
const input = fs.readFileSync(0, "utf8");
process.stdout.write(solve(input));
`,
  },
};

const defaultNarrative: ProblemNarrative = {
  timeLimit: "1 second",
  memory: "256 MB",
  statement: [
    "Solve the problem using the input format and constraints below.",
    "Return the required output for each test case.",
  ],
  inputFormat: [
    "First line contains an integer `n`.",
    "Second line contains `n` space-separated integers.",
  ],
  outputFormat: ["Print the required result as described in the statement."],
  constraints: [
    "1 <= n <= 10^5",
    "-10^9 <= values <= 10^9",
    "Time limit applies to all test cases.",
  ],
  example: {
    input: ["5", "1 2 3 4 5"],
    output: ["Example output"],
    explanation: "Explain how the output is derived from the input.",
  },
  testCases: [
    { id: "Test Case 1", input: "1 | 1", expected: "1", sample: true },
    { id: "Test Case 2", input: "2 | 1 2", expected: "3", sample: true },
  ],
  hiddenCount: 8,
  starterCodes: defaultStarterCodes,
  submissions: [
    {
      id: "1",
      status: "accepted",
      language: "C++",
      runtime: "0.12s",
      memory: "12.4MB",
      submitted: "2 hours ago",
    },
  ],
  editorial: {
    approach:
      "Use a hash table to store the numbers we have seen so far. As we iterate through the array, check if (target - current number) exists in the table.",
    timeComplexity: "O(n) - We traverse the list containing n elements only once.",
    spaceComplexity:
      "O(n) - The extra space required depends on the number of items stored in the hash table.",
    note:
      "Editorial is only available after you've solved the problem or the contest has ended.",
  },
};

const narrativeByCode: Record<string, ProblemNarrative> = {
  a: {
    timeLimit: "1 second",
    memory: "256 MB",
    statement: [
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.",
      "You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    ],
    inputFormat: [
      "First line contains two integers: `n` (array length) and `target`.",
      "Second line contains `n` space-separated integers.",
    ],
    outputFormat: [
      "Print two space-separated integers representing the indices (0-based) of the two numbers.",
    ],
    constraints: [
      "2 <= n <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
    example: {
      input: ["4 9", "2 7 11 15"],
      output: ["0 1"],
      explanation: "Because `nums[0] + nums[1]` = 9, we return [0, 1].",
    },
    testCases: [
      {
        id: "Test Case 1",
        input: "4 9 | 2 7 11 15",
        expected: "0 1",
        sample: true,
      },
      {
        id: "Test Case 2",
        input: "3 6 | 3 2 4",
        expected: "1 2",
        sample: true,
      },
    ],
    hiddenCount: 8,
    starterCodes: starterCodesByCode.a,
    submissions: [
      {
        id: "1",
        status: "accepted",
        language: "C++",
        runtime: "0.12s",
        memory: "12.4MB",
        submitted: "2 hours ago",
      },
      {
        id: "2",
        status: "wrong",
        language: "C++",
        runtime: "0.08s",
        memory: "11.2MB",
        submitted: "3 hours ago",
      },
      {
        id: "3",
        status: "tle",
        language: "Python",
        runtime: "> 2.0s",
        memory: "15.8MB",
        submitted: "5 hours ago",
      },
    ],
    editorial: {
      approach:
        "The optimal solution uses a hash table to store the numbers we've seen so far. As we iterate through the array, for each number we check if (target - current number) exists in our hash table.",
      timeComplexity: "O(n) - We traverse the list containing n elements only once.",
      spaceComplexity:
        "O(n) - The extra space required depends on the number of items stored in the hash table.",
      note:
        "Editorial is only available after you've solved the problem or the contest has ended.",
    },
  },
  b: {
    timeLimit: "2 seconds",
    memory: "256 MB",
    statement: [
      "Given a binary tree, return the preorder, inorder, and postorder traversals.",
      "The traversal should visit nodes in the required order without modifying the tree.",
    ],
    inputFormat: [
      "First line contains integer `n`, the number of nodes.",
      "Next line contains `n` integers describing the tree in level-order, using `-1` for null nodes.",
    ],
    outputFormat: [
      "Print three lines: preorder, inorder, and postorder traversals separated by spaces.",
    ],
    constraints: [
      "1 <= n <= 10^5",
      "-10^9 <= node values <= 10^9",
    ],
    example: {
      input: ["5", "1 2 3 -1 4"],
      output: ["1 2 4 3", "2 4 1 3", "4 2 3 1"],
      explanation: "Traverse the tree in each order to produce the three sequences.",
    },
    testCases: [
      {
        id: "Test Case 1",
        input: "5 | 1 2 3 -1 4",
        expected: "1 2 4 3",
        sample: true,
      },
      {
        id: "Test Case 2",
        input: "3 | 1 -1 2",
        expected: "1 2",
        sample: true,
      },
    ],
    hiddenCount: 6,
    starterCodes: starterCodesByCode.b,
    submissions: [
      {
        id: "1",
        status: "accepted",
        language: "C++",
        runtime: "0.31s",
        memory: "18.1MB",
        submitted: "1 day ago",
      },
    ],
    editorial: {
      approach:
        "Traverse the tree recursively, building preorder, inorder, and postorder lists as you visit each node.",
      timeComplexity: "O(n) - Each node is visited once in each traversal.",
      spaceComplexity:
        "O(h) - The recursion depth depends on the height of the tree.",
      note:
        "Editorial is only available after you've solved the problem or the contest has ended.",
    },
  },
  c: {
    timeLimit: "2 seconds",
    memory: "512 MB",
    statement: [
      "You are given `k` linked lists sorted in ascending order.",
      "Merge all the linked lists into one sorted list and return it.",
    ],
    inputFormat: [
      "First line contains `k`, the number of linked lists.",
      "Each of the next `k` lines contains a sorted list of integers.",
    ],
    outputFormat: ["Print the merged sorted list in one line."],
    constraints: [
      "1 <= k <= 10^4",
      "Total number of nodes <= 10^5",
    ],
    example: {
      input: ["3", "1 4 5", "1 3 4", "2 6"],
      output: ["1 1 2 3 4 4 5 6"],
      explanation: "Merge each list while preserving ascending order.",
    },
    testCases: [
      {
        id: "Test Case 1",
        input: "3 | 1 4 5 | 1 3 4 | 2 6",
        expected: "1 1 2 3 4 4 5 6",
        sample: true,
      },
      {
        id: "Test Case 2",
        input: "2 | 1 3 | 2 4",
        expected: "1 2 3 4",
        sample: true,
      },
    ],
    hiddenCount: 5,
    starterCodes: starterCodesByCode.c,
    submissions: [
      {
        id: "1",
        status: "wrong",
        language: "Java",
        runtime: "0.56s",
        memory: "22.3MB",
        submitted: "6 hours ago",
      },
    ],
    editorial: {
      approach:
        "Use a min-heap to repeatedly extract the smallest head among the lists and build the merged list.",
      timeComplexity: "O(n log k) - Each heap operation costs log k.",
      spaceComplexity: "O(k) - The heap stores one node from each list.",
      note:
        "Editorial is only available after you've solved the problem or the contest has ended.",
    },
  },
};

export const buildProblemDetail = (problem: ContestProblem): ProblemDetail => {
  const narrative = narrativeByCode[problem.code.toLowerCase()] ?? defaultNarrative;

  return {
    ...problem,
    ...narrative,
  };
};
