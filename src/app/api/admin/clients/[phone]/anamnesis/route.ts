import {NextResponse} from "next/server";
import {FieldValue} from "firebase-admin/firestore";
import {z} from "zod";
import {getAdminSession} from "@/lib/auth";
import {adminDb} from "@/lib/firebase-admin";

const schema=z.object({clientName:z.string().trim().min(2).max(100),birthDate:z.string().max(10),allergies:z.boolean(),allergyDetails:z.string().trim().max(200),diabetes:z.boolean(),circulatoryProblems:z.boolean(),anticoagulants:z.boolean(),pregnant:z.boolean(),medications:z.string().trim().max(200),mycosis:z.boolean(),ingrownNails:z.boolean(),wounds:z.boolean(),nailBiting:z.boolean(),sensitivity:z.boolean(),previousReactions:z.string().trim().max(300),observations:z.string().trim().max(500),consent:z.boolean(),consentDate:z.string().max(10)});
const clean=(phone:string)=>phone.replace(/\D/g,"");

export async function GET(_:Request,{params}:{params:Promise<{phone:string}>}){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const{phone}=await params,id=clean(decodeURIComponent(phone));if(id.length<10)return NextResponse.json({error:"Telefone inválido."},{status:400});const snapshot=await adminDb().collection("clientAnamnesis").doc(id).get();return NextResponse.json(snapshot.exists?snapshot.data():{}, {headers:{"Cache-Control":"no-store"}})}

export async function PUT(request:Request,{params}:{params:Promise<{phone:string}>}){if(!await getAdminSession())return NextResponse.json({error:"Não autorizado."},{status:401});const{phone}=await params,id=clean(decodeURIComponent(phone));if(id.length<10)return NextResponse.json({error:"Telefone inválido."},{status:400});const parsed=schema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Confira os dados da ficha."},{status:400});await adminDb().collection("clientAnamnesis").doc(id).set({...parsed.data,phone:id,updatedAt:FieldValue.serverTimestamp()},{merge:true});return NextResponse.json({ok:true})}
