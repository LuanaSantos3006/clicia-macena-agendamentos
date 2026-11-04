"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Loader2, Plus, ReceiptText, Trash2, WalletCards } from "lucide-react";
import styles from "./FinanceManager.module.css";

type EntryType = "INCOME" | "EXPENSE";
type Entry = { id:string; type:EntryType; category:string; description:string; amountCents:number; date:string; paymentMethod:string };

const categories: Record<EntryType,string[]> = {
  INCOME:["Atendimento","Venda","Outro"],
  EXPENSE:["Material","Pessoal","Transporte","Conta","Outro"],
};
const paymentLabels:Record<string,string>={CASH:"Dinheiro",PIX:"Pix",CARD:"Cartão",OTHER:"Outro"};
const today=()=>new Date().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
const currentMonth=()=>today().slice(0,7);
const money=(cents:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100);
const displayDate=(value:string)=>value.split("-").reverse().join("/");

export default function FinanceManager(){
  const [entries,setEntries]=useState<Entry[]>([]);
  const [month,setMonth]=useState(currentMonth);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [type,setType]=useState<EntryType>("EXPENSE");
  const [date,setDate]=useState(today);
  const [category,setCategory]=useState("Material");
  const [description,setDescription]=useState("");
  const [amount,setAmount]=useState("");
  const [paymentMethod,setPaymentMethod]=useState("PIX");

  const load=useCallback(async()=>{setLoading(true);setError("");try{const response=await fetch(`/api/admin/finance?month=${encodeURIComponent(month)}`,{cache:"no-store"});const data=await response.json();if(!response.ok)throw new Error(data.error||"Não foi possível carregar os lançamentos.");setEntries(data)}catch(err){setError(err instanceof Error?err.message:"Não foi possível carregar os lançamentos.")}finally{setLoading(false)}},[month]);
  useEffect(()=>{load()},[load]);

  const totals=useMemo(()=>entries.reduce((sum,item)=>{if(item.type==="INCOME")sum.income+=item.amountCents;else sum.expense+=item.amountCents;return sum},{income:0,expense:0}),[entries]);

  function changeType(next:EntryType){setType(next);setCategory(categories[next][0])}
  async function submit(event:FormEvent){event.preventDefault();setSaving(true);setError("");setMessage("");try{const response=await fetch("/api/admin/finance",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type,date,category,description,amount,paymentMethod})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Não foi possível salvar.");setDescription("");setAmount("");setMessage(type==="INCOME"?"Entrada registrada com sucesso.":"Saída registrada com sucesso.");if(date.slice(0,7)!==month)setMonth(date.slice(0,7));else await load()}catch(err){setError(err instanceof Error?err.message:"Não foi possível salvar.")}finally{setSaving(false)}}
  async function remove(id:string){if(!window.confirm("Excluir este lançamento?"))return;setError("");const response=await fetch(`/api/admin/finance/${id}`,{method:"DELETE"});const data=await response.json().catch(()=>({}));if(!response.ok){setError(data.error||"Não foi possível excluir.");return}setEntries(value=>value.filter(item=>item.id!==id));setMessage("Lançamento excluído.")}

  return <section className={styles.shell} aria-label="Controle financeiro">
    <div className={styles.toolbar}><p style={{margin:0,color:"#6f675c",lineHeight:1.6}}>Registre diariamente o que entrou e o que saiu do caixa.</p><label className={styles.monthField}><span>Mês visualizado</span><input type="month" value={month} onChange={event=>setMonth(event.target.value)}/></label></div>
    <div className={styles.summary}>
      <article className={`${styles.summaryCard} ${styles.income}`}><span><ArrowUpCircle size={18}/> Entradas do mês</span><strong>{money(totals.income)}</strong></article>
      <article className={`${styles.summaryCard} ${styles.expense}`}><span><ArrowDownCircle size={18}/> Saídas do mês</span><strong>{money(totals.expense)}</strong></article>
      <article className={`${styles.summaryCard} ${styles.balance}`}><span><WalletCards size={18}/> Saldo do mês</span><strong>{money(totals.income-totals.expense)}</strong></article>
    </div>
    <form className={styles.formCard} onSubmit={submit}>
      <div className={styles.formHeader}><h2>Novo lançamento</h2><Plus size={22} color="#b1802e"/></div>
      <div className={styles.formGrid}>
        <div className={`${styles.field} ${styles.wide}`}><span>Tipo</span><div className={styles.typeToggle}><button type="button" data-active={type==="INCOME"} onClick={()=>changeType("INCOME")}><ArrowUpCircle size={17}/> Entrada</button><button type="button" data-active={type==="EXPENSE"} onClick={()=>changeType("EXPENSE")}><ArrowDownCircle size={17}/> Saída</button></div></div>
        <label className={styles.field}><span>Data</span><input type="date" value={date} onChange={event=>setDate(event.target.value)} required/></label>
        <label className={styles.field}><span>Categoria</span><select value={category} onChange={event=>setCategory(event.target.value)}>{categories[type].map(item=><option key={item}>{item}</option>)}</select></label>
        <label className={`${styles.field} ${styles.wide}`}><span>Descrição</span><input value={description} onChange={event=>setDescription(event.target.value)} placeholder={type==="INCOME"?"Ex.: Manicure e pedicure":"Ex.: Compra de esmaltes"} maxLength={120} required/></label>
        <label className={styles.field}><span>Valor (R$)</span><input inputMode="decimal" value={amount} onChange={event=>setAmount(event.target.value)} placeholder="0,00" required/></label>
        <label className={styles.field}><span>Forma de pagamento</span><select value={paymentMethod} onChange={event=>setPaymentMethod(event.target.value)}><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="OTHER">Outro</option></select></label>
        <div className={styles.wide}>{error?<p className={`${styles.message} ${styles.error}`} role="alert">{error}</p>:message?<p className={styles.message} role="status">{message}</p>:null}</div>
        <div className={styles.wide}><button className={styles.submit} disabled={saving}>{saving?<><Loader2 className={styles.spin} size={18}/> Salvando...</>:<>Salvar lançamento</>}</button></div>
      </div>
    </form>
    <div className={styles.history}>
      <div className={styles.historyHeader}><h2>Movimentações do mês</h2><ReceiptText size={22} color="#b1802e"/></div>
      {loading?<div className={styles.loading}><Loader2 className={styles.spin} size={20}/> Carregando...</div>:entries.length===0?<div className={styles.empty}><ReceiptText size={30}/><strong>Nenhum lançamento neste mês</strong><span>Use o formulário acima para fazer o primeiro registro.</span></div>:<div className={styles.list}>{entries.map(item=><article className={styles.entry} data-type={item.type} key={item.id}><div className={styles.entryIcon}>{item.type==="INCOME"?<ArrowUpCircle size={20}/>:<ArrowDownCircle size={20}/>}</div><div className={styles.entryMain}><strong>{item.description}</strong><small>{displayDate(item.date)} · {item.category} · {paymentLabels[item.paymentMethod]||item.paymentMethod}</small></div><span className={styles.entryValue}>{item.type==="INCOME"?"+ ":"− "}{money(item.amountCents)}</span><button className={styles.delete} type="button" onClick={()=>remove(item.id)} aria-label={`Excluir ${item.description}`}><Trash2 size={17}/></button></article>)}</div>}
    </div>
  </section>
}
