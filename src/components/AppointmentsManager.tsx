"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, CheckCircle2, Clock3, Loader2, Search, Trash2, X } from "lucide-react";

type Appointment = { id:string; clientName:string; phone:string; serviceName:string; startsAt:string; endsAt:string; priceCents:number; status:string; notes?:string|null };
const labels:Record<string,string>={PENDING:"Pendente",CONFIRMED:"Confirmado",COMPLETED:"Concluído",CANCELLED:"Cancelado",CANCELED:"Cancelado"};
const money=(value:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(value/100);

export default function AppointmentsManager({ agenda=false }:{agenda?:boolean}) {
  const [items,setItems]=useState<Appointment[]>([]),[loading,setLoading]=useState(true),[search,setSearch]=useState(""),[filter,setFilter]=useState("ALL"),[message,setMessage]=useState("");
  async function load(){setLoading(true);const r=await fetch("/api/admin/appointments",{cache:"no-store"});if(r.ok)setItems(await r.json());else setMessage("Não foi possível carregar os agendamentos.");setLoading(false)}
  useEffect(()=>{void load()},[]);
  const visible=useMemo(()=>items.filter(item=>{
    const term=search.toLowerCase(),matches=!term||item.clientName.toLowerCase().includes(term)||item.phone.includes(term)||item.serviceName.toLowerCase().includes(term);
    const future=new Date(item.startsAt).getTime()>=Date.now()-86400000;
    return matches&&(filter==="ALL"||item.status===filter)&&(!agenda||future);
  }),[items,search,filter,agenda]);
  async function update(id:string,status:string){const r=await fetch(`/api/admin/appointments/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});setMessage(r.ok?"Agendamento atualizado.":"Não foi possível atualizar.");if(r.ok)await load()}
  async function remove(id:string){if(!confirm("Excluir este agendamento definitivamente?"))return;const r=await fetch(`/api/admin/appointments/${id}`,{method:"DELETE"});setMessage(r.ok?"Agendamento excluído.":"Não foi possível excluir.");if(r.ok)await load()}
  if(loading)return <div className="loading-row"><Loader2 className="spin"/> Carregando agenda...</div>;
  return <><div className="admin-toolbar"><label className="admin-search"><Search size={17}/><input aria-label="Pesquisar" placeholder="Buscar cliente, telefone ou serviço" value={search} onChange={e=>setSearch(e.target.value)}/></label><select aria-label="Filtrar status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">Todos os status</option><option value="PENDING">Pendentes</option><option value="CONFIRMED">Confirmados</option><option value="COMPLETED">Concluídos</option><option value="CANCELLED">Cancelados</option></select></div>
  {message?<div className="notice" role="status">{message}</div>:null}
  {visible.length===0?<div className="empty-state"><CalendarDays/><h3>Nenhum agendamento</h3><p>A agenda está livre e pronta para receber novas clientes.</p></div>:<div className="appointment-list">{visible.map(item=>{const date=new Date(item.startsAt);return <article className="appointment-card" key={item.id}><div className="appointment-date"><strong>{date.toLocaleDateString("pt-BR",{day:"2-digit",month:"short",timeZone:"America/Sao_Paulo"})}</strong><span>{date.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",timeZone:"America/Sao_Paulo"})}</span></div><div className="appointment-info"><div><span className={`status-pill status-${item.status.toLowerCase()}`}>{labels[item.status]||item.status}</span><h3>{item.clientName}</h3><p>{item.serviceName} • {money(item.priceCents)}</p><a href={`https://wa.me/55${item.phone}`} target="_blank" rel="noreferrer">{item.phone}</a>{item.notes?<small>Observação: {item.notes}</small>:null}</div><div className="appointment-actions">{item.status==="PENDING"?<button className="btn btn-primary" onClick={()=>update(item.id,"CONFIRMED")}><Check size={16}/> Confirmar</button>:null}{item.status!=="COMPLETED"&&item.status!=="CANCELLED"?<button className="btn btn-soft" onClick={()=>update(item.id,"COMPLETED")}><CheckCircle2 size={16}/> Concluir</button>:null}{item.status!=="CANCELLED"?<button className="btn btn-soft" onClick={()=>update(item.id,"CANCELLED")}><X size={16}/> Cancelar</button>:null}<button className="icon-button danger" aria-label="Excluir" onClick={()=>remove(item.id)}><Trash2 size={17}/></button></div></div></article>})}</div>}</>;
}
