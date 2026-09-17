"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CalendarDays, Clock3, ExternalLink, Menu, Settings, Sparkles, Users, X, ClipboardList } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import LogoutButton from "@/components/LogoutButton";

const menu = [
  { name: "Agenda", url: "/admin/agenda", icon: CalendarDays },
  { name: "Agendamentos", url: "/admin/agendamentos", icon: ClipboardList },
  { name: "Clientes", url: "/admin/clientes", icon: Users },
  { name: "Serviços", url: "/admin/servicos", icon: Sparkles },
  { name: "Horários", url: "/admin/horarios", icon: Clock3 },
  { name: "Configurações", url: "/admin/configuracoes", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return <aside className={`sidebar ${open ? "menu-open" : ""}`}>
    <div className="sidebar-head">
      <BrandLogo variant="admin" href="/admin"/>
      <button type="button" className="mobile-menu-toggle" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls="admin-navigation">
        {open ? <X size={19}/> : <Menu size={19}/>}<span>{open ? "Fechar" : "Menu"}</span>
      </button>
    </div>
    <div className="sidebar-collapsible">
      <nav id="admin-navigation" aria-label="Navegação administrativa">
        {menu.map(({ name, url, icon: Icon }) => <Link key={name} href={url} className={pathname === url ? "active" : ""} onClick={() => setOpen(false)}><Icon size={17}/><span>{name}</span></Link>)}
      </nav>
      <div className="sidebar-secondary">
        <Link href="/" onClick={() => setOpen(false)}><ExternalLink size={16}/> Ver página da cliente</Link>
        <LogoutButton/>
      </div>
    </div>
  </aside>;
}
