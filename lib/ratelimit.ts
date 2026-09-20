import { db } from "./db";

/** Returns true if the action is allowed. Fails closed if the database is unreachable. */
export async function allow(key: string, max: number, windowSeconds: number): Promise<boolean> {
  const { data, error } = await db().rpc("hit_rate_limit", {
    p_key: key,
    p_max: max,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error("rate limit error:", error.message);
    return false;
  }
  return data === true;
}
