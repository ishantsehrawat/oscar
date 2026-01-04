export interface Sheet {
  id: string;
  name: string;
  questionIds: string[];
  totalQuestions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

