import { FieldValue, Firestore } from "firebase-admin/firestore";

export const defaultServices = [
  { id: "manicure", name: "Manicure", description: "Cuidado completo, cutilagem e esmaltação das mãos." },
  { id: "pedicure", name: "Pedicure", description: "Cuidado completo, cutilagem e esmaltação dos pés." },
  { id: "esmaltacao-em-gel", name: "Esmaltação em gel", description: "Brilho intenso e maior durabilidade para as unhas." },
  { id: "blindagem", name: "Blindagem", description: "Proteção e fortalecimento para unhas naturais." },
  { id: "remocao-esmaltacao-gel", name: "Remoção de esmaltação em gel", description: "Remoção cuidadosa do esmalte em gel." },
  { id: "remocao-cutilagem-esmaltacao", name: "Remoção + cutilagem + esmaltação", description: "Remoção, acabamento completo e nova esmaltação." },
  { id: "remocao-alongamento", name: "Remoção de alongamento", description: "Remoção segura e cuidadosa do alongamento." },
  { id: "remocao-alongamento-completa", name: "Remoção de alongamento + cutilagem + esmaltação", description: "Remoção do alongamento com cuidado completo das unhas." },
  { id: "correcao-unhas-borradas", name: "Correção de unhas borradas", description: "Correção do acabamento para recuperar a esmaltação." },
  { id: "spa-dos-pes", name: "Spa dos pés", description: "Momento de relaxamento, hidratação e cuidado para os pés." },
] as const;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export async function ensureDefaultServices(db: Firestore) {
  const collection = db.collection("services");
  const snapshot = await collection.get();
  const names = new Set(snapshot.docs.map(doc => normalize(String(doc.data().name || ""))));
  const missing = defaultServices.filter(service => !names.has(normalize(service.name)));
  if (!missing.length) return;
  const batch = db.batch();
  for (const service of missing) {
    const ref = collection.doc(service.id);
    batch.set(ref, { name: service.name, description: service.description, durationMin: 60, priceCents: 0, active: true, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() }, { merge: false });
  }
  await batch.commit();
}
