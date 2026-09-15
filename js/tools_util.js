'use strict';
/* KHALED AI SUITE — tools_util.js: python, playground, dictation, tts studio, qr, password, regex, json */

/* ================= PYTHON (Pyodide) ================= */
let pyodide=null,pyLoading=false;
const PY_EXAMPLES={
hello:'# أساسيات بايثون — عدّل وشغّل\nname = "KHALED AI"\nprint(f"مرحباً من {name}! 🐍")\nfor i in range(1, 6):\n    print(f"العدد {i} مربعه = {i**2}")',
fib:'def fib(n):\n    a, b = 0, 1\n    result = []\n    for _ in range(n):\n        result.append(a)\n        a, b = b, a + b\n    return result\n\nprint("أول 15 عدداً في متتالية فيبوناتشي:")\nprint(fib(15))',
numpy:'import numpy as np\n\narr = np.array([[1, 2, 3], [4, 5, 6]])\nprint("المصفوفة:")\nprint(arr)\nprint("المجموع:", arr.sum())\nprint("المتوسط:", arr.mean())\nprint("المنقول:")\nprint(arr.T)',
pandas:'import pandas as pd\n\ndata = {"الاسم": ["أحمد", "سارة", "خالد"], "العمر": [25, 30, 28]}\ndf = pd.DataFrame(data)\nprint(df)\nprint("متوسط العمر:", df["العمر"].mean())'};
async function ensurePyodide(statusEl){
  if(pyodide)return true;
  if(pyLoading){statusEl.textContent='بانتظار تحميل البيئة…';return false}
  pyLoading=true;statusEl.className='py-status';statusEl.textContent='⏳ جارٍ تحميل بيئة بايثون (مرة واحدة فقط)…';
  try{pyodide=await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/'});
    statusEl.className='py-status ok';statusEl.textContent='✓ بايثون '+pyodide.version+' جاهزة';pyLoading=false;return true}
  catch(err){pyLoading=false;statusEl.className='py-status err';statusEl.textContent='✗ تعذر تحميل بيئة بايثون — تحقق من اتصالك';return false}
}
async function pyRun(){
  const code=$('pyCode').value;if(!code.trim())return;
  const statusEl=$('pyStatus'),out=$('pyOutput');
  if(!(await ensurePyodide(statusEl)))return;
  statusEl.className='py-status';statusEl.textContent='🐍 جارٍ التنفيذ…';out.textContent='...';
  let output='';
  pyodide.setStdout({batched:s=>{output+=s+'\n'}});
  pyodide.setStderr({batched:s=>{output+='⚠️ '+s+'\n'}});
  try{
    await pyodide.loadPackagesFromImports(code);
    const result=await pyodide.runPythonAsync(code);
    if(result!==undefined&&result!==null)output+='\n← النتيجة: '+String(result);
    out.textContent=output||'(نفّذ الكود بدون مخرجات — استخدم print())';
    statusEl.className='py-status ok';statusEl.textContent='✓ تم التنفيذ بنجاح';
  }catch(err){out.textContent=output+'\n✗ خطأ:\n'+String(err);statusEl.className='py-status err';statusEl.textContent='✗ حدث خطأ (انظر الناتج)'}
}
function initPythonUI(){
  if(!$('pyRunBtn'))return;
  $('pyCode').value=PY_EXAMPLES.hello;
  $$('button[data-py]').forEach(chip=>{chip.addEventListener('click',()=>{$('pyCode').value=PY_EXAMPLES[chip.dataset.py]||''})});
  $('pyRunBtn').addEventListener('click',pyRun);
  $('pyClearBtn').addEventListener('click',()=>{$('pyOutput').textContent='(مسح)';$('pyStatus').textContent='';$('pyStatus').className='py-status'});
}

/* ================= CODE PLAYGROUND (HTML/CSS/JS live) ================= */
const PG_DEFAULT_HTML='<div class="card">\n  <h1>مرحباً بالعالم 👋</h1>\n  <p>عدّل الأكواد واضغط تشغيل</p>\n  <button id="btn">اضغطني</button>\n</div>';
const PG_DEFAULT_CSS='body{font-family:sans-serif;background:#1e293b;color:#fff;display:flex;justify-content:center;padding:2rem}\n.card{background:#334155;padding:2rem;border-radius:16px;text-align:center;box-shadow:0 10px 30px rgba(0,0,0,.3)}\nbutton{background:#2563eb;color:#fff;border:none;padding:.6rem 1.4rem;border-radius:10px;font-size:1rem;cursor:pointer}\nbutton:hover{background:#1d4ed8}';
const PG_DEFAULT_JS='document.getElementById("btn").addEventListener("click", () => {\n  alert("🎉 يعمل!");\n});';
function pgBuildDoc(){
  return '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><style>'+($('pgCss').value||'')+'</style></head><body>'+($('pgHtml').value||'')+'<script>try{'+($('pgJs').value||'')+'}catch(e){document.body.insertAdjacentHTML("beforeend","<pre style=\\"color:red;direction:ltr\\">"+e+"</pre>")}<\/script></body></html>';
}
function pgRun(){
  $('pgPreview').srcdoc=pgBuildDoc();
  toast('تم التشغيل ✓');
}
function initPlaygroundUI(){
  if(!$('pgRunBtn'))return;
  $('pgHtml').value=PG_DEFAULT_HTML;$('pgCss').value=PG_DEFAULT_CSS;$('pgJs').value=PG_DEFAULT_JS;
  $('pgRunBtn').addEventListener('click',pgRun);
  pgRun();
}

