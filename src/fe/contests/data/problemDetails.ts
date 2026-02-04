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
  timeLimit: string;
  memory: string;
  statement: string[];
  inputFormat: string[];
  outputFormat: string[];
  constraints: string[];
  example: ProblemExample;
  testCases: ProblemTestCase[];
  hiddenCount: number;
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
