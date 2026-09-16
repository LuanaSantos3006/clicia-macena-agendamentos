import Link from "next/link";
import { CalendarDays, Clock3, Settings, Sparkles, Users } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

const menu = [["Agenda", "/admin/agenda"], ["Agendamentos", "/admin/agendamentos"], ["Clientes", "/admin/clientes"], ["Serviços", "/admin/servicos"], ["Horários", "/admin/horarios"], ["Configurações", "/admin/configuracoes"]];

export default function Admin() {
  return <div className="admin-layout"><aside className="sidebar"><BrandLogo variant="admin" href="/admin"/><nav aria-label="Navegação administrativa">{menu.map(([name, url]) => <Link key={name} href={url}>{name}</Link>)}</nav><Link href="/" style={{ display: "block", marginTop: 30, fontSize: 13, color: "var(--muted)" }}>Ver página da cliente</Link></aside><main className="admin-main"><div className="eyebrow">Painel administrativo</div><h1 style={{ fontSize: 48 }}>Olá, Clicia.</h1><p className="section-copy">Controle sua agenda, serviços, valores, clientes e horários em um só lugar.</p><section className="stats"><div className="stat"><CalendarDays size={20}/><small>Agendamentos hoje</small><strong>—</strong></div><div className="stat"><Clock3 size={20}/><small>Próximos</small><strong>—</strong></div><div className="stat"><Users size={20}/><small>Clientes</small><strong>—</strong></div><div className="stat"><Sparkles size={20}/><small>Serviços ativos</small><strong>—</strong></div></section><section className="card"><Settings size={22}/><h3>Gestão da Clicia</h3><p>Use o menu para editar os serviços e preços exibidos às clientes, além de configurar seus dias e horários de atendimento.</p></section></main></div>;
}
