import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const input=process.env.LEADS_DIR||path.join(root,'data/enquiries');
const output=path.join(root,'data/exports');
await mkdir(input,{recursive:true});await mkdir(output,{recursive:true});
const rows=[];for(const file of await readdir(input)){if(file.endsWith('.json'))rows.push(JSON.parse(await readFile(path.join(input,file),'utf8')))}
rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
const columns=['id','createdAt','name','email','company','country','solution','capacity','timeline','phone','message','priority','nextFollowUpAt','source','campaign'];
function csv(v){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'}
const csvRows=rows.map(r=>({...r,priority:r.qualification.priority,source:r.campaign.utm_source||'direct / unknown',campaign:r.campaign.utm_campaign||''}));
await writeFile(path.join(output,'enquiries.csv'),'\uFEFF'+[columns.join(','),...csvRows.map(r=>columns.map(c=>csv(r[c])).join(','))].join('\r\n'),'utf8');
await writeFile(path.join(output,'follow-up-drafts.txt'),rows.map(r=>`REFERENCE: ${r.id}\nPRIORITY: ${r.qualification.priority}\nFOLLOW-UP DUE: ${r.nextFollowUpAt}\nNOT SENT — REVIEW BEFORE SENDING\nTo: ${r.followUp.recipient}\nSubject: ${r.followUp.subject}\n\n${r.followUp.body}\n\n${'='.repeat(60)}`).join('\n\n'),'utf8');
console.log(`Exported ${rows.length} enquiries to ${output}. No messages were sent.`);
