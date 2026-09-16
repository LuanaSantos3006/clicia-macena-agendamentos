import {NextResponse} from "next/server";import {adminDb} from "@/lib/firebase-admin";
export async function GET(){try{const snap=await adminDb().collection("settings").doc("contact").get(),v=snap.data();return NextResponse.json({instagram:String(v?.instagram||""),whatsapp:String(v?.whatsapp||"")})}catch{return NextResponse.json({instagram:"",whatsapp:""})}}
