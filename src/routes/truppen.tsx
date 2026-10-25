import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentDetailDialog } from "@/components/ContentDetailDialog";
import { resolveClubImages } from "@/lib/club-media";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/truppen")({
  head: () => ({
    meta: [
      { title: "Truppen — Roj FC" },
      {
        name: "description",
        content: "Hela Roj FC:s trupp säsongen 2024/25 med spelarnamn och tröjnummer.",
      },
      { property: "og:title", content: "Truppen — Roj FC" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Möt spelarna i Roj FC:s trupp." },
    ],
  }),
  component: SquadPage,
});

function SquadPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["players"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name, shirt_number, position, sort_order, biography, image_url")
        .order("sort_order")
        .order("name");
      if (error) throw error;
      return resolveClubImages(data);
    },
  });
  const selected = data?.find(player => player.id === selectedId);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <h1 className="text-4xl md:text-5xl">Truppen</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {data ? `${data.length} spelare` : "Roj FC:s spelartrupp"}
      </p>

      {isLoading ? (
        <p className="mt-8 text-muted-foreground">Laddar truppen…</p>
      ) : (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-lg border border-border bg-card"
            >
              <Button variant="ghost" aria-label={`Visa ${p.name}`} onClick={() => setSelectedId(p.id)} className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-none px-4 py-3 text-left hover:bg-secondary hover:text-foreground">
              {p.image_url ? <img src={p.image_url} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded-md object-cover" /> : null}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {p.shirt_number ?? "–"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="break-words font-semibold">{p.name}</p>
                {p.position ? (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {p.position}
                  </p>
                ) : null}
              </div>
              <ChevronRight className="shrink-0 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ContentDetailDialog kind="player" onClose={() => setSelectedId(null)} item={selected ? { title: selected.name, text: selected.biography, imageUrl: selected.image_url, detail: [`Tröjnummer ${selected.shirt_number ?? '–'}`, selected.position].filter(Boolean).join(' · ') } : null} />
    </div>
  );
}
