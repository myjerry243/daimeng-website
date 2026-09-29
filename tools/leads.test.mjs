import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,readdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base='http://127.0.0.1:4174';
test('Enquiry API validates, persists, deduplicates and protects records',async()=>{
 await mkdir(path.join(root,'work'),{recursive:true});const temp=await mkdtemp(path.join(root,'work','qa-enquiries-'));
 const child=spawn(process.execPath,[path.join(root,'server.mjs')],{env:{...process.env,PORT:'4174',LEADS_DIR:temp},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Test server did not start')),10000);child.stdout.on('data',chunk=>{if(String(chunk).includes('Daimeng website:')){clearTimeout(timer);resolve()}});child.once('error',reject);child.once('exit',code=>reject(new Error('Test server exited '+code)))});
  const valid={name:'QA Test',email:'qa@example.test',company:'QA Fixture',country:'Test country',solution:'vertical',capacity:2000,timeline:'3months',message:'Test fixture: long aluminium profiles and a new factory building. This is not a real customer enquiry.',consent:true,phone:'',requestId:crypto.randomUUID(),campaign:{utm_source:'qa',utm_campaign:'verification'}};
  const send=(body,origin=base)=>fetch(base+'/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(body)});
  assert.equal((await send({...valid,consent:false})).status,400);
  assert.equal((await send({...valid,email:'invalid'})).status,400);
  assert.equal((await send({...valid,capacity:-10})).status,400);
  assert.equal((await send(valid,'https://example.invalid')).status,403);
  const [first,second]=await Promise.all([send(valid),send(valid)]);assert.equal(first.status,201);assert.equal(second.status,201);
  const a=await first.json(),b=await second.json();assert.equal(a.id,b.id);assert.equal(a.localPreview,true);
  const files=await readdir(temp);assert.equal(files.length,1);const stored=JSON.parse(await readFile(path.join(temp,files[0]),'utf8'));
  assert.equal(stored.campaign.utm_source,'qa');assert.equal(stored.followUp.status,'draft_not_sent');assert.equal(stored.qualification.priority,'High');
  assert.equal((await fetch(base+'/api/enquiries')).status,405);
  assert.equal((await fetch(base+'/data/enquiries/'+files[0])).status,404);
  assert.equal((await send({...valid,message:'a'.repeat(22000)})).status,413);
  console.log('QA fixtures saved separately in '+temp);
 }finally{child.kill()}
});
