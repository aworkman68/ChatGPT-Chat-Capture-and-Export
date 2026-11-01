const pending = new Map();
chrome.runtime.onMessage.addListener((msg,sender,sendResponse)=>{
  if(msg.type==='download'){
    chrome.downloads.download({url:msg.url,filename:msg.filename,saveAs:true},id=>sendResponse({ok:!!id,error:chrome.runtime.lastError?.message||null}));
    return true;
  }
  if(msg.type==='viewer-ready'){
    const done=pending.get(sender.tab?.id);
    if(done){pending.delete(sender.tab.id);done();}
  }
  if(msg.type==='pdf'){
    (async()=>{
      const key='pdfContent';
      await chrome.storage.local.set({[key]:msg.html});
      const tab=await chrome.tabs.create({url:'about:blank',active:false});
      try{
        const ready = new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>{pending.delete(tab.id);reject(new Error('PDF preview did not load within 20 seconds'));},20000);
          pending.set(tab.id,()=>{clearTimeout(timeout);resolve();});
        });
        await chrome.tabs.update(tab.id,{url:chrome.runtime.getURL('viewer.html')});
        await ready;
        const target={tabId:tab.id};
        await chrome.debugger.attach(target,'1.3');
        try{
          await chrome.debugger.sendCommand(target,'Page.enable');
          const pdf=await chrome.debugger.sendCommand(target,'Page.printToPDF',{
            printBackground:true,preferCSSPageSize:true,paperWidth:8.5,paperHeight:11,
            marginTop:0.45,marginBottom:0.45,marginLeft:0.5,marginRight:0.5
          });
          const id=await chrome.downloads.download({url:'data:application/pdf;base64,'+pdf.data,filename:msg.filename+'.pdf',saveAs:true});
          sendResponse({ok:true,id});
        }finally{await chrome.debugger.detach(target).catch(()=>{});}
      }finally{pending.delete(tab.id);await chrome.tabs.remove(tab.id).catch(()=>{});await chrome.storage.local.remove(key);}
    })().catch(e=>sendResponse({ok:false,error:e.message}));
    return true;
  }
});
