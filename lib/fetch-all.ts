import type { SupabaseClient } from "@supabase/supabase-js";
import type { Member } from "@/lib/types";

/** PostgREST defaults to max 1000 rows — page through members. */
export async function fetchAllMembers(
  sb: SupabaseClient,
  clubIds?: string[]
): Promise<Member[]> {
  const pageSize = 1000;
  const out: Member[] = [];
  let from = 0;
  for (;;) {
    let q = sb.from("members").select("*").range(from, from + pageSize - 1);
    if (clubIds?.length) q = q.in("club_id", clubIds);
    const { data, error } = await q;
    if (error) throw error;
    const batch = (data as Member[]) ?? [];
    out.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }
  return out;
}
