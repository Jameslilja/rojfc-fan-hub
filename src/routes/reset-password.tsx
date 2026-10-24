import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAdminAuth } from '@/lib/auth-context';

export const Route = createFileRoute('/reset-password')({
  head: () => ({ meta: [
    { title: 'Välj lösenord — Roj FC' },
    { name: 'description', content: 'Aktivera ditt Roj FC-adminkonto eller välj ett nytt lösenord.' },
    { property: 'og:title', content: 'Välj lösenord — Roj FC' },
    { property: 'og:description', content: 'Aktivera ditt Roj FC-adminkonto eller välj ett nytt lösenord.' },
    { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary' },
    { name: 'robots', content: 'noindex' },
  ] }), component: ResetPassword,
});
function ResetPassword() {
  const { user, ready, passwordLink: validLink } = useAdminAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  return <div className="mx-auto max-w-md px-4 py-20">
    <h1 className="text-4xl">Välj lösenord</h1>
    {!ready ? <p className="mt-4 text-muted-foreground">Kontrollerar länken…</p> : done ? <div className="mt-6 space-y-4"><p role="status">Ditt lösenord är sparat.</p><Button asChild><Link to="/admin">Öppna admin-sidan</Link></Button></div> : !user || !validLink ? <div className="mt-6 space-y-4"><p className="text-muted-foreground">Öppna länken i ditt inbjudnings- eller återställningsmejl. Om länken har gått ut, begär en ny på admin-sidan.</p><Button asChild variant="outline"><Link to="/admin">Till Admin</Link></Button></div> : <form className="mt-8 space-y-4" onSubmit={async e => {
      e.preventDefault();
      if (password !== confirm) { setMessage('Lösenorden matchar inte.'); return; }
      setBusy(true);
      const { error } = await supabase.auth.updateUser({ password });
      setBusy(false);
      if (error) setMessage(error.message); else setDone(true);
    }}>
      <Label htmlFor="new-password">Nytt lösenord</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} />
      <Label htmlFor="confirm-password">Upprepa lösenord</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} />
      {message && <p role="alert" className="text-destructive">{message}</p>}
      <Button disabled={busy} className="w-full">{busy ? 'Sparar…' : 'Spara lösenord'}</Button>
    </form>}
  </div>;
}