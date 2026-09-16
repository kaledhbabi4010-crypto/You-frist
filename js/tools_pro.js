'use strict';
/* KHALED AI SUITE — tools_pro.js: إعدادات المحركات، البحث العميق، منشئ التطبيقات، مركز الوظائف */

/* ================= ENGINE SETTINGS ================= */
function initSettingsUI(){
  if(!$('setEngine'))return;
  const sel=$('setEngine'),keyIn=$('setKey'),modelIn=$('setModel'),urlRow=$('setUrlRow'),urlIn=$('setUrl'),hint=$('setHint'),dl=$('setModelList');
  sel.innerHTML='';
  Object.entries(ENGINES).forEach(([id,cfg])=>{const o=document.createElement('option');o.value=id;
    o.textContent=cfg.name+(cfg.keyless?' ✓ مجاني بدون مفتاح':(cfg.free!==false?' (مفتاح مجاني)':''));sel.appendChild(o)});
  const st=getEngineState();
  function syncUI(){
    const cfg=ENGINES[sel.value];hint.textContent='💡 '+cfg.hint;
    keyIn.parentElement.style.display=cfg.keyless?'none':'block';
    urlRow.style.display=sel.value==='custom'?'block':'none';
    dl.innerHTML='';(cfg.models||[]).forEach(m=>{const o=document.createElement('option');o.value=m;dl.appendChild(o)});
    if(sel.value==='pollinations'&&!modelIn.value)modelIn.value='openai';
  }
  sel.value=st.id;keyIn.value=st.key||'';modelIn.value=st.model||'';urlIn.value=st.url||'';syncUI();
  sel.addEventListener('change',()=>{const cfg=ENGINES[sel.value];modelIn.value=cfg.models&&cfg.models[0]||'';$('setTestResult').innerHTML='';syncUI()});
  $('setSaveBtn').addEventListener('click',()=>{
    const st2={id:sel.value,key:keyIn.value.trim(),model:modelIn.value.trim(),url:urlIn.value.trim()};
    setEngineState(st2);updateEngineTag();checkConnection();toast('تم حفظ المحرك ✓ — كل أدوات الذكاء ستستخدمه الآن');
  });
  $('setResetBtn').addEventListener('click',()=>{setEngineState({id:'pollinations',key:'',model:'openai',url:''});sel.value='pollinations';keyIn.value='';modelIn.value='openai';syncUI();updateEngineTag();checkConnection();toast('عودة للمحرك المجاني بدون مفتاح ✓')});
  $('setTestBtn').addEventListener('click',async()=>{
    const res=$('setTestResult');res.style.color='var(--accent-amber)';res.textContent='⏳ جارٍ اختبار الاتصال…';
    const testState={id:sel.value,key:keyIn.value.trim(),model:modelIn.value.trim()||ENGINES[sel.value].models[0]||'',url:urlIn.value.trim()};
    try{
      const t=await callWithRetries([{role:'user',content:'قل: تم الاتصال بنجاح'}],{},testState);
      res.style.color='var(--accent-emerald)';res.textContent='✓ المحرك يعمل! رده: '+t.slice(0,60);
    }catch(err){res.style.color='var(--accent-rose)';res.textContent='✗ '+friendlyError(err)}
  });
}

