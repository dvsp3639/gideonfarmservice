import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useSignedPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-photo", path],
    enabled: !!path,
    staleTime: 55 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      const { data, error } = await supabase.storage
        .from("vehicle-photos")
        .createSignedUrl(path, 60 * 60);
      if (error) throw error;
      return data.signedUrl;
    },
  });
}
