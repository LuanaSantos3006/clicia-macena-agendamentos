"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";

export default function AdminLogin(){
  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  async function submit(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault(); setLoading(true); setError("");
    const data=new FormData(e.currentTarget);
    const res=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:data.get("email"),password:data.get("password")})});
    const json=await res.json().catch(()=>({})); setLoading(false);
    if(!res.ok){setError(json.error||"Não foi possível entrar.");return;}
    router.push("/admin"); router.refresh();
  }
  return <main className="shell"><div className="form-card"><Link href="/" style={{display:"inline-flex",gap:8,alignItems:"center",color:"var(--muted)"}}><ArrowLeft size={16}/> Página inicial</Link><div style={{textAlign:"center",marginTop:28}}><LockKeyhole size={34} style={{margin:"0 auto 14px"}}/><div className="eyebrow">Área restrita</div><h1 style={{fontSize:42}}>Administração</h1><p className="section-copy" style={{margin:"0 auto 28px"}}>Acesso exclusivo da Clicia.</p></div><form onSubmit={submit}><div className="field"><label>E-mail</label><input required name="email" type="email" autoComplete="email" placeholder="E-mail da administradora" /></div><div className="field"><label>Senha</label><input required name="password" type="password" autoComplete="current-password" placeholder="Sua senha" /></div>{error&&<p style={{color:"#9b3030",fontSize:13}}>{error}</p>}<button disabled={loading} type="submit" className="btn btn-primary" style={{width:"100%"}}>{loading?"Entrando...":"Entrar"}</button></form></div></main>
}