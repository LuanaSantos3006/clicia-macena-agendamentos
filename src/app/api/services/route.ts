import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(){
  try {
    const services=await prisma.service.findMany({where:{active:true},orderBy:{name:"asc"}});
    return NextResponse.json(services);
  } catch {
    return NextResponse.json({error:"Banco de dados ainda não configurado."},{status:503});
  }
}
