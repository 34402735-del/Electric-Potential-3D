import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {networkInterfaces} from 'node:os';
const assets=new Set(['index.html','style.css','app.js','physics.js','vendor/three.module.js','vendor/OrbitControls.js']);
const server=http.createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(!assets.has(name)){res.writeHead(404);res.end('Not found');return;}const data=await readFile(new URL(name,import.meta.url));res.setHeader('Content-Type',name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8');res.setHeader('Cache-Control','no-cache');res.end(data);}catch{res.writeHead(404);res.end('Not found');}});
server.on('error',err=>{console.error(err.message);process.exitCode=1;});
server.listen(8765,'0.0.0.0',()=>{console.log('电脑访问：http://127.0.0.1:8765');for(const [name,ips] of Object.entries(networkInterfaces()))for(const ip of ips||[])if(ip.family==='IPv4'&&!ip.internal&&!ip.address.startsWith('169.254.')&&!/vpn|radmin|virtual/i.test(name))console.log(`手机访问（同一局域网，${name}）：http://${ip.address}:8765`);console.log('保持终端运行，Ctrl+C 停止服务。');});
