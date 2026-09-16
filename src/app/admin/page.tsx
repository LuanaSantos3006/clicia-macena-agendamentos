import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import AdminDashboard from "@/components/AdminDashboard";
import LogoutButton from "@/components/LogoutButton";

const menu = [["Agenda", "/admin/agenda"], ["Agendamentos", "/admin/agendamentos"], ["Clientes", "/admin/clientes"], ["Serviços", "/admin/servicos"], ["Horários", "/admin/horarios"], ["Configurações", "/admin/configuracoes"]];

export default function Admin() {
  return <div className="admin-layout"><aside className="sidebar"><BrandLogo variant="admin" href="/admin"/><nav aria-label="Navegação administrativa">{menu.map(([name, url]) => <Link key={name} href={url}>{name}</Link>)}</nav><Link href="/" style={{ display: "block", marginTop: 30, fontSize: 13 }}>Ver página da cliente</Link><LogoutButton/></aside><main className="admin-main"><div className="eyebrow">Painel administrativo</div><h1 style={{ fontSize: 48 }}>Olá, Clicia.</h1><p className="section-copy">Sua agenda, clientes, serviços e horários atualizados em um só lugar.</p><AdminDashboard/></main></div>;
}
