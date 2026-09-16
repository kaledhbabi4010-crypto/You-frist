'use strict';
/* KHALED AI SUITE â€” core.js v2: Ø¹Ø´Ø±Ø© Ù…Ø­Ø±ÙƒØ§Øª Ø°ÙƒØ§Ø¡ØŒ ØªÙ†Ù‚Ù„ØŒ ØªØ®Ø²ÙŠÙ†ØŒ ÙƒÙ„Ø§Ù…ØŒ MarkDown */
const MAX_INPUT_CHARS=4000;
const SYSTEM_PROMPT='Ø£Ù†Øª "KHALED AI"ØŒ Ù…Ø³Ø§Ø¹Ø¯ Ø°ÙƒÙŠ Ø¹Ø±Ø¨ÙŠ Ù…Ø­ØªØ±Ù ÙˆØ¯Ù‚ÙŠÙ‚ Ù…Ù† Ù…Ù†ØµØ© Ø¹Ø±Ø¨ÙŠØ© Ù…Ø¬Ø§Ù†ÙŠØ©. Ù‚ÙˆØ§Ø¹Ø¯Ùƒ: 1) Ø£Ø¬Ø¨ Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ© Ø§Ù„ÙØµØ­Ù‰ Ø§Ù„ÙˆØ§Ø¶Ø­Ø© Ø¥Ù„Ø§ Ø¥Ø°Ø§ Ø·Ù„Ø¨ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù„ØºØ© Ø£Ø®Ø±Ù‰. 2) ÙƒÙ† Ø¯Ù‚ÙŠÙ‚Ù‹Ø§ ÙˆØµØ§Ø¯Ù‚Ù‹Ø§: Ø¥Ø°Ø§ Ù„Ù… ØªÙƒÙ† Ù…ØªØ£ÙƒØ¯Ù‹Ø§ ÙÙ‚Ù„ Ø°Ù„Ùƒ ØµØ±Ø§Ø­Ø© Ø¨Ø¯Ù„ Ø§Ù„ØªØ®Ù…ÙŠÙ†. 3) Ø§Ø³ØªØ®Ø¯Ù… Markdown Ø¹Ù†Ø¯ Ø§Ù„Ø­Ø§Ø¬Ø©. 4) ÙÙŠ Ø§Ù„Ø£ÙƒÙˆØ§Ø¯ Ø§Ø°ÙƒØ± Ø§Ø³Ù… Ø§Ù„Ù„ØºØ© ÙˆØ§ÙƒØªØ¨ ÙƒÙˆØ¯Ù‹Ø§ ØµØ­ÙŠØ­Ù‹Ø§ Ù‚Ø§Ø¨Ù„Ù‹Ø§ Ù„Ù„ØªØ´ØºÙŠÙ„. 5) ÙƒÙ† Ø¹Ù…Ù„ÙŠÙ‹Ø§ ÙˆÙ…Ø®ØªØµØ±Ù‹Ø§ Ø¨Ø¯ÙˆÙ† Ø­Ø´Ùˆ.';

