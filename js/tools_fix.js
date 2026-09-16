'use strict';
/* KHALED AI — tools_fix.js: محرك الإصلاح الشامل — أمر واحد يعدّل المستودع مباشرة */
const FX_REPO='kaledhbabi4010-crypto/You-frist';
const FX_FILES=['index.html','css/app.css','js/core.js','js/tools_ai.js','js/tools_knowledge.js','js/tools_util.js','js/tools_pro.js','js/tools_fix.js','llm_provider_config.json'];
let fxLast=null;
function fxTok(){return (lsGet('khaled_gh_token','')||'').trim()}
async function fxRun(){
  const token=fxTok(),file=$('fxFile').value,cmd=$('fxCmd').value.trim();
  const st=$('fxStatus'),pv=$('fxPreview'),commitBtn=$('fxCommitBtn');
  commitBtn.style.display='none';pv.style.display='none';fxLast=null;
  if(!token){st.style.color='var(--accent-rose)';st.textContent='✗ الصق مفتاح GitHub أولًا (github.com/settings/tokens — صلاحيات Contents: Read and write على مستودعك فقط، واحذفه بعد الانتهاء)';return}
  if(!cmd){st.style.color='var(--accent-rose)';st.textContent='✗ اكتب أمر التعديل';return}
  st.style.color='var(--accent-amber)';st.textContent='⏳ 1/3 — جارٍ قراءة الملف من المستودع…';
  let meta;
  try{
    const r=await fetch('https://api.github.com/repos/'+FX_REPO+'/contents/'+file,{headers:{Authorization:'Bearer '+token,'Accept':'application/vnd.github+json'}});
    if(r.status===401||r.status===403){st.style.color='var(--accent-rose)';st.textContent='✗ المفتاح غير صالح أو بلا صلاحية Contents:Read+Write — أنشئ مفتاحًا جديدًا';return}
    if(!r.ok){st.style.color='var(--accent-rose)';st.textContent='✗ تعذر قراءة الملف من GitHub (HTTP '+r.status+')';return}
    meta=await r.json();
  }catch(e){st.style.color='var(--accent-rose)';st.textContent='✗ تعذر الاتصال بـ GitHub — تحقق من إنترنتك';return}
  const original=atob((meta.content||'').replace(/\n/g,''));
  st.textContent='⏳ 2/3 — جارٍ توليد الإصلاح بالذكاء الاصطناعي (مع إعادة محاولة تلقائية)…';
  try{
    const reply=await callAI([{role:'user',content:'أنت مهندس صيانة موثوق لموقع ويب. هذا ملف "'+file+'" كاملًا:\n\n```\n'+original+'\n```\n\nأمر التعديل المطلوب: "'+cmd+'"\n\nالمطلوب: أخرج الملف كاملًا بعد تنفيذ الأمر في كتلة واحدة فقط بين ``` في البداية والنهاية. قواعد صارمة: 1) لا تحذف أي وظيفة موجودة 2) نفّذ الأمر فقط وما يتطلبه 3) أخرج الملف كاملًا حرفيًا من أول سطر لآخر سطر بدون اختصار أو تعليق "// الباقي كما هو" 4) لا تكتب أي شرح خارج الكتلة.'}],{maxAttempts:4,onStatus:s=>{st.textContent='⏳ 2/3 — '+s}});
    const m=reply.match(/```[a-z]*\s*\n?([\s\S]*?)```/);
    const patched=(m?m[1]:reply).trim();
    if(!patched||patched.length<original.length*0.5){
      st.style.color='var(--accent-rose)';st.textContent='✗ الموديل قصّ الملف (خرج '+patched.length+' من '+original.length+' حرفًا) — جرّب مرة أخرى أو موديلًا أقوى (Groq) — لم يُنشر شيء';
      pv.style.display='block';pv.textContent='معاينة المخرج المرفوض:\n\n'+patched.slice(0,600)+'…';
      return;
    }
    fxLast={file,content:patched,sha:meta.sha,message:'fix-engine: '+cmd.slice(0,80)};
    pv.style.display='block';pv.textContent=patched;
    let ok='✅';
    if(patched.length<original.length*0.9)ok='⚠ الملف الجديد أصغر من الأصل ('+patched.length+' مقابل '+original.length+') — راجع المعاينة قبل النشر';
    st.style.color='var(--accent-emerald)';st.textContent='✓ 3/3 — الإصلاح جاهز ('+patched.length+' حرفًا). '+ok;
    commitBtn.style.display='inline-block';
  }catch(err){st.style.color='var(--accent-rose)';st.textContent='✗ تعذر توليد الإصلاح: '+friendlyError(err)}
}
async function fxCommit(){
  if(!fxLast)return;
  const st=$('fxStatus'),token=fxTok();
  st.style.color='var(--accent-amber)';st.textContent='⏳ جارٍ النشر إلى المستودع…';
  try{
    const b64=btoa(unescape(encodeURIComponent(fxLast.content)));
    const r=await fetch('https://api.github.com/repos/'+FX_REPO+'/contents/'+fxLast.file,{
      method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
      body:JSON.stringify({message:fxLast.message,content:b64,sha:fxLast.sha})});
    if(r.ok){
      st.style.color='var(--accent-emerald)';st.textContent='✅ تم نشر الإصلاح في المستودع! GitHub Pages سيحدّث الموقع خلال دقيقتين تقريبًا (Ctrl+Shift+R للتحديث)';
      fxLast=null;$('fxCommitBtn').style.display='none';
    }else{
      let d='';try{d=(await r.json()).message||''}catch{}
      if(r.status===409){st.style.color='var(--accent-amber)';st.textContent='⚠ الملف تغيّر في المستودع منذ قراءته — اضغط تنفيذ مرة أخرى ليعيد القراءة والتعديل على النسخة الجديدة'}
      else{st.style.color='var(--accent-rose)';st.textContent='✗ رفض GitHub النشر (HTTP '+r.status+') '+d}
    }
  }catch(e){st.style.color='var(--accent-rose)';st.textContent='✗ تعذر الاتصال بـ GitHub'}
}
function initFixUI(){
  if(!$('fxRunBtn'))return;
  const saved=fxTok();if(saved)$('fxToken').value=saved;
  $('fxToken').addEventListener('change',()=>lsSet('khaled_gh_token',$('fxToken').value.trim()));
  const sel=$('fxFile');sel.innerHTML='';FX_FILES.forEach(f=>{const o=document.createElement('option');o.value=f;o.textContent=f;sel.appendChild(o)});
  $('fxRunBtn').addEventListener('click',fxRun);
  $('fxCommitBtn').addEventListener('click',fxCommit);
}
