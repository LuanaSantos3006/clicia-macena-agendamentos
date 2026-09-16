"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import { ArrowLeft, Loader2, LockKeyhole } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const credential = await signInWithEmailAndPassword(firebaseAuth, String(data.get("email")), String(data.get("password")));
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken }) });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Não foi possível entrar.");
      router.push("/admin"); router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "E-mail ou senha inválidos.");
    } finally { setLoading(false); }
  }
  return <main className="login-page"><div className="shell"><section className="form-card"><Link href="/" className="back-link"><ArrowLeft size={16}/> Página inicial</Link><div style={{ textAlign: "center", marginTop: 22 }}><BrandLogo variant="login"/><LockKeyhole size={28} style={{ margin: "0 auto 12px", color: "var(--rose-dark)" }}/><div className="eyebrow">Área restrita</div><h1 style={{ fontSize: 42 }}>Administração</h1><p className="section-copy" style={{ margin: "0 auto 28px" }}>Acesso exclusivo da Clicia.</p></div><form onSubmit={submit}><div className="field"><label htmlFor="email">E-mail</label><input id="email" required name="email" type="email" autoComplete="email" placeholder="E-mail da administradora"/></div><div className="field"><label htmlFor="password">Senha</label><input id="password" required name="password" type="password" autoComplete="current-password" placeholder="Sua senha"/></div>{error ? <div className="notice notice-error" role="alert">{error}</div> : null}<button disabled={loading} type="submit" className="btn btn-primary" style={{ width: "100%" }}>{loading ? <><Loader2 className="spin" size={17}/> Entrando...</> : "Entrar"}</button></form></section></div></main>;
}
