"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Loader2, Pencil, Plus, Save, Trash2, X, XCircle } from "lucide-react";

type Service = { id: string; name: string; description?: string; durationMin: number; priceCents: number; active: boolean };
type Draft = { name: string; description: string; durationMin: number; price: number; active: boolean };

export default function ServicesManager() {
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/services", { cache: "no-store" });
      if (!response.ok) throw new Error();
      setItems(await response.json());
    } catch {
      showMessage("Não foi possível carregar os serviços.", false);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  function showMessage(text: string, success: boolean) {
    setOk(success);
    setMessage(text);
    window.setTimeout(() => setMessage(""), 4500);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const form = event.currentTarget, data = new FormData(form);
    setSaving(true);
    try {
      const response = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), description: data.get("description"), durationMin: Number(data.get("durationMin")), price: Number(data.get("price")), active: true }) });
      if (!response.ok) throw new Error();
      form.reset();
      showMessage("Serviço adicionado com sucesso!", true);
      await load();
    } catch {
      showMessage("Não foi possível adicionar o serviço. Tente novamente.", false);
    } finally { setSaving(false); }
  }

  function startEditing(service: Service) {
    setEditingId(service.id);
    setDraft({ name: service.name, description: service.description || "", durationMin: service.durationMin, price: service.priceCents / 100, active: service.active });
  }

  async function saveEdit() {
    if (!draft || !editingId || saving) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/services/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      if (!response.ok) throw new Error();
      setEditingId("");
      setDraft(null);
      showMessage("Serviço atualizado com sucesso!", true);
      await load();
    } catch {
      showMessage("Não foi possível salvar as alterações.", false);
    } finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!window.confirm("Excluir este serviço? Essa ação não poderá ser desfeita.")) return;
    const response = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (response.ok) { showMessage("Serviço excluído com sucesso.", true); await load(); }
    else showMessage("Não foi possível excluir o serviço.", false);
  }

  return <><section className="card"><h3>Novo serviço</h3><p>Os valores podem ser preenchidos ou alterados a qualquer momento.</p><form onSubmit={create}><div className="field"><label>Nome</label><input name="name" required disabled={saving}/></div><div className="field"><label>Descrição</label><input name="description" disabled={saving}/></div><div className="grid" style={{ gridTemplateColumns: "1fr 1fr", marginTop: 0 }}><div className="field"><label>Duração (minutos)</label><input name="durationMin" type="number" min="15" defaultValue="60" required disabled={saving}/></div><div className="field"><label>Valor (R$)</label><input name="price" type="number" min="0" step="0.01" defaultValue="0" required disabled={saving}/></div></div><button className="btn btn-primary" type="submit" disabled={saving} aria-busy={saving}>{saving ? <><Loader2 className="spin" size={17}/> Salvando...</> : <><Plus size={17}/> Adicionar serviço</>}</button></form></section>
    {message ? <div role="status" aria-live="polite" className={`notice ${ok ? "" : "notice-error"}`} style={{ display: "flex", alignItems: "center", gap: 9 }}>{ok ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {message}</div> : null}
    {loading ? <div className="loading-row"><Loader2 className="spin"/> Carregando serviços...</div> : items.length === 0 ? <div className="card"><p>Nenhum serviço cadastrado.</p></div> : <div className="grid">{items.map(service => <article className="card service-editor" key={service.id}>{editingId === service.id && draft ? <><h3>Editar serviço e valor</h3><div className="field"><label>Nome</label><input value={draft.name} onChange={event => setDraft({ ...draft, name: event.target.value })}/></div><div className="field"><label>Descrição</label><textarea rows={3} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })}/></div><div className="field"><label>Duração (minutos)</label><input type="number" min={15} value={draft.durationMin} onChange={event => setDraft({ ...draft, durationMin: Number(event.target.value) })}/></div><div className="field price-edit-field"><label>Valor do serviço (R$)</label><input type="number" min={0} step="0.01" inputMode="decimal" value={draft.price} onChange={event => setDraft({ ...draft, price: Number(event.target.value) })}/><small className="field-hint">O novo valor aparecerá imediatamente para as clientes após salvar.</small></div><label><input type="checkbox" checked={draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })}/> Serviço ativo e visível para clientes</label><div className="service-editor-actions"><button className="btn btn-primary" type="button" onClick={saveEdit} disabled={saving}><Save size={16}/> Salvar alterações</button><button className="btn btn-soft" type="button" onClick={() => { setEditingId(""); setDraft(null); }}><X size={16}/> Cancelar</button></div></> : <><span className="service-status">{service.active ? "Ativo" : "Inativo"}</span><div><h3>{service.name}</h3><p>{service.description || "Sem descrição"}</p><div className="price">{service.priceCents > 0 ? `R$ ${(service.priceCents / 100).toFixed(2).replace(".", ",")}` : "Valor a definir"} • {service.durationMin} min</div></div><div className="service-editor-actions"><button className="btn btn-primary" type="button" onClick={() => startEditing(service)}><Pencil size={16}/> Editar valor e serviço</button><button className="btn btn-soft" type="button" onClick={() => remove(service.id)}><Trash2 size={16}/> Excluir</button></div></>}</article>)}</div>}
  </>;
}
