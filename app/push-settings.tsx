'use client';
import {useEffect,useState} from 'react';
export default function PushSettings(){
 const [minutes,setMinutes]=useState(30),[enabled,setEnabled]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState('');
 useEffect(()=>{setEnabled(localStorage.getItem('hydrate-push-enabled')==='true');setMinutes(Number(localStorage.getItem('hydrate-push-minutes'))||30);if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});},[]);
 async function save(on:boolean){setBusy(true);setMessage('');try{
 let token=localStorage.getItem('hydrate-push-token');if(!token){token=crypto.randomUUID();localStorage.setItem('hydrate-push-token',token);}
 let subscription:PushSubscription|null=null;
 if(on){if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw Error('Install the app on your home screen and open it there, or use a supported browser.');
 const key=process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;if(!key)throw Error('Push is not configured on this deployment.');
 if(await Notification.requestPermission()!=='granted')throw Error('Please allow notifications in device settings.');
 await navigator.serviceWorker.register('/sw.js');const reg=await navigator.serviceWorker.ready;
 const raw=atob(key.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(key.length/4)*4,'='));const bytes=Uint8Array.from(raw,c=>c.charCodeAt(0));
 subscription=await reg.pushManager.getSubscription()||await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:bytes});}
 const res=await fetch('/api/reminders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,subscription,minutes,enabled:on})});const result=await res.json();if(!res.ok)throw Error(result.error||'Could not save');
 setEnabled(on);localStorage.setItem('hydrate-push-enabled',String(on));localStorage.setItem('hydrate-push-minutes',String(minutes));setMessage(on?'Background schedule saved.':'Background reminders stopped.');
 }catch(e){setMessage(e instanceof Error?e.message:'Something went wrong');}finally{setBusy(false);}}
 return <section className="mt-5 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm"><h3 className="font-bold">Mobile lock-screen reminders</h3><p className="my-2 text-sm text-slate-500">Install Hydrate on your home screen. This independent background schedule works even when the app is closed, with internet access.</p><label className="my-4 flex items-center justify-between text-sm">Repeat every (minutes)<input className="w-24 rounded-lg border p-2" type="number" min={1} max={180} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label><div className="flex gap-2"><button disabled={busy||!Number.isInteger(minutes)||minutes<1||minutes>180} onClick={()=>save(true)} className="flex-1 rounded-xl bg-sky-600 p-3 font-semibold text-white disabled:opacity-50">{enabled?'Update schedule':'Enable background reminders'}</button>{enabled&&<button disabled={busy} onClick={()=>save(false)} className="rounded-xl border p-3">Stop</button>}</div><p role="status" className="mt-3 text-sm text-slate-600">{message|| (enabled?'Background schedule enabled on this device.':'Background schedule off.')}</p><p className="mt-2 text-xs text-slate-500">Use either the background schedule or the foreground timer to avoid duplicate alerts. Sound follows phone settings.</p></section>;
}
