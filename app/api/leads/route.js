import { getSupabase } from "@/lib/supabase";
import { getOpenAI } from "@/lib/openai";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const industry = searchParams.get("industry");

  let query = getSupabase()
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (industry) query = query.ilike("industry", `%${industry}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const { action } = body;

  if (action === "generate") {
    return generateLeads(body);
  }

  if (action === "save") {
    return saveLead(body.lead);
  }

  return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
}

async function generateLeads({ criteria }) {
  const { industry, region, revenue_min, revenue_max, employee_range, count } = criteria || {};
  const leadCount = Math.min(Math.max(parseInt(count) || 10, 1), 15);

  const prompt = `Du bist ein erfahrener M&A-Analyst spezialisiert auf den deutschen Mittelstand.

WICHTIG: Nutze die Web-Suche um ECHTE, existierende Unternehmen zu finden. Keine fiktiven Firmen!

Suche nach ${leadCount} echten Unternehmen als potenzielle PE-Akquisitionsziele mit folgenden Kriterien:
- Branche: ${industry || "produzierendes Gewerbe, IT, Maschinenbau"}
- Region: ${region || "DACH-Raum (Deutschland, Oesterreich, Schweiz)"}
- Umsatz: ${revenue_min || "10"}M - ${revenue_max || "100"}M EUR
- Mitarbeiter: ${employee_range || "50-500"}

Suche gezielt nach:
- Echten Mittelstandsunternehmen in der angegebenen Branche und Region
- Unternehmen die auf ihren Webseiten oder in Handelsregister-Eintraegen auffindbar sind
- B2B-Unternehmen mit erklaerungsbeduerftigem Produkt

Fuer jedes Unternehmen gib zurueck:
1. Echter Firmenname (wie er tatsaechlich heisst)
2. Branche
3. Standort (Stadt, Bundesland)
4. Geschaetzter Jahresumsatz in Mio EUR (basierend auf verfuegbaren Informationen, markiere als Schaetzung wenn nicht verifiziert)
5. Mitarbeiterzahl (basierend auf verfuegbaren Informationen)
6. Kurzbeschreibung (2-3 Saetze ueber echtes Geschaeftsmodell)
7. PE-Attraktivitaets-Score (1-10) mit Begruendung
8. Empfohlener Ansprechpartner (echter Name wenn verfuegbar, sonst typische Position)
9. Quelle/URL wo du die Firma gefunden hast

Antworte ausschliesslich im JSON-Format:
{
  "leads": [
    {
      "company_name": "...",
      "industry": "...",
      "location": "...",
      "revenue_mio": 0,
      "employees": 0,
      "description": "...",
      "pe_score": 0,
      "pe_reasoning": "...",
      "contact_name": "...",
      "contact_position": "...",
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
  const leads = parsed.leads || parsed.companies || parsed;

  return NextResponse.json({ leads: Array.isArray(leads) ? leads : [leads] });
}

async function saveLead(lead) {
  const { data, error } = await getSupabase()
    .from("leads")
    .insert({
      company_name: lead.company_name,
      industry: lead.industry,
      location: lead.location,
      revenue_mio: lead.revenue_mio,
      employees: lead.employees,
      description: lead.description,
      pe_score: lead.pe_score,
      pe_reasoning: lead.pe_reasoning,
      contact_name: lead.contact_name,
      contact_position: lead.contact_position,
      status: "neu",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
  }

  const { error } = await getSupabase().from("leads").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("leads")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
