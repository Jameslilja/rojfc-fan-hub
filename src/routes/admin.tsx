import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LogOut, Plus, Trash2, Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/lib/auth-context";
import { AdminInvites, AdminProfile } from "@/components/AdminExtras";
import { ClubImageField } from "@/components/ClubImageField";
import { uploadClubImage } from "@/lib/club-media";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Roj FC" },
      { name: "description", content: "Inloggning för Roj FC:s administratörer." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Roj FC" },
      { property: "og:description", content: "Inloggning för Roj FC:s administratörer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user, ready } = useAdminAuth();
  if (!ready) return <div className="mx-auto max-w-md px-4 py-20 text-muted-foreground">…</div>;
  if (!user) return <LoginCard />;
  return <AdminPanel key={user.id} email={user.email ?? ""} userId={user.id} />;
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message);
  }

  async function signUp() {
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else setNotice("Kontrollera din e-post och bekräfta kontot. Endast inbjudna administratörer får redigera sidan.");
  }

  async function resetPassword() {
    if (!email || !email.includes('@')) { toast.error('Fyll i din e-postadress först.'); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) toast.error('Kunde inte skicka återställningsmejlet.');
    else setNotice('Om kontot finns skickas en länk till din e-postadress.');
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-4xl">Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Roj FC · Administratörer
      </p>
      {notice && <p role="status" className="mt-4 text-sm text-gold">{notice}</p>}
      <form onSubmit={signIn} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Lösenord</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" disabled={busy} className="w-full">
          Logga in
        </Button>
        <Button type="button" variant="outline" onClick={signUp} disabled={busy} className="w-full">
          Skapa konto
        </Button>
        <Button type="button" variant="ghost" onClick={resetPassword} disabled={busy} className="w-full">Glömt lösenord?</Button>
      </form>
    </div>
  );
}

