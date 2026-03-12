import { getOpenAI } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  if (action === "scan") {
    return scanTriggerEvents(body);
  }

  if (action === "outreach") {
    return generateTriggerOutreach(body);
  }

  return NextResponse.json({ error: "Ungueltige Aktion" }, { status: 400 });
}

async function scanTriggerEvents({ filters }) {
  const {
    trigger_types = [],
    industries = "",
    region = "",
    pe_focus = false,
    count = "8",
  } = filters || {};

  const triggerList = trigger_types.length > 0
    ? trigger_types.join(", ")
    : "Neuer CEO/Geschaeftsfuehrer, PE-Einstieg, Series A/B/C Funding, Internationalisierung, Neue Produktlinie, Verfehlte Umsatzziele, Wachsendes Vertriebsteam ohne Struktur";

  const prompt = `Du bist ein erfahrener AI-Vertriebsassistent spezialisiert auf die Akquise von Beratungs- und Interim-Mandaten im Bereich Vertriebsorganisation, Commercial Excellence und KI-gestuetzte Vertriebsoptimierung.

WICHTIG: Nutze die Web-Suche um ECHTE, aktuelle Trigger-Events und ECHTE Unternehmen zu finden. Keine fiktiven Firmen oder erfundenen Events!

Suche gezielt nach aktuellen Nachrichten und Events in den letzten 3 Monaten (seit Dezember 2025):
- Fuehrungswechsel (neuer CEO, neuer Geschaeftsfuehrer, neuer CRO/Head of Sales)
- Private Equity Transaktionen und Beteiligungen
- Finanzierungsrunden (Series A, B, C)
- Expansionen und Internationalisierung
- Restrukturierungen und Transformationen

Kontext des Auftraggebers:
Er unterstuetzt B2B-Unternehmen dabei, ihre Vertriebsorganisation zu strukturieren, optimieren oder fuer Wachstum zu skalieren. Er arbeitet als Berater, Interim Head of Sales oder Interim Head of Commercial.

AUFGABE: Finde ${parseInt(count) || 8} echte, aktuelle Trigger-Events.

Filter:
- Trigger-Typen: ${triggerList}
- Branchen: ${industries || "Maschinenbau, Bauindustrie, Industrieprodukte, Metallverarbeitung, B2B Software, Medizintechnik"}
- Region: ${region || "DACH-Raum (Deutschland, Oesterreich, Schweiz)"}
- PE-Fokus: ${pe_focus ? "Ja - priorisiere PE-Portfolio-Unternehmen" : "Gemischt (Familienunternehmen + PE-Portfolio)"}

Zielunternehmen:
- Umsatz: 20-300 Mio EUR
- Mitarbeiter: 50-1000
- B2B mit erklaerungsbeduerftigem Produkt oder Dienstleistung

Suche im Web nach:
- Pressemitteilungen zu Fuehrungswechseln
- PE-Deal-News (z.B. von PE-Magazine, Unternehmeredition, Finance-Magazin, Deutsche-Startups)
- Funding-Announcements
- Expansions-Nachrichten
- Handelsblatt, WirtschaftsWoche, Manager-Magazin Meldungen

Fuer jedes echte Trigger-Event erstelle:
1. Echter Firmenname
2. Branche
3. Standort
4. Umsatz (Mio EUR - aus Quellen oder geschaetzt)
5. Mitarbeiterzahl (aus Quellen oder geschaetzt)
6. Eigentuemer (Familienunternehmen, PE-Portfolio von [echter PE-Name], Boersennotiert)
7. Was genau ist passiert (echtes Event mit Details)
8. Trigger-Typ: neuer_ceo, pe_einstieg, funding, internationalisierung, neue_produktlinie, umsatzziele_verfehlt, vertrieb_wachstum, sonstiges
9. Datum des Events
10. Warum ist das ein guter Lead (2-3 Saetze)
11. Prioritaet: high, medium oder low
12. Ansprechpartner (echter Name wenn verfuegbar)
13. Kurze LinkedIn-Nachricht (2-3 Saetze, personalisiert auf den echten Trigger)
14. Quell-URL wo du die Information gefunden hast

Antworte ausschliesslich im JSON-Format:
{
  "trigger_events": [
    {
      "company_name": "...",
      "industry": "...",
      "location": "...",
      "revenue_mio": 0,
      "employees": 0,
      "ownership": "...",
      "trigger_event": "...",
      "trigger_type": "...",
      "trigger_date": "...",
      "lead_reasoning": "...",
      "priority": "high|medium|low",
      "contact_name": "...",
      "contact_position": "...",
      "linkedin_message": "...",
      "source_url": "..."
    }
  ]
}`;

  const response = await getOpenAI().responses.create({
    model: "gpt-4o",
    tools: [{ type: "web_search_preview" }],
    input: prompt,
  });

  const text = response.output_text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: "Konnte keine Ergebnisse parsen" }, { status: 500 });
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const events = parsed.trigger_events || parsed.events || parsed;

  return NextResponse.json({
    trigger_events: Array.isArray(events) ? events : [events],
  });
}

async function generateTriggerOutreach({ trigger, channel, tone }) {
  const prompt = `Du bist ein erfahrener Vertriebsberater. Erstelle eine personalisierte ${channel === "email" ? "E-Mail" : channel === "linkedin" ? "LinkedIn-Nachricht" : "Telefonleitfaden"} fuer folgendes echtes Unternehmen.

Ton: ${tone === "formal" ? "Formell/Professionell" : tone === "friendly" ? "Freundlich/Persoenlich" : "Direkt/Auf den Punkt"}

Unternehmen: ${trigger.company_name}
Branche: ${trigger.industry}
Standort: ${trigger.location}
Eigentuemer: ${trigger.ownership}
Trigger-Event: ${trigger.trigger_event}
Ansprechpartner: ${trigger.contact_name}, ${trigger.contact_position}

Kontext: Der Absender ist ein erfahrener Vertriebsberater und Interim Manager, der B2B-Unternehmen bei der Professionalisierung ihrer Vertriebsorganisation unterstuetzt. Er bietet:
- Aufbau/Optimierung von Vertriebsorganisationen
- Sales Funnel und Pipeline-Optimierung
- Internationalisierung und neue Maerkte
- KI-gestuetzte Vertriebsoptimierung

Die Nachricht soll direkt auf den echten Trigger-Event Bezug nehmen und einen konkreten Mehrwert aufzeigen.

Antworte im JSON-Format:
{
  "subject": "..." (nur bei E-Mail),
  "message": "...",
  "follow_up_suggestion": "..." (wann und wie nachfassen)
}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  return NextResponse.json(JSON.parse(content));
}
