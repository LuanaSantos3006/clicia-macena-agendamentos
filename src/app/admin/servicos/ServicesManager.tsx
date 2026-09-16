"use client";
import { useEffect,useState } from "react";
import { CheckCircle2, Loader2, Plus, Trash2, XCircle } from "lucide-react";
type Service={id:string;name:string;description?:string;durationMin:number;priceCents:number;active:boolean};
export default function ServicesManager(){
 const [items,setItems]=useState<Service[]>([]);const [loading,setLoading]=useState(true);const [saving,setSaving]=useState(false);const [msg,setMsg]=useState("");const [ok,setOk]=useState(false);
 async function load(){setLoading(true);const r=await fetch('/api/admin/services');if(r.ok)setItems(await r.json());setLoading(false)}
 useEffect(()=>{load()},[]);
 async function create(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(saving)return;const form=e.currentTarget;const f=new FormData(form);setSaving(true);setMsg("");
  try{const r=await fetch('/api/admin/services',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:f.get('name'),description:f.get('description'),durationMin:Number(f.get('durationMin')),price:Number(f.get('price')),active:true})});
   if(!r.ok)throw new Error();form.reset();setOk(true);setMsg('Serviço adicionado com sucesso!');await load();setTimeout(()=>setMsg(''),4000);
  }catch{setOk(false);setMsg('Não foi possível adicionar o serviço. Tente novamente.')}finally{setSaving(false)}
 }
 async function remove(id:string){if(!confirm('Excluir este serviço?'))return;const r=await fetch('/api/admin/services/'+id,{method:'DELETE'});if(r.ok){setOk(true);setMsg('Serviço excluído com sucesso.');load()}}
 return <><div className="card"><h3>Novo serviço</h3><form onSubmit={create}><div className="field"><label>Nome</label><input name="name" required disabled={saving}/></div><div className="field"><label>Descrição</label><input name="description" disabled={saving}/></div><div className="grid" style={{gridTemplateColumns:'1fr 1fr',marginTop:0}}><div className="field"><label>Duração (minutos)</label><input name="durationMin" type="number" min="15" defaultValue="60" required disabled={saving}/></div><div className="field"><label>Valor (R$)</label><input name="price" type="number" min="0" step="0.01" required disabled={saving}/></div></div><button className="btn btn-primary" type="submit" disabled={saving} aria-busy={saving} style={{opacity:saving?.7:1,cursor:saving?'not-allowed':'pointer'}}>{saving?<><Loader2 size={17}/> Salvando...</>:<><Plus size={17}/> Adicionar serviço</>}</button>{msg&&<div role="status" aria-live="polite" style={{marginTop:16,padding:'12px 14px',borderRadius:12,display:'flex',alignItems:'center',gap:9,background:ok?'#edf8f0':'#fff0f0',color:ok?'#256b3c':'#9b3030',fontWeight:600}}>{ok?<CheckCircle2 size={19}/>:<XCircle size={19}/>} {msg}</div>}</form></div><div style={{height:20}}/>{loading?<p>Carregando...</p>:items.length===0?<div className="card"><p>Nenhum serviço cadastrado ainda. Use o formulário acima para adicionar os serviços da Clicia.</p></div>:<div className="grid">{items.map(s=><div className="card" key={s.id}><h3>{s.name}</h3><p>{s.description||'Sem descrição'}</p><div className="price">R$ {(s.priceCents/100).toFixed(2).replace('.',',')} • {s.durationMin} min</div><p>{s.active?'Ativo':'Inativo'}</p><button className="btn btn-soft" onClick={()=>remove(s.id)}><Trash2 size={16}/> Excluir</button></div>)}</div>}</>
}
