import { supabase } from "@/integrations/supabase/client";

export async function uploadClubImage(file: File | null, currentUrl: string) {
  if (!file) return currentUrl || null;
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('club-media').upload(path, file, { contentType: file.type });
  if (error) throw error;
  return `club-media:${path}`;
}

export async function resolveClubImage(value: string | null) {
  if (!value?.startsWith('club-media:')) return value;
  const { data, error } = await supabase.storage.from('club-media').createSignedUrl(value.slice('club-media:'.length), 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export async function resolveClubImages<T extends { image_url: string | null }>(items: T[]) {
  return Promise.all(items.map(async item => ({ ...item, image_url: await resolveClubImage(item.image_url) })));
}