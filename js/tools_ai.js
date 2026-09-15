'use strict';
/* KHALED AI SUITE — tools_ai.js: chat, image generator, translator, summarizer */

/* ================= CHAT ================= */
let sessions=[],activeSessionId=null,isGenerating=false,abortController=null;
(function initChat(){
  sessions=lsGet('khaled_sessions_v2',[]);
  activeSessionId=lsGet('khaled_active_session_v2',null);
  if(!Array.isArray(sessions))sessions=[];
  if(!sessions.length)chatCreateSession('محادثة جديدة',false);
  if(!activeSessionId||!sessions.find(s=>s.id===activeSessionId))activeSessionId=sessions[0].id;
})();
function chatPersist(){lsSet('khaled_sessions_v2',sessions.slice(0,40));lsSet('khaled_active_session_v2',activeSessionId)}
function chatCurrent(){return sessions.find(s=>s.id===activeSessionId)}
function chatCreateSession(title,save=true){const s={id:'s_'+Date.now()+'_'+Math.random().toString(36).slice(2,7),title:title||'محادثة جديدة',messages:[],created:Date.now()};sessions.unshift(s);activeSessionId=s.id;if(save){chatPersist();chatRenderSessions();chatRenderMessages()}return s}
function chatDeleteSession(id){sessions=sessions.filter(s=>s.id!==id);if(activeSessionId===id)activeSessionId=sessions[0]?.id||null;if(!sessions.length)chatCreateSession('محادثة جديدة',false);chatPersist();chatRenderSessions();chatRenderMessages()}
function chatRenderSessions(){
  const list=$('sessionsList');if(!list)return;list.innerHTML='';
  sessions.forEach(s=>{const div=document.createElement('div');div.className='session-item'+(s.id===activeSessionId?' active':'');
    div.innerHTML='<span class="session-title"></span><button class="session-del" title="حذف"><i class="fa-solid fa-xmark"></i></button>';
    div.querySelector('.session-title').textContent=s.title;
    div.addEventListener('click',e=>{if(e.target.closest('.session-del'))return;activeSessionId=s.id;chatPersist();chatRenderSessions();chatRenderMessages();if(window.innerWidth<=768)$('chatSidebar').classList.add('hidden')});
    div.querySelector('.session-del').addEventListener('click',()=>chatDeleteSession(s.id));list.appendChild(div)});
}
function chatBuildWelcome(){
  const div=document.createElement('div');div.className='welcome-hero';
  div.innerHTML='<div class="hero-icon"><i class="fa-solid fa-robot"></i></div><h2 style="font-weight:800;font-size:1.4rem;margin-bottom:0.5rem">أهلاً بك 👋</h2><p style="color:var(--text-muted);font-size:0.9rem;line-height:1.8;margin-bottom:1.2rem">اسألني أي شيء — مع إعادة محاولة تلقائية ذكية عند انشغال الخدمة.</p><div class="welcome-suggestions"></div>';
  const sug=div.querySelector('.welcome-suggestions');
  [['🧠 اشرح لي','الفرق بين الذكاء الاصطناعي والتعلم العميق'],['💻 اكتب كود','كود بايثون يحلل ملف CSV'],['✍️ قصيدة','قصيدة قصيرة عن الطموح والأمل'],['📚 خطة دراسة','خطة دراسة للرياضيات في شهر']].forEach(([t,p])=>{
    const c=document.createElement('div');c.className='suggestion-card';
    c.innerHTML='<div class="s-title"></div><div class="s-desc"></div>';
    c.querySelector('.s-title').textContent=t;c.querySelector('.s-desc').textContent=p;
    c.addEventListener('click',()=>chatSend(p));sug.appendChild(c)});
  return div;
}
function chatRenderMessages(){
  const el=$('chatMessages');if(!el)return;el.innerHTML='';
  const s=chatCurrent();
  if(!s||!s.messages.length){el.appendChild(chatBuildWelcome())}
  else{s.messages.forEach(m=>chatAppendMessage(m.role,m.content,{animate:false}));chatScroll(false)}
}
function chatAppendMessage(role,content,opts={}){
  const el=$('chatMessages');if(!el)return null;
  const hero=el.querySelector('.welcome-hero');if(hero)hero.remove();
  const row=document.createElement('div');row.className='msg-row '+role;
  row.innerHTML='<div class="avatar-box '+(role==='user'?'avatar-user':'avatar-ai')+'"><i class="fa-solid '+(role==='user'?'fa-user':'fa-robot')+'"></i></div><div class="msg-body"><div class="msg-sender">'+(role==='user'?'أنت':'KHALED AI')+'</div><div class="msg-bubble"></div></div>';
  const bubble=row.querySelector('.msg-bubble');
  if(opts.raw){bubble.innerHTML=content}
  else{bubble.innerHTML=renderMarkdown(content);enhanceCodeBlocks(bubble)}
  if(role==='assistant'&&!opts.raw){
    const tools=document.createElement('div');tools.className='msg-tools';
    tools.innerHTML='<button class="tool-chip tts-btn"><i class="fa-solid fa-volume-high me-1"></i>استمع</button><button class="tool-chip"><i class="fa-regular fa-copy me-1"></i>نسخ</button>';
    const btns=tools.querySelectorAll('.tool-chip');
    btns[0].addEventListener('click',()=>speakText(content));
    btns[1].addEventListener('click',()=>copyText(content));
    bubble.parentNode.appendChild(tools);
  }
  if(!opts.animate)row.style.animation='none';
  el.appendChild(row);
  if(opts.scroll!==false)chatScroll();
  return{row,bubble};
}
function chatScroll(smooth=true){const el=$('chatMessages');if(el)el.scrollTo({top:el.scrollHeight,behavior:smooth?'smooth':'auto'})}
function chatSetGeneratingUI(g){
  const sendBtn=$('sendBtn');if(!sendBtn)return;
  sendBtn.disabled=g;
  if(g){sendBtn.innerHTML='<i class="fa-solid fa-stop"></i>';sendBtn.classList.remove('btn-send');sendBtn.classList.add('btn-stop');
    sendBtn.onclick=e=>{e.preventDefault();if(abortController)abortController.abort()}}
  else{sendBtn.innerHTML='<i class="fa-solid fa-paper-plane"></i>';sendBtn.classList.add('btn-send');sendBtn.classList.remove('btn-stop');sendBtn.onclick=null}
}
async function chatSend(text){
  if(isGenerating)return;
  const prompt=(text!==undefined?text:$('userInput').value).trim();
  if(!prompt)return;
  if(prompt.length>MAX_INPUT_CHARS){toast('النص طويل جدًا (الحد '+MAX_INPUT_CHARS+' حرفًا)');return}
  const s=chatCurrent()||chatCreateSession('محادثة');
  isGenerating=true;abortController=new AbortController();chatSetGeneratingUI(true);
  s.messages.push({role:'user',content:prompt});
  if(s.messages.length===1)s.title=prompt.slice(0,40)+(prompt.length>40?'…':'');
  chatAppendMessage('user',prompt);
  $('userInput').value='';$('userInput').style.height='auto';chatUpdateCount();
  chatPersist();chatRenderSessions();
  const els=chatAppendMessage('assistant','',{raw:true});const bubble=els.bubble;
  bubble.innerHTML='<span class="typing-cursor"></span><span style="color:var(--text-muted);font-size:0.85rem"> يفكر…</span>';
  const context=s.messages.slice(-16).map(m=>({role:m.role,content:m.content}));
  try{
    const full=await callAI(context,{signal:abortController.signal,onChunk:partial=>{
      bubble.innerHTML=renderMarkdown(partial)+'<span class="typing-cursor"></span>';enhanceCodeBlocks(bubble);chatScroll(false)
    },onStatus:status=>{
      bubble.innerHTML='<span class="typing-cursor"></span><div class="auto-retry-note">'+escapeHtmlText(status)+'</div>'
    }});
    bubble.innerHTML=renderMarkdown(full);enhanceCodeBlocks(bubble);
    s.messages.push({role:'assistant',content:full});chatPersist();chatScroll();
  }catch(err){
    if(err.name==='AbortError'){bubble.innerHTML='<div class="error-box">⏹ تم إيقاف توليد الرد.</div>'}
    else{
      bubble.innerHTML='<div class="error-box"><strong>تعذر الحصول على رد:</strong> '+escapeHtmlText(friendlyError(err))+'<br><span class="retry-link">↻ أعد المحاولة</span></div>';
      const r=bubble.querySelector('.retry-link');
      if(r)r.addEventListener('click',()=>{bubble.closest('.msg-row').remove();s.messages.pop();chatPersist();isGenerating=false;abortController=null;chatSetGeneratingUI(false);chatSend(prompt)});
    }
  }finally{isGenerating=false;abortController=null;chatSetGeneratingUI(false)}
}
function chatUpdateCount(){const c=$('charCount');if(c)c.textContent=$('userInput').value.length+' / '+MAX_INPUT_CHARS}
function initChatUI(){
  const ui=$('userInput');if(!ui)return;
  ui.addEventListener('input',()=>{chatUpdateCount();ui.style.height='auto';ui.style.height=Math.min(ui.scrollHeight,140)+'px'});
  ui.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('chatForm').dispatchEvent(new Event('submit'))}});
  $('chatForm').addEventListener('submit',e=>{e.preventDefault();chatSend()});
  $('quickChips').addEventListener('click',e=>{const chip=e.target.closest('.quick-chip');if(!chip)return;chatSend(chip.dataset.prompt)});
  $('newChatBtn').addEventListener('click',()=>{chatCreateSession('محادثة جديدة');if(window.innerWidth<=768)$('chatSidebar').classList.add('hidden')});
  $('sidebarToggle').addEventListener('click',()=>$('chatSidebar').classList.toggle('hidden'));
  /* voice input in chat */
  const micBtn=$('micBtn');const rec=createRecognizer('ar-SA');
  if(rec&&micBtn){let recording=false;
    micBtn.style.display='flex';
    micBtn.addEventListener('click',()=>{if(recording){rec.stop();return}try{rec.start();recording=true;micBtn.classList.add('recording')}catch{}});
    rec.onresult=e=>{let final='';for(let i=0;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript}
      if(final){ui.value=(ui.value+' '+final).trim();chatUpdateCount()}};
    rec.onend=()=>{recording=false;micBtn.classList.remove('recording')};
    rec.onerror=()=>{recording=false;micBtn.classList.remove('recording')};
  }
}