/* ================= DEEP SEARCH (بحث عميق: عربي + إنجليزي + خلاصات + تحليل) ================= */
let dsLastSources=[];
async function dsLangSearch(lang,q){
  const url='https://'+lang+'.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&origin=*&srlimit=6&srprop=snippet';
  const r=await fetch(url);const d=await r.json();
  return (d.query&&d.query.search?d.query.search:[]).map(h=>({title:h.title,url:'https://'+lang+'.wikipedia.org/wiki/'+encodeURIComponent(h.title.replace(/ /g,'_')),snippet:stripHtml(h.snippet)}));
}
async function deepSearch(){
  const q=$('dsQuery').value.trim();if(!q){toast('اكتب موضوع البحث');return}
  const box=$('dsSources'),ai=$('dsAI');
  ai.style.display='none';box.style.display='block';
  box.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ البحث العميق في ويكيبيديا العربية والإنجليزية…</span></div>';
  const [ar,en]=await Promise.allSettled([dsLangSearch('ar',q),dsLangSearch('en',q)]);
  const arHits=ar.status==='fulfilled'?ar.value:[];
  const enHits=en.status==='fulfilled'?en.value:[];
  if(!arHits.length&&!enHits.length){box.innerHTML='<div class="error-box">لا توجد نتائج — جرّب صياغة أخرى.</div>';dsLastSources=[];return}
  dsLastSources=[];
  let num=0;let html='';
  if(arHits.length){html+='<div class="ds-lang-head">🇸🇦 النتائج العربية ('+arHits.length+')</div>';
    arHits.forEach(h=>{num++;dsLastSources.push({num,title:h.title,url:h.url,snippet:h.snippet});
      html+='<div class="src-card"><span class="src-num">'+num+'</span><a class="src-title" target="_blank" rel="noopener" href="'+h.url+'">'+escapeHtmlText(h.title)+'</a><div class="src-snip">'+escapeHtmlText(h.snippet)+'…</div></div>'})}
  if(enHits.length){html+='<div class="ds-lang-head">🌐 النتائج الإنجليزية ('+enHits.length+')</div>';
    enHits.forEach(h=>{num++;dsLastSources.push({num,title:h.title,url:h.url,snippet:h.snippet});
      html+='<div class="src-card"><span class="src-num en">'+num+'</span><a class="src-title" target="_blank" rel="noopener" href="'+h.url+'">'+escapeHtmlText(h.title)+'</a><div class="src-snip">'+escapeHtmlText(h.snippet)+'…</div></div>'})}
  html+='<div class="foot-note">وجدت '+dsLastSources.length+' مرجعًا من لغتين — اضغط زر التحليل الشامل أدناه</div>';
  box.innerHTML=html;
  $('dsAnalyzeBtn').style.display='inline-block';
  $('dsCount').textContent=dsLastSources.length;
}
async function dsAnalyze(){
  if(!dsLastSources.length)return;
  const ai=$('dsAI'),q=$('dsQuery').value.trim();
  ai.style.display='block';
  ai.innerHTML='<span class="spinner"></span> <span class="loading-text">جارٍ التحليل الشامل للمراجع مع إعادة محاولة تلقائية…</span>';
  const sources=dsLastSources.map(s=>'['+s.num+'] ('+(s.url.includes('/ar.')?'عربي':'إنجليزي')+') '+s.title+': '+s.snippet).join('\n');
  try{
    const full=await callAI([{role:'user',content:'سؤال البحث العميق: "'+q+'"\n\nمراجع من ويكيبيديا بلغتين:\n'+sources+'\n\nالمطلوب: تقرير تحليلي شامل بالعربية يتضمن: 1) الإجابة المباشرة والوافية 2) أهم الحقائق والأرقام مع الإشارة لرقم المرجع [n] 3) خلفية تاريخية موجزة إن وجدت 4) ما لم تغطه المراجع بصراحة. لا تخترع أي معلومة ليست في المراجع.'}],{maxAttempts:4});
    ai.innerHTML='<strong style="color:var(--accent-blue)"><i class="fa-solid fa-brain me-1"></i>التحليل الشامل:</strong><hr style="border-color:rgba(255,255,255,0.1)">'+renderMarkdown(full);
  }catch(err){ai.innerHTML='<div class="error-box">تعذر التحليل: '+escapeHtmlText(friendlyError(err))+'<br>المراجع أعلاه متاحة للقراءة المباشرة.</div>'}
}
function initDeepSearchUI(){
  if(!$('dsBtn'))return;
  $('dsBtn').addEventListener('click',deepSearch);
  $('dsQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();deepSearch()}});
  $('dsAnalyzeBtn').addEventListener('click',dsAnalyze);
}

/* ================= APP BUILDER (منشئ التطبيقات) ================= */
let abLastCode='',abLastType='html';
async function abGen(){
  const desc=$('abDesc').value.trim();
  if(!desc){toast('صِف التطبيق الذي تريده');return}
  const type=$('abType').value;
  const status=$('abStatus'),codeEl=$('abCode');
  status.textContent='🚀 جارٍ بناء المشروع بالكامل — قد يستغرق حتى دقيقة…';
  codeEl.textContent='';
  let prompt;
  if(type==='html'){
    prompt='أنت مهندس برمجيات خبير محترف. ابنِ تطبيق ويب كاملًا يعمل من ملف HTML واحد بناءً على هذا الوصف:\n\n"'+desc+'"\n\nالمطلوب بدقة:\n1) أخرج كتلة واحدة فقط بصيغة ```html تحتوي ملف HTML كاملًا (head وbody وstyle وscript داخليًا).\n2) تصميم عصري جميل متجاوب مع الجوال، واجهة عربية RTL بخط جميل، ألوان متناسقة، وحركات ناعمة.\n3) كل الأكواد داخل الملف — بدون أي مكتبات خارجية أو CDN.\n4) التطبيق يجب أن يعمل فورًا عند فتحه بدون أخطاء.\n5) لا تكتب أي شرح خارج كتلة الكود.';
  }else{
    prompt='أنت مهندس بايثون خبير. اكتب سكربت بايثون كاملًا احترافيًا يعتمد فقط على المكتبات القياسية (أو numpy/pandas فقط) لهذه المهمة:\n\n"'+desc+'"\n\nأخرج كتلة واحدة فقط ```python بكود كامل جاهز للتشغيل مع تعليقات عربية موجزة، ومعالجة للأخطاء. لا شرح خارج الكتلة.';
  }
  try{
    const full=await callAI([{role:'user',content:prompt}],{maxAttempts:4,onStatus:s=>{status.textContent='⚠ '+s}});
    const m=full.match(/```(html|python)\s*([\s\S]*?)```/i);
    if(!m){status.textContent='';codeEl.textContent=full;$('abActions').style.display='flex';abLastCode=full;abLastType=type;toast('إليك الكود — لم أجد كتلة منظمة فعرضته كاملًا');return}
    abLastCode=m[2].trim();abLastType=type;
    status.textContent='';
    if(type==='html'){
      $('abPreview').srcdoc=abLastCode;
      $('abPreviewBox').style.display='block';
      $('abRunPyBtn').style.display='none';
    }else{
      $('abPreviewBox').style.display='none';
      $('abRunPyBtn').style.display='inline-block';
    }
    codeEl.textContent=abLastCode;
    $('abActions').style.display='flex';
    toast('تم بناء المشروع ✓ — جرّبه الآن');
  }catch(err){status.textContent='';toast('تعذر البناء: '+friendlyError(err))}
}
function initAppBuilderUI(){
  if(!$('abGenBtn'))return;
  $('abGenBtn').addEventListener('click',abGen);
  $('abCopyBtn').addEventListener('click',()=>copyText(abLastCode));
  $('abDownloadBtn').addEventListener('click',()=>{
    if(!abLastCode)return;
    const ext=abLastType==='html'?'html':'py';
    const mime=abLastType==='html'?'text/html':'text/x-python';
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([abLastCode],{type:mime}));
    a.download='khaled-app.'+ext;a.click();URL.revokeObjectURL(a.href);
    toast('تم التحميل ✓');
  });
  $('abRunPyBtn').addEventListener('click',()=>{
    if(!abLastCode)return;
    showView('python');
    $('pyCode').value=abLastCode;
    toast('الكود جاهز في أداة بايثون — اضغط تشغيل');
  });
}

