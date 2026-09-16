import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const schema=z.object({name:z.string().min(2).max(100),description:z.string().max(300).optional(),durationMin:z.coerce.number().int().min(15).max(480),price:z.coerce.number().min(0),active:z.boolean()});
export async function PUT(req:Request,{params}:{params:Promise<{id:string}>}){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const {id}=await params;const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Dados inválidos."},{status:400});await adminDb().collection("services").doc(id).update({...parsed.data,priceCents:Math.round(parsed.data.price*100),price:FieldValue.delete(),updatedAt:FieldValue.serverTimestamp()});return NextResponse.json({ok:true});}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const {id}=await params;await adminDb().collection("services").doc(id).delete();return NextResponse.json({ok:true});}
