import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AdminSidebar from "@/components/AdminSidebar";
import ServicesManager from "../servicos/ServicesManager";
import HoursManager from "../horarios/HoursManager";
import AppointmentsManager from "@/components/AppointmentsManager";
import ClientsManager from "@/components/ClientsManager";
import AccountManager from "@/components/AccountManager";
import ContactSettings from "@/components/ContactSettings";
import ReportsManager from "@/components/ReportsManager";

const titles: Record<string, string> = { agenda: "Agenda", agendamentos: "Agendamentos", clientes: "Clientes", servicos: "Serviços", horarios: "Horários", relatorios: "Relatórios", configuracoes: "Configurações" };

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = titles[section] ?? "Administração";
  const content=section==="servicos"?<ServicesManager/>:section==="horarios"?<HoursManager/>:section==="agenda"?<AppointmentsManager agenda/>:section==="agendamentos"?<AppointmentsManager/>:section==="clientes"?<ClientsManager/>:section==="relatorios"?<ReportsManager/>:section==="configuracoes"?<div className="settings-stack"><ContactSettings/><AccountManager/></div>:<div className="card"><p>Área não encontrada.</p></div>;
  return <div className="admin-layout"><AdminSidebar/><main className="admin-main admin-section"><div className="section-brand-row"><Link href="/admin" className="back-link"><ArrowLeft size={16}/> Dashboard</Link></div><div className="eyebrow">Área administrativa</div><h1 style={{ fontSize: 52 }}>{title}</h1>{content}</main></div>;
}
