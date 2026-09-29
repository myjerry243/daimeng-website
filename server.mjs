import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const publicDir=path.join(root,'dist');
const port=Number(process.env.PORT||4173);
// The published site lives under /<repo>/ on GitHub Pages; strip that prefix so the local preview
// serves the same paths the deployed site uses. Set SITE_PREFIX= to disable.
const sitePrefix=process.env.SITE_PREFIX===undefined?'/daimeng-website':process.env.SITE_PREFIX.replace(/\/+$/,'');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain; charset=utf-8','.json':'application/json'};
const server=http.createServer(async(req,res)=>{
 try{
  const allowedHosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
  if(process.env.PUBLIC_ORIGIN)allowedHosts.add(new URL(process.env.PUBLIC_ORIGIN).host);
  if(!allowedHosts.has(req.headers.host)){res.writeHead(403);res.end('Unrecognized website host');return}
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
  const reqPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const pathname=sitePrefix&&(reqPath===sitePrefix||reqPath.startsWith(sitePrefix+'/'))?(reqPath.slice(sitePrefix.length)||'/'):reqPath;
  if(pathname.startsWith('/api/')){const {handleApi}=await import('./tools/leads.mjs');await handleApi(req,res,pathname);return}
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return}
  let filename=path.resolve(publicDir,'.'+pathname);
  if(!filename.startsWith(publicDir+path.sep)&&filename!==publicDir){res.writeHead(403);res.end();return}
  try{if((await stat(filename)).isDirectory()){if(!pathname.endsWith('/')){res.writeHead(301,{Location:reqPath+'/'+new URL(req.url,'http://localhost').search});res.end();return}filename=path.join(filename,'index.html')}}catch{}
  let data;try{data=await readFile(filename)}catch{res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end(await readFile(path.join(publicDir,'404/index.html')).catch(()=>Buffer.from('Page not found')));return}
  res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);
 }catch(e){console.error('Request failed:',e.code||e.message);res.writeHead(500,{'Content-Type':'text/plain'});res.end('Service temporarily unavailable')}
});
server.listen(port,'127.0.0.1',()=>console.log(`Daimeng website: http://127.0.0.1:${port}`));
