import {NextResponse} from "next/server";
import {FieldValue,Timestamp} from "firebase-admin/firestore";
import {adminDb} from "@/lib/firebase-admin";
import {getAdminSession} from "@/lib/auth";
import {z} from "zod";
const schema=z.object({date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),clientName:z.string().trim().min(2).max(100),phone:z.string().transform(value=>value.replace(/\D/g,"")).refine(value=>value.length===0||(value.length>=10&&value.length<=11)),serviceId:z.string().min(1),amount:z.union([z.string(),z.number()]),paymentMethod:z.enum(["CASH","PIX","CARD"]).nullable(),isPackage:z.boolean().default(false),notes:z.string().trim().max(300).optional()});
const brDay=(offset=0)=>new Date(Date.now()+offset*86400000).toLocaleDateString("en-CA",{timeZone:"America/Sao_Paulo"});
function cents(value:string|number){const normalized=String(value).trim().replace(/\s/g,"").replace(/\.(?=\d{3}(?:\D|$))/g,"").replace(",",".");const number=Number(normalized);return Number.isFinite(number)?Math.round(number*100):0}
export async function POST(request:Request){
  if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});
  const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os dados do atendimento."},{status:400});
  const today=brDay(),minDate=brDay(-365),maxDate=brDay(1),isFuture=parsed.data.date>today;
  if(parsed.data.date<minDate||parsed.data.date>maxDate)return NextResponse.json({error:"Escolha uma data válida até amanhã."},{status:400});
  const priceCents=parsed.data.isPackage?0:cents(parsed.data.amount);if(!parsed.data.isPackage&&(priceCents<=0||priceCents>10000000))return NextResponse.json({error:"Informe um valor válido."},{status:400});
  const db=adminDb(),serviceRef=db.collection("services").doc(parsed.data.serviceId),serviceSnap=await serviceRef.get();if(!serviceSnap.exists)return NextResponse.json({error:"Serviço não encontrado."},{status:404});
  const service=serviceSnap.data()!,startsAt=new Date(`${parsed.data.date}T${parsed.data.time}:00-03:00`),duration=Number(service.durationMin||60),endsAt=new Date(startsAt.getTime()+duration*60000),clientRef=db.collection("clients").doc(),appointmentRef=db.collection("appointments").doc(),financeRef=db.collection("financialEntries").doc(`appointment_${appointmentRef.id}`),batch=db.batch();
  batch.create(clientRef,{name:parsed.data.clientName,phone:parsed.data.phone,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp(),source:"MANUAL"});
  batch.create(appointmentRef,{clientId:clientRef.id,clientName:parsed.data.clientName,phone:parsed.data.phone,serviceId:serviceRef.id,serviceName:String(service.name||"Serviço"),startsAt:Timestamp.fromDate(startsAt),endsAt:Timestamp.fromDate(endsAt),priceCents,status:isFuture?"CONFIRMED":"COMPLETED",paymentMethod:parsed.data.isPackage||isFuture?null:parsed.data.paymentMethod,isPackage:parsed.data.isPackage,notes:[parsed.data.isPackage?"Sessão de pacote já pago":null,parsed.data.notes||null].filter(Boolean).join(" — ")||null,source:"MANUAL",createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
  if(!isFuture&&!parsed.data.isPackage){
    batch.create(financeRef,{type:"INCOME",date:parsed.data.date,month:parsed.data.date.slice(0,7),category:"Atendimentos",description:`${String(service.name||"Serviço")} — ${parsed.data.clientName}`,amountCents:priceCents,paymentMethod:parsed.data.paymentMethod,source:"APPOINTMENT",appointmentId:appointmentRef.id,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    batch.update(appointmentRef,{financialEntryId:financeRef.id,paymentReceived:true});
  }
  await batch.commit();return NextResponse.json({id:appointmentRef.id,status:isFuture?"CONFIRMED":"COMPLETED"},{status:201});
}