/* ================= IMAGE GENERATOR ================= */
let imgSize={w:1024,h:1024},lastImg={url:'',prompt:''};
function imgGen(prompt,seed){
  if(!prompt)return;
  seed=seed||Math.floor(Math.random()*1e6);
  const url='https://image.pollinations.ai/prompt/'+encodeURIComponent(prompt)+'?width='+imgSize.w+'&height='+imgSize.h+'&model=flux&nologo=true&seed='+seed;
  const area=$('imgResult');
  area.className='result-area';
  area.innerHTML='<div><span class="spinner"></span><br><span class="loading-text" id="imgTimerText">جارٍ رسم الصورة… 0 ثانية</span></div>';
  let sec=0;const timer=setInterval(()=>{sec++;const el=$('imgTimerText');if(el)el.textContent='جارٍ رسم الصورة… '+sec+' ثانية'},1000);
  const img=new Image();img.crossOrigin='anonymous';
  const timeout=setTimeout(()=>{clearInterval(timer);img.src='';area.innerHTML='<div class="error-box">استغرق التوليد وقتًا طويلًا. <span class="retry-link" id="imgRetry">أعد المحاولة</span></div>';const r=$('imgRetry');if(r)r.addEventListener('click',()=>imgGen(prompt))},90000);
  img.onload=()=>{clearTimeout(timeout);clearInterval(timer);area.className='result-area has-img';area.innerHTML='';img.style.maxWidth='100%';img.style.borderRadius='12px';area.appendChild(img);lastImg={url,prompt};$('imgActions').style.display='flex';imgSaveGallery(url,prompt)};
  img.onerror=()=>{clearTimeout(timeout);clearInterval(timer);area.innerHTML='<div class="error-box">تعذر توليد الصورة — حاول مرة أخرى. <span class="retry-link" id="imgRetry2">↻</span></div>';const r=$('imgRetry2');if(r)r.addEventListener('click',()=>imgGen(prompt))};
  img.src=url;
}
function imgSaveGallery(url,prompt){let g=lsGet('khaled_gallery',[]);g.unshift({url,prompt,ts:Date.now()});lsSet('khaled_gallery',g.slice(0,12));imgRenderGallery()}
function imgRenderGallery(){
  const g=lsGet('khaled_gallery',[]);const card=$('galleryCard');const grid=$('galleryGrid');if(!card||!grid)return;
  if(!g.length){card.style.display='none';return}
  card.style.display='block';grid.innerHTML='';
  g.forEach(item=>{const d=document.createElement('div');d.className='gallery-item';
    d.innerHTML='<img loading="lazy" alt=""><div class="g-label"></div>';
    d.querySelector('img').src=item.url;d.querySelector('.g-label').textContent=item.prompt;
    d.addEventListener('click',()=>{$('imgPrompt').value=item.prompt;imgGen(item.prompt)});
    grid.appendChild(d)});
}
function initImageUI(){
  if(!$('imgGenBtn'))return;
  $('sizePresets').addEventListener('click',e=>{const chip=e.target.closest('.preset-chip');if(!chip)return;$$('#sizePresets .preset-chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');imgSize={w:+chip.dataset.w,h:+chip.dataset.h}});
  $('imgGenBtn').addEventListener('click',()=>{const p=$('imgPrompt').value.trim();if(!p){toast('اكتب وصفًا للصورة أولًا');return}imgGen(p)});
  $('imgPrompt').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('imgGenBtn').click()}});
  $('imgVariation').addEventListener('click',()=>{if(lastImg.prompt)imgGen(lastImg.prompt)});
  $('imgDownload').addEventListener('click',()=>{if(!lastImg.url)return;
    fetch(lastImg.url).then(r=>r.blob()).then(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='khaled-ai-image.jpg';a.click();URL.revokeObjectURL(a.href)}).catch(()=>window.open(lastImg.url,'_blank'))});
  imgRenderGallery();
}

