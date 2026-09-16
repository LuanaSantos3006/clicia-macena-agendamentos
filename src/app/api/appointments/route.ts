import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema=z.object({name:z.string().min(2).max(100),phone:z.string().min(8).max(30),serviceId:z.string().min(1),startsAt:z.string().datetime(),notes:z.string().max(500).optional()});

export async function POST(request:Request){
  const parsed=schema.safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return NextResponse.json({error:"Confira os dados informados."},{status:400});
  try{
    const result=await prisma.$transaction(async(tx)=>{
      const service=await tx.service.findFirst({where:{id:parsed.data.serviceId,active:true}});
      if(!service) throw new Error("SERVICE");
      const startsAt=new Date(parsed.data.startsAt);
      const endsAt=new Date(startsAt.getTime()+service.durationMin*60000);
      const conflict=await tx.appointment.findFirst({where:{status:{not:"CANCELLED"},startsAt:{lt:endsAt},endsAt:{gt:startsAt}}});
      if(conflict) throw new Error("CONFLICT");
      const blocked=await tx.blockedPeriod.findFirst({where:{startsAt:{lt:endsAt},endsAt:{gt:startsAt}}});
      if(blocked) throw new Error("CONFLICT");
      let client=await tx.client.findFirst({where:{phone:parsed.data.phone}});
      if(!client) client=await tx.client.create({data:{name:parsed.data.name,phone:parsed.data.phone}});
      return tx.appointment.create({data:{clientId:client.id,serviceId:service.id,startsAt,endsAt,priceCents:service.priceCents,notes:parsed.data.notes||null},include:{service:true}});
    },{isolationLevel:"Serializable"});
    return NextResponse.json({id:result.id,status:result.status,service:result.service.name,startsAt:result.startsAt,priceCents:result.priceCents},{status:201});
  }catch(error){
    if(error instanceof Error&&error.message==="CONFLICT") return NextResponse.json({error:"Este horário acabou de ser reservado. Escolha outro horário."},{status:409});
    if(error instanceof Error&&error.message==="SERVICE") return NextResponse.json({error:"Serviço indisponível."},{status:400});
    return NextResponse.json({error:"Não foi possível registrar o agendamento."},{status:500});
  }
}
