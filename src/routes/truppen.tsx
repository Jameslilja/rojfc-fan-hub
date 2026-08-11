import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

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
      { property: "og:description", content: "Möt spelarna i Roj FC:s trupp." },
    ],
  }),
  component: SquadPage,
});

function SquadPage() {
  const { data, isLoading } = useQuery({
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
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {p.shirt_number ?? "–"}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{p.name}</p>
                {p.position ? (
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {p.position}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