/* ================= TRANSLATOR ================= */
const LANGS=[['auto','تلقائي (كشف اللغة)'],['ar','العربية'],['en','الإنجليزية'],['fr','الفرنسية'],['es','الإسبانية'],['de','الألمانية'],['tr','التركية'],['ur','الأردية'],['id','الإندونيسية'],['ru','الروسية'],['zh','الصينية'],['ja','اليابانية'],['hi','الهندية']];
function fillLangSelect(sel,withAuto){
  LANGS.forEach(([code,name])=>{if(code==='auto'&&!withAuto)return;const o=document.createElement('option');o.value=code;o.textContent=name;sel.appendChild(o)});
}
async function translateGo(){
  const text=$('trText').value.trim();if(!text){toast('اكتب نصًا للترجمة');return}
  const from=$('trFrom').value,to=$('trTo').value;
  if(from===to){toast('اختر لغتين مختلفتين');return}
  const out=$('trResult');out.className='result-box';out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ الترجمة…</span></div>';
  const fromName=(LANGS.find(l=>l[0]===from)||['',''])[1],toName=(LANGS.find(l=>l[0]===to)||['',''])[1];
  try{
    const full=await callAI([{role:'user',content:'ترجم النص التالي من '+fromName+' إلى '+toName+'. أخرج الترجمة فقط بدون أي شرح أو مقدمات:\n\n'+text}],{maxAttempts:4});
    out.className='result-box';out.textContent=full;
    const copyBtn=$('trCopy');if(copyBtn)copyBtn.style.display='inline-block';
  }catch(err){out.className='result-box';out.innerHTML='<div class="error-box">'+escapeHtmlText(friendlyError(err))+'</div>'}
}
function initTranslateUI(){
  if(!$('trGoBtn'))return;
  fillLangSelect($('trFrom'),true);fillLangSelect($('trTo'),false);
  $('trFrom').value='auto';$('trTo').value='en';
  $('trGoBtn').addEventListener('click',translateGo);
  $('trCopy').addEventListener('click',()=>copyText($('trResult').textContent));
}

/* ================= SUMMARIZER ================= */
async function summarizeGo(){
  const text=$('sumInput').value.trim();
  if(!text){toast('الصق نصًا أولًا');return}
  if(text.length<50){toast('النص قصير جدًا للتلخيص');return}
  const style=$('sumStyle').value;
  const prompts={'short':'لخص في 3 نقاط رئيسية كحد أقصى','medium':'لخص في فقرة واحدة موجزة (5-7 أسطر)','bullets':'لخص في نقاط منظمة مع عنوان لكل نقطة'};
  const out=$('sumResult');
  out.className='result-box';out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ التلخيص الذكي…</span></div>';
  try{
    const full=await callAI([{role:'user',content:prompts[style]+' بالنص التالي:\n\n'+text.slice(0,6000)}],{maxAttempts:4});
    out.className='result-box';out.innerHTML=renderMarkdown(full);
  }catch(err){out.className='result-box';out.innerHTML='<div class="error-box">'+escapeHtmlText(friendlyError(err))+'</div>'}
}
function initSummarizerUI(){
  if(!$('sumGoBtn'))return;
  $('sumGoBtn').addEventListener('click',summarizeGo);
  $('sumCopy').addEventListener('click',()=>copyText($('sumResult').textContent));
}
