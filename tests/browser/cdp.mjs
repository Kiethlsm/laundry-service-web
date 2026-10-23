import {spawn,spawnSync} from 'node:child_process';
import {existsSync,mkdtempSync,readFileSync} from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function until(read,timeout=60000){const end=Date.now()+timeout;while(Date.now()<end){try{const value=await read();if(value)return value;}catch{}await delay(100);}throw new Error('Local test deadline');}
export async function replaceInput(page,selector,text){
 await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:2});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'a',code:'KeyA',windowsVirtualKeyCode:65,modifiers:0});
 await page.send('Input.dispatchKeyEvent',{type:'keyDown',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8});
 await page.send('Input.dispatchKeyEvent',{type:'keyUp',key:'Backspace',code:'Backspace',windowsVirtualKeyCode:8});
 await page.send('Input.insertText',{text});
}
export function kill(child){if(process.platform==='win32')spawnSync(path.join(process.env.SystemRoot??'C:/Windows','System32/taskkill.exe'),['/PID',String(child.pid),'/T','/F'],{stdio:'ignore',windowsHide:true});else child.kill('SIGTERM');}
export async function browser(){
 const executable=[path.join(process.env.LOCALAPPDATA??'','BraveSoftware/Brave-Browser/Application/brave.exe'),'/usr/bin/google-chrome','/usr/bin/chromium'].find(existsSync);
 if(!executable)throw new Error('No installed test browser; do not skip this gate');
 const dir=mkdtempSync(path.join(os.tmpdir(),'ss-browser-'));
 const child=spawn(executable,['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--remote-debugging-address=127.0.0.1','--remote-debugging-port=0',`--user-data-dir=${dir}`,'about:blank'],{stdio:'ignore',windowsHide:true});
 try {
 const port=await until(()=>existsSync(path.join(dir,'DevToolsActivePort'))&&readFileSync(path.join(dir,'DevToolsActivePort'),'utf8').split('\n')[0]);
 const target=await until(async()=>{const pages=await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();return pages.find(p=>p.type==='page');});
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 let id=0;const pending=new Map();ws.onmessage=e=>{const r=JSON.parse(e.data);if(r.id){const p=pending.get(r.id);pending.delete(r.id);if(r.error)p.reject(new Error(JSON.stringify(r.error)));else p.resolve(r.result);}};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw new Error('Browser expression failed: '+r.exceptionDetails.text);return r.result.value;};
 return {send,evaluate,close:()=>{ws.close();kill(child);}};
 }catch(e){kill(child);throw e;}
}
