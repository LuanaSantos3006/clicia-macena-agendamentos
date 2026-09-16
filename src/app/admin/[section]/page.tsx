import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import ServicesManager from "../servicos/ServicesManager";
import HoursManager from "../horarios/HoursManager";
import AppointmentsManager from "@/components/AppointmentsManager";
import ClientsManager from "@/components/ClientsManager";
import AccountManager from "@/components/AccountManager";

const titles: Record<string, string> = { agenda: "Agenda", agendamentos: "Agendamentos", clientes: "Clientes", servicos: "Serviços", horarios: "Horários", configuracoes: "Configurações" };

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = titles[section] ?? "Administração";
  const content=section==="servicos"?<ServicesManager/>:section==="horarios"?<HoursManager/>:section==="agenda"?<AppointmentsManager agenda/>:section==="agendamentos"?<AppointmentsManager/>:section==="clientes"?<ClientsManager/>:section==="configuracoes"?<AccountManager/>:<div className="card"><p>Área não encontrada.</p></div>;
  return <main className="shell section admin-section"><div className="section-brand-row"><Link href="/admin" className="back-link"><ArrowLeft size={16}/> Dashboard</Link><BrandLogo variant="admin" href="/admin"/></div><div className="eyebrow">Área administrativa</div><h1 style={{ fontSize: 52 }}>{title}</h1>{content}</main>;
}
