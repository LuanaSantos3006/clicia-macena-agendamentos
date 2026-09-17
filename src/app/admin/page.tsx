import AdminDashboard from "@/components/AdminDashboard";
import AdminSidebar from "@/components/AdminSidebar";

export default function Admin() {
  return <div className="admin-layout"><AdminSidebar/><main className="admin-main"><div className="eyebrow">Painel administrativo</div><h1 style={{ fontSize: 48 }}>Olá, Clicia.</h1><p className="section-copy">Sua agenda, clientes, serviços e horários atualizados em um só lugar.</p><AdminDashboard/></main></div>;
}
