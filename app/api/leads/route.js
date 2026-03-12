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
  const { industry, region, revenue_min, revenue_max, employee_range } = criteria || {};

  const prompt = `Du bist ein erfahrener M&A-Analyst spezialisiert auf den deutschen Mittelstand.
Generiere 5 realistische, fiktive aber plausible Unternehmensprofile als potenzielle PE-Akquisitionsziele.

Kriterien:
- Branche: ${industry || "produzierendes Gewerbe, IT, Maschinenbau"}
- Region: ${region || "DACH-Raum"}
- Umsatz: ${revenue_min || "10"}M - ${revenue_max || "100"}M EUR
- Mitarbeiter: ${employee_range || "50-500"}

Für jedes Unternehmen gib zurück:
1. Firmenname (realistisch klingend)
2. Branche
3. Standort (Stadt, Bundesland)
4. Geschätzter Jahresumsatz in Mio EUR
5. Mitarbeiterzahl
6. Kurzbeschreibung (2-3 Sätze über Geschäftsmodell und Stärken)
7. PE-Attraktivitäts-Score (1-10) mit Begründung
8. Empfohlener Ansprechpartner (Name, Position)

Antworte ausschließlich im JSON-Format als Array von Objekten mit den Feldern:
company_name, industry, location, revenue_mio, employees, description, pe_score, pe_reasoning, contact_name, contact_position`;

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.8,
  });

  const content = completion.choices[0].message.content;
  const parsed = JSON.parse(content);
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
