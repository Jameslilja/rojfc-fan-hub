import { supabase } from "@/integrations/supabase/client";

export async function uploadClubImage(file: File | null, currentUrl: string) {
  if (!file) return currentUrl || null;
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('club-media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from('club-media').getPublicUrl(path).data.publicUrl;
}