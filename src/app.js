'use strict';
const menu=document.querySelector('.menu-toggle');
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));document.querySelector('.nav-links').classList.toggle('open',open)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu?.setAttribute('aria-expanded','false');document.querySelector('.nav-links')?.classList.remove('open')}});

const params=new URLSearchParams(location.search);
const campaignKeys=['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
let campaign={};
try{campaign=JSON.parse(sessionStorage.getItem('daimeng-campaign')||'{}');if(campaignKeys.some(k=>params.has(k))){campaign=Object.fromEntries(campaignKeys.filter(k=>params.has(k)).map(k=>[k,params.get(k).slice(0,180)]));campaign.landing=location.pathname;sessionStorage.setItem('daimeng-campaign',JSON.stringify(campaign))}}catch{campaign={}}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-region]').forEach(card=>card.hidden=button.dataset.filter!=='all'&&card.dataset.region!==button.dataset.filter)}));

function recommendLine(mix,height,priority){
 if(mix==='parts')return{solution:'review',title:'Start with a dedicated process review',text:'Small parts and non-profile components need a separate workpiece and handling assessment. Share drawings and finishing requirements before selecting a line.'};
 if(height==='unknown'||priority==='review')return{solution:'review',title:'Start with a factory and process review',text:'Confirm the workpiece envelope, usable building height and finishing route before comparing configurations.'};
 if(mix==='long'&&height==='flexible'&&priority==='volume')return{solution:'vertical',title:'Explore a vertical anodizing line',text:'Your answers suggest long profiles, flexible building height and repeat production. A vertical line is a useful starting point for an engineering discussion.'};
 return{solution:'horizontal',title:'Explore a horizontal anodizing line',text:'Your answers suggest reviewing a horizontal configuration for your product mix or building constraints. Confirm loading, process route and capacity through engineering.'};
}
const selector=document.querySelector('#selector');
selector?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(selector);const r=recommendLine(f.get('mix'),f.get('height'),f.get('priority'));const box=document.querySelector('#selector-result');box.replaceChildren();const h=document.createElement('h3');h.textContent=r.title;const p=document.createElement('p');p.textContent=r.text;const a=document.createElement('a');a.className='btn';a.href='/contact/?solution='+r.solution+'&selector='+encodeURIComponent([f.get('mix'),f.get('height'),f.get('priority')].join('/'));a.textContent='Continue with this project brief';box.append(h,p,a);box.hidden=false});
if(selector&&document.modelContext?.registerTool){
 const lifecycle=new AbortController();
 const choices={mix:['long','mixed','parts'],height:['flexible','limited','unknown'],priority:['volume','variety','review']};
 try{Promise.resolve(document.modelContext.registerTool({name:'configure_line_selector',title:'Compare anodizing line starting points',description:'Set the three visible line-selector answers and display a preliminary recommendation. Does not submit an enquiry.',inputSchema:{type:'object',properties:Object.fromEntries(Object.entries(choices).map(([k,v])=>[k,{type:'string',enum:v}])),required:Object.keys(choices),additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||Object.keys(input).length!==3||Object.entries(choices).some(([k,v])=>!v.includes(input[k])))throw new Error('Choose one supported value for each selector question.');for(const key of Object.keys(choices))selector.elements[key].value=input[key];selector.requestSubmit();return recommendLine(input.mix,input.height,input.priority)}},{signal:lifecycle.signal})).catch(()=>{});}catch{}
 window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}

const form=document.querySelector('#enquiry-form');
const solutionNames={vertical:'Vertical anodizing line',horizontal:'Horizontal anodizing line',automation:'Control / MES integration',equipment:'Supporting equipment',review:'Engineering review'};
function briefText(data){return ['DAIMENG — PROJECT BRIEF','',`Name: ${data.name||''}`,`Email: ${data.email||''}`,`Company: ${data.company||''}`,`Country: ${data.country||''}`,`Solution: ${solutionNames[data.solution]||data.solution||''}`,`Target output: ${data.capacity||'Not specified'} tonnes/month`,`Timing: ${data.timeline||''}`,`Phone: ${data.phone||'Not provided'}`,'','Project requirements:',data.message||'','',`Prepared: ${new Date().toISOString().slice(0,10)}`].join('\n')}
function offerEmail(prefix){
 const email=document.querySelector('#email-brief');
 email.href='mailto:DM_tech@yeah.net?subject='+encodeURIComponent('Anodizing project enquiry'+(prefix?' '+prefix:''))+'&body='+encodeURIComponent(briefText(Object.fromEntries(new FormData(form))));
 document.querySelector('#enquiry-success').hidden=false;
 return email;
}
let briefUrl;
function downloadBrief(){
 const text=briefText(Object.fromEntries(new FormData(form)));if(briefUrl)URL.revokeObjectURL(briefUrl);briefUrl=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
 let box=document.querySelector('#brief-preview');if(!box){box=document.createElement('div');box.id='brief-preview';box.className='brief-preview';form.append(box)}box.replaceChildren();
 const label=document.createElement('label');label.className='field';label.textContent='Your project brief';const preview=document.createElement('textarea');preview.readOnly=true;preview.rows=12;preview.value=text;label.append(preview);
 const save=document.createElement('a');save.className='btn outline';save.href=briefUrl;save.download='Daimeng-project-brief.txt';save.textContent='Save brief as a text file';
 const note=document.createElement('p');note.className='note';note.textContent='Your brief is ready. Save the file, or select and copy the text above if your browser does not support downloads.';box.append(label,save,note);box.scrollIntoView({block:'nearest',behavior:'smooth'});
}
if(form){
 if(solutionNames[params.get('solution')])form.elements.solution.value=params.get('solution');
 const selected=params.get('selector');if(selected&&selected.length<120)form.elements.message.value='Line selector starting point: '+selected+'\n\nMy project requirements: ';
 document.querySelector('#download-brief').addEventListener('click',downloadBrief);
 let requestId=crypto.randomUUID();
 form.addEventListener('input',()=>{requestId=crypto.randomUUID();document.querySelector('#enquiry-success').hidden=true;document.querySelector('#form-status').textContent=''});
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const status=document.querySelector('#form-status');const submit=form.querySelector('[type=submit]');status.className='form-status';status.textContent='Saving your enquiry…';submit.disabled=true;
  const payload={...Object.fromEntries(new FormData(form)),consent:form.elements.consent.checked,campaign,requestId};
  try{
   const response=await fetch('/api/enquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const type=response.headers.get('content-type')||'';
   if(!type.includes('application/json')||[404,405,501].includes(response.status)){offerEmail('');status.className='form-status success';status.textContent='This is a static preview of the site, so no enquiry service is running here. Your project brief has been prepared - send the email draft to reach the Daimeng team.';return}
   const result=await response.json();if(!response.ok)throw new Error(result.error||'Unable to save your enquiry.');
   status.className='form-status success';status.textContent='Your enquiry has been saved. Reference: '+result.id+'.'+(result.localPreview?'\nLocal preview: your enquiry is stored on this computer. No email has been sent.':'\nKeep this reference for your project discussion.');
   const email=document.querySelector('#email-brief');email.href='mailto:DM_tech@yeah.net?subject='+encodeURIComponent('Anodizing project enquiry — '+result.id)+'&body='+encodeURIComponent(briefText(payload));document.querySelector('#enquiry-success').hidden=false;
  }catch(error){status.className='form-status error';status.textContent=error.message+' Your details are still here. Try again, download your brief, or email DM_tech@yeah.net.'}
  finally{submit.disabled=false}
 });
}
