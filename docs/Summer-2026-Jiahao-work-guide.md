# Summer 2026 Platform Research Report

Term: Summer 2026
Author: Jiahao Han (Spencer)

---

## Personal Research Analysis Overview

The Summer 2026 work summarized in this guide focused on the following areas:

- [Paper research](#Literature-Review-and-Proposed-Features)

## Literature Review and Proposed Features


## Paper 1
### Bridging Code and Timely Feedback: Integrating Generative AI into a Programming Platform
*Martínez-Araneda et al. (2025)*

### Key Findings

- Students viewed AI-generated feedback positively.
- Students were willing to continue using the AI tools.
- AI can support problem analysis and code feedback.
- Combining an online judge with AI feedback is feasible.
- Timely and personalized feedback is valuable in programming education.
- Insufficient evidence that AI feedback improved performance. (End of Abstract)

### Ideas Applicable to Our Project

#### 1. AI-Based Problem Analysis Assistant

The paper proposes helping students understand a problem before coding by identifying:

- Inputs
- Outputs
- Constraints
- Step-by-step algorithms

**Original text (on page 3):**

Students must analyze a problem by identifying inputs, processes, outputs, and restrictions. Then, they must design an algorithmic solution using semi-structured representations (such as pseudocode, flowcharts, or Nassi-Schneidermann diagrams), build it in a programming language, and execute the test cases.

**Application to our project**

Before allowing students to code, the platform can provide an optional AI-generated problem analysis section that helps students understand the problem and develop problem-solving skills.

#### 2. Topic Weakness Tracker

The platform can track each student's performance across different programming topics. Instead of only recording whether a problem is solved or unsolved, the system can analyze which types of problems the student struggles with.

For example, the platform can track topics such as:

- Arrays
- Sorting
- Recursion
- Greedy Algorithms
- Graphs
- Dynamic Programming
- Data Structures

**Original text (on page 4):**

Through self-regulation of learning, students can identify areas in which they need to improve and specifically focus on them. Feedback can also enhance student effectiveness by allowing students to understand their progress and giving them a sense of control over their learning.

**Application to our project**

Each problem can be tagged with one or more topics. When a student submits solutions, the platform records their performance for each topic.

Example:

| Topic | Mastery |
|---------|---------|
| Arrays | 85% |
| Sorting | 90% |
| Graphs | 45% |
| Dynamic Programming | 30% |

Based on this data, the platform can identify weak areas and recommend suitable practice problems.

#### 3. Progressive Hint System

The paper emphasizes detailed and timely feedback.

**Original text:**

**(on page 2)**
A systematic review conducted by *Haughney, Wakeman & Hart (2020)* about the potential of feedback in higher education found common elements that include widely accepted quality standards, such as that feedback should be positive, specific, timely, and encourage active participation of students, as well as less known characteristics that emerge the impact of peer feedback, the use of novel tools.

**(on page 4)**
A study by *Shute et al. (2016)* indicates that students perceive late feedback as ineffective. Furthermore, *Rubio-Manzano et al. (2020)* emphasises that feedback must be frequent and detailed to support effective learning

**Application to our project**

Implement a multi-level hint system:

- Level 1: General direction
- Level 2: Algorithm suggestion
- Level 3: Detailed implementation guidance

This prevents students from becoming dependent on AI-generated solutions.

#### 4. Positive Motivation Messages

The chatbot was intentionally designed with a positive personality.

**Origiinal text (on page 5)**

Students who receive positive feedback, i.e., feedback emphasizing the positive aspects of their code, may feel motivated and engaged in the learning process, which can improve their performance and enhance their ability to apply what they have learned to future situations.

**Origiinal text (on page 13)**

After the above, an attempt was made to assign a positive and relaxed personality through the following instruction: “*You are a cheerful programming assistant. Use emojis at the end of your messages to reinforce moods.*”

**Application to our project**

Provide encouraging messages after failed submissions to improve motivation and reduce frustration.