/* ================= DICTATION (voice → text) ================= */
function initDictationUI(){
  const startBtn=$('dictStartBtn');if(!startBtn)return;
  const rec=createRecognizer('ar-SA');
  if(!rec){$('dictStatus').textContent='⚠️ الإدخال الصوتي مدعوم في Chrome وEdge فقط';startBtn.disabled=true;return}
  let recording=false;
  rec.onresult=e=>{
    let finalTxt='';
    for(let i=0;i<e.results.length;i++)if(e.results[i].isFinal)finalTxt+=e.results[i][0].transcript;
    if(finalTxt)$('dictText').value=finalTxt;
  };
  rec.onend=()=>{recording=false;startBtn.classList.remove('recording');startBtn.innerHTML='<i class="fa-solid fa-microphone me-1"></i>ابدأ الاستماع';$('dictStatus').textContent=''};
  rec.onerror=e=>{recording=false;startBtn.classList.remove('recording');$('dictStatus').textContent='⚠️ '+({ 'not-allowed':'امنح المتصفح إذن الميكروفون','no-speech':'لم أسمع شيئًا — حاول مجددًا','audio-capture':'لا يوجد ميكروفون' }[e.error]||e.error)};
  startBtn.addEventListener('click',()=>{
    if(recording){rec.stop();return}
    try{rec.start();recording=true;startBtn.classList.add('recording');startBtn.innerHTML='<i class="fa-solid fa-stop me-1"></i>إيقاف الاستماع';$('dictStatus').textContent='🎤 أستمع إليك الآن…'}
    catch{}
  });
  $('dictCopy').addEventListener('click',()=>copyText($('dictText').value));
  $('dictClear').addEventListener('click',()=>{$('dictText').value=''});
}

/* ================= TTS STUDIO ================= */
function initTTSUI(){
  if(!$('ttsPlayBtn'))return;
  function fillVoices(){
    const sel=$('ttsVoice');if(!sel)return;
    const voices=window.speechSynthesis?speechSynthesis.getVoices():[];
    if(!voices.length)return;
    sel.innerHTML='<option value="">الصوت العربي الافتراضي</option>';
    voices.forEach(v=>{const o=document.createElement('option');o.value=v.voiceURI;o.textContent=v.name+' ('+v.lang+')';if(v.lang&&v.lang.startsWith('ar'))o.textContent='⭐ '+o.textContent;sel.appendChild(o)});
  }
  if(window.speechSynthesis){fillVoices();speechSynthesis.onvoiceschanged=fillVoices}
  $('ttsRate').addEventListener('input',()=>{$('ttsRateVal').textContent=$('ttsRate').value+'×'});
  $('ttsPlayBtn').addEventListener('click',()=>{
    const text=$('ttsText').value.trim();
    if(!text){toast('اكتب نصًا أولًا');return}
    const ok=speakText(text,$('ttsVoice').value,parseFloat($('ttsRate').value));
    if(!ok)toast('القراءة الصوتية غير مدعومة في هذا المتصفح');
  });
  $('ttsStopBtn').addEventListener('click',stopSpeaking);
}

/* ================= QR GENERATOR (qrcodejs CDN) ================= */
function initQRUI(){
  if(!$('qrBtn'))return;
  $('qrBtn').addEventListener('click',()=>{
    const text=$('qrText').value.trim();
    if(!text){toast('اكتب نصًا أو رابطًا أولًا');return}
    const box=$('qrBox');box.innerHTML='';
    try{
      new QRCode(box,{text,width:220,height:220,colorDark:'#0f172a',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M});
      $('qrDownload').style.display='inline-block';
    }catch(err){box.innerHTML='<div class="error-box">تعذر توليد QR: '+escapeHtmlText(err.message)+'</div>'}
  });
  $('qrDownload').addEventListener('click',()=>{
    const canvas=$('qrBox').querySelector('canvas');
    if(!canvas){toast('ولّد رمزًا أولًا');return}
    try{const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download='khaled-qr.png';a.click()}catch{toast('تعذر التحميل')}
  });
}

