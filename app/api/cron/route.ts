import {createClient} from '@supabase/supabase-js';
import webpush from 'web-push';
export const runtime='nodejs';
export async function GET(req:Request){
 if(!process.env.CRON_SECRET||req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return new Response('Unauthorized',{status:401});
 const db=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
 webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
 const {data,error}=await db.from('hydration_reminders').select('*').lte('next_at',new Date().toISOString()).limit(100);
 if(error)return new Response('Database error',{status:500});
 let sent=0,failed=0;
 for(const row of data||[]){
 const next=new Date(Date.now()+row.minutes*60000).toISOString();
 const {data:claimed,error:claimError}=await db.from('hydration_reminders').update({next_at:next}).eq('id',row.id).eq('next_at',row.next_at).select('id');
 if(claimError||!claimed?.length)continue;
 try{await webpush.sendNotification(row.subscription,JSON.stringify({type:'hydrate'}),{TTL:120});sent++;}catch(e){failed++;const status=(e as {statusCode?:number}).statusCode;if(status===404||status===410)await db.from('hydration_reminders').delete().eq('id',row.id).eq('next_at',next);}
 }
 return Response.json({sent,failed});
}
