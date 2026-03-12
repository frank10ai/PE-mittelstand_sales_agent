import { getOpenAI } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json();
  const { action, lead } = body;

  if (action === "analyze") {
    return analyzeCompany(lead);
  }

  if (action === "outreach") {
    return generateOutreach(body);
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}

async function analyzeCompany(lead) {
  const prompt = `Du bist ein erfahrener M&A-Analyst für Private Equity im deutschen Mittelstand.

Analysiere folgendes Unternehmen als potenzielles Akquisitionsziel:

Firma: ${lead.company_name}
Branche: ${lead.industry}
Standort: ${lead.location}
Umsatz: ${lead.revenue_mio} Mio EUR
Mitarbeiter: ${lead.employees}
Beschreibung: ${lead.description}

Erstelle eine detaillierte Analyse mit:
1. **SWOT-Analyse** (Stärken, Schwächen, Chancen, Risiken)
2. **Marktposition** und Wettbewerbslandschaft
3. **Bewertungsindikation** (EV/EBITDA-Multiple-Range für die Branche)
4. **Synergiepotenziale** bei einem PE-Erwerb
5. **Due-Diligence-Schwerpunkte** (Top 5 Punkte)
6. **Empfehlung** (Kaufen/Beobachten/Ablehnen) mit Begründung

Antworte im JSON-Format mit den Feldern:
swot (object mit strengths, weaknesses, opportunities, threats als Arrays),
market_position (string),
valuation_range (string),
synergies (array of strings),
due_diligence_focus (array of strings),
recommendation (string: "kaufen" | "beobachten" | "ablehnen"),
recommendation_reasoning (string)`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.6,
  });

  const analysis = JSON.parse(completion.choices[0].message.content);
  return NextResponse.json(analysis);
}

async function generateOutreach(body) {
  const { lead, tone, channel } = body;

  const channelInfo = {
    email: "eine professionelle E-Mail",
    linkedin: "eine LinkedIn-Nachricht (max 300 Zeichen für InMail)",
    phone: "ein Telefonleitfaden mit Gesprächseinstieg",
  };

  const toneInfo = {
    formal: "formell und professionell",
    friendly: "freundlich aber professionell",
    direct: "direkt und auf den Punkt",
  };

  const prompt = `Du bist ein erfahrener PE-Deal-Originator im DACH-Raum.

Erstelle ${channelInfo[channel] || "eine professionelle Ansprache"} für folgendes Zielunternehmen:

Firma: ${lead.company_name}
Branche: ${lead.industry}
Standort: ${lead.location}
Ansprechpartner: ${lead.contact_name}, ${lead.contact_position}
Umsatz: ${lead.revenue_mio} Mio EUR
Beschreibung: ${lead.description}

Tonalität: ${toneInfo[tone] || "professionell"}

Wichtig:
- Keine aggressive Verkaufssprache
- Betone Partnerschaft und Wachstum
- Vermeide den Begriff "Übernahme", nutze stattdessen "strategische Partnerschaft" oder "Wachstumskapital"
- Personalisiere basierend auf der Branche und Firmenbeschreibung

Antworte im JSON-Format:
{
  "subject": "Betreff (nur bei E-Mail)",
  "message": "Der vollständige Nachrichtentext",
  "follow_up_suggestion": "Vorschlag für Follow-up nach 5-7 Tagen"
}`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const outreach = JSON.parse(completion.choices[0].message.content);
  return NextResponse.json(outreach);
}
