import { Link } from "@tanstack/react-router";
import { Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";

import logo from "@/assets/roj-fc-logo.png.asset.json";
import { SHOP_URL } from "@/lib/links";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Nyheter" },
  { to: "/truppen", label: "Truppen" },
  { to: "/om-oss", label: "Om oss" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  const linkClass =
    "px-3 py-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-gold";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <img src={logo.url} alt="Roj FC klubbmärke" className="h-12 w-12 shrink-0" />
          <span className="font-display text-2xl leading-none text-foreground">
            ROJ <span className="text-gold">FC</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            <span className="inline-flex items-center gap-1">
              <ShoppingBag className="h-4 w-4" /> Shop
            </span>
          </a>
          <Link
            to="/admin"
            className="ml-2 rounded-md border border-gold/60 px-3 py-2 text-sm font-semibold uppercase tracking-wider text-gold transition-colors hover:bg-gold hover:text-gold-foreground"
          >
            Admin
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Meny"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto rounded-md border border-border p-2 text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={cn("border-t border-border/70 md:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-6xl flex-col px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={linkClass}
              onClick={() => setOpen(false)}
              activeOptions={{ exact: item.to === "/" }}
              activeProps={{ className: "text-gold" }}
            >
              {item.label}
            </Link>
          ))}
          <a href={SHOP_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
            Shop
          </a>
          <Link to="/admin" className={linkClass} onClick={() => setOpen(false)}>
            Admin
          </Link>
        </nav>
      </div>
      <div className="flag-bar h-1 w-full" />
    </header>
  );
}
