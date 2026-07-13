import { supabase } from "@/integrations/supabase/client";

/** Legacy compatibility: some components import a sign-out helper from here. */
export async function logout() {
  await supabase.auth.signOut();
}
