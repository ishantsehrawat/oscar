export interface OscarMessage {
  id: string;
  message: string;
  type: "info" | "milestone" | "reminder" | "observation";
  timestamp: Date;
}

export function generateOscarMessage(
  type: OscarMessage["type"],
  context: {
    topic?: string;
    count?: number;
    streak?: number;
    isSunday?: boolean;
  }
): string {
  switch (type) {
    case "observation":
      if (context.topic) {
        return `Oscar noticed you've avoided ${context.topic}.`;
      }
      return "Oscar noticed you've been quiet.";
    case "milestone":
      if (context.count) {
        return `You've completed ${context.count} questions.`;
      }
      return "You've reached a milestone.";
    case "reminder":
      if (context.isSunday) {
        return "Your Sunday test is ready.";
      }
      return "Time for your weekly test.";
    case "info":
      return "Oscar is here to help.";
    default:
      return "";
  }
}