/* ============ Ø¹Ø´Ø±Ø© Ù…Ø­Ø±ÙƒØ§Øª Ø°ÙƒØ§Ø¡ ============ */
const ENGINES={
pollinations:{name:'Pollinations â€” Ù…Ø¬Ø§Ù†ÙŠ Ø¨Ø¯ÙˆÙ† Ù…ÙØªØ§Ø­',keyless:true,url:'https://text.pollinations.ai/openai',models:['openai'],hint:'ÙŠØ¹Ù…Ù„ ÙÙˆØ±Ù‹Ø§ Ø¨Ø¯ÙˆÙ† Ù…ÙØªØ§Ø­ â€” Ù„ÙƒÙ†Ù‡ Ø®Ø¯Ù…Ø© Ù…Ø¬Ø§Ù†ÙŠØ© Ù…Ø²Ø¯Ø­Ù…Ø© (Ø·Ù„Ø¨ ÙˆØ§Ø­Ø¯ ÙÙŠ Ø§Ù„Ù„Ø­Ø¸Ø© Ù„ÙƒÙ„ IP). Ø¥Ø°Ø§ ÙƒÙ†Øª Ø¹Ù„Ù‰ Ø¥Ù†ØªØ±Ù†Øª Ù…Ø´ØªØ±Ùƒ (Ø¬ÙˆØ§Ù„/Ù…Ù‚Ø§Ù‡ÙŠ) Ù‚Ø¯ ØªØ´Ø§Ø±Ùƒ Ø¹Ù†ÙˆØ§Ù†Ùƒ Ù…Ø¹ Ù…Ø¦Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ† ÙÙŠØ¨Ø·Ø¦ Ø§Ù„Ø±Ø¯ Ø£Ùˆ ÙŠÙØ´Ù„ â€” Ø§Ù„Ø­Ù„ Ø§Ù„Ø¯Ø§Ø¦Ù… ÙˆØ§Ù„Ø£Ø³Ø±Ø¹: Ù…ÙØªØ§Ø­ Groq Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠ (30 Ø«Ø§Ù†ÙŠØ©).'},
groq:{name:'Groq â€” Ø£Ø³Ø±Ø¹ Ù…Ø­Ø±Ùƒ ÙÙŠ Ø§Ù„Ø¹Ø§Ù„Ù…',url:'https://api.groq.com/openai/v1/chat/completions',models:['openai/gpt-oss-120b','openai/gpt-oss-20b','qwen/qwen3.6-27b'],hint:'Ù…ÙØªØ§Ø­ Ù…Ø¬Ø§Ù†ÙŠ 100% Ù…Ù†: console.groq.com/keys â€” Ø³Ø±Ø¹Ø© Ø®Ø±Ø§ÙÙŠØ© ÙˆØ­Ø¯ÙˆØ¯ ÙŠÙˆÙ…ÙŠØ© Ø³Ø®ÙŠØ©.'},
gemini:{name:'Google Gemini',url:'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',models:['gemini-2.0-flash','gemini-2.5-flash','gemini-2.5-pro'],hint:'Ù…ÙØªØ§Ø­ Ù…Ø¬Ø§Ù†ÙŠ 100% Ù…Ù†: aistudio.google.com/apikey â€” Ù…Ù† Ø¬ÙˆØ¬Ù„ Ù…Ø¨Ø§Ø´Ø±Ø© ÙˆØ¨Ø­Ø¯ÙˆØ¯ ÙŠÙˆÙ…ÙŠØ© Ù…Ù…ØªØ§Ø²Ø©.'},
openrouter:{name:'OpenRouter â€” Ø¹Ø´Ø±Ø§Øª Ø§Ù„Ù†Ù…Ø§Ø°Ø¬ Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠØ©',url:'https://openrouter.ai/api/v1/chat/completions',models:['deepseek/deepseek-chat-v3.1:free','qwen/qwen3-235b-a22b:free','meta-llama/llama-3.3-70b-instruct:free','google/gemini-2.0-flash-exp:free','mistralai/mistral-small-3.1-24b-instruct:free'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: openrouter.ai/settings/keys Ø«Ù… Ø§Ø®ØªØ± Ø£ÙŠ Ù…ÙˆØ¯ÙŠÙ„ ÙŠÙ†ØªÙ‡ÙŠ Ø¨Ù€ ":free" â€” ÙŠØ¹Ù…Ù„ Ù…Ø¬Ø§Ù†Ù‹Ø§.'},
deepseek:{name:'DeepSeek â€” Ø°ÙƒØ§Ø¡ Ø¹Ù…ÙŠÙ‚',url:'https://api.deepseek.com/v1/chat/completions',models:['deepseek-chat','deepseek-reasoner'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: platform.deepseek.com â€” Ø£Ø³Ø¹Ø§Ø± Ø²Ù‡ÙŠØ¯Ø© Ø¬Ø¯Ù‹Ø§ ÙˆØ°ÙƒØ§Ø¡ Ù‚ÙˆÙŠ.'},
qwen:{name:'Qwen â€” Ù…Ù† Ø¹Ù„ÙŠ Ø¨Ø§Ø¨Ø§',url:'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',models:['qwen-plus','qwen-max','qwen-turbo'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: dashscope.console.aliyun.com â€” Ø¨Ø§Ù‚Ø© Ù…Ø¬Ø§Ù†ÙŠØ© Ù„Ù„ØªØ¬Ø±Ø¨Ø©.'},
mistral:{name:'Mistral â€” Ø£ÙˆØ±ÙˆØ¨ÙŠ',url:'https://api.mistral.ai/v1/chat/completions',models:['mistral-large-latest','mistral-small-latest'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: console.mistral.ai â€” Ø¨Ø§Ù‚Ø© Ù…Ø¬Ø§Ù†ÙŠØ© ØªØ¬Ø±ÙŠØ¨ÙŠØ©.'},
together:{name:'Together AI â€” Ù†Ù…Ø§Ø°Ø¬ Ù…ÙØªÙˆØ­Ø©',url:'https://api.together.xyz/v1/chat/completions',models:['meta-llama/Llama-3.3-70B-Instruct-Turbo','Qwen/Qwen2.5-72B-Instruct-Turbo','deepseek-ai/DeepSeek-V3'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: api.together.ai â€” ÙŠØ¬Ù…Ø¹ Ø£ÙØ¶Ù„ Ø§Ù„Ù†Ù…Ø§Ø°Ø¬ Ø§Ù„Ù…ÙØªÙˆØ­Ø©.'},
cohere:{name:'Cohere',url:'https://api.cohere.ai/compatibility/v1/chat/completions',models:['command-r-plus','command-r'],hint:'Ù…ÙØªØ§Ø­ Ù…Ù†: dashboard.cohere.com â€” Ù…ÙØªØ§Ø­ ØªØ¬Ø±ÙŠØ¨ÙŠ Ù…Ø¬Ø§Ù†ÙŠ.'},
custom:{name:'Ù…Ø®ØµØµ â€” Ø£ÙŠ Ø®Ø¯Ù…Ø© Ù…ØªÙˆØ§ÙÙ‚Ø© Ù…Ø¹ OpenAI',url:'',models:[],hint:'Ø£Ø¯Ø®Ù„ Ø±Ø§Ø¨Ø· Ø£ÙŠ Ø®Ø¯Ù…Ø© Ù…ØªÙˆØ§ÙÙ‚Ø© Ù…Ø¹ OpenAI (ÙŠÙ†ØªÙ‡ÙŠ Ø¨Ù€ /chat/completions) Ù…Ø¹ Ù…ÙØªØ§Ø­Ùƒ ÙˆØ§Ø³Ù… Ø§Ù„Ù…ÙˆØ¯ÙŠÙ„.'}};

function getEngineState(){const st=lsGet('khaled_engine_v1',{id:'pollinations',key:'',model:'',url:''});if(!ENGINES[st.id])st.id='pollinations';return st}
function setEngineState(st){lsSet('khaled_engine_v1',st)}
function engineLabel(){const st=getEngineState();const cfg=ENGINES[st.id];const model=st.model||(cfg.models&&cfg.models[0])||'';return cfg.name.split('â€”')[0].trim()+(model?' â€¢ '+model:'')}
function updateEngineTag(){const el=document.getElementById('engineTag');if(el)el.textContent='âš™ Ø§Ù„Ù…Ø­Ø±Ùƒ: '+engineLabel()}

const $=id=>document.getElementById(id);
const $$=sel=>document.querySelectorAll(sel);
function lsGet(k,f){try{const v=JSON.parse(localStorage.getItem(k));return v===null?f:v}catch{return f}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function escapeHtmlText(s){const d=document.createElement('div');d.textContent=s;return d.innerHTML}
function stripHtml(s){const d=document.createElement('div');d.innerHTML=s;return d.textContent||d.innerText||''}
function renderMarkdown(t){try{return marked.parse(t)}catch{return escapeHtmlText(t).replace(/\n/g,'<br>')}}
function enhanceCodeBlocks(c){c.querySelectorAll('pre code').forEach(b=>{try{hljs.highlightElement(b)}catch{};const pre=b.parentElement;if(pre.querySelector('.code-copy-btn'))return;const btn=document.createElement('button');btn.className='code-copy-btn';btn.textContent='Ù†Ø³Ø®';btn.addEventListener('click',()=>{navigator.clipboard.writeText(b.textContent).then(()=>{btn.textContent='ØªÙ… âœ“';setTimeout(()=>btn.textContent='Ù†Ø³Ø®',1500)}).catch(()=>{})});pre.appendChild(btn)})}
function toast(msg){const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>{t.style.opacity='0';t.style.transition='opacity .3s';setTimeout(()=>t.remove(),320)},2200)}
async function copyText(txt){try{await navigator.clipboard.writeText(txt);toast('ØªÙ… Ø§Ù„Ù†Ø³Ø® âœ“')}catch{toast('ØªØ¹Ø°Ø± Ø§Ù„Ù†Ø³Ø® â€” Ø§Ù†Ø³Ø® ÙŠØ¯ÙˆÙŠÙ‹Ø§')}}

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
  if(err.name==='AbortError')return 'ØªÙ… Ø¥ÙŠÙ‚Ø§Ù Ø§Ù„Ø±Ø¯.';
  if(err.status===401||err.status===403)return 'Ø§Ù„Ù…ÙØªØ§Ø­ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ù…Ù†ØªÙ‡ÙŠ â€” Ø±Ø§Ø¬Ø¹ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø­Ø±ÙƒØ§Øª.';
  if(err.status===429)return 'Ø§Ù„Ø®Ø¯Ù…Ø© Ù…Ø´ØºÙˆÙ„Ø© Ø­Ø§Ù„ÙŠÙ‹Ø§ (Ø­Ø¯ Ø§Ù„Ø·Ù„Ø¨Ø§Øª Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠØ©).';
  if(err.status===503||err.status===502)return 'Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ØªØ§Ø­ Ù…Ø¤Ù‚ØªÙ‹Ø§.';
  if(String(err.message).includes('Failed to fetch')||String(err.message).includes('NetworkError'))return 'ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ â€” ØªØ­Ù‚Ù‚ Ù…Ù† Ø§ØªØµØ§Ù„Ùƒ Ø¨Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª Ø£Ùˆ Ù…Ù† Ù…ÙØªØ§Ø­ Ø§Ù„Ù…Ø­Ø±Ùƒ.';
  return err.message||'Ø­Ø¯Ø« Ø®Ø·Ø£ ØºÙŠØ± Ù…ØªÙˆÙ‚Ø¹.';
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
  if(!full.trim())throw new AIError(0,'Ø§Ù†ØªÙ‡Ù‰ Ø§Ù„Ø¨Ø« Ø¨Ø¯ÙˆÙ† Ù…Ø­ØªÙˆÙ‰.');
  if(isErrorLike(full))throw new AIError(429,'Ø­ØµØ© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø¤Ù‚ØªØ© Ù…Ø´ØºÙˆÙ„Ø©.');
  return full.trim();
}
async function aiCallOnce(messages,signal,onChunk,forcedEngine){
  const st=forcedEngine||getEngineState();const cfg=ENGINES[st.id];
  const url=st.id==='custom'?st.url:cfg.url;
  if(!url)throw new AIError(0,'Ø£Ø¯Ø®Ù„ Ø±Ø§Ø¨Ø· Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ù…Ø®ØµØµ ÙÙŠ Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø£ÙˆÙ„Ù‹Ø§.');
  const headers={'Content-Type':'application/json'};
  if(!cfg.keyless){st.key=(st.key||'').trim();if(!st.key)throw new AIError(401,'Ù‡Ø°Ø§ Ø§Ù„Ù…Ø­Ø±Ùƒ ÙŠØ­ØªØ§Ø¬ Ù…ÙØªØ§Ø­ API â€” Ø£Ø¶ÙÙ‡ Ù…Ù† Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ù…Ø­Ø±ÙƒØ§Øª (âš™).');headers.Authorization='Bearer '+st.key}
  const model=st.model||cfg.models[0]||'openai';
  const internal=new AbortController();
  const onOuterAbort=()=>internal.abort();
  if(signal)signal.addEventListener('abort',onOuterAbort);
  const timer=setTimeout(()=>internal.abort(),90000);
  let resp;
  try{
    resp=await fetch(url,{method:'POST',headers,body:JSON.stringify({model,messages,stream:!!onChunk}),signal:internal.signal});
  }catch(e){
    clearTimeout(timer);if(signal)signal.removeEventListener('abort',onOuterAbort);
    if(signal&&signal.aborted)throw new DOMException('aborted','AbortError');
    throw new AIError(0,'Ø§Ù†ØªÙ‡Øª Ù…Ù‡Ù„Ø© Ø§Ù„Ù…Ø­Ø±Ùƒ (90 Ø«Ø§Ù†ÙŠØ©) Ø¨Ù„Ø§ Ø±Ø¯ â€” Ø³ÙŠÙØ¹Ø§Ø¯ ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§');
  }
  clearTimeout(timer);if(signal)signal.removeEventListener('abort',onOuterAbort);
  if(resp.ok){
    if(onChunk)return streamResponse(resp,onChunk);
    const data=await resp.json().catch(()=>null);
    const text=data&&data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content;
    if(!text||!text.trim())throw new AIError(0,'ÙˆØµÙ„ Ø±Ø¯ ÙØ§Ø±Øº Ù…Ù† Ø§Ù„Ù…Ø­Ø±Ùƒ.');
    if(isErrorLike(text))throw new AIError(429,'Ø­ØµØ© Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ù…Ø¤Ù‚ØªØ© Ù…Ø´ØºÙˆÙ„Ø©.');
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
          onStatus('Ø§Ù„Ø®Ø¯Ù…Ø© Ù…Ø´ØºÙˆÙ„Ø© â€” Ø¥Ø¹Ø§Ø¯Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ø¨Ø¹Ø¯ '+left+' Ø«â€¦ (Ù…Ø­Ø§ÙˆÙ„Ø© '+attempt+'/'+maxAttempts+')');
          const timer=setInterval(()=>{left--;if(left<=0){clearInterval(timer);onStatus('Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ø§Ù„Ø¢Ù†â€¦');resolve()}else onStatus('Ø§Ù„Ø®Ø¯Ù…Ø© Ù…Ø´ØºÙˆÙ„Ø© â€” Ø¥Ø¹Ø§Ø¯Ø© ØªÙ„Ù‚Ø§Ø¦ÙŠØ© Ø¨Ø¹Ø¯ '+left+' Ø«â€¦ (Ù…Ø­Ø§ÙˆÙ„Ø© '+attempt+'/'+maxAttempts+')')},1000);
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
      if(opts.onStatus)opts.onStatus('ØªØ¹Ø°Ø± Ù…Ø­Ø±Ùƒ '+engineLabel()+' â€” Ø§Ù„ØªØ­ÙˆÙ„ Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø¥Ù„Ù‰ Ø§Ù„Ù…Ø­Ø±Ùƒ Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠâ€¦');
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
    const clean=String(text).replace(/```[\s\S]*?```/g,' Ù…Ù‚Ø·Ø¹ ÙƒÙˆØ¯ ').replace(/[#*`_>|]/g,'').replace(/\[(.*?)\]\(.*?\)/g,'$1').slice(0,3000);
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

/* ---------- connection checker (engine-aware, ÙŠÙˆÙØ± Ø§Ù„Ø±ØµÙŠØ¯ Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠ) ---------- */
async function checkConnection(){
  const ind=$('connIndicator'),txt=$('connText');if(!ind)return;
  try{
    const ctrl=new AbortController();const t=setTimeout(()=>ctrl.abort(),10000);
    const resp=await aiCallOnce([{role:'user',content:'ping'}],ctrl.signal,null);
    clearTimeout(t);
    ind.className='conn-indicator conn-ok';txt.textContent='Ø§Ù„Ù…Ø­Ø±Ùƒ ÙŠØ¹Ù…Ù„';
  }catch(err){
    if(err.status===429){ind.className='conn-indicator conn-ok';txt.textContent='Ø§Ù„Ù…Ø­Ø±Ùƒ Ù…ØªØµÙ„ (Ù…Ø´ØºÙˆÙ„)'}
    else if(err.status===401||err.status===403){ind.className='conn-indicator conn-bad';txt.textContent='Ø§Ù„Ù…ÙØªØ§Ø­ ØºÙŠØ± ØµØ§Ù„Ø­'}
    else{ind.className='conn-indicator conn-bad';txt.textContent='ØªØ¹Ø°Ø± Ø§Ù„ÙˆØµÙˆÙ„ Ù„Ù„Ù…Ø­Ø±Ùƒ'}
  }
}

/* ÙØ­Øµ Ø§Ù„Ø§ØªØµØ§Ù„: Ø¹Ù†Ø¯ ÙØªØ­ Ø§Ù„ØµÙØ­Ø©ØŒ ÙˆØ¨Ø¹Ø¯Ù‡Ø§ ÙƒÙ„ 20 Ø¯Ù‚ÙŠÙ‚Ø© ÙÙ‚Ø·ØŒ ÙˆÙŠØªÙˆÙ‚Ù ØªÙ…Ø§Ù…Ù‹Ø§
   Ù„Ùˆ Ø§Ù„ØªØ¨ÙˆÙŠØ¨ ÙÙŠ Ø§Ù„Ø®Ù„ÙÙŠØ© â€” ÙŠØ­Ù…ÙŠ Ø­ØµØªÙƒ Ø§Ù„Ù…Ø¬Ø§Ù†ÙŠØ© Ù…Ù† Ø§Ù„Ø§Ø³ØªÙ‡Ù„Ø§Ùƒ Ø§Ù„ØµØ§Ù…Øª */
document.addEventListener('visibilitychange', () => {
  if(document.visibilityState === 'visible') checkConnection();
});
checkConnection();
setInterval(() => { if(document.visibilityState === 'visible') checkConnection(); }, 20*60*1000);
