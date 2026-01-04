export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Question {
  id: string;
  title: string;
  topics: string[]; // Changed from topic: string to topics: string[]
  difficulty: Difficulty;
  youtubeLink: string | null;
  leetcodeLink: string;
  order: number;
  sheets: string[]; // Multiple sheets this question belongs to
  createdAt?: Date;
}

export interface QuestionWithProgress extends Question {
  progress?: QuestionProgress;
}

