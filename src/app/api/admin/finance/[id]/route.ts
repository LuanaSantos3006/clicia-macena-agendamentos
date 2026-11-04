import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){
  if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});
  const {id}=await params;
  const ref=adminDb().collection("financialEntries").doc(id);
  const snapshot=await ref.get();
  if(!snapshot.exists)return NextResponse.json({error:"Lançamento não encontrado."},{status:404});
  await ref.delete();
  return NextResponse.json({ok:true});
}
