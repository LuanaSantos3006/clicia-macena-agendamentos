import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

function mins(v:string){const [h,m]=v.split(':').map(Number);return h*60+m}function clock(n:number){return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`}
export async function GET(req:Request){
 const u=new URL(req.url),date=u.searchParams.get('date'),serviceId=u.searchParams.get('serviceId');
 if(!date||!serviceId)return NextResponse.json({error:'Informe data e serviço.'},{status:400});
 const db=adminDb();const [serviceSnap,hoursSnap]=await Promise.all([db.collection('services').doc(serviceId).get(),db.collection('settings').doc('workingHours').get()]);
 if(!serviceSnap.exists||serviceSnap.data()?.active!==true)return NextResponse.json([]);
 const duration=Number(serviceSnap.data()?.durationMin||60);const dayIndex=new Date(`${date}T12:00:00-03:00`).getDay();const cfg=(hoursSnap.data()?.days||[]).find((d:any)=>d.day===dayIndex);
 if(!cfg?.enabled)return NextResponse.json([]);
 const start=mins(cfg.start),end=mins(cfg.end),bs=cfg.breakStart?mins(cfg.breakStart):null,be=cfg.breakEnd?mins(cfg.breakEnd):null;
 const dayStart=new Date(`${date}T00:00:00-03:00`),dayEnd=new Date(`${date}T23:59:59-03:00`);
 const snap=await db.collection('appointments').where('startsAt','>=',dayStart).where('startsAt','<=',dayEnd).get();
 const occupied=snap.docs.filter(d=>!['CANCELLED','CANCELED'].includes(String(d.data().status))).map(d=>({s:d.data().startsAt.toDate().getTime(),e:d.data().endsAt.toDate().getTime()}));
 const now=Date.now(),slots:string[]=[];
 for(let t=start;t+duration<=end;t+=30){if(bs!==null&&be!==null&&t<be&&t+duration>bs)continue;const h=clock(t);const s=new Date(`${date}T${h}:00-03:00`).getTime(),e=s+duration*60000;if(s<=now)continue;if(occupied.some(o=>s<o.e&&e>o.s))continue;slots.push(h)}
 return NextResponse.json(slots);
}
