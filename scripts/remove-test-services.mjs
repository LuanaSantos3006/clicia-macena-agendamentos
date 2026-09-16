import {cert,getApps,initializeApp} from "firebase-admin/app";
import {FieldValue,getFirestore} from "firebase-admin/firestore";
const projectId=process.env.FIREBASE_PROJECT_ID,clientEmail=process.env.FIREBASE_CLIENT_EMAIL,privateKey=process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g,"\n");
if(!projectId||!clientEmail||!privateKey){console.log("Limpeza ignorada: Firebase Admin indisponível no build.");process.exit(0)}
const app=getApps()[0]||initializeApp({credential:cert({projectId,clientEmail,privateKey})}),db=getFirestore(app),marker=db.collection("settings").doc("adminInitialization");
const state=await marker.get();
if(state.data()?.testServicesResetVersion===1){console.log("Serviços de teste já foram verificados.");process.exit(0)}
const snap=await db.collection("services").get(),testDocs=snap.docs.filter(doc=>{const name=String(doc.data().name||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();return name.includes("teste")||/(^|\s)test($|\s|\d)/.test(name)});
if(testDocs.length){const batch=db.batch();testDocs.forEach(doc=>batch.delete(doc.ref));await batch.commit()}
await marker.set({testServicesResetVersion:1,testServicesRemoved:testDocs.length,testServicesResetAt:FieldValue.serverTimestamp()},{merge:true});
console.log(`Serviços de teste removidos: ${testDocs.length}.`);
