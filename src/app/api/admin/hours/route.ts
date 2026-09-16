import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";
const day=z.object({day:z.number().int().min(0).max(6),enabled:z.boolean(),start:z.string().regex(/^\d{2}:\d{2}$/),end:z.string().regex(/^\d{2}:\d{2}$/),breakStart:z.string().regex(/^\d{2}:\d{2}$/).nullable(),breakEnd:z.string().regex(/^\d{2}:\d{2}$/).nullable()});
const schema=z.array(day).length(7);
const defaults=Array.from({length:7},(_,i)=>({day:i,enabled:i>0&&i<6,start:"09:00",end:"18:00",breakStart:"12:00",breakEnd:"13:00"}));
export async function GET(){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const s=await adminDb().collection("settings").doc("workingHours").get();return NextResponse.json(s.exists?s.data()?.days:defaults)}
export async function PUT(req:Request){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Horários inválidos."},{status:400});for(const d of p.data){if(d.enabled&&d.start>=d.end)return NextResponse.json({error:"O horário inicial deve ser anterior ao final."},{status:400});if((d.breakStart&&!d.breakEnd)||(!d.breakStart&&d.breakEnd))return NextResponse.json({error:"Preencha início e fim do intervalo."},{status:400})}await adminDb().collection("settings").doc("workingHours").set({days:p.data,updatedAt:FieldValue.serverTimestamp()},{merge:true});return NextResponse.json({ok:true})}
