import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const monthPattern=/^\d{4}-(0[1-9]|1[0-2])$/;
const datePattern=/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/;
const schema=z.object({type:z.enum(["INCOME","EXPENSE"]),date:z.string().regex(datePattern),category:z.string().trim().min(2).max(40),description:z.string().trim().min(2).max(120),amount:z.union([z.string(),z.number()]),paymentMethod:z.enum(["CASH","PIX","CARD","OTHER"])});

function amountInCents(value:string|number){const normalized=String(value).trim().replace(/\s/g,"").replace(/\.(?=\d{3}(?:\D|$))/g,"").replace(",",".");const number=Number(normalized);return Number.isFinite(number)?Math.round(number*100):0}

export async function GET(request:Request){
  if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});
  const month=new URL(request.url).searchParams.get("month")||"";
  if(!monthPattern.test(month))return NextResponse.json({error:"Mês inválido."},{status:400});
  const snapshot=await adminDb().collection("financialEntries").where("month","==",month).get();
  const entries=snapshot.docs.map(doc=>({id:doc.id,...doc.data()})).sort((a:Record<string,unknown>,b:Record<string,unknown>)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  return NextResponse.json(entries,{headers:{"Cache-Control":"no-store"}});
}

export async function POST(request:Request){
  if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success)return NextResponse.json({error:"Confira os dados do lançamento."},{status:400});
  const amountCents=amountInCents(parsed.data.amount);
  if(amountCents<=0||amountCents>100000000)return NextResponse.json({error:"Informe um valor válido."},{status:400});
  const ref=adminDb().collection("financialEntries").doc();
  await ref.set({type:parsed.data.type,date:parsed.data.date,month:parsed.data.date.slice(0,7),category:parsed.data.category,description:parsed.data.description,amountCents,paymentMethod:parsed.data.paymentMethod,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  return NextResponse.json({id:ref.id},{status:201});
}
