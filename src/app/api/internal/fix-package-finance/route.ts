import {NextResponse} from "next/server";
import {FieldValue} from "firebase-admin/firestore";
import {adminDb} from "@/lib/firebase-admin";
const TOKEN="fix-packages-2026-11-13-b8e4d1";
export async function POST(request:Request){
  if(request.headers.get("x-fix-token")!==TOKEN)return NextResponse.json({error:"Não autorizado."},{status:401});
  const db=adminDb(),snapshot=await db.collection("appointments").limit(1000).get();
  const targets=snapshot.docs.filter(doc=>{const data=doc.data(),notes=String(data.notes||"").toLowerCase();return data.isPackage===true||(notes.includes("pacote")&&!/(1ª|1a|primeira)\s*(sessão|sessao)?/.test(notes))});
  for(let index=0;index<targets.length;index+=400){const batch=db.batch();targets.slice(index,index+400).forEach(doc=>batch.update(doc.ref,{priceCents:0,paymentMethod:null,isPackage:true,updatedAt:FieldValue.serverTimestamp()}));await batch.commit()}
  return NextResponse.json({ok:true,updated:targets.length,clients:targets.map(doc=>String(doc.data().clientName||"Cliente"))});
}
