import { QuestionProgress } from "@/types/progress";

/**
 * Conflict resolution: prefer local (last write wins)
 * If timestamps are equal, prefer the one with more attempts or completed status
 */
export function resolveProgressConflict(
  local: QuestionProgress,
  remote: QuestionProgress
): QuestionProgress {
  // If local is newer, prefer local
  if (local.updatedAt > remote.updatedAt) {
    return local;
  }

  // If remote is newer, prefer remote
  if (remote.updatedAt > local.updatedAt) {
    return remote;
  }

  // Same timestamp: prefer completed status
  if (local.status === "completed" && remote.status !== "completed") {
    return local;
  }
  if (remote.status === "completed" && local.status !== "completed") {
    return remote;
  }

  // Prefer more attempts
  if (local.attempts > remote.attempts) {
    return local;
  }
  if (remote.attempts > local.attempts) {
    return remote;
  }

  // Default to local
  return local;
}

