(async()=>{
  const {pdfContent}=await chrome.storage.local.get('pdfContent');
  if(!pdfContent)throw new Error('No content for PDF');
  document.open();document.write(pdfContent);document.close();
  await document.fonts.ready;
  await Promise.all([...document.images].map(img=>img.complete?Promise.resolve():new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;setTimeout(resolve,4000);})))
  chrome.runtime.sendMessage({type:'viewer-ready'});
})();
