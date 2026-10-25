import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContentDetailDialog } from "@/components/ContentDetailDialog";
import { resolveClubImages } from "@/lib/club-media";

import logo from "@/assets/roj-fc-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Roj FC — Nyheter från klubben" },
      {
        name: "description",
        content:
          "Senaste nyheterna från Roj FC. Matchrapporter, truppnytt och information om klubben som grundades 2024.",
      },
      { property: "og:title", content: "Roj FC — Nyheter från klubben" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        property: "og:description",
        content: "Senaste nyheterna, truppen och shopen för Roj FC.",
      },
    ],
  }),
  component: NewsPage,
});

function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("news")
        .select("id, title, body, image_url, published_at")
        .order("published_at", { ascending: false });
      if (error) throw error;
      return resolveClubImages(data);
    },
  });
}

function NewsPage() {
  const { data, isLoading } = useNews();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = data?.find(item => item.id === selectedId);

  return (
    <div>
      <section className="hero-gradient border-b border-border/70">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <img src={logo.url} alt="Roj FC klubbmärke" className="h-32 w-32 md:h-40 md:w-40" />
          <h1 className="text-glow text-5xl md:text-7xl">ROJ FC</h1>
          <p className="max-w-xl text-base text-muted-foreground md:text-lg">
            Est. 2024 — solen går upp över varje match. Gemenskap, glädje och fotboll med hjärta.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-3xl md:text-4xl">Senaste nytt</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Laddar nyheter…</p>
        ) : !data?.length ? (
          <p className="text-muted-foreground">Inga nyheter publicerade ännu.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {data.map((item) => (
              <article
                key={item.id}
                className="card-elevated overflow-hidden rounded-lg border border-border bg-card"
              >
                <Button variant="ghost" className="block h-auto w-full whitespace-normal rounded-none p-0 text-left hover:bg-secondary hover:text-foreground" aria-label={`Läs ${item.title}`} onClick={() => setSelectedId(item.id)}>
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    loading="lazy"
                    className="h-52 w-full object-cover"
                  />
                ) : null}
                <div className="p-6">
                  <p className="mb-2 inline-flex items-center gap-2 text-xs uppercase tracking-widest text-gold">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {new Date(item.published_at).toLocaleDateString("sv-SE")}
                  </p>
                  <h3 className="text-2xl">{item.title}</h3>
                  <p className="mt-3 line-clamp-3 whitespace-pre-line break-words text-sm text-muted-foreground">
                    {item.body}
                  </p>
                </div>
                </Button>
              </article>
            ))}
          </div>
        )}
      </section>
      <ContentDetailDialog kind="news" onClose={() => setSelectedId(null)} item={selected ? { title: selected.title, text: selected.body, imageUrl: selected.image_url, detail: new Date(selected.published_at).toLocaleDateString('sv-SE') } : null} />
    </div>
  );
}
