import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import ServicesManager from "../servicos/ServicesManager";
import HoursManager from "../horarios/HoursManager";

const titles: Record<string, string> = { agenda: "Agenda", agendamentos: "Agendamentos", clientes: "Clientes", servicos: "Serviços", horarios: "Horários", configuracoes: "Configurações" };

export default async function Section({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const title = titles[section] ?? "Administração";
  return <main className="shell section"><div className="section-brand-row"><Link href="/admin" className="back-link"><ArrowLeft size={16}/> Dashboard</Link><BrandLogo variant="admin" href="/admin"/></div><div className="eyebrow">Área administrativa</div><h1 style={{ fontSize: 52 }}>{title}</h1>{section === "servicos" ? <ServicesManager/> : section === "horarios" ? <HoursManager/> : <div className="card"><h3>{title}</h3><p>Esta área será conectada ao Firestore na próxima etapa.</p></div>}</main>;
}
