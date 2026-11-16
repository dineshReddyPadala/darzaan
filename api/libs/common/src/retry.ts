export const RETRY_DELAYS_MS = [5_000, 30_000, 120_000, 600_000] as const;

export type RetryPlan =
  | { dead: false; delayMs: number; suffix: string }
  | { dead: true };

const SUFFIX = ['retry.5s', 'retry.30s', 'retry.2m', 'retry.10m'];

/** `attempt` is 1-based and counts the failure that just happened. */
export function planRetry(attempt: number): RetryPlan {
  const index = attempt - 1;
  if (index < 0 || index >= RETRY_DELAYS_MS.length) return { dead: true };
  return { dead: false, delayMs: RETRY_DELAYS_MS[index], suffix: SUFFIX[index] };
}
