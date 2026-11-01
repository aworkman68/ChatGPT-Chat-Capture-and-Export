const $=id=>document.getElementById(id);
let matches=[];
const mode=()=>document.querySelector('input[name="mode"]:checked').value;
const status=s=>$('status').textContent=s;
const busy=v=>{ $('find').disabled=v; $('export').disabled=v; };
function update(){ $('searchPanel').style.display=mode()==='search'?'block':'none';matches=[];$('matches').style.display='none';status(''); $('preview').textContent=''; }
document.querySelectorAll('input[name="mode"]').forEach(r=>r.addEventListener('change',update));update();
const settings=()=>({mode:mode(),start:$('start').value.trim(),format:$('format').value,filename:$('filename').value.trim()||'ChatGPT_Conversation'});
async function run(action,extra={}){
  const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
  if(!tab?.id||!/^https:\/\/chatgpt\.com\//.test(tab.url||''))throw new Error('Open a ChatGPT conversation at chatgpt.com first.');
  await chrome.scripting.executeScript({target:{tabId:tab.id},files:['capture.js']});
  return chrome.tabs.sendMessage(tab.id,{type:'capture',action,...extra});
}
$('find').addEventListener('click',async()=>{
  busy(true);status('Scanning conversation for matching text. This may take a little while…');
  try {const s=settings();const res=await run('find',{query:s.start});if(!res.ok)throw new Error(res.error);
    matches=res.matches||[];$('match').replaceChildren();
    for(const m of matches){const o=document.createElement('option');o.value=String(m.index);o.textContent=`Match ${m.number}: ${m.preview}`;$('match').append(o);}
    $('matches').style.display=matches.length?'block':'none';status(`${matches.length} match(es) among ${res.count} captured messages. ${res.note||''}`); $('preview').textContent=res.preview||'';
  }catch(e){status('Error: '+e.message);}finally{busy(false);}
});
$('export').addEventListener('click',async()=>{
  busy(true);status('Scanning and capturing messages…');
  try {const s=settings();let chosen=null;
    if(s.mode==='search'){if(!matches.length)throw new Error('Click Find matches and select a match first.');chosen=Number($('match').value);}
    const res=await run('export',{...s,chosen});if(!res.ok)throw new Error(res.error);
    const filename=s.filename.replace(/[\\/:*?"<>|]/g,'_').slice(0,100);
    const ext='.md';
    if(s.format==='print') {
      status('Generating PDF with Chrome…');
      const reply=await chrome.runtime.sendMessage({type:'pdf',html:res.content,filename});
      if(!reply)throw new Error('No response from PDF service. Open chrome://extensions, select Service worker under this extension, and inspect errors.');
      if(!reply.ok)throw new Error(reply.error||'PDF generation failed');
      $('preview').textContent=res.preview||'';status(`${res.count} messages prepared. PDF saved. ${res.note||''}`);return;
    }
    const blob=new Blob([res.content],{type:s.format==='markdown'?'text/markdown;charset=utf-8':'text/html;charset=utf-8'});
    const url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});
    const reply=await chrome.runtime.sendMessage({type:'download',url,filename:filename+ext});if(!reply)throw new Error('No response from download service.');if(!reply.ok)throw new Error(reply.error||'Download failed');
    $('preview').textContent=res.preview||''; status(`${res.count} messages prepared. ${res.note||''}`);
  }catch(e){status('Error: '+e.message);}finally{busy(false);}
});
