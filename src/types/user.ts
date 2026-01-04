import { UserTestSettings } from "./test";

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  createdAt: Date;
  settings?: UserTestSettings;
}

export interface SyncQueueItem {
  id: string;
  type: "progress" | "test" | "settings";
  action: "create" | "update" | "delete";
  data: any;
  timestamp: Date;
}

