import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { LogOut, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Admin — Roj FC" },
      { name: "description", content: "Inloggning för Roj FC:s administratörer." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin — Roj FC" },
      { property: "og:description", content: "Inloggning för Roj FC:s administratörer." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="mx-auto max-w-md px-4 py-20 text-muted-foreground">…</div>;
  if (!session) return <LoginCard />;
  return <AdminPanel email={session.user.email ?? ""} />;
}

function LoginCard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("Konto skapat! Kolla din e-post för att bekräfta.");
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="text-4xl">Admin</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Logga in för att redigera nyheter, truppen och Om oss.
      </p>
      <form onSubmit={signIn} className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="email">E-post</Label>
          <Input
            id="email"
            type="email"
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
      </form>
    </div>
  );
}

function AdminPanel({ email }: { email: string }) {
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("role", "admin");
      if (error) throw error;
      return (data?.length ?? 0) > 0;
    },
  });

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
      ) : !isAdmin ? (
        <p className="mt-10 rounded-lg border border-border bg-card p-6 text-muted-foreground">
          Ditt konto saknar administratörsbehörighet. Kontakta klubbens huvudadmin.
        </p>
      ) : (
        <Tabs defaultValue="news" className="mt-10">
          <TabsList>
            <TabsTrigger value="news">Nyheter</TabsTrigger>
            <TabsTrigger value="players">Truppen</TabsTrigger>
            <TabsTrigger value="about">Om oss</TabsTrigger>
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

  const { data } = useQuery({
    queryKey: ["news"],
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
      const { error } = await supabase
        .from("news")
        .insert({ title, body, image_url: imageUrl || null });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle("");
      setBody("");
      setImageUrl("");
      toast.success("Nyhet publicerad");
      qc.invalidateQueries({ queryKey: ["news"] });
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
        <h2 className="text-2xl">Ny nyhet</h2>
        <div className="space-y-2">
          <Label htmlFor="n-title">Rubrik</Label>
          <Input id="n-title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-body">Text</Label>
          <Textarea id="n-body" rows={5} value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="n-img">Bild-URL (valfritt)</Label>
          <Input id="n-img" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <Button type="submit" disabled={create.isPending}>
          <Plus className="mr-2 h-4 w-4" /> Publicera
        </Button>
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
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(item.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
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

  const { data } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, shirt_number, position, sort_order")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("players").insert({
        name,
        shirt_number: number ? Number(number) : null,
        position: position || null,
        sort_order: 100,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setNumber("");
      setPosition("");
      toast.success("Spelare tillagd");
      qc.invalidateQueries({ queryKey: ["players"] });
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
        <Button type="submit" disabled={create.isPending} className="sm:col-span-4 sm:w-fit">
          <Plus className="mr-2 h-4 w-4" /> Lägg till spelare
        </Button>
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
            <Button variant="ghost" size="icon" onClick={() => remove.mutate(p.id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
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
        .upsert({ key: "about", value: value ?? "" });
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