function AdminPanel({ email, userId }: { email: string; userId: string }) {
  const { data: isAdmin, isLoading, error } = useQuery({
    queryKey: ["admin", "role", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
      if (error) throw error;
      return data;
    },
  });
  const { data: access } = useQuery({ queryKey: ['admin', 'access', userId], queryFn: async () => {
    const { data, error } = await supabase.from('admin_access').select('is_owner').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }, enabled: Boolean(isAdmin) });

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl">Adminpanel</h1>
          <p className="text-sm text-muted-foreground">Inloggad som {email}</p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logga ut
        </Button>
      </div>

      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Kontrollerar behörighet…</p>
      ) : error ? <p className="mt-10 text-destructive">Kunde inte kontrollera behörigheten. Försök ladda om sidan.</p> : !isAdmin ? (
        <p className="mt-10 rounded-lg border border-border bg-card p-6 text-muted-foreground">
          Ditt konto saknar administratörsbehörighet. Kontakta klubbens huvudadmin.
        </p>
      ) : (
        <Tabs defaultValue="news" className="mt-10">
          <TabsList className="h-auto flex flex-wrap justify-start gap-1">
            <TabsTrigger value="news">Nyheter</TabsTrigger>
            <TabsTrigger value="players">Truppen</TabsTrigger>
            <TabsTrigger value="about">Om oss</TabsTrigger>
            {access?.is_owner && <TabsTrigger value="admins">Lägg till admin</TabsTrigger>}
            <TabsTrigger value="profile">Min profil</TabsTrigger>
          </TabsList>
          <TabsContent value="news" className="mt-6">
            <NewsAdmin />
          </TabsContent>
          <TabsContent value="players" className="mt-6">
            <PlayersAdmin />
          </TabsContent>
          <TabsContent value="about" className="mt-6">
            <AboutAdmin />
          </TabsContent>
          {access?.is_owner && <TabsContent value="admins" className="mt-6"><AdminInvites /></TabsContent>}
          <TabsContent value="profile" className="mt-6"><AdminProfile userId={userId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function NewsAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, body, image_url, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const savedImage = await uploadClubImage(imageFile, imageUrl);
      const values = { title: title.trim(), body, image_url: savedImage };
      const { error } = editingId ? await supabase.from('news').update(values).eq('id', editingId) : await supabase.from('news').insert(values);
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      setImageUrl("");
      setImageFile(null);
      toast.success(editingId ? "Nyhet uppdaterad" : "Nyhet publicerad");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["admin", "news"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("news").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nyhet borttagen");
      qc.invalidateQueries({ queryKey: ["news"] });
      qc.invalidateQueries({ queryKey: ["admin", "news"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <h2 className="text-2xl">{editingId ? 'Redigera nyhet' : 'Ny nyhet'}</h2>
        <div className="space-y-2">
          <Label htmlFor="n-title">Rubrik</Label>
          <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-body">Text</Label>
          <Textarea id="n-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <ClubImageField id="n-img" imageUrl={imageUrl} file={imageFile} onUrlChange={setImageUrl} onFileChange={setImageFile} disabled={create.isPending} />
        <Button type="submit" disabled={create.isPending}>
          <Save className="mr-2 h-4 w-4" /> {editingId ? 'Spara nyhet' : 'Publicera'}
        </Button>
        {editingId && <Button type="button" variant="ghost" disabled={create.isPending} onClick={() => { setEditingId(null); setTitle(''); setBody(''); setImageUrl(''); setImageFile(null); }}><X className="mr-2 h-4 w-4" />Avbryt</Button>}
      </form>

      <div className="space-y-3">
        {data?.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-card px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(item.published_at).toLocaleDateString("sv-SE")}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" disabled={create.isPending} aria-label={`Redigera ${item.title}`} title="Redigera nyhet" onClick={() => { setEditingId(item.id); setTitle(item.title); setBody(item.body); setImageUrl(item.image_url ?? ''); setImageFile(null); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label={`Ta bort ${item.title}`} title="Ta bort nyhet" disabled={remove.isPending} onClick={() => { if (window.confirm('Ta bort nyheten?')) remove.mutate(item.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayersAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [biography, setBiography] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["admin", "players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, shirt_number, position, sort_order, biography, image_url")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const values = {
        name: name.trim(),
        shirt_number: number ? Number(number) : null,
        position: position || null,
        biography,
        image_url: await uploadClubImage(imageFile, imageUrl),
      };
      const { error } = editingId ? await supabase.from('players').update(values).eq('id', editingId) : await supabase.from('players').insert({ ...values, sort_order: 100 });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setNumber("");
      setPosition("");
      setBiography("");
      setImageUrl("");
      setImageFile(null);
      toast.success(editingId ? "Spelare uppdaterad" : "Spelare tillagd");
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["admin", "players"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("players").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Spelare borttagen");
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["admin", "players"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
        className="grid gap-4 rounded-xl border border-border bg-card p-6 sm:grid-cols-4"
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="p-name">Namn</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-num">Nummer</Label>
          <Input
            id="p-num"
            type="number"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-pos">Position</Label>
          <Input id="p-pos" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-4">
          <Label htmlFor="p-bio">Spelarinfo</Label>
          <Textarea id="p-bio" rows={5} value={biography} onChange={e => setBiography(e.target.value)} />
        </div>
        <div className="sm:col-span-4"><ClubImageField id="p-img" imageUrl={imageUrl} file={imageFile} onUrlChange={setImageUrl} onFileChange={setImageFile} disabled={create.isPending} /></div>
        <Button type="submit" disabled={create.isPending} className="sm:col-span-4 sm:w-fit">
          <Save className="mr-2 h-4 w-4" /> {editingId ? 'Spara spelare' : 'Lägg till spelare'}
        </Button>
        {editingId && <Button type="button" variant="ghost" disabled={create.isPending} className="sm:col-span-4 sm:w-fit" onClick={() => { setEditingId(null); setName(''); setNumber(''); setPosition(''); setBiography(''); setImageUrl(''); setImageFile(null); }}><X className="mr-2 h-4 w-4" />Avbryt</Button>}
      </form>

      <div className="grid gap-2 sm:grid-cols-2">
        {data?.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-2"
          >
            <span className="truncate text-sm">
              <span className="mr-2 text-gold">{p.shirt_number ?? "–"}</span>
              {p.name}
            </span>
            <div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" disabled={create.isPending} aria-label={`Redigera ${p.name}`} title="Redigera spelare" onClick={() => { setEditingId(p.id); setName(p.name); setNumber(p.shirt_number?.toString() ?? ''); setPosition(p.position ?? ''); setBiography(p.biography); setImageUrl(p.image_url ?? ''); setImageFile(null); }}><Pencil className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" aria-label={`Ta bort ${p.name}`} title="Ta bort spelare" disabled={remove.isPending} onClick={() => { if (window.confirm('Ta bort spelaren?')) remove.mutate(p.id); }}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutAdmin() {
  const qc = useQueryClient();
  const [value, setValue] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["site_content", "about"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "about")
        .maybeSingle();
      if (error) throw error;
      return data?.value ?? "";
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_content")
        .upsert({ key: "about", value: value ?? data ?? "" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Om oss sparad");
      qc.invalidateQueries({ queryKey: ["site_content", "about"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <Label htmlFor="about">Text på Om oss-sidan</Label>
      <Textarea
        id="about"
        rows={12}
        value={value ?? data ?? ""}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        Spara
      </Button>
    </div>
  );
}
