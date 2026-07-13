import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to a Postgres change stream and invalidate the given query keys
 * when any change is received. Keys are batched under one channel per table.
 */
export function useRealtimeInvalidate(
  table: "entries" | "coupons" | "bonus_coupons",
  queryKeys: readonly (readonly unknown[])[],
) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        for (const key of queryKeys) qc.invalidateQueries({ queryKey: key });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}
