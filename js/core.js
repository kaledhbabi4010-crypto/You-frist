'use strict';
/* KHALED AI SUITE — core.js v2: عشرة محركات ذكاء، تنقل، تخزين، كلام، MarkDown */
const MAX_INPUT_CHARS=4000;
const SYSTEM_PROMPT='أنت "KHALED AI"، مساعد ذكي عربي محترف ودقيق من منصة عربية مجانية. قواعدك: 1) أجب بالعربية الفصحى الواضحة إلا إذا طلب المستخدم لغة أخرى. 2) كن دقيقًا وصادقًا: إذا لم تكن متأكدًا فقل ذلك صراحة بدل التخمين. 3) استخدم Markdown عند الحاجة. 4) في الأكواد اذكر اسم اللغة واكتب كودًا صحيحًا قابلًا للتشغيل. 5) كن عمليًا ومختصرًا بدون حشو.';

/* ============ عشرة محركات ذكاء ============ */
const ENGINES={
pollinations:{name:'Pollinations — مجاني بدون مفتاح',keyless:true,url:'https://text.pollinations.ai/openai',models:['openai'],hint:'يعمل فورًا بدون مفتاح — لكنه خدمة مجانية مزدحمة (طلب واحد في اللحظة لكل IP). إذا كنت على إنترنت مشترك (جوال/مقاهي) قد تشارك عنوانك مع مئات المستخدمين فيبطئ الرد أو يفشل — الحل الدائم والأسرع: مفتاح Groq المجاني (30 ثانية).'},
groq:{name:'Groq — أسرع محرك في العالم',url:'https://api.groq.com/openai/v1/chat/completions',models:['llama-3.3-70b-versatile','openai/gpt-oss-120b','qwen/qwen3-32b','deepseek-r1-distill-llama-70b','gemma2-9b-it'],hint:'مفتاح مجاني 100% من: console.groq.com/keys — سرعة خرافية وحدود يومية سخية.'},
gemini:{name:'Google Gemini',url:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',models:['gemini-2.0-flash','gemini-2.5-flash','gemini-2.5-pro'],hint:'مفتاح مجاني 100% من: aistudio.google.com/apikey — من جوجل مباشرة وبحدود يومية ممتازة.'},
openrouter:{name:'OpenRouter — عشرات النماذج المجانية',url:'https://openrouter.ai/api/v1/chat/completions',models:['deepseek/deepseek-chat-v3.1:free','qwen/qwen3-235b-a22b:free','meta-llama/llama-3.3-70b-instruct:free','google/gemini-2.0-flash-exp:free','mistralai/mistral-small-3.1-24b-instruct:free'],hint:'مفتاح من: openrouter.ai/settings/keys ثم اختر أي موديل ينتهي بـ ":free" — يعمل مجانًا.'},
deepseek:{name:'DeepSeek — ذكاء عميق',url:'https://api.deepseek.com/v1/chat/completions',models:['deepseek-chat','deepseek-reasoner'],hint:'مفتاح من: platform.deepseek.com — أسعار زهيدة جدًا وذكاء قوي.'},
qwen:{name:'Qwen — من علي بابا',url:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',models:['qwen-plus','qwen-max','qwen-turbo'],hint:'مفتاح من: dashscope.console.aliyun.com — باقة مجانية للتجربة.'},
mistral:{name:'Mistral — أوروبي',url:'https://api.mistral.ai/v1/chat/completions',models:['mistral-large-latest','mistral-small-latest'],hint:'مفتاح من: console.mistral.ai — باقة مجانية تجريبية.'},
together:{name:'Together AI — نماذج مفتوحة',url:'https://api.together.xyz/v1/chat/completions',models:['meta-llama/Llama-3.3-70B-Instruct-Turbo','Qwen/Qwen2.5-72B-Instruct-Turbo','deepseek-ai/DeepSeek-V3'],hint:'مفتاح من: api.together.ai — يجمع أفضل النماذج المفتوحة.'},
cohere:{name:'Cohere',url:'https://api.cohere.ai/compatibility/v1/chat/completions',models:['command-r-plus','command-r'],hint:'مفتاح من: dashboard.cohere.com — مفتاح تجريبي مجاني.'},
custom:{name:'مخصص — أي خدمة متوافقة مع OpenAI',url:'',models:[],hint:'أدخل رابط أي خدمة متوافقة مع OpenAI (ينتهي بـ /chat/completions) مع مفتاحك واسم الموديل.'}};

function getEngineState(){const st=lsGet('khaled_engine_v1',{id:'pollinations',key:'',model:'',url:''});if(!ENGINES[st.id])st.id='pollinations';return st}
function setEngineState(st){lsSet('khaled_engine_v1',st)}
function engineLabel(){const st=getEngineState();const cfg=ENGINES[st.id];const model=st.model||(cfg.models&&cfg.models[0])||'';return cfg.name.split('—')[0].trim()+(model?' • '+model:'')}
function updateEngineTag(){const el=document.getElementById('engineTag');if(el)el.textContent='⚙ المحرك: '+engineLabel()}

const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
function lsGet(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch{return f}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function escapeHtmlText(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function stripHtml(s){const d=document.createElement('div');d.innerHTML=s;return d.textContent||d.innerText||''}
function renderMarkdown(t){try{return marked.parse(t)}catch{return escapeHtmlText(t).replace(/\n/g,'<br>')}}
function enhanceCodeBlocks(c){c.querySelectorAll('pre code').forEach(b=>{try{hljs.highlightElement(b)}catch{};const pre=b.parentElement;if(pre.querySelector('.code-copy-btn'))return;const btn=document.createElement('button');btn.className='code-copy-btn';btn.textContent='نسخ';btn.addEventListener('click',()=>{navigator.clipboard.writeText(b.textContent).then(()=>{btn.textContent='تم ✓';setTimeout(()=>btn.textContent='نسخ',1500)}).catch(()=>{})});pre.appendChild(btn)})}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),320)},2200)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);toast('تم النسخ ✓')}catch{toast('تعذر النسخ — انسخ يدويًا')}}

/* ---------- navigation ---------- */
const VIEW_IDS=['home','chat','images','python','playground','search','translate','summarizer','weather','crypto','prayer','hijri','dictation','tts','qr','password','regex','json','deepsearch','appbuilder','jobs','settings','fixit'];
function showView(v){
  if(!VIEW_IDS.includes(v))v='home';
  $$('.app-view').forEach(s=>s.classList.toggle('active',s.id==='view-'+v));
  window.scrollTo({top:0});
}

/* ---------- AI dispatch: any engine, OpenAI-compatible ---------- */
class AIError extends Error{constructor(status,message){super(message);this.status=status}}
function isErrorLike(text){const t=text.slice(0,300).toLowerCase();return t.includes('reached its budget')||t.includes('api key used for this request')||t.includes('budget limit')}
function friendlyError(err){
  if(err.name==='AbortError')return 'تم إيقاف الرد.';
  if(err.status===401||err.status===403)return 'المفتاح غير صحيح أو منتهي — راجع إعدادات المحركات.';
  if(err.status===429)return 'الخدمة مشغولة حاليًا (حد الطلبات المجانية).';
  if(err.status===503||err.status===502)return 'الخادم غير متاح مؤقتًا.';
  if(String(err.message).includes('Failed to fetch')||String(err.message).includes('NetworkError'))return 'تعذر الاتصال — تحقق من اتصالك بالإنترنت أو من مفتاح المحرك.';
  return err.message||'حدث خطأ غير متوقع.';
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
async function aiCallOnce(messages,signal,onChunk,forcedEngine){
  const st=forcedEngine||getEngineState();const cfg=ENGINES[st.id];
  const url=st.id==='custom'?st.url:cfg.url;
  if(!url)throw new AIError(0,'أدخل رابط المحرك المخصص في الإعدادات أولًا.');
  const headers={'Content-Type':'application/json'};
  if(!cfg.keyless){st.key=(st.key||'').trim();if(!st.key)throw new AIError(401,'هذا المحرك يحتاج مفتاح API — أضفه من إعدادات المحركات (⚙).');headers.Authorization='Bearer '+st.key}
  const model=st.model||cfg.models[0]||'openai';
  const resp=await fetch(url,{method:'POST',headers,body:JSON.stringify({model,messages,stream:!!onChunk}),signal});
  if(resp.ok){
    if(onChunk)return streamResponse(resp,onChunk);
    const data=await resp.json().catch(()=>null);
    const text=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    if(!text||!text.trim())throw new AIError(0,'وصل رد فارغ من المحرك.');
    if(isErrorLike(text))throw new AIError(429,'حصة الاستخدام المؤقتة مشغولة.');
    return text.trim();
  }
  let errMsg='HTTP '+resp.status;
  try{const j=await resp.json();const e=j.error;errMsg=(typeof e==='string'?e:(e&&e.message)||errMsg)}catch{}
  throw new AIError(resp.status,errMsg);
}
const RETRY_DELAYS=[4000,7000,10000,15000,20000,25000,30000,40000];
async function callWithRetries(messages,opts,engine){
  const signal=opts.signal||null,onChunk=opts.onChunk||null,onStatus=opts.onStatus||null;
  const maxAttempts=opts.maxAttempts!==undefined?opts.maxAttempts:8;
  const withSystem=messages[0]&&messages[0].role==='system'?messages:[{role:'system',content:SYSTEM_PROMPT},...messages];
  let lastErr=null;
  for(let attempt=1;attempt<=maxAttempts;attempt++){
    try{const text=await aiCallOnce(withSystem,signal,onChunk,engine);if(onStatus)onStatus(null);return text}
    catch(err){
      lastErr=err;
      if(err.name==='AbortError')throw err;
      const retryable=err.status===429||err.status===502||err.status===503||err.status===504||err.status===0;
      if(!retryable||attempt>=maxAttempts)break;
      const delay=RETRY_DELAYS[Math.min(attempt-1,RETRY_DELAYS.length-1)];
      if(onStatus){
        await new Promise(resolve=>{let left=delay/1000;
          onStatus('الخدمة مشغولة — إعادة تلقائية بعد '+left+' ث… (محاولة '+attempt+'/'+maxAttempts+')');
          const timer=setInterval(()=>{left--;if(left<=0){clearInterval(timer);onStatus('إعادة المحاولة الآن…');resolve()}else onStatus('الخدمة مشغولة — إعادة تلقائية بعد '+left+' ث… (محاولة '+attempt+'/'+maxAttempts+')')},1000);
          if(signal)signal.addEventListener('abort',()=>{clearInterval(timer);resolve()})});
      }else await new Promise(r=>setTimeout(r,delay));
      if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
    }
  }
  throw lastErr;
}
async function callAI(messages,opts={}){
  const st=getEngineState();
  if(st.id!=='pollinations'){
    try{return await callWithRetries(messages,opts,st)}
    catch(err){
      if(err.name==='AbortError')throw err;
      if(opts.onStatus)opts.onStatus('تعذر محرك '+engineLabel()+' — التحول التلقائي إلى المحرك المجاني…');
      return await callWithRetries(messages,opts,{id:'pollinations',key:'',model:'openai'});
    }
  }
  return await callWithRetries(messages,opts,st);
}

/* ---------- speech ---------- */
function speakText(text,voiceURI,rate){
  try{
    if(!('speechSynthesis' in window))return false;
    speechSynthesis.cancel();
    const clean=String(text).replace(/```[\s\S]*?```/g,' مقطع كود ').replace(/[#*`_>|]/g,'').replace(/\[(.*?)\]\(.*?\)/g,'$1').slice(0,3000);
    const u=new SpeechSynthesisUtterance(clean);u.lang='ar-SA';u.rate=rate||1;
    const voices=speechSynthesis.getVoices();
    if(voiceURI){const v=voices.find(v=>v.voiceURI===voiceURI);if(v){u.voice=v;u.lang=v.lang}}
    else{const v=voices.find(v=>v.lang&&v.lang.startsWith('ar'));if(v)u.voice=v}
    speechSynthesis.speak(u);return true;
  }catch{return false}
}
function stopSpeaking(){try{speechSynthesis.cancel()}catch{}}
function createRecognizer(lang){
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR)return null;
  const rec=new SR();rec.lang=lang||'ar-SA';rec.interimResults=true;rec.continuous=true;rec.maxAlternatives=1;
  return rec;
}

/* ---------- connection checker (engine-aware) ---------- */
async function checkConnection(){
  const ind=$('connIndicator'),txt=$('connText');if(!ind)return;
  try{
    const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),10000);
    const resp=await aiCallOnce([{role:'user',content:'ping'}],ctrl.signal,null);
    clearTimeout(t);
    ind.className='conn-indicator conn-ok';txt.textContent='المحرك يعمل';
  }catch(err){
    if(err.status===429){ind.className='conn-indicator conn-ok';txt.textContent='المحرك متصل (مشغول)'}
    else if(err.status===401||err.status===403){ind.className='conn-indicator conn-bad';txt.textContent='المفتاح غير صالح'}
    else{ind.className='conn-indicator conn-bad';txt.textContent='تعذر الوصول للمحرك'}
  }
}
