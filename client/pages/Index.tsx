import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { classifyComplaint, detectLanguage, type ComplaintCategory, type CreateComplaintResponse } from "@shared/api";

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    headline: "Report civic issues in your language",
    sub: "CivicBot classifies your complaint in real time and generates a trackable ticket.",
    placeholder: "Describe the issue (e.g., Garbage not collected in my street)",
    predicted: "Predicted category",
    generate: "Generate Ticket",
    features: "Key capabilities",
    f1: "Multilingual input",
    f2: "Real-time classification",
    f3: "Instant ticket ID",
    f4: "Lightweight CSV storage",
    success: "Ticket created",
    ticketId: "Ticket ID",
  },
  hi: {
    headline: "अपनी भाषा में शिकायत दर्ज करें",
    sub: "CivicBot आपकी शिकायत को तुरंत वर्गीकृत करता है और एक ट्रैक करने योग्य टिकट बनाता है।",
    placeholder: "समस्या का वर्णन करें (जैसे, हमारे क्षेत्र में कचरा नहीं उठाया गया)",
    predicted: "अनुमानित श्रेणी",
    generate: "टिकट बनाएं",
    features: "मुख्य विशेषताएँ",
    f1: "बहुभाषी इनपुट",
    f2: "रीयल-टाइम वर्गीकरण",
    f3: "तुरंत टिकट आईडी",
    f4: "हल्का CSV स्टोरेज",
    success: "टिकट बनाया गया",
    ticketId: "टिकट आईडी",
  },
  ta: {
    headline: "உங்கள் மொழியில் குடிமை புகார் அளிக்கவும்",
    sub: "CivicBot உங்��ள் புகாரை உடனடியாக வகைப்படுத்தி, கண்காணிக்கத்தக்க டிக்கெட்டை உருவாக்குகிறது.",
    placeholder: "பிரச்சினையை விவரிக்கவும் (உதா., எங்கள் தெருவில் குப்பை அகற்றப்படவில்லை)",
    predicted: "கணிக்கப்பட்ட வகை",
    generate: "டிக்கெட் உருவாக்கவும்",
    features: "முக்கிய திறன்கள்",
    f1: "பலமொழி உள்ளீடு",
    f2: "உடனடி வகைப்படுத்தல்",
    f3: "உடனடி டிக்கெட் ஐடி",
    f4: "இலகு CSV சேமிப்பு",
    success: "டிக்கெட் உருவாக்கப்பட்டது",
    ticketId: "டிக்கெட் ஐடி",
  },
};

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  garbage: "Garbage",
  streetlight: "Streetlight",
  water_leak: "Water leak",
  road_damage: "Road damage",
  drainage: "Drainage",
  other: "Other",
};

export default function Index() {
  const [text, setText] = useState("");
  const [lang, setLang] = useState<string>(() => localStorage.getItem("civicbot.lang") || "en");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateComplaintResponse | null>(null);

  useEffect(() => {
    const onLang = (e: any) => setLang(e.detail);
    window.addEventListener("civicbot:language", onLang as any);
    return () => window.removeEventListener("civicbot:language", onLang as any);
  }, []);

  const detectedLang = useMemo(() => (text ? detectLanguage(text) : (lang as any)), [text, lang]);

  const classification = useMemo(() => {
    if (!text.trim()) return null;
    return classifyComplaint(text);
  }, [text]);

  const t = TRANSLATIONS[lang] ?? TRANSLATIONS.en;

  async function submit() {
    if (!text.trim()) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: detectedLang }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as CreateComplaintResponse;
      setResult(data);
      setText("");
    } catch (e) {
      // noop
    } finally {
      setSubmitting(false);
    }
  }

  const category = classification?.category ?? "other";
  const scoreMap = classification?.scoreMap;

  return (
    <main className="relative">
      <section className="bg-gradient-to-br from-primary/5 via-accent/10 to-transparent pb-16 pt-12 md:pt-20">
        <div className="container grid items-center gap-10 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span>Multilingual grievance redressal</span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-tight md:text-5xl">
              {t.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{t.sub}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Feature label={t.f1} />
              <Feature label={t.f2} />
              <Feature label={t.f3} />
              <Feature label={t.f4} />
            </div>
          </div>
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl">CivicBot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={t.placeholder}
                  rows={5}
                  className="w-full resize-none rounded-md border bg-background p-3 text-sm"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="px-3 py-1" variant="secondary">
                    {t.predicted}: {CATEGORY_LABELS[category]}
                  </Badge>
                  {scoreMap && (
                    <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {Object.entries(scoreMap).map(([k, v]) => (
                        <span key={k} className="rounded bg-muted px-2 py-0.5">
                          {k}:{" "}{v.toFixed(1)}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">Lang: {detectedLang}</span>
                </div>

                <div className="flex items-center gap-3">
                  <Button className="h-11 px-6" onClick={submit} disabled={submitting || !text.trim()}>
                    {submitting ? "Submitting..." : t.generate}
                  </Button>
                  {result && (
                    <div className="text-sm">
                      <div className="font-semibold">{t.success}</div>
                      <div className="text-muted-foreground">
                        {t.ticketId}: <span className="font-mono">{result.ticketId}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container pb-20">
        <h2 className="text-xl font-semibold">{t.features}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoCard title="Conversational UX" desc="Simple chat-like form with instant feedback." />
          <InfoCard title="XLM-RoBERTa ready" desc="Backend designed to swap in your fine-tuned model." />
          <InfoCard title="Trackability" desc="Every submission receives a unique ticket ID." />
        </div>
      </section>
    </main>
  );
}

function Feature({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm shadow-sm">
      <span className="h-2 w-2 rounded-full bg-primary" />
      <span>{label}</span>
    </div>
  );
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
