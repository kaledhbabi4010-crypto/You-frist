'use strict';
/* KHALED AI SUITE — core.js: navigation, storage, AI engine (auto-retry), speech, markdown */
const AI_ENDPOINT='https://text.pollinations.ai/openai';
const AI_MODEL='openai';
const MAX_INPUT_CHARS=4000;
const SYSTEM_PROMPT='أنت "KHALED AI"، مساعد ذكي عربي محترف ودقيق من منصة عربية مجانية. قواعدك: 1) أجب بالعربية الفصحى الواضحة إلا إذا طلب المستخدم لغة أخرى أو كتب بالإنجليزية. 2) كن دقيقًا وصادقًا: إذا لم تكن متأكدًا فقل ذلك صراحة بدل التخمين، ولا تدّعي أبدًا دقة 100%. 3) استخدم Markdown عند الحاجة. 4) في الأكواد اذكر اسم اللغة واكتب كودًا صحيحًا قابلًا للتشغيل. 5) كن عمليًا ومختصرًا بدون حشو.';

const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);

/* ---------- storage ---------- */
function lsGet(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch{return f}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function escapeHtmlText(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function stripHtml(s){const d=document.createElement('div');d.innerHTML=s;return d.textContent||d.innerText||''}
function renderMarkdown(t){try{return marked.parse(t)}catch{return escapeHtmlText(t).replace(/\n/g,'<br>')}}
function enhanceCodeBlocks(c){c.querySelectorAll('pre code').forEach(b=>{try{hljs.highlightElement(b)}catch{};const pre=b.parentElement;if(pre.querySelector('.code-copy-btn'))return;const btn=document.createElement('button');btn.className='code-copy-btn';btn.textContent='نسخ';btn.addEventListener('click',()=>{navigator.clipboard.writeText(b.textContent).then(()=>{btn.textContent='تم ✓';setTimeout(()=>btn.textContent='نسخ',1500)}).catch(()=>{})});pre.appendChild(btn)})}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),320)},2200)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);toast('تم النسخ ✓')}catch{toast('تعذر النسخ — انسخ يدويًا')}}

