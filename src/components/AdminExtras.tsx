import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { Mail, Save, Upload, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { inviteAdmin, listAdmins } from '@/lib/admin.functions';
import { inviteSchema, profileSchema } from '@/lib/admin-rules';

export function AdminInvites() {
  const send = useServerFn(inviteAdmin);
  const list = useServerFn(listAdmins);
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const { data, error } = useQuery({ queryKey: ['admin', 'members'], queryFn: () => list() });
  return <div className="space-y-6">
    <form className="max-w-lg space-y-4" onSubmit={async e => {
      e.preventDefault(); setBusy(true);
      try { const result = await send({ data: inviteSchema.parse({ email }) }); toast.success(result.message); setEmail(''); await qc.invalidateQueries({ queryKey: ['admin', 'members'] }); }
      catch (err) { toast.error(err instanceof Error ? err.message : 'Kunde inte skicka inbjudan.'); }
      finally { setBusy(false); }
    }}>
      <h2 className="text-2xl">Lägg till admin</h2>
      <Label htmlFor="invite-email">E-postadress</Label>
      <Input id="invite-email" type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} />
      <Button disabled={busy}><Mail className="mr-2 h-4 w-4" />{busy ? 'Skickar…' : 'Skicka inbjudan'}</Button>
    </form>
    {error && <p className="text-destructive">Kunde inte hämta administratörer.</p>}
    <ul className="divide-y divide-border">{data?.map(a => <li key={a.email} className="flex flex-wrap justify-between gap-2 py-4"><span className="break-all">{a.email}</span><span className="text-sm text-muted-foreground">{a.is_owner ? 'Huvudadmin' : a.user_id ? 'Admin' : 'Inbjuden'}</span></li>)}</ul>
  </div>;
}

export function AdminProfile({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, error } = useQuery({ queryKey: ['admin', 'profile', userId], queryFn: async () => {
    const { data: profile, error } = await supabase.from('profiles').select('display_name,avatar_path').eq('id', userId).maybeSingle();
    if (error) throw error;
    let url: string | undefined;
    if (profile?.avatar_path) { const result = await supabase.storage.from('admin-avatars').createSignedUrl(profile.avatar_path, 3600); url = result.data?.signedUrl; }
    return { ...profile, url };
  }});
  async function save(avatarPath = data?.avatar_path ?? null) {
    const values = profileSchema.parse({ display_name: name ?? data?.display_name ?? '', avatar_path: avatarPath });
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...values });
    if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['admin', 'profile', userId] });
  }
  return <form className="max-w-lg space-y-4" onSubmit={async e => { e.preventDefault(); setBusy(true); try { await save(); toast.success('Profil sparad'); } catch { toast.error('Kunde inte spara profilen.'); } finally { setBusy(false); } }}>
    <h2 className="text-2xl">Min profil</h2>
    {error && <p className="text-destructive">Kunde inte hämta profilen.</p>}
    {data?.url ? <img src={data.url} alt="Min profilbild" className="h-24 w-24 rounded-full object-cover" /> : <UserRound className="h-24 w-24 text-muted-foreground" />}
    <Label htmlFor="avatar">Profilbild</Label>
    <Input id="avatar" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => {
      const file = e.target.files?.[0]; if (!file) return;
      if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error('Välj JPG, PNG eller WebP, högst 5 MB.'); return; }
      setBusy(true);
      try {
        const path = `${userId}/${crypto.randomUUID()}.${file.type.split('/')[1]}`;
        const { error } = await supabase.storage.from('admin-avatars').upload(path, file);
        if (error) throw error;
        await save(path); toast.success('Profilbild sparad');
      } catch { toast.error('Kunde inte spara profilbilden.'); } finally { setBusy(false); }
    }} />
    <Label htmlFor="display-name">Namn</Label><Input id="display-name" maxLength={100} value={name ?? data?.display_name ?? ''} onChange={e => setName(e.target.value)} />
    <Button disabled={busy}><Save className="mr-2 h-4 w-4" />Spara profil</Button>
  </form>;
}