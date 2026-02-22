import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    PENDING: 0,
  };

  return scoreMap[status] ?? 0;
}

async function main() {
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

  const problemRecords = [
    {
      code: "two-sum",
      title: "Two Sum",
      statement: "Find two numbers in an array that add up to the target.",
      difficulty: "Easy",
    },
    {
      code: "valid-palindrome",
      title: "Valid Palindrome",
      statement: "Determine whether a string is a palindrome after normalization.",
      difficulty: "Easy",
    },
    {
      code: "binary-tree-traversal",
      title: "Binary Tree Traversal",
      statement: "Return preorder, inorder, and postorder traversals for a binary tree.",
      difficulty: "Medium",
    },
    {
      code: "graphs-shortest-path",
      title: "Graphs Shortest Path",
      statement: "Compute shortest paths in a weighted graph.",
      difficulty: "Medium",
    },
    {
      code: "dynamic-programming-fundamentals",
      title: "Dynamic Programming Fundamentals",
      statement: "Solve foundational DP tasks using bottom-up transitions.",
      difficulty: "Medium",
    },
    {
      code: "merge-k-sorted-lists",
      title: "Merge K Sorted Lists",
      statement: "Merge k sorted linked lists and return one sorted list.",
      difficulty: "Hard",
    },
    {
      code: "segment-tree-range-query",
      title: "Segment Tree Range Query",
      statement: "Support dynamic range query/update operations.",
      difficulty: "Hard",
    },
    {
      code: "strings-kmp",
      title: "KMP String Matching",
      statement: "Find all occurrences of a pattern in linear time.",
      difficulty: "Medium",
    },
  ];

  await prisma.problem.createMany({ data: problemRecords });

  const problems = await prisma.problem.findMany();
  const problemByCode = new Map(problems.map((problem) => [problem.code, problem]));

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

  const languagePool = ["cpp", "python", "java", "javascript"];
  const submissionRows = [];
  const participantSetByContestId = new Map();

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
            createdAt,
          });
        }
      });
    }
  });

  await prisma.submission.createMany({
    data: submissionRows,
  });

  for (const contest of contests) {
    const participants = participantSetByContestId.get(contest.id)?.size ?? 0;
    await prisma.contest.update({
      where: { id: contest.id },
      data: { participants },
    });
  }

  const counts = await Promise.all([
    prisma.user.count(),
    prisma.contest.count(),
    prisma.problem.count(),
    prisma.contestProblem.count(),
    prisma.announcement.count(),
    prisma.submission.count(),
  ]);

  console.log("Seed complete");
  console.log(`Users: ${counts[0]}`);
  console.log(`Contests: ${counts[1]}`);
  console.log(`Problems: ${counts[2]}`);
  console.log(`ContestProblems: ${counts[3]}`);
  console.log(`Announcements: ${counts[4]}`);
  console.log(`Submissions: ${counts[5]}`);
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
