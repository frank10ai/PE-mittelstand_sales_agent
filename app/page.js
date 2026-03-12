"use client";

import { useState, useEffect } from "react";

const STATUS_LABELS = {
  neu: "Neu",
  kontaktiert: "Kontaktiert",
  interessiert: "Interessiert",
  abgelehnt: "Abgelehnt",
};

const STATUS_COLORS = {
  neu: "bg-blue-100 text-blue-800",
  kontaktiert: "bg-yellow-100 text-yellow-800",
  interessiert: "bg-green-100 text-green-800",
  abgelehnt: "bg-red-100 text-red-800",
};

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [generatedLeads, setGeneratedLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedLead, setSelectedLead] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [outreach, setOutreach] = useState(null);
  const [outreachChannel, setOutreachChannel] = useState("email");
  const [outreachTone, setOutreachTone] = useState("formal");
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingOutreach, setGeneratingOutreach] = useState(false);
  const [savingLead, setSavingLead] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [criteria, setCriteria] = useState({
    industry: "",
    region: "",
    revenue_min: "10",
    revenue_max: "100",
    employee_range: "50-500",
    count: "10",
  });

  useEffect(() => {
    if (activeTab === "pipeline") fetchLeads();
  }, [activeTab]);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      if (Array.isArray(data)) setLeads(data);
    } catch (err) {
      console.error("Fehler beim Laden der Leads:", err);
    }
  }

  async function handleGenerate() {
    setLoading(true);
    setGeneratedLeads([]);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate", criteria }),
      });
      const data = await res.json();
      if (data.leads) setGeneratedLeads(data.leads);
    } catch (err) {
      console.error("Fehler bei Lead-Generierung:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveLead(lead) {
    setSavingLead(lead.company_name);
    setSaveError(null);
    setSaveSuccess(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", lead }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedLeads((prev) =>
          prev.filter((l) => l.company_name !== lead.company_name)
        );
        setSaveSuccess(`"${lead.company_name}" wurde in die Pipeline gespeichert.`);
        setTimeout(() => setSaveSuccess(null), 4000);
      } else {
        setSaveError(`Fehler beim Speichern: ${data.error || "Unbekannter Fehler"}`);
        setTimeout(() => setSaveError(null), 5000);
      }
    } catch (err) {
      setSaveError(`Fehler beim Speichern: ${err.message}`);
      setTimeout(() => setSaveError(null), 5000);
    } finally {
      setSavingLead(null);
    }
  }

  async function handleAnalyze(lead) {
    setSelectedLead(lead);
    setAnalysis(null);
    setOutreach(null);
    setAnalyzing(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "analyze", lead }),
      });
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      console.error("Fehler bei Analyse:", err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleOutreach(lead) {
    setGeneratingOutreach(true);
    setOutreach(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "outreach",
          lead,
          channel: outreachChannel,
          tone: outreachTone,
        }),
      });
      const data = await res.json();
      setOutreach(data);
    } catch (err) {
      console.error("Fehler bei Outreach:", err);
    } finally {
      setGeneratingOutreach(false);
    }
  }

  async function handleStatusUpdate(id, status) {
    try {
      await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchLeads();
    } catch (err) {
      console.error("Fehler beim Status-Update:", err);
    }
  }

  async function handleDelete(id) {
    try {
      await fetch(`/api/leads?id=${id}`, { method: "DELETE" });
      fetchLeads();
    } catch (err) {
      console.error("Fehler beim Löschen:", err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">
              PE Mittelstand Sales Agent
            </h1>
            <p className="text-sm text-black">
              KI-gestutzte Lead-Generierung fur Private Equity
            </p>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {[
              { key: "generate", label: "Lead-Generierung" },
              { key: "pipeline", label: "Pipeline" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-white text-black shadow-sm"
                    : "text-black/70 hover:text-black"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Success/Error Banners */}
        {saveSuccess && (
          <div className="mb-4 px-4 py-3 bg-green-100 border border-green-300 text-green-900 rounded-md text-sm">
            {saveSuccess}
          </div>
        )}
        {saveError && (
          <div className="mb-4 px-4 py-3 bg-red-100 border border-red-300 text-red-900 rounded-md text-sm">
            {saveError}
          </div>
        )}

        {activeTab === "generate" && (
          <div className="space-y-6">
            {/* Criteria Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-black mb-4">
                Suchkriterien
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Branche
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Maschinenbau, IT, Medizintechnik"
                    value={criteria.industry}
                    onChange={(e) =>
                      setCriteria({ ...criteria, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Region
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Bayern, NRW, DACH"
                    value={criteria.region}
                    onChange={(e) =>
                      setCriteria({ ...criteria, region: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Mitarbeiter
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. 50-500"
                    value={criteria.employee_range}
                    onChange={(e) =>
                      setCriteria({
                        ...criteria,
                        employee_range: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Umsatz von (Mio EUR)
                  </label>
                  <input
                    type="number"
                    value={criteria.revenue_min}
                    onChange={(e) =>
                      setCriteria({ ...criteria, revenue_min: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Umsatz bis (Mio EUR)
                  </label>
                  <input
                    type="number"
                    value={criteria.revenue_max}
                    onChange={(e) =>
                      setCriteria({ ...criteria, revenue_max: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Anzahl Leads
                  </label>
                  <select
                    value={criteria.count}
                    onChange={(e) =>
                      setCriteria({ ...criteria, count: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="5">5 Leads</option>
                    <option value="10">10 Leads</option>
                    <option value="15">15 Leads</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Generiere Leads..." : "Leads generieren"}
                </button>
              </div>
            </div>

            {/* Generated Leads */}
            {generatedLeads.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-black">
                    Generierte Leads ({generatedLeads.length})
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
                    <span className="text-xs text-amber-800 font-medium">
                      Hinweis: Alle Daten (Umsatz, Mitarbeiter, etc.) sind KI-generierte Schatzungen, keine verifizierten Quellen.
                    </span>
                  </div>
                </div>
                {generatedLeads.map((lead, idx) => (
                  <LeadCard
                    key={idx}
                    lead={lead}
                    onSave={() => handleSaveLead(lead)}
                    onAnalyze={() => handleAnalyze(lead)}
                    saving={savingLead === lead.company_name}
                  />
                ))}
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-black">
                    KI generiert Leads basierend auf deinen Kriterien...
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "pipeline" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-black">
                Lead Pipeline ({leads.length})
              </h2>
              <button
                onClick={fetchLeads}
                className="px-3 py-1.5 text-sm text-black border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Aktualisieren
              </button>
            </div>

            {leads.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-black">
                  Noch keine Leads in der Pipeline. Generiere zuerst Leads und
                  speichere sie.
                </p>
              </div>
            ) : (
              leads.map((lead) => (
                <PipelineCard
                  key={lead.id}
                  lead={lead}
                  onStatusUpdate={handleStatusUpdate}
                  onDelete={handleDelete}
                  onAnalyze={() => handleAnalyze(lead)}
                />
              ))
            )}
          </div>
        )}

        {/* Analysis & Outreach Panel */}
        {selectedLead && (
          <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-10 z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 mb-10">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-black">
                  {selectedLead.company_name}
                </h3>
                <button
                  onClick={() => {
                    setSelectedLead(null);
                    setAnalysis(null);
                    setOutreach(null);
                  }}
                  className="text-gray-400 hover:text-black text-xl leading-none"
                >
                  x
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Analysis */}
                {analyzing && (
                  <div className="flex items-center gap-3 text-sm text-black">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    Analysiere Unternehmen...
                  </div>
                )}

                {analysis && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          analysis.recommendation === "kaufen"
                            ? "bg-green-100 text-green-800"
                            : analysis.recommendation === "beobachten"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        Empfehlung:{" "}
                        {analysis.recommendation?.charAt(0).toUpperCase() +
                          analysis.recommendation?.slice(1)}
                      </span>
                      <span className="text-sm text-black">
                        Bewertung: {analysis.valuation_range}
                      </span>
                    </div>

                    <p className="text-sm text-black">
                      {analysis.recommendation_reasoning}
                    </p>

                    {analysis.swot && (
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          {
                            key: "strengths",
                            label: "Starken",
                            color: "green",
                          },
                          {
                            key: "weaknesses",
                            label: "Schwachen",
                            color: "red",
                          },
                          {
                            key: "opportunities",
                            label: "Chancen",
                            color: "blue",
                          },
                          {
                            key: "threats",
                            label: "Risiken",
                            color: "orange",
                          },
                        ].map(({ key, label, color }) => (
                          <div
                            key={key}
                            className={`bg-${color}-50 rounded-md p-3`}
                          >
                            <h5
                              className={`text-sm font-medium text-${color}-800 mb-1`}
                            >
                              {label}
                            </h5>
                            <ul className="text-xs text-black space-y-1">
                              {analysis.swot[key]?.map((item, i) => (
                                <li key={i}>- {item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.due_diligence_focus && (
                      <div>
                        <h5 className="text-sm font-medium text-black mb-1">
                          Due-Diligence-Schwerpunkte
                        </h5>
                        <ul className="text-sm text-black space-y-1">
                          {analysis.due_diligence_focus.map((item, i) => (
                            <li key={i}>
                              {i + 1}. {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Outreach Section */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-semibold text-black mb-3">
                    Outreach generieren
                  </h4>
                  <div className="flex gap-3 mb-3">
                    <select
                      value={outreachChannel}
                      onChange={(e) => setOutreachChannel(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="email">E-Mail</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="phone">Telefon</option>
                    </select>
                    <select
                      value={outreachTone}
                      onChange={(e) => setOutreachTone(e.target.value)}
                      className="px-3 py-1.5 border border-gray-300 rounded-md text-sm text-black"
                    >
                      <option value="formal">Formell</option>
                      <option value="friendly">Freundlich</option>
                      <option value="direct">Direkt</option>
                    </select>
                    <button
                      onClick={() => handleOutreach(selectedLead)}
                      disabled={generatingOutreach}
                      className="px-4 py-1.5 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {generatingOutreach ? "Generiere..." : "Generieren"}
                    </button>
                  </div>

                  {outreach && (
                    <div className="bg-gray-50 rounded-md p-4 space-y-3">
                      {outreach.subject && (
                        <div>
                          <span className="text-xs font-medium text-black/60">
                            Betreff:
                          </span>
                          <p className="text-sm text-black">
                            {outreach.subject}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs font-medium text-black/60">
                          Nachricht:
                        </span>
                        <p className="text-sm text-black whitespace-pre-wrap">
                          {outreach.message}
                        </p>
                      </div>
                      {outreach.follow_up_suggestion && (
                        <div>
                          <span className="text-xs font-medium text-black/60">
                            Follow-up:
                          </span>
                          <p className="text-sm text-black">
                            {outreach.follow_up_suggestion}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(outreach.message)
                        }
                        className="px-3 py-1 text-xs text-black border border-gray-300 rounded-md hover:bg-gray-100"
                      >
                        Kopieren
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LeadCard({ lead, onSave, onAnalyze, saving }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-black">
              {lead.company_name}
            </h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              Score: {lead.pe_score}/10
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-black mb-2">
            <span>{lead.industry}</span>
            <span>{lead.location}</span>
            <span>~{lead.revenue_mio} Mio EUR (Schatzung)</span>
            <span>~{lead.employees} Mitarbeiter (Schatzung)</span>
          </div>
          <p className="text-sm text-black mb-2">{lead.description}</p>
          <p className="text-xs text-black/70">
            <span className="font-medium">PE-Begrundung:</span>{" "}
            {lead.pe_reasoning}
          </p>
          <p className="text-xs text-black/70 mt-1">
            <span className="font-medium">Kontakt:</span> {lead.contact_name},{" "}
            {lead.contact_position}
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <button
            onClick={onAnalyze}
            className="px-3 py-1.5 text-sm text-black border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Analysieren
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Speichern..." : "In Pipeline speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PipelineCard({ lead, onStatusUpdate, onDelete, onAnalyze }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-base font-semibold text-black">
              {lead.company_name}
            </h3>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                STATUS_COLORS[lead.status] || "bg-gray-100 text-gray-800"
              }`}
            >
              {STATUS_LABELS[lead.status] || lead.status}
            </span>
            {lead.pe_score && (
              <span className="text-xs text-black/60">
                Score: {lead.pe_score}/10
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-black mb-2">
            <span>{lead.industry}</span>
            <span>{lead.location}</span>
            <span>~{lead.revenue_mio} Mio EUR (Schatzung)</span>
            <span>~{lead.employees} Mitarbeiter (Schatzung)</span>
          </div>
          <p className="text-sm text-black">{lead.description}</p>
        </div>
        <div className="flex flex-col gap-2 ml-4">
          <select
            value={lead.status}
            onChange={(e) => onStatusUpdate(lead.id, e.target.value)}
            className="px-2 py-1 text-xs text-black border border-gray-300 rounded-md"
          >
            {Object.entries(STATUS_LABELS).map(([val, label]) => (
              <option key={val} value={val}>
                {label}
              </option>
            ))}
          </select>
          <button
            onClick={onAnalyze}
            className="px-3 py-1 text-xs text-black border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Analysieren
          </button>
          <button
            onClick={() => onDelete(lead.id)}
            className="px-3 py-1 text-xs text-red-600 border border-red-200 rounded-md hover:bg-red-50"
          >
            Loschen
          </button>
        </div>
      </div>
    </div>
  );
}
