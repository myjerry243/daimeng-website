import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const storage=process.env.LEADS_DIR||path.join(root,'data','enquiries');
const rate=new Map();
let queue=Promise.resolve();
const values={solution:['vertical','horizontal','automation','equipment','review'],timeline:['exploring','12months','6months','3months']};
const respond=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
function clean(v,max=200){return typeof v==='string'?v.trim().replace(/\u0000/g,'').slice(0,max):''}
export function qualify(data){
 const reasons=[];let score=0;
 if(data.solution!=='review'){score+=20;reasons.push('Solution identified')}
 if(data.capacity){score+=20;reasons.push('Capacity target supplied')}
 if(data.timeline==='3months'){score+=30;reasons.push('Project within 3 months')}
 else if(data.timeline==='6months'){score+=20;reasons.push('Project within 6 months')}
 else if(data.timeline==='12months')score+=10;
 if(data.message.length>=100){score+=15;reasons.push('Detailed project brief')}
 if(data.phone){score+=5;reasons.push('Phone supplied')}
 return{score,priority:score>=65?'High':score>=40?'Standard':'Exploratory',reasons};
}
function followUp(data,id){return{status:'draft_not_sent',recipient:data.email,subject:`Your anodizing project — ${data.company}`,body:`Hello ${data.name},\n\nThank you for sharing your project brief (reference ${id}).\n\nTo prepare the next discussion, please confirm your profile dimensions, required finishes, available factory dimensions and intended operating schedule.\n\nWe have recorded your interest in ${data.solution} and your project timing as ${data.timeline}.\n\nBest regards,\nDaimeng Technology`,nextAction:'Review the enquiry, then contact the customer using the approved sales process.'}}
async function readBody(req){let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>20000)throw Object.assign(new Error('Request too large'),{status:413})}try{return JSON.parse(body)}catch{throw Object.assign(new Error('Invalid JSON request'),{status:400})}}
export async function handleApi(req,res,pathname){
 if(pathname!=='/api/enquiries'){respond(res,404,{error:'Not found'});return}
 if(req.method!=='POST'){respond(res,405,{error:'Method not allowed'});return}
 const origin=req.headers.origin;
 const expected=process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`;
 if(origin&&origin!==expected){respond(res,403,{error:'This request must come from the website.'});return}
 if(!(req.headers['content-type']||'').startsWith('application/json')){respond(res,415,{error:'A JSON request is required.'});return}
 const key=req.socket.remoteAddress,now=Date.now();
 for(const [k,v]of rate)if(now-v.start>3600000)rate.delete(k);
 const bucket=rate.get(key)||{count:0,start:now};
 if(bucket.count>=30){respond(res,429,{error:'Too many enquiries. Please try later or contact us by email.'});return}
 bucket.count++;rate.set(key,bucket);
 try{
  const raw=await readBody(req);
  if(!raw||typeof raw!=='object'||Array.isArray(raw)){respond(res,400,{error:'Invalid enquiry.'});return}
  if(raw.website){respond(res,400,{error:'Please leave the hidden field empty.'});return}
  const data={name:clean(raw.name,100),email:clean(raw.email,180),company:clean(raw.company,160),country:clean(raw.country,100),solution:clean(raw.solution),timeline:clean(raw.timeline),phone:clean(raw.phone,50),message:clean(raw.message,4000),capacity:raw.capacity?Number(raw.capacity):null,consent:raw.consent===true};
  if(!data.name||!data.company||!data.country||!/^\S+@[^\s@]+\.[^\s@]+$/.test(data.email)||data.message.length<20||!data.consent||!values.solution.includes(data.solution)||!values.timeline.includes(data.timeline)||data.capacity!==null&&(!Number.isFinite(data.capacity)||data.capacity<1||data.capacity>100000)){
   respond(res,400,{error:'Please check the required fields, email address, output target and consent.'});return;
  }
  const requestId=clean(raw.requestId,80);
  if(!/^[0-9a-f-]{36}$/i.test(requestId)){respond(res,400,{error:'Please refresh the page and try again.'});return}
  const campaign={};for(const k of ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','landing']){const v=clean(raw.campaign?.[k],180);if(v)campaign[k]=v}
  const digest=crypto.createHash('sha256').update(requestId).digest('hex');
  const id='DM-'+new Date().toISOString().slice(0,10).replaceAll('-','')+'-'+digest.slice(0,8).toUpperCase();
  const filename=path.join(storage,digest+'.json');
  const run=queue.then(async()=>{
   await mkdir(storage,{recursive:true});
   try{const existing=JSON.parse(await readFile(filename,'utf8'));return{id:existing.id,duplicate:true}}catch(e){if(e.code!=='ENOENT')throw e}
   const qualification=qualify(data);
   const record={id,createdAt:new Date().toISOString(),status:'new',...data,campaign,qualification,nextFollowUpAt:new Date(Date.now()+(qualification.priority==='High'?1:2)*86400000).toISOString(),followUp:followUp(data,id)};
   await writeFile(filename,JSON.stringify(record,null,2),{flag:'wx',mode:0o600});
   return{id,duplicate:false};
  });queue=run.catch(()=>{});
  const result=await run;respond(res,201,{...result,localPreview:!process.env.PUBLIC_ORIGIN});
 }catch(e){console.error('Enquiry save failed:',e.code||e.message);respond(res,e.status||503,{error:e.status?e.message:'Enquiry storage is unavailable. Please try again or email us.'})}
}
