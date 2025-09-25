import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SUPPORTED = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "ta", label: "தமிழ்" },
];

export function Header() {
  const location = useLocation();
  const [lang, setLang] = useState<string>(() => localStorage.getItem("civicbot.lang") || "en");

  useEffect(() => {
    localStorage.setItem("civicbot.lang", lang);
    window.dispatchEvent(new CustomEvent("civicbot:language", { detail: lang }));
  }, [lang]);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-gradient-to-br from-primary to-accent" />
          <span className="text-lg font-extrabold tracking-tight">CivicBot</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className={cn("text-sm font-medium hover:text-primary", location.pathname === "/" && "text-primary")}>Home</Link>
          <Link to="/track" className={cn("text-sm font-medium hover:text-primary", location.pathname === "/track" && "text-primary")}>Track Ticket</Link>
        </nav>
        <div className="flex items-center gap-3">
          <select
            aria-label="Language"
            className="h-9 rounded-md border bg-transparent px-3 text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            {SUPPORTED.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
          <Link to="/track">
            <Button variant="secondary" size="sm">Track</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
