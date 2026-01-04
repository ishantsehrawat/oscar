export type TestSource = "all" | "completed" | "topics" | "custom";

export interface TestConfig {
  source: TestSource;
  topics?: string[];
  questionIds?: string[];
  count: number;
}

export interface TestResult {
  questionId: string;
  markedWeak: boolean;
}

export interface Test {
  id: string;
  createdAt: Date;
  questions: string[]; // Question IDs
  config: TestConfig;
  results?: TestResult[];
}

export interface UserTestSettings {
  testConfig: {
    defaultSource: TestSource;
    defaultCount: number;
    defaultTopics?: string[];
  };
  syncEnabled: boolean;
  lastSyncedAt: Date | null;
}

export function getDefaultTestConfig(): TestConfig {
  return {
    source: "completed",
    count: 10,
  };
}

