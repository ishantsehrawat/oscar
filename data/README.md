# Questions Data

This directory contains the Striver's SDE Sheet questions data.

## Current Status

The `strivers-sde-sheet.json` file currently contains a sample structure with 6 questions. 

## Required Action

You need to extract all **191 questions** from the [Striver's SDE Sheet](https://takeuforward.org/dsa/strivers-sde-sheet-top-coding-interview-problems) and populate this file.

## Data Format

Each question should follow this structure:

```json
{
  "title": "Question Title",
  "topic": "Arrays",
  "difficulty": "Easy" | "Medium" | "Hard",
  "youtubeLink": "https://youtube.com/..." | null,
  "leetcodeLink": "https://leetcode.com/problems/.../",
  "order": 1
}
```

## Topics

The questions should be organized under these topics (as per Striver's SDE Sheet):

- Arrays
- Arrays Part-II
- Arrays Part-III
- Arrays Part-IV
- Linked List
- Linked List Part-II
- Linked List and Arrays
- Greedy Algorithm
- Recursion
- Recursion and Backtracking
- Binary Search
- Heaps
- Stack and Queue
- Stack and Queue Part-II
- String
- String Part-II
- Binary Tree
- Binary Tree part-II
- Binary Tree part-III
- Binary Search Tree
- Binary Search Tree Part-II
- Binary Trees[Miscellaneous]
- Graph
- Graph Part-II
- Dynamic Programming
- Dynamic Programming Part-II
- Trie

## Seeding to Firestore

Once you have the complete JSON file, you can seed it to Firestore using:

```bash
npx ts-node scripts/seed-questions.ts
```

Make sure your Firebase credentials are set up in `.env.local` or `src/lib/firebase/config.ts` before running the seed script.

