import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

const schema=z.object({name:z.string().min(2).max(100),phone:z.string().min(8).max(30),serviceId:z.string().min(1),startsAt:z.string().datetime(),notes:z.string().max(500).optional()});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Confira os dados informados."},{status:400});
  try{
    const db=adminDb();
    const result=await db.runTransaction(async(tx)=>{
      const serviceRef=db.collection("services").doc(parsed.data.serviceId);
      const serviceSnap=await tx.get(serviceRef);
      if(!serviceSnap.exists || serviceSnap.data()?.active!==true) throw new Error("SERVICE");
      const service=serviceSnap.data()!;
      const startsAt=new Date(parsed.data.startsAt);
      const durationMin=Number(service.durationMin||60);
      const endsAt=new Date(startsAt.getTime()+durationMin*60000);
      const slotId=startsAt.toISOString().replace(/[^0-9]/g,"").slice(0,14);
      const slotRef=db.collection("appointmentSlots").doc(slotId);
      const slotSnap=await tx.get(slotRef);
      if(slotSnap.exists) throw new Error("CONFLICT");
      const clientRef=db.collection("clients").doc();
      const appointmentRef=db.collection("appointments").doc();
      tx.create(slotRef,{appointmentId:appointmentRef.id,startsAt:Timestamp.fromDate(startsAt),endsAt:Timestamp.fromDate(endsAt),createdAt:FieldValue.serverTimestamp()});
      tx.create(clientRef,{name:parsed.data.name,phone:parsed.data.phone,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
      tx.create(appointmentRef,{clientId:clientRef.id,clientName:parsed.data.name,phone:parsed.data.phone,serviceId:serviceRef.id,serviceName:service.name,startsAt:Timestamp.fromDate(startsAt),endsAt:Timestamp.fromDate(endsAt),priceCents:Number(service.priceCents||0),status:"PENDING",notes:parsed.data.notes||null,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
      return {id:appointmentRef.id,status:"PENDING",service:String(service.name),startsAt:startsAt.toISOString(),priceCents:Number(service.priceCents||0)};
    });
    return NextResponse.json(result,{status:201});
  }catch(error){
    if(error instanceof Error&&error.message==="CONFLICT") return NextResponse.json({error:"Este horário acabou de ser reservado. Escolha outro horário."},{status:409});
    if(error instanceof Error&&error.message==="SERVICE") return NextResponse.json({error:"Serviço indisponível."},{status:400});
    return NextResponse.json({error:"Não foi possível registrar o agendamento."},{status:500});
  }
}
