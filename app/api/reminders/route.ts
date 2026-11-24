import {createClient} from '@supabase/supabase-js';
import {createHash} from 'node:crypto';
export const runtime='nodejs';
export async function POST(req:Request){
 try{
 const {token,subscription,minutes,enabled}=await req.json();
 if(typeof token!=='string'||!/^[a-f0-9-]{36}$/.test(token)||typeof enabled!=='boolean')return Response.json({error:'Invalid request'},{status:400});
 const db=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
 const id=createHash('sha256').update(token).digest('hex');
 if(!enabled){const {error}=await db.from('hydration_reminders').delete().eq('id',id);if(error)throw error;return Response.json({ok:true});}
 if(!Number.isInteger(minutes)||minutes<1||minutes>180||!subscription?.keys?.p256dh||!subscription?.keys?.auth)return Response.json({error:'Invalid schedule'},{status:400});
 const url=new URL(subscription.endpoint);if(url.protocol!=='https:'||!['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h)))return Response.json({error:'Unsupported push provider'},{status:400});
 const {error}=await db.from('hydration_reminders').upsert({id,subscription,minutes,next_at:new Date(Date.now()+minutes*60000).toISOString()});if(error)throw error;
 return Response.json({ok:true});
 }catch{return Response.json({error:'Unable to save schedule. Check server configuration.'},{status:500});}
}
