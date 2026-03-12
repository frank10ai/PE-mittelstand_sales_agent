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
    : "Neuer CEO/Geschaeftsfuehrer, PE-Einstieg, Series B/C Funding, Internationalisierung, Neue Produktlinie, Verfehlte Umsatzziele, Wachsendes Vertriebsteam ohne Struktur";

  const prompt = `Du bist ein erfahrener AI-Vertriebsassistent spezialisiert auf die Akquise von Beratungs- und Interim-Mandaten im Bereich Vertriebsorganisation, Commercial Excellence und KI-gestuetzte Vertriebsoptimierung.

Dein Auftraggeber unterstuetzt B2B-Unternehmen dabei, ihre Vertriebsorganisation zu strukturieren, optimieren oder fuer Wachstum zu skalieren. Er arbeitet als Berater, Interim Head of Sales oder Interim Head of Commercial.

Typische Mandate:
- Aufbau/Professionalisierung von Vertriebsorganisationen
- Optimierung von Sales Funnels, Pipeline und Forecast
- Steigerung von Abschlussquoten und Umsatz pro Kunde
- Aufbau neuer Maerkte und Internationalisierung
- Einsatz von KI und Automatisierung im Vertrieb

AUFGABE: Generiere ${parseInt(count) || 8} realistische, fiktive aber plausible Trigger-Events fuer Unternehmen, die mit hoher Wahrscheinlichkeit Beratungs- oder Interim-Mandate im Vertrieb benoetigen.

Filter:
- Trigger-Typen: ${triggerList}
- Branchen: ${industries || "Maschinenbau, Bauindustrie, Industrieprodukte, Metallverarbeitung, B2B Software, Medizintechnik"}
- Region: ${region || "DACH-Raum"}
- PE-Fokus: ${pe_focus ? "Ja - priorisiere PE-Portfolio-Unternehmen" : "Gemischt (Familienunternehmen + PE-Portfolio)"}

Zielunternehmen:
- Umsatz: 20-300 Mio EUR
- Mitarbeiter: 50-1000
- B2B mit erklaerungsbeduerftigem Produkt oder Dienstleistung

Fuer jedes Trigger-Event erstelle:
1. Firmenname (realistisch klingend)
2. Branche
3. Standort (Stadt, Bundesland)
4. Umsatz (Mio EUR, geschaetzt)
5. Mitarbeiterzahl (geschaetzt)
6. Eigentuemer (Familienunternehmen, PE-Portfolio von [Name], oder Boersennotiert)
7. Trigger-Event (was ist passiert)
8. Trigger-Typ (einer von: neuer_ceo, pe_einstieg, funding, internationalisierung, neue_produktlinie, umsatzziele_verfehlt, vertrieb_wachstum, sonstiges)
9. Trigger-Datum (realistisches Datum der letzten 3 Monate)
10. Warum ist das ein guter Lead (2-3 Saetze: Bezug zum Trigger und warum Vertriebsberatung hier relevant ist)
11. Prioritaet: high, medium oder low
    - High: PE-Portfolio + Trigger, Neuer CEO, Vertriebsteam >10 ohne Struktur
    - Medium: Wachsender Mittelstand ohne Commercial Leader
    - Low: Kleine Firmen, reine Konsumentenprodukte
12. Empfohlener Ansprechpartner (Name, Position - typisch: CEO, GF, Head of Sales, CRO, Operating Partner)
13. Empfohlene LinkedIn-Nachricht (2-3 Saetze, personalisiert auf den Trigger)

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
      "linkedin_message": "..."
    }
  ]
}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const content = completion.choices[0].message.content;
  const parsed = JSON.parse(content);
  const events = parsed.trigger_events || parsed.events || parsed;

  return NextResponse.json({
    trigger_events: Array.isArray(events) ? events : [events],
  });
}

async function generateTriggerOutreach({ trigger, channel, tone }) {
  const prompt = `Du bist ein erfahrener Vertriebsberater. Erstelle eine personalisierte ${channel === "email" ? "E-Mail" : channel === "linkedin" ? "LinkedIn-Nachricht" : "Telefonleitfaden"} fuer folgendes Unternehmen.

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

Die Nachricht soll direkt auf den Trigger-Event Bezug nehmen und einen konkreten Mehrwert aufzeigen.

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
