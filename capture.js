(() => {
  if (window.__webpageCaptureV044) return;
  window.__webpageCaptureV044 = true;
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = heading => heading?.innerText?.trim();
  const headings = () => [...document.querySelectorAll('main h4')].filter(h => ['You said:', 'ChatGPT said:'].includes(label(h)));
  // Based on the user's October 2026 ChatGPT DOM inspection. A three-level ancestor
  // contains one message, while a higher ancestor can contain multiple messages.
  function container(h) {
    let e = h;
    for (let i=0;i<3 && e.parentElement;i++) e=e.parentElement;
    return e;
  }
  function entries() {
    return headings().map(h => ({role:label(h)==='You said:'?'user':'assistant', element:container(h)}));
  }
  function scrollHost(el) {
    for(let p=el?.parentElement;p;p=p.parentElement) {
      const css=getComputedStyle(p);
      if (/(auto|scroll)/.test(css.overflowY) && p.scrollHeight>p.clientHeight+80) return p;
    }
    return document.scrollingElement || document.documentElement;
  }
  const scrollTop = host => host===document.scrollingElement || host===document.documentElement ? window.scrollY : host.scrollTop;
  const scrollTo = (host, top) => {if(host===document.scrollingElement || host===document.documentElement) window.scrollTo(0,top);else host.scrollTop=top;};
  function cleaned(element, role) {
    let target;
    if(role==='user') target=element.querySelector('[class~="group/user-message"] .whitespace-pre-wrap') || element.querySelector('.whitespace-pre-wrap');
    else target=element.querySelector('[class*="MarkdownRoot"]') || element.querySelector('[class*="DilResponseRoot"]');
    if(!target) target=[...element.querySelectorAll('[class*="MarkdownRoot"],.whitespace-pre-wrap')].find(x=>x.innerText?.trim()) || element;
    const clone=target.cloneNode(true);
    clone.querySelectorAll('button,script,style,textarea,input,select,form,video,audio,[contenteditable="true"],.turn-action-controls,.actionRow-nqqZbm,h4.sr-only').forEach(n=>n.remove());
    clone.querySelectorAll('h4').forEach(h=>{if(['You said:','ChatGPT said:'].includes(h.textContent.trim()))h.remove();});
    // Remove UI-only icons; keep SVG diagrams and images where possible.
    clone.querySelectorAll('svg').forEach(svg=>{if(svg.closest('a,button') || svg.getAttribute('aria-hidden')==='true')svg.remove();});
    const originals=[target,...target.querySelectorAll('*')];
    const copies=[clone,...clone.querySelectorAll('*')];
    // Work on the cloned tree only; resolve relative image URLs against the original page.
    for(const node of copies){
      if(!(node instanceof Element))continue;
      for(const attr of [...node.attributes]){
        if(!['href','src','alt','title','colspan','rowspan','width','height','viewBox','xmlns','role','aria-label'].includes(attr.name))node.removeAttribute(attr.name);
      }
      for(const attr of ['href','src']) if(node.hasAttribute(attr)){
        try{const value=new URL(node.getAttribute(attr),location.href);if(!['https:','http:','data:','blob:'].includes(value.protocol))node.removeAttribute(attr);else node.setAttribute(attr,value.href);}catch{node.removeAttribute(attr);}
      }
      if(node.tagName==='IMG') {node.removeAttribute('loading');node.removeAttribute('srcset');}
    }
    // Preserve source whitespace for user bubbles; PDF stylesheet controls wrapping.
    if(role==='user')clone.style.whiteSpace='pre-wrap';
    return clone;
  }
  const escapeMd = s => String(s).replace(/\\/g,'\\\\').replace(/([*_\[\]|])/g,'\\$1');
  function inline(node) {
    if(node.nodeType===Node.TEXT_NODE)return node.textContent.replace(/\s+/g,' ');
    if(node.nodeType!==Node.ELEMENT_NODE)return '';
    const tag=node.tagName.toLowerCase();
    if(tag==='img')return `![${escapeMd(node.getAttribute('alt')||'image')}](${node.getAttribute('src')||''})`;
    if(tag==='br')return '  \n';
    const content=[...node.childNodes].map(inline).join('');
    if(tag==='a')return node.getAttribute('href')?`[${content.trim()||node.getAttribute('href')}](${node.getAttribute('href')})`:content;
    if(tag==='code' && node.parentElement?.tagName!=='PRE') {const ticks='`'.repeat(Math.max(1,...(content.match(/`+/g)||[]).map(x=>x.length+1)));return ticks+content+ticks;}
    if(tag==='strong'||tag==='b')return `**${content}**`;
    if(tag==='em'||tag==='i')return `*${content}*`;
    if(tag==='s'||tag==='del')return `~~${content}~~`;
    return content;
  }
  function markdown(root) {
    const blocks=[];
    const push=x=>{if(x&&x.trim())blocks.push(x.trimEnd());};
    function list(el, depth=0) {
      const ordered=el.tagName==='OL';let i=Number(el.getAttribute('start')||1);
      return [...el.children].filter(x=>x.tagName==='LI').map(li=>{
        const children=[...li.childNodes].filter(n=>!(n.nodeType===Node.ELEMENT_NODE&&['UL','OL'].includes(n.tagName)));
        const line=children.map(inline).join('').trim();
        const nested=[...li.children].filter(x=>['UL','OL'].includes(x.tagName)).map(x=>list(x,depth+1)).join('\n');
        return '  '.repeat(depth)+(ordered?`${i++}. `:'- ')+line+(nested?'\n'+nested:'');
      }).join('\n');
    }
    function walk(el){
      if(el.nodeType!==Node.ELEMENT_NODE)return;
      const tag=el.tagName.toLowerCase();
      if(/^h[1-6]$/.test(tag)){push('#'.repeat(Number(tag[1]))+' '+inline(el).trim());return;}
      if(tag==='pre'){
        const code=el.querySelector('code');const cls=code?.className||'';
        const lang=(cls.match(/(?:language|lang)-([\w+#.-]+)/)||[])[1]||el.getAttribute('data-language')||'';
        const body=(code||el).textContent.replace(/\n+$/,'');
        const fence='`'.repeat(Math.max(3,...(body.match(/`+/g)||[]).map(x=>x.length+1)));
        push(`${fence}${lang}\n${body}\n${fence}`);return;
      }
      if(tag==='ul'||tag==='ol'){push(list(el));return;}
      if(tag==='table'){
        const rows=[...el.querySelectorAll('tr')].map(tr=>[...tr.children].filter(x=>['TH','TD'].includes(x.tagName)).map(cell=>inline(cell).replace(/\|/g,'\\|').replace(/\s*\n\s*/g,' ').trim()));
        if(rows.length){const cols=Math.max(...rows.map(x=>x.length));const pad=r=>Array.from({length:cols},(_,i)=>r[i]||'');const row=r=>'| '+pad(r).join(' | ')+' |';push([row(rows[0]),row(Array(cols).fill('---')),...rows.slice(1).map(row)].join('\n'));}return;
      }
      if(tag==='blockquote'){const content=inline(el).trim();push(content.split('\n').map(x=>'> '+x).join('\n'));return;}
      if(tag==='img'){push(inline(el));return;}
      if(tag==='p'){push(inline(el).trim());return;}
      if(tag==='hr'){push('---');return;}
      if(tag==='div'||tag==='section'||tag==='main'||tag==='figure'||tag==='article'){
        // Preserve text-only wrappers without duplicating nested paragraphs.
        const structural=[...el.children].some(x=>/^(P|DIV|SECTION|UL|OL|PRE|TABLE|H[1-6]|BLOCKQUOTE|FIGURE|IMG)$/.test(x.tagName));
        if(!structural){push(inline(el).trim());return;}
      }
      for(const child of el.children)walk(child);
    }
    walk(root);
    return blocks.join('\n\n').trim()||inline(root).trim();
  }
  let captured=[];
  const keyOf=(role,plain)=>role+'\u0000'+plain;
  function harvest() {
    const visible=[];
    for(const {role,element} of entries()) {
      const clean=cleaned(element,role);
      const plain=(clean.textContent||'').trim();
      if(!plain)continue;
      const key=keyOf(role,plain);
      visible.push({key,role,plain,html:clean.innerHTML,md:markdown(clean)});
    }
    // Merge overlapping windows in document order. Preserve identical text at
    // different positions when they are simultaneously visible.
    if(!captured.length){captured=visible;return;}
    let best={size:0,at:0};
    for(let i=0;i<captured.length;i++){
      let n=0;
      while(i+n<captured.length&&n<visible.length&&captured[i+n].key===visible[n].key)n++;
      if(n>best.size)best={size:n,at:i};
    }
    if(best.size){
      captured.splice(best.at, captured.length-best.at, ...visible);
      return;
    }
    // Scrolling forward: append unseen windows. A non-overlap may occur with
    // large virtualized jumps, so warn users that completeness is not guaranteed.
    const existing=new Set(captured.map(x=>x.key));
    for(const item of visible)if(!existing.has(item.key)){captured.push(item);existing.add(item.key);}
  }
  function nearestKey() {
    const list=entries();
    const cutoff=window.innerHeight*.2;
    const item=list.find(({element})=>element.getBoundingClientRect().bottom>=cutoff) || list.at(-1);
    if(!item)return null;
    const clean=cleaned(item.element,item.role);
    return item.role+'\u0000'+(clean.textContent||'').trim();
  }
  async function sweep(host,direction,steps=180) {
    let stable=0;
    for(let i=0;i<steps && stable<8;i++) {
      harvest();
      const before=scrollTop(host), height=host.scrollHeight;
      const amount=Math.max(260,Math.round(host.clientHeight*.72));
      scrollTo(host,direction==='up'?Math.max(0,before-amount):Math.min(height,before+amount));
      await wait(340);
      harvest();
      const after=scrollTop(host);
      stable=Math.abs(after-before)<3 && Math.abs(host.scrollHeight-height)<3?stable+1:0;
    }
  }
  let snapshot=[], matches=[], currentStart=null;
  async function prepare(mode) {
    captured=[];
    const first=entries()[0]?.element;
    if(!first)throw new Error('No ChatGPT speaker headings found. Check that a conversation is open and messages are visible.');
    const host=scrollHost(first), original=scrollTop(host);
    harvest(); currentStart=nearestKey();
    try {
      if(mode==='current') await sweep(host,'down');
      else {
        await sweep(host,'up');
        scrollTo(host,0);await wait(650);
        captured=[];harvest();
        await sweep(host,'down',450);
      }
    } finally {scrollTo(host,original);}
    snapshot=[...captured];
    return {count:snapshot.length};
  }
  const summary = items => items.length?`Preview: ${items.length} messages\nFirst: ${items[0].role} — ${items[0].plain.slice(0,100).replace(/\s+/g,' ')}\nLast: ${items.at(-1).role} — ${items.at(-1).plain.slice(0,100).replace(/\s+/g,' ')}`:'No messages captured.';
  function output(items,filename,format,note) {
    if(!items.length)throw new Error('No conversation messages were captured.');
    if(format==='markdown')return {ok:true,count:items.length,note,preview:summary(items),content:items.map(m=>m.md).join('\n\n---\n\n')+'\n'};
    const sections=items.map(m=>`<section class="message ${m.role}"><div class="bubble">${m.html}</div></section>`).join('\n');
    const css=`@page{size:letter;margin:.55in .62in}*{box-sizing:border-box}html{color-scheme:light}body{background:#fff;color:#0d0d0d;font:14px/1.65 Arial,Helvetica,sans-serif;margin:0 auto;max-width:800px;padding:16px 12px}main{width:100%}.message{display:flex;margin:0 0 25px;break-inside:auto}.message.user{justify-content:flex-end}.message.assistant{justify-content:flex-start}.bubble{min-width:0;max-width:100%;overflow-wrap:anywhere}.user .bubble{max-width:82%;background:#f4f4f4;border-radius:20px;padding:10px 16px;white-space:pre-wrap}.assistant .bubble{width:100%;padding:0 5px}.assistant p{margin:0 0 1em}.assistant h1,.assistant h2,.assistant h3,.assistant h4{font-weight:650;line-height:1.35;margin:1.25em 0 .6em}.assistant h1{font-size:1.7em}.assistant h2{font-size:1.35em}.assistant h3{font-size:1.15em}.assistant h4{font-size:1.03em}ul,ol{padding-left:1.6em;margin:.6em 0 1em}li{margin:.3em 0}li p{margin:.2em 0}blockquote{border-left:3px solid #d8d8d8;padding-left:14px;margin:1em 0;color:#454545}pre{font:12px/1.55 Consolas,"Liberation Mono",monospace;white-space:pre-wrap;overflow-wrap:anywhere;background:#f7f7f8;border:1px solid #e5e5e5;border-radius:10px;padding:12px 14px;break-inside:auto}code{font:.9em Consolas,"Liberation Mono",monospace;background:#f4f4f4;border-radius:4px;padding:2px 4px}pre code{background:none;padding:0}a{color:#1666a5;text-decoration:underline}img,svg,canvas{max-width:100%;height:auto;object-fit:contain}img{break-inside:avoid}table{border-collapse:collapse;width:100%;font-size:.92em;margin:1em 0;break-inside:auto}th,td{border:1px solid #dcdcdc;padding:8px 10px;text-align:left;vertical-align:top}th{background:#f7f7f7;font-weight:600}tr{break-inside:avoid}hr{border:0;border-top:1px solid #e5e5e5;margin:18px 0}.message+.message{margin-top:22px}@media print{body{padding:0;margin:0;max-width:none;-webkit-print-color-adjust:exact;print-color-adjust:exact}.message{break-inside:auto}.user .bubble{background:#f4f4f4!important}h1,h2,h3,h4{break-after:avoid}pre{break-inside:auto}}`;
    const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(filename)}</title><style>${css}</style></head><body><main>${sections}</main></body></html>`;
    return {ok:true,count:items.length,note,preview:summary(items),content:html};
  }
  chrome.runtime.onMessage.addListener((message,sender,respond)=>{
    if(message.type!=='capture')return;
    (async()=>{
      if(message.action==='find'){
        if(!message.query?.trim())throw new Error('Enter a search phrase.');
        await prepare('complete');
        const query=message.query.trim().toLocaleLowerCase();
        matches=snapshot.map((m,index)=>({...m,index})).filter(m=>m.plain.toLocaleLowerCase().includes(query));
        return {ok:true,count:snapshot.length,matches:matches.map((m,i)=>({index:m.index,number:i+1,preview:m.plain.slice(0,110).replace(/\s+/g,' ')})),preview:summary(snapshot),note:'Results include messages discovered while scrolling.'};
      }
      if(message.action==='export'){
        const mode=message.mode||'current';let start=0;
        if(mode==='search'){
          if(!matches.some(m=>m.index===message.chosen))throw new Error('Find matches and choose one before exporting.');
          start=message.chosen;
        }else{
          await prepare(mode);
          if(mode==='current')start=Math.max(0,snapshot.findIndex(m=>m.key===currentStart));
        }
        const selected=snapshot.slice(start);
        const note='Captured from the selected message through the last discovered message. Verify completeness on long or virtualized conversations.';
        return output(selected,message.filename||'ChatGPT_Conversation',message.format,note);
      }
      throw new Error('Unknown action');
    })().then(respond).catch(e=>respond({ok:false,error:e.message}));
    return true;
  });
})();
