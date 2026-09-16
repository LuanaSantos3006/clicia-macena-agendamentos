"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Heart, Loader2, Sparkles } from "lucide-react";

type Service = {
  id: string;
  name: string;
  description?: string;
  durationMin: number;
  priceCents: number;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value / 100);
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/services", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("services");
        setServices(await response.json());
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setServicesError(true);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return <>
    <header className="header"><div className="shell header-inner"><Link className="brand" href="/">Clicia Macena<span>nail care • agendamentos</span></Link><nav className="nav" aria-label="Navegação principal"><a href="#servicos">Serviços</a><a href="#como-funciona">Como funciona</a><Link href="/admin/login">Área administrativa</Link></nav><Link className="btn btn-primary header-cta" href="/agendar"><CalendarDays size={17}/> Agendar</Link></div></header>
    <main>
      <section className="shell hero"><div><div className="eyebrow">Seu momento de cuidado</div><h1>Beleza nos detalhes, cuidado em cada momento.</h1><p className="lead">Escolha seu serviço, encontre o melhor horário e faça seu agendamento online de forma simples.</p><div className="flow" aria-label="Etapas do agendamento"><span className="step">1. Serviço</span><span className="step">2. Data</span><span className="step">3. Horário</span><span className="step">4. Seus dados</span></div><Link className="btn btn-primary" href="/agendar"><Sparkles size={17}/> Quero agendar</Link></div><div className="hero-card"><Heart size={34}/><strong>Um espaço feito para você.</strong><p className="section-copy">Organize seu horário sem mensagens de ida e volta e veja as opções realmente disponíveis.</p></div></section>
      <section id="servicos" className="section"><div className="shell"><div className="eyebrow">Serviços</div><h2 className="section-title">Escolha seu cuidado</h2><p className="section-copy">Valores e duração atualizados diretamente pela agenda da Clicia.</p>
        {loading ? <div className="grid" aria-label="Carregando serviços">{[1,2,3].map(item => <div className="card skeleton-card" key={item}><span/><span/><span/></div>)}</div> : null}
        {!loading && servicesError ? <div className="notice notice-error" role="alert">Não foi possível carregar os serviços agora. <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button></div> : null}
        {!loading && !servicesError && services.length === 0 ? <div className="empty-state"><Sparkles/><h3>Novos horários em breve</h3><p>A Clicia ainda está preparando os serviços disponíveis.</p></div> : null}
        {!loading && services.length > 0 ? <div className="grid service-catalog">{services.map(service => <article className="card service-card" key={service.id}><div><Sparkles size={22}/><h3>{service.name}</h3><p>{service.description || "Cuidado profissional com todo carinho e atenção."}</p></div><div className="service-meta"><span>{service.durationMin} min</span><strong>{money(service.priceCents)}</strong></div><Link className="btn btn-soft" href={`/agendar?service=${encodeURIComponent(service.id)}`}>Escolher serviço</Link></article>)}</div> : null}
      </div></section>
      <section id="como-funciona" className="section section-soft"><div className="shell"><div className="eyebrow">Agendamento online</div><h2 className="section-title">Simples do começo ao fim</h2><div className="grid"><div className="card"><Sparkles/><h3>Escolha</h3><p>Selecione o serviço que deseja realizar.</p></div><div className="card"><Clock3/><h3>Encontre um horário</h3><p>Veja somente os horários que estiverem livres na agenda.</p></div><div className="card"><CalendarDays/><h3>Confirme</h3><p>Revise seus dados e receba o resumo do agendamento.</p></div></div></div></section>
    </main>
    <Link className="mobile-booking-bar" href="/agendar"><CalendarDays size={18}/> Agendar horário</Link>
    <footer className="footer"><div className="shell">© {new Date().getFullYear()} Clicia Macena • Agendamentos</div></footer>
  </>;
}
