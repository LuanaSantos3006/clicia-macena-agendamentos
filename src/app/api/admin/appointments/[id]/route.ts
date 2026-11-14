import {NextResponse} from "next/server";import {FieldValue} from "firebase-admin/firestore";import {adminDb} from "@/lib/firebase-admin";import {getAdminSession} from "@/lib/auth";import {z} from "zod";
const schema=z.object({status:z.enum(["PENDING","CONFIRMED","COMPLETED","CANCELLED"]).optional(),paymentMethod:z.enum(["CASH","PIX","CARD"]).optional()}).refine(v=>v.status||v.paymentMethod);
const appointmentDate=(value:{toDate?:()=>Date})=>value?.toDate?.().toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"})||"";
export async function PATCH(req:Request,{params}:{params:Promise<{id:string}>}){
  if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});
  const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({error:"Dados inválidos."},{status:400});
  const{id}=await params,db=adminDb(),appointmentRef=db.collection("appointments").doc(id),appointmentSnap=await appointmentRef.get();
  if(!appointmentSnap.exists)return NextResponse.json({error:"Agendamento não encontrado."},{status:404});
  const current=appointmentSnap.data()!,status=p.data.status||current.status,paymentMethod=p.data.paymentMethod||current.paymentMethod;
  if(status==="COMPLETED"&&!current.isPackage&&Number(current.priceCents||0)>0&&!paymentMethod)return NextResponse.json({error:"Informe a forma de pagamento."},{status:400});
  const financeRef=db.collection("financialEntries").doc(`appointment_${id}`),batch=db.batch();
  batch.update(appointmentRef,{...p.data,updatedAt:FieldValue.serverTimestamp()});
  if(status==="COMPLETED"&&!current.isPackage&&Number(current.priceCents||0)>0){
    const date=appointmentDate(current.startsAt);
    batch.set(financeRef,{type:"INCOME",date,month:date.slice(0,7),category:"Atendimentos",description:`${current.serviceName||"Serviço"} — ${current.clientName||"Cliente"}`,amountCents:Number(current.priceCents),paymentMethod,source:"APPOINTMENT",appointmentId:id,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()},{merge:true});
    batch.update(appointmentRef,{financialEntryId:financeRef.id,paymentReceived:true});
  }else{
    batch.delete(financeRef);
    batch.update(appointmentRef,{financialEntryId:FieldValue.delete(),paymentReceived:false});
  }
  await batch.commit();return NextResponse.json({ok:true,financeRecorded:status==="COMPLETED"&&!current.isPackage&&Number(current.priceCents||0)>0});
}
export async function DELETE(_:Request,{params}:{params:Promise<{id:string}>}){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const{id}=await params,db=adminDb(),ref=db.collection("appointments").doc(id),snap=await ref.get();if(!snap.exists)return NextResponse.json({error:"Agendamento não encontrado."},{status:404});const v=snap.data()!,batch=db.batch();batch.delete(ref);batch.delete(db.collection("financialEntries").doc(`appointment_${id}`));if(v.startsAt?.toDate){const key=v.startsAt.toDate().toISOString().replace(/[^0-9]/g,"").slice(0,14);batch.delete(db.collection("appointmentSlots").doc(key))}await batch.commit();return NextResponse.json({ok:true})}
