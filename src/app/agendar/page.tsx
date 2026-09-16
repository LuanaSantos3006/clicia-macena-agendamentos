"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, Check, CheckCircle2, Clock3, Loader2, RefreshCw, Sparkles, UserRound } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

type Service = { id: string; name: string; durationMin: number; priceCents: number; active: boolean };
type Confirmation = { id: string; status: string; service: string; startsAt: string; priceCents: number };

function money(value: number) {
  if (value <= 0) return "Valor a definir";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

function displayDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long" }).format(new Date(`${value}T12:00:00-03:00`));
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AgendarPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [phone, setPhone] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [minDate, setMinDate] = useState("");
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const selectedService = useMemo(() => services.find(service => service.id === serviceId), [services, serviceId]);
  const currentStep = !serviceId ? 1 : !date ? 2 : !time ? 3 : 4;

  useEffect(() => {
    setMinDate(new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }));
    const controller = new AbortController();
    fetch("/api/services", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error("Não foi possível carregar os serviços.");
        const data: Service[] = await response.json();
        setServices(data);
        const requested = new URLSearchParams(window.location.search).get("service");
        if (requested && data.some(service => service.id === requested)) setServiceId(requested);
      })
      .catch(err => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setTime("");
    if (!serviceId || !date) { setSlots([]); return; }
    const controller = new AbortController();
    setSlotsLoading(true);
    setSlots([]);
    setError("");
    fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Não foi possível consultar os horários.");
        setSlots(data);
      })
      .catch(err => {
        if (err instanceof Error && err.name !== "AbortError") setError(err.message);
      })
      .finally(() => setSlotsLoading(false));
    return () => controller.abort();
  }, [serviceId, date]);

  function chooseService(id: string) {
    if (saving) return;
    setServiceId(id);
    setDate("");
    setTime("");
    setError("");
  }

  async function refreshSlots() {
    if (!serviceId || !date) return;
    setSlotsLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/availability?serviceId=${encodeURIComponent(serviceId)}&date=${encodeURIComponent(date)}&refresh=${Date.now()}`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.error || "Não foi possível consultar os horários.");
      setSlots(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível consultar os horários.");
    } finally { setSlotsLoading(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !serviceId || !date || !time) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const startsAt = new Date(`${date}T${time}:00-03:00`).toISOString();
    try {
      const response = await fetch("/api/appointments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.get("name"), phone: phone.replace(/\D/g, ""), serviceId, startsAt, notes: form.get("notes") || undefined }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível confirmar o agendamento.");
      setConfirmation(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível confirmar o agendamento.");
      setTime("");
      await refreshSlots();
    } finally { setSaving(false); }
  }

  if (confirmation) {
    const confirmedDate = new Date(confirmation.startsAt);
    return <main className="shell booking-shell"><section className="success-card" aria-live="polite"><BrandLogo variant="booking"/><div className="success-icon"><CheckCircle2 size={44}/></div><div className="eyebrow">Tudo certo</div><h1>Agendamento confirmado!</h1><p className="section-copy">Seu horário foi reservado. Guarde este resumo para consultar quando precisar.</p><div className="receipt"><div><span>Serviço</span><strong>{confirmation.service}</strong></div><div><span>Data</span><strong>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "America/Sao_Paulo" }).format(confirmedDate)}</strong></div><div><span>Horário</span><strong>{new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/Sao_Paulo" }).format(confirmedDate)}</strong></div><div><span>Valor</span><strong>{money(confirmation.priceCents)}</strong></div></div><p className="confirmation-note">A Clicia receberá os dados do seu agendamento.</p><Link className="btn btn-primary" href="/">Voltar ao início</Link></section></main>;
  }

  return <main className="shell booking-shell"><section className="booking-card"><BrandLogo variant="booking"/><Link className="back-link" href="/"><ArrowLeft size={17}/> Voltar ao início</Link><header className="booking-heading"><div className="eyebrow">Agenda online</div><h1>Reserve seu horário</h1><p>Faça uma escolha por vez. Você poderá revisar tudo antes de confirmar.</p></header>
    <ol className="booking-progress" aria-label={`Etapa ${currentStep} de 4`}>{[{n:1,label:"Serviço",icon:Sparkles},{n:2,label:"Data",icon:CalendarDays},{n:3,label:"Horário",icon:Clock3},{n:4,label:"Dados",icon:UserRound}].map(({n,label,icon:Icon}) => <li key={n} className={currentStep === n ? "active" : currentStep > n ? "complete" : ""}><span>{currentStep > n ? <Check size={16}/> : <Icon size={16}/>}</span><small>{label}</small></li>)}</ol>
    <form onSubmit={submit} noValidate>
      <fieldset className="booking-section"><legend><span>1</span> Escolha o serviço</legend>{loading ? <div className="loading-row"><Loader2 className="spin"/> Carregando serviços...</div> : <div className="service-options">{services.map(service => <button type="button" key={service.id} className={`service-option ${serviceId === service.id ? "selected" : ""}`} onClick={() => chooseService(service.id)} aria-pressed={serviceId === service.id}><span><strong>{service.name}</strong><small>{service.durationMin} min</small></span><b>{money(service.priceCents)}</b>{serviceId === service.id ? <CheckCircle2 size={20}/> : null}</button>)}</div>}{!loading && services.length === 0 ? <div className="empty-state compact"><p>Nenhum serviço disponível no momento.</p></div> : null}</fieldset>
      {serviceId ? <fieldset className="booking-section"><legend><span>2</span> Escolha a data</legend><label className="field"><span>Data do atendimento</span><input required type="date" value={date} min={minDate} onChange={event => { setDate(event.target.value); setError(""); }} disabled={saving}/>{date ? <small className="field-hint">{displayDate(date)}</small> : <small className="field-hint">Selecione uma data disponível.</small>}</label></fieldset> : null}
      {serviceId && date ? <fieldset className="booking-section"><legend><span>3</span> Escolha o horário</legend>{slotsLoading ? <div className="loading-row"><Loader2 className="spin"/> Consultando a agenda...</div> : slots.length > 0 ? <div className="time-grid" role="group" aria-label="Horários disponíveis">{slots.map(slot => <button type="button" key={slot} className={time === slot ? "selected" : ""} onClick={() => { setTime(slot); setError(""); }} aria-pressed={time === slot}>{slot}</button>)}</div> : <div className="empty-state compact"><Clock3/><strong>Sem horários livres nesta data</strong><p>Escolha outra data para conferir novas opções.</p><button type="button" className="text-button" onClick={refreshSlots}><RefreshCw size={15}/> Atualizar horários</button></div>}</fieldset> : null}
      {serviceId && date && time ? <fieldset className="booking-section"><legend><span>4</span> Seus dados</legend><div className="field"><label htmlFor="name">Nome completo</label><input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Como podemos chamar você?" disabled={saving}/></div><div className="field"><label htmlFor="phone">WhatsApp</label><input id="phone" name="phone" required inputMode="tel" autoComplete="tel" value={phone} onChange={event => setPhone(formatPhone(event.target.value))} pattern="\(?\d{2}\)?\s?\d{4,5}-?\d{4}" placeholder="(11) 99999-9999" disabled={saving}/><small className="field-hint">Usado somente para contato sobre o agendamento.</small></div><div className="field"><label htmlFor="notes">Observação <span>(opcional)</span></label><textarea id="notes" name="notes" rows={3} maxLength={500} placeholder="Conte algo importante para o atendimento" disabled={saving}/></div><div className="booking-summary"><div><span>Serviço</span><strong>{selectedService?.name}</strong></div><div><span>Quando</span><strong>{displayDate(date)}, às {time}</strong></div><div><span>Duração</span><strong>{selectedService?.durationMin} min</strong></div><div><span>Valor</span><strong>{money(selectedService?.priceCents || 0)}</strong></div></div>{error ? <div className="notice notice-error" role="alert">{error}</div> : null}<button className="btn btn-primary confirm-button" disabled={saving || phone.replace(/\D/g, "").length < 10}>{saving ? <><Loader2 className="spin" size={18}/> Confirmando...</> : <><CalendarDays size={18}/> Confirmar agendamento</>}</button><p className="privacy-note">Ao confirmar, você concorda com o uso dos dados somente para organizar seu atendimento.</p></fieldset> : null}
      {error && (!serviceId || !date || !time) ? <div className="notice notice-error" role="alert">{error}</div> : null}
    </form>
  </section></main>;
}
