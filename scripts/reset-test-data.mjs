import {cert,getApps,initializeApp} from "firebase-admin/app";
import {FieldValue,getFirestore} from "firebase-admin/firestore";
const projectId=process.env.FIREBASE_PROJECT_ID,clientEmail=process.env.FIREBASE_CLIENT_EMAIL,privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
if(!projectId||!clientEmail||!privateKey){console.log("Reset ignorado: Firebase Admin indisponível no build.");process.exit(0)}
const app=getApps()[0]||initializeApp({credential:cert({projectId,clientEmail,privateKey})}),db=getFirestore(app),marker=db.collection("settings").doc("adminInitialization");
const state=await marker.get();
if(state.data()?.resetVersion===1){console.log("Limpeza de testes já concluída.");process.exit(0)}
async function clear(name){let removed=0;while(true){const snap=await db.collection(name).limit(400).get();if(snap.empty)break;const batch=db.batch();snap.docs.forEach(doc=>batch.delete(doc.ref));await batch.commit();removed+=snap.size}return removed}
const [appointments,clients,slots]=await Promise.all([clear("appointments"),clear("clients"),clear("appointmentSlots")]);
await marker.set({resetVersion:1,resetAt:FieldValue.serverTimestamp(),appointments,clients,slots},{merge:true});
console.log(`Dados de teste removidos: ${appointments} agendamentos, ${clients} clientes, ${slots} horários.`);
