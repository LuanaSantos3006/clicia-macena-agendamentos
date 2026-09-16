import {NextResponse} from "next/server";import {adminDb} from "@/lib/firebase-admin";
const KEY="30b41e4a649719850886f412b0138720";
async function clearCollection(name:string){const db=adminDb();let removed=0;while(true){const snap=await db.collection(name).limit(400).get();if(snap.empty)break;const batch=db.batch();snap.docs.forEach(doc=>batch.delete(doc.ref));await batch.commit();removed+=snap.size}return removed}
export async function GET(req:Request){if(new URL(req.url).searchParams.get("key")!==KEY)return NextResponse.json({error:"Não autorizado."},{status:401});const appointments=await clearCollection("appointments"),clients=await clearCollection("clients"),slots=await clearCollection("appointmentSlots");return NextResponse.json({ok:true,appointments,clients,slots})}