/* ================= PASSWORD GENERATOR ================= */
function initPasswordUI(){
  if(!$('pwGenBtn'))return;
  const sets={upper:'ABCDEFGHJKLMNPQRSTUVWXYZ',lower:'abcdefghijkmnopqrstuvwxyz',digits:'23456789',symbols:'!@#$%^&*-_=+?'};
  function gen(){
    const len=+$('pwLength').value;
    let pool='';
    ['upper','lower','digits','symbols'].forEach(k=>{if($('pw_'+k).checked)pool+=sets[k]});
    if(!pool){$('pwResult').textContent='اختر نوعًا واحدًا على الأقل';return null}
    const arr=new Uint32Array(len);crypto.getRandomValues(arr);
    let pw='';for(let i=0;i<len;i++)pw+=pool[arr[i]%pool.length];
    $('pwResult').textContent=pw;
    let bits=Math.log2(pool.length)*len;
    const bar=$('pwStrengthFill');const lbl=$('pwStrengthLabel');
    const pct=Math.min(100,Math.round(bits/128*100));
    bar.style.width=pct+'%';
    if(bits<45){bar.style.background='var(--accent-rose)';lbl.textContent='ضعيفة'}
    else if(bits<70){bar.style.background='var(--accent-amber)';lbl.textContent='متوسطة'}
    else if(bits<100){bar.style.background='#84cc16';lbl.textContent='قوية'}
    else{bar.style.background='var(--accent-emerald)';lbl.textContent='خرافية 💪'}
    return pw;
  }
  $('pwLength').addEventListener('input',()=>{$('pwLenVal').textContent=$('pwLength').value});
  $('pwGenBtn').addEventListener('click',gen);
  $('pwCopy').addEventListener('click',()=>{const p=$('pwResult').textContent;if(p&&!p.includes('اختر'))copyText(p)});
  gen();
}

/* ================= REGEX TESTER ================= */
function initRegexUI(){
  if(!$('rxRunBtn'))return;
  $('rxRunBtn').addEventListener('click',()=>{
    const pattern=$('rxPattern').value,flags=$('rxFlags').value||'g',testStr=$('rxTest').value;
    const errEl=$('rxError'),out=$('rxMatches');
    errEl.style.display='none';out.innerHTML='';
    if(!pattern){out.innerHTML='<span style="color:var(--text-muted)">أدخل نمط Regex</span>';return}
    let re;
    try{re=new RegExp(pattern,flags.includes('g')?flags:flags+'g')}
    catch(err){errEl.style.display='block';errEl.textContent='✗ '+err.message;return}
    const matches=testStr.match(re)||[];
    if(!matches.length){out.innerHTML='<span style="color:var(--text-muted)">لا تطابقات ('+escapeHtmlText(pattern)+')</span>';return}
    out.innerHTML='<div style="margin-bottom:0.4rem;color:var(--accent-emerald)">✓ '+matches.length+' تطابق:</div>';
    matches.slice(0,50).forEach(m=>{
      const chip=document.createElement('span');
      chip.style.cssText='display:inline-block;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.35);color:#a7f3d0;border-radius:8px;padding:0.15rem 0.6rem;margin:0.2rem;font-size:0.82rem;direction:ltr';
      chip.textContent='"'+m+'"';out.appendChild(chip)});
  });
  $('rxRunBtn').click();
}

/* ================= JSON TOOL ================= */
function initJSONUI(){
  if(!$('jsonFormatBtn'))return;
  $('jsonFormatBtn').addEventListener('click',()=>{
    const errEl=$('jsonError'),out=$('jsonOutput');errEl.style.display='none';
    try{
      const obj=JSON.parse($('jsonInput').value);
      out.textContent=JSON.stringify(obj,null,2);
      toast('JSON صالح ✓ — تم التنسيق');
    }catch(err){errEl.style.display='block';errEl.textContent='✗ '+err.message}
  });
  $('jsonMinifyBtn').addEventListener('click',()=>{
    const errEl=$('jsonError'),out=$('jsonOutput');errEl.style.display='none';
    try{
      const obj=JSON.parse($('jsonInput').value);
      out.textContent=JSON.stringify(obj);
      toast('تم التصغير ✓');
    }catch(err){errEl.style.display='block';errEl.textContent='✗ '+err.message}
  });
  $('jsonCopy').addEventListener('click',()=>copyText($('jsonOutput').textContent));
}