/* ================= JOBS CENTER (مركز الوظائف) ================= */
function initJobsUI(){
  if(!$('jobTabs'))return;
  $('jobTabs').addEventListener('click',e=>{
    const btn=e.target.closest('.jtab-btn');if(!btn)return;
    $$('.jtab-btn').forEach(b=>b.classList.toggle('active',b===btn));
    $$('.jtab-pane').forEach(p=>p.style.display=p.id===btn.dataset.jtab?'block':'none');
  });
  /* CV generator + print */
  $('cvGenBtn').addEventListener('click',async()=>{
    const data={name:$('cvName').value.trim(),title:$('cvTitle').value.trim(),exp:$('cvExp').value.trim(),edu:$('cvEdu').value.trim(),skills:$('cvSkills').value.trim(),langs:$('cvLangs').value.trim()};
    if(!data.name||!data.title){toast('الاسم والمسمى الوظيفي مطلوبان');return}
    const out=$('cvResult');
    out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ صياغة سيرتك الذاتية الاحترافية…</span></div>';
    const fields=Object.entries(data).filter(([k,v])=>v).map(([k,v])=>k+': '+v).join('\n');
    try{
      const full=await callAI([{role:'user',content:'أنشئ سيرة ذاتية احترافية بالعربية (بتنسيق Markdown أنيق) لهذا المرشح:\n'+fields+'\n\nاجعلها سيرة ذاتية احترافية مقنعة: ملخص شخصي قوي، خبرات عملية بصيغة إنجازات، مهارات مصنفة، وتعليم. لا تخترع أي خبرة لم يذكرها — صِغ ما ذكره بشكل احترافي فقط.'}],{maxAttempts:4});
      out.innerHTML=renderMarkdown(full);
      $('cvPrintBtn').style.display='inline-block';
      $('cvCopyBtn').style.display='inline-block';
      out.dataset.md=full;
    }catch(err){out.innerHTML='<div class="error-box">'+escapeHtmlText(friendlyError(err))+'</div>'}
  });
  $('cvPrintBtn').addEventListener('click',()=>{
    const w=window.open('','_blank');
    const md=$('cvResult').dataset.md||$('cvResult').textContent;
    w.document.write('<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>سيرة ذاتية</title><script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js"><\/script><style>body{font-family:Arial,sans-serif;max-width:750px;margin:2rem auto;padding:0 1.5rem;line-height:1.9;color:#111}h1{color:#0f4c81;border-bottom:3px solid #0f4c81;padding-bottom:0.4rem}h2{color:#0f4c81;margin-top:1.6rem}ul{padding-right:1.4rem}@media print{body{margin:0}}</style></head><body><div id="cv"></div><script>document.getElementById("cv").innerHTML=marked.parse('+JSON.stringify(md)+');setTimeout(()=>window.print(),400);<\/script></body></html>');
    w.document.close();
  });
  $('cvCopyBtn').addEventListener('click',()=>copyText($('cvResult').dataset.md||$('cvResult').textContent));
  /* Cover letter */
  $('letterGenBtn').addEventListener('click',async()=>{
    const job=$('letterJob').value.trim(),company=$('letterCompany').value.trim(),skills=$('letterSkills').value.trim();
    if(!job){toast('اكتب المسمى الوظيفي');return}
    const out=$('letterResult');
    out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ كتابة خطاب التقديم…</span></div>';
    try{
      const full=await callAI([{role:'user',content:'اكتب خطاب تقديم (Cover Letter) احترافيًا بالعربية لوظيفة "'+job+'"'+(company?' في شركة "'+company+'"':'')+(skills?' مع إبراز هذه المهارات: '+skills:'')+'. الخطاب: متميز، صادق بدون مبالغة، من 3 إلى 4 فقرات، جاهز للإرسال.'}],{maxAttempts:4});
      out.innerHTML=renderMarkdown(full);
      $('letterCopyBtn').style.display='inline-block';
      out.dataset.md=full;
    }catch(err){out.innerHTML='<div class="error-box">'+escapeHtmlText(friendlyError(err))+'</div>'}
  });
  $('letterCopyBtn').addEventListener('click',()=>copyText($('letterResult').dataset.md||$('letterResult').textContent));
  /* Interview simulator */
  $('intGenBtn').addEventListener('click',async()=>{
    const pos=$('intPosition').value.trim();
    if(!pos){toast('اكتب المسمى الوظيفي');return}
    const out=$('intResult');
    out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ تجهيز أسئلة المقابلة ونماذج الإجابات…</span></div>';
    try{
      const full=await callAI([{role:'user',content:'أنا مقدَّم على وظيفة "'+pos+'". جهّزني للمقابلة:\n\nأعطني 8 أسئلة متوقعة (من الأسهل للأصعب) مع إجابة نموذجية قوية لكل سؤال، وسؤالين ذكيين أنصحني بطرحهما على الشركة. بالعربية بتنسيق Markdown منظم.'}],{maxAttempts:4});
      out.innerHTML=renderMarkdown(full);
    }catch(err){out.innerHTML='<div class="error-box">'+escapeHtmlText(friendlyError(err))+'</div>'}
  });
}
