import { Facebook, Instagram } from "lucide-react";

import logo from "@/assets/roj-fc-logo.png.asset.json";
import { FACEBOOK_URL, INSTAGRAM_URL, SHOP_URL } from "@/lib/links";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border/70 bg-surface">
      <div className="flag-bar h-1 w-full" />
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-12 text-center">
        <img src={logo.url} alt="Roj FC klubbmärke" className="h-20 w-20" />
        <p className="max-w-md text-sm text-muted-foreground">
          Roj FC – grundad 2024. Följ laget på Instagram för matchklipp, mål och livet bakom
          kulisserna.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gold/60 px-5 py-2 text-sm font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
        >
          <Instagram className="h-4 w-4" />
          @rojfc24
        </a>
        <div className="flex flex-wrap justify-center gap-4 text-xs uppercase tracking-widest text-muted-foreground">
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-gold">
            Officiell shop
          </a>
          <span>© {new Date().getFullYear()} Roj FC</span>
        </div>
      </div>
    </footer>
  );
}