/* ---------- navigation ---------- */
const VIEW_IDS=['home','chat','images','python','playground','search','translate','summarizer','weather','crypto','prayer','hijri','dictation','tts','qr','password','regex','json'];
function showView(v){
  if(!VIEW_IDS.includes(v))v='home';
  $$('.app-view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
  const isChat=v==='chat';
  const chatLayout=$('chatLayoutWrap');
  if(chatLayout)chatLayout.style.display=isChat?'block':'none';
  window.scrollTo({top:0});
}

/* ---------- AI engine: honest + auto-retry queue ---------- */
class AIError extends Error{constructor(status,message){super(message);this.status=status}}
function isErrorLike(text){const t=text.slice(0,300).toLowerCase();return t.includes('reached its budget')||t.includes('api key used for this request')||t.includes('budget limit')}
function friendlyError(err){
  if(err.name==='AbortError')return 'تم إيقاف الرد.';
  if(err.status===429)return 'الخدمة مشغولة حاليًا — الخدمة المجانية تسمح بطلب واحد في اللحظة لكل مستخدم.';
  if(err.status===503||err.status===502)return 'الخادم غير متاح مؤقتًا.';
  if(String(err.message).includes('Failed to fetch')||String(err.message).includes('NetworkError'))return 'تعذر الاتصال — تحقق من اتصالك بالإنترنت.';
  return err.message||'حدث خطأ غير متوقع.';
}
/* Single call — no auto retry (caller controls retries via callAI) */
async function aiCall(messages,signal,onChunk){
  const body=JSON.stringify({model:AI_MODEL,messages,stream:!!onChunk});
  const resp=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body,signal});
  if(resp.ok){
    if(onChunk)return streamResponse(resp,onChunk);
    const data=await resp.json().catch(()=>null);
    const text=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    if(!text||!text.trim())throw new AIError(0,'وصل رد فارغ من المحرك.');
    if(isErrorLike(text))throw new AIError(429,'حصة الاستخدام المؤقتة مشغولة.');
    return text.trim();
  }
  let errMsg='HTTP '+resp.status;
  try{const j=await resp.json();if(j.error)errMsg=typeof j.error==='string'?j.error:(j.error.message||errMsg)}catch{}
  throw new AIError(resp.status,errMsg);
}
async function streamResponse(resp,onChunk){
  const reader=resp.body.getReader();const decoder=new TextDecoder('utf-8');
  let full='',buffer='';
  while(true){const{done,value}=await reader.read();if(done)break;
    buffer+=decoder.decode(value,{stream:true});const lines=buffer.split('\n');buffer=lines.pop()||'';
    for(const line of lines){const t=line.trim();if(!t.startsWith('data:'))continue;const payload=t.slice(5).trim();
      if(payload==='[DONE]')continue;
      try{const j=JSON.parse(payload);const piece=(j.choices&&j.choices[0]&&((j.choices[0].delta&&j.choices[0].delta.content)||(j.choices[0].message&&j.choices[0].message.content)))||'';
        if(piece){full+=piece;onChunk(full)}}catch{}}}
  if(!full.trim())throw new AIError(0,'انتهى البث بدون محتوى.');
  if(isErrorLike(full))throw new AIError(429,'حصة الاستخدام المؤقتة مشغولة.');
  return full.trim();
}
/* Auto-retry engine: shows countdown inside onStatus, tries up to N times with growing waits */
const RETRY_DELAYS=[4000,8000,14000,22000,30000,45000];
async function callAI(messages,opts={}){
  const signal=opts.signal||null;const onChunk=opts.onChunk||null;const onStatus=opts.onStatus||null;
  const maxAttempts=opts.maxAttempts!==undefined?opts.maxAttempts:5;
  const withSystem=Array.isArray(messages)&&messages[0]&&messages[0].role==='system'?messages:[{role:'system',content:SYSTEM_PROMPT},...messages];
  let lastErr=null;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{
      const text=await aiCall(withSystem,signal,onChunk);
      if(onStatus)onStatus(null);
      return text;
    }catch(err){
      lastErr=err;
      if(err.name==='AbortError')throw err;
      const retryable=err.status===429||err.status===502||err.status===503||err.status===504||err.status===0;
      if(!retryable||attempt>=maxAttempts)break;
      const delay=RETRY_DELAYS[Math.min(attempt-1,RETRY_DELAYS.length-1)];
      if(onStatus){
        await new Promise(resolve=>{
          let left=delay/1000;
          onStatus('الخدمة مشغولة (طلب واحد لكل مستخدم في اللحظة) — إعادة تلقائية بعد '+left+' ث… (محاولة '+attempt+'/'+maxAttempts+')');
          const timer=setInterval(()=>{left--;if(left<=0){clearInterval(timer);onStatus('إعادة المحاولة الآن…');resolve()}else{onStatus('الخدمة مشغولة — إعادة تلقائية بعد '+left+' ث… (محاولة '+attempt+'/'+maxAttempts+')')}},1000);
          if(signal)signal.addEventListener('abort',()=>{clearInterval(timer);resolve()});
        });
      }else{
        await new Promise(r=>setTimeout(r,delay));
      }
      if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
    }
  }
  throw lastErr;
}

/* ---------- speech: TTS + STT ---------- */
function speakText(text,voiceURI,rate){
  try{
    if(!('speechSynthesis' in window))return false;
    speechSynthesis.cancel();
    const clean=String(text).replace(/```[\s\S]*?```/g,' مقطع كود ').replace(/[#*`_>|]/g,'').replace(/\[(.*?)\]\(.*?\)/g,'$1').slice(0,3000);
    const u=new SpeechSynthesisUtterance(clean);
    u.lang='ar-SA';u.rate=rate||1;
    const voices=speechSynthesis.getVoices();
    if(voiceURI){const v=voices.find(v=>v.voiceURI===voiceURI);if(v){u.voice=v;u.lang=v.lang}}
    else{const v=voices.find(v=>v.lang&&v.lang.startsWith('ar'));if(v)u.voice=v}
    speechSynthesis.speak(u);
    return true;
  }catch{return false}
}
function stopSpeaking(){try{speechSynthesis.cancel()}catch{}}
function createRecognizer(lang){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  const rec=new SR();rec.lang=lang||'ar-SA';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
  return rec;
}

/* ---------- connection checker ---------- */
let connTimer=null;
async function checkConnection(){
  const ind=$('connIndicator'),txt=$('connText');
  if(!ind)return;
  try{
    const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),10000);
    const resp=await fetch(AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:AI_MODEL,messages:[{role:'user',content:'ping'}],max_tokens:1}),signal:ctrl.signal});
    clearTimeout(t);
    if(resp.ok||resp.status===429){ind.className='conn-indicator conn-ok';txt.textContent='المحرك يعمل'}
    else throw new Error();
  }catch{ind.className='conn-indicator conn-bad';txt.textContent='تعذر الوصول للمحرك'}
}
