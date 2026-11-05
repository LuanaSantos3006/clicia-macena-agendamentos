"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { CalendarRange, Check, CircleDollarSign, Hand, PackageCheck, Plus, Trash2, UserRound } from "lucide-react";
import styles from "./MonthlyPackagesManager.module.css";

type Session = {
  id: "1" | "2" | "3" | "4";
  label: string;
  manicure: number;
  pedicure: number;
  completed: boolean;
  completedAt: string | null;
};

type MonthlyPackage = {
  id: string;
  clientName: string;
  phone: string;
  month: string;
  amountCents: number;
  paymentMethod: "CASH" | "PIX" | "CARD" | "PENDING";
  notes?: string;
  sessions: Session[];
  status: "ACTIVE" | "COMPLETED";
};

const paymentLabels = { CASH: "Dinheiro", PIX: "Pix", CARD: "Cartão", PENDING: "Pendente" } as const;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function displayMonth(month: string) {
  const [year, value] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(new Date(year, value - 1, 1));
}

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export default function MonthlyPackagesManager() {
  const [month, setMonth] = useState(currentMonth);
  const [packages, setPackages] = useState<MonthlyPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/monthly-packages?month=${month}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível carregar os pacotes.");
      setPackages(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível carregar os pacotes.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { void loadPackages(); }, [loadPackages]);

  const summary = useMemo(() => packages.reduce((total, item) => {
    total.active += item.status === "ACTIVE" ? 1 : 0;
    total.completed += item.status === "COMPLETED" ? 1 : 0;
    total.received += item.paymentMethod === "PENDING" ? 0 : item.amountCents;
    return total;
  }, { active: 0, completed: 0, received: 0 }), [packages]);

  async function createPackage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch("/api/admin/monthly-packages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível cadastrar o pacote.");
      event.currentTarget.reset();
      setMessage("Pacote mensal cadastrado com sucesso.");
      await loadPackages();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível cadastrar o pacote.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSession(packageId: string, session: Session) {
    const key = `${packageId}-${session.id}`;
    setBusy(key);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/monthly-packages/${packageId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: session.id, completed: !session.completed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível atualizar a sessão.");
      await loadPackages();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível atualizar a sessão.");
    } finally {
      setBusy("");
    }
  }

  async function removePackage(item: MonthlyPackage) {
    if (!window.confirm(`Excluir o pacote de ${item.clientName}?`)) return;
    setBusy(item.id);
    try {
      const response = await fetch(`/api/admin/monthly-packages/${item.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível excluir o pacote.");
      setMessage("Pacote excluído.");
      await loadPackages();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível excluir o pacote.");
    } finally {
      setBusy("");
    }
  }

  return <div className={styles.page}>
    <section className={styles.intro}>
      <div>
        <span className={styles.kicker}><PackageCheck size={16}/> Controle exclusivo</span>
        <h2>Pacotes do mês</h2>
        <p>Cada pacote inclui quatro sessões: duas de mão e pé e duas somente de mão.</p>
      </div>
      <label className={styles.monthPicker}>Mês de referência<input type="month" value={month} onChange={event => setMonth(event.target.value)}/></label>
    </section>

    <section className={styles.summary} aria-label="Resumo dos pacotes">
      <article><CalendarRange/><div><strong>{summary.active}</strong><span>Em andamento</span></div></article>
      <article><Check/><div><strong>{summary.completed}</strong><span>Concluídos</span></div></article>
      <article><CircleDollarSign/><div><strong>{money(summary.received)}</strong><span>Valores recebidos</span></div></article>
    </section>

    <section className={styles.formCard}>
      <div className={styles.cardHeading}><div className={styles.iconBox}><Plus/></div><div><h3>Novo pacote mensal</h3><p>Cadastre a cliente e comece o acompanhamento das sessões.</p></div></div>
      <form onSubmit={createPackage} className={styles.form}>
        <label>Nome da cliente<input name="clientName" placeholder="Nome completo" required minLength={2}/></label>
        <label>WhatsApp<input name="phone" type="tel" placeholder="(11) 99999-9999" required minLength={8}/></label>
        <label>Mês do pacote<input name="month" type="month" value={month} onChange={event => setMonth(event.target.value)} required/></label>
        <label>Valor do pacote<input name="amount" inputMode="decimal" placeholder="0,00" required/></label>
        <label>Pagamento<select name="paymentMethod" defaultValue="PIX"><option value="PIX">Pix</option><option value="CASH">Dinheiro</option><option value="CARD">Cartão</option><option value="PENDING">Pendente</option></select></label>
        <label className={styles.notes}>Observação<input name="notes" placeholder="Informação opcional" maxLength={200}/></label>
        <button className={styles.primaryButton} disabled={saving}>{saving ? "Salvando..." : "Cadastrar pacote"}</button>
      </form>
    </section>

    {message ? <p className={styles.message} role="status">{message}</p> : null}

    <section className={styles.listSection}>
      <div className={styles.listHeading}><div><span>ACOMPANHAMENTO</span><h3>{displayMonth(month)}</h3></div><strong>{packages.length} {packages.length === 1 ? "pacote" : "pacotes"}</strong></div>
      {loading ? <div className={styles.empty}>Carregando pacotes...</div> : packages.length === 0 ? <div className={styles.empty}><PackageCheck/><h3>Nenhum pacote neste mês</h3><p>Use o formulário acima para cadastrar o primeiro.</p></div> : <div className={styles.packageGrid}>
        {packages.map(item => {
          const completed = item.sessions.filter(session => session.completed);
          const usedManicure = completed.reduce((sum, session) => sum + session.manicure, 0);
          const usedPedicure = completed.reduce((sum, session) => sum + session.pedicure, 0);
          return <article className={styles.packageCard} key={item.id}>
            <header>
              <div className={styles.avatar}><UserRound/></div>
              <div className={styles.client}><h3>{item.clientName}</h3><a href={`tel:${item.phone}`}>{item.phone}</a></div>
              <span className={item.status === "COMPLETED" ? styles.done : styles.active}>{item.status === "COMPLETED" ? "Concluído" : "Em andamento"}</span>
            </header>
            <div className={styles.details}><span>{money(item.amountCents)}</span><span>{paymentLabels[item.paymentMethod]}</span>{item.notes ? <span>{item.notes}</span> : null}</div>
            <div className={styles.balance}>
              <div><Hand size={17}/><span>Manicures</span><strong>{4 - usedManicure} restantes</strong></div>
              <div><Hand size={17}/><span>Pedicures</span><strong>{2 - usedPedicure} restantes</strong></div>
            </div>
            <div className={styles.sessions}>
              {item.sessions.map(session => <button type="button" key={session.id} className={session.completed ? styles.sessionDone : styles.session} onClick={() => toggleSession(item.id, session)} disabled={busy === `${item.id}-${session.id}`} aria-pressed={session.completed}>
                <span className={styles.check}>{session.completed ? <Check size={15}/> : session.id}</span>
                <span><strong>{session.label}</strong><small>{session.pedicure ? "Mão + pé" : "Somente mão"}{session.completedAt ? ` · ${new Date(session.completedAt).toLocaleDateString("pt-BR")}` : ""}</small></span>
              </button>)}
            </div>
            <footer><span>{completed.length} de 4 sessões realizadas</span><button type="button" className={styles.deleteButton} onClick={() => removePackage(item)} disabled={busy === item.id} aria-label={`Excluir pacote de ${item.clientName}`}><Trash2 size={16}/> Excluir</button></footer>
          </article>;
        })}
      </div>}
    </section>
  </div>;
}
