"use client";
import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, ExternalLink, Loader2, RefreshCw } from "lucide-react";

type CalendarStatus = { configured: boolean; connected: boolean; accountEmail: string | null; connectedAt: string | null };
export default function GoogleCalendarSettings() {
  const [status, setStatus] = useState<CalendarStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function load() {
    const response = await fetch("/api/admin/google-calendar/status", { cache: "no-store" });
    if (response.ok) setStatus(await response.json());
  }
  useEffect(() => { void load(); }, []);
  async function sync() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/admin/google-calendar/sync", { method: "POST" });
    const data = await response.json().catch(() => ({}));
    setMessage(response.ok ? `${data.imported} evento(s) sincronizado(s).` : (data.error || "Não foi possível sincronizar."));
    setBusy(false); await load();
  }
  if (!status) return <div className="loading-row"><Loader2 className="spin"/> Verificando conexão do Google...</div>;
  return <section className="card" style={{ marginBottom: 24 }}>
    <div className="eyebrow">Integração</div>
    <h2 style={{ marginTop: 4 }}>Google Calendar</h2>
    <p className="section-copy">Os eventos da agenda serão importados como agendamentos pendentes. O pagamento continua sendo confirmado por você no app.</p>
    {status.connected ? <p style={{ display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={18}/> Conectado{status.accountEmail ? ` à conta ${status.accountEmail}` : ""}</p> : <p>{status.configured ? "Sua conta Google ainda não foi conectada." : "A conexão ainda precisa ser configurada no ambiente do app."}</p>}
    {message ? <div className="notice" role="status">{message}</div> : null}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
      {!status.connected ? <a className="btn btn-primary" href="/api/admin/google-calendar/connect" aria-disabled={!status.configured} style={!status.configured ? { opacity: .55, pointerEvents: "none" } : undefined}><CalendarDays size={16}/> Conectar Google Calendar <ExternalLink size={14}/></a> : <button className="btn btn-primary" disabled={busy} onClick={()=>void sync()}>{busy ? <Loader2 className="spin" size={16}/> : <RefreshCw size={16}/>} Sincronizar agora</button>}
    </div>
    {!status.configured ? <small style={{ display: "block", marginTop: 12 }}>Para habilitar o botão, o projeto precisa receber as credenciais OAuth do Google no ambiente de produção e no ambiente de prévia.</small> : null}
  </section>;
}
