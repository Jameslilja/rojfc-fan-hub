import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import logo from "@/assets/roj-fc-logo.png.asset.json";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/om-oss")({
  head: () => ({
    meta: [
      { title: "Om oss — Roj FC" },
      {
        name: "description",
        content:
          "Roj FC grundades 2024. Läs om klubbens historia, värderingar och gemenskapen bakom laget.",
      },
      { property: "og:title", content: "Om oss — Roj FC" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Historien och värderingarna bakom Roj FC." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { data, isLoading } = useQuery({
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <img src={logo.url} alt="Roj FC klubbmärke" className="mb-6 h-24 w-24" />
      <h1 className="text-4xl md:text-5xl">Om oss</h1>
      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Laddar…</p>
      ) : (
        <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-muted-foreground">
          {data}
        </p>
      )}
    </div>
  );
}
