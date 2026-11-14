"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Loader2, Pencil, Search, Users } from "lucide-react";
import AnamnesisModal from "@/components/AnamnesisModal";
import EditClientModal from "@/components/EditClientModal";
import styles from "./ClientsManager.module.css";

export type Client = { phone: string; name: string; appointments: number; lastAppointment: string | null };

export default function ClientsManager() {
  const [items, setItems] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [anamnesisClient, setAnamnesisClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const loadClients = useCallback(async () => {
    setLoading(true);
    try { const response = await fetch("/api/admin/clients", { cache: "no-store" }); setItems(response.ok ? await response.json() : []); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadClients(); }, [loadClients]);
  const visible = useMemo(() => items.filter(item => `${item.name}${item.phone}`.toLowerCase().includes(search.toLowerCase())), [items, search]);
  if (loading) return <div className="loading-row"><Loader2 className="spin" /> Carregando clientes...</div>;
  return <>
    <div className={styles.intro}><ClipboardCheck /><div><strong>Cadastro e anamnese</strong><span>Atualize os dados e consulte as informações de cada cliente.</span></div></div>
    <label className="admin-search"><Search size={17} /><input aria-label="Pesquisar clientes" placeholder="Buscar por nome ou telefone" value={search} onChange={event => setSearch(event.target.value)} /></label>
    {visible.length === 0 ? <div className="empty-state"><Users /><h3>Nenhuma cliente cadastrada</h3><p>As clientes aparecerão aqui após o primeiro agendamento.</p></div> : <div className="client-grid">{visible.map(item => <article className="card" key={item.phone}>
      <Users size={20} /><h3>{item.name}</h3><a href={`https://wa.me/55${item.phone}`} target="_blank" rel="noreferrer">{item.phone}</a>
      <p>{item.appointments} atendimento{item.appointments === 1 ? "" : "s"}{item.lastAppointment ? ` • Último em ${new Date(item.lastAppointment).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}` : ""}</p>
      <div className={styles.actions}><button type="button" className={styles.editButton} onClick={() => setEditingClient(item)}><Pencil size={16} /> Editar cadastro</button><button type="button" className={styles.anamnesisButton} onClick={() => setAnamnesisClient(item)}><ClipboardCheck size={16} /> Anamnese</button></div>
    </article>)}</div>}
    {anamnesisClient ? <AnamnesisModal client={anamnesisClient} onClose={() => setAnamnesisClient(null)} /> : null}
    {editingClient ? <EditClientModal client={editingClient} onClose={() => setEditingClient(null)} onSaved={async () => { setEditingClient(null); await loadClients(); }} /> : null}
  </>;
}
