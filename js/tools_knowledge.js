'use strict';
/* KHALED AI SUITE — tools_knowledge.js: wikipedia search, prayer times, hijri, weather, crypto */

/* ================= WIKIPEDIA SEARCH ================= */
let lastSearchResults=[];
async function wikiSearch(){
  const q=$('searchQuery').value.trim();if(!q)return;
  const resultsBox=$('searchResults'),srcList=$('srcList'),sumBox=$('aiSummary');
  sumBox.style.display='none';resultsBox.style.display='block';
  srcList.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ البحث في ويكيبيديا…</span></div>';
  try{
    const url='https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch='+encodeURIComponent(q)+'&format=json&origin=*&srlimit=5&srprop=snippet';
    const r=await fetch(url);const d=await r.json();
    const hits=d.query&&d.query.search?d.query.search:[];
    if(!hits.length){srcList.innerHTML='<div class="error-box">لا توجد نتائج في ويكيبيديا العربية — جرّب كلمات أخرى.</div>';lastSearchResults=[];return}
    lastSearchResults=hits.map((h,i)=>({num:i+1,title:h.title,url:'https://ar.wikipedia.org/wiki/'+encodeURIComponent(h.title.replace(/ /g,'_')),snippet:stripHtml(h.snippet)}));
    srcList.innerHTML='';
    lastSearchResults.forEach(r=>{
      const div=document.createElement('div');div.className='src-card';
      div.innerHTML='<span class="src-num">'+r.num+'</span><a class="src-title" target="_blank" rel="noopener" href="'+r.url+'">'+escapeHtmlText(r.title)+'</a><div class="src-snip">'+escapeHtmlText(r.snippet)+'…</div>';
      srcList.appendChild(div)});
  }catch(err){srcList.innerHTML='<div class="error-box">تعذر البحث: '+escapeHtmlText(err.message||'خطأ في الاتصال')+'</div>'}
}
async function wikiSummarize(){
  if(!lastSearchResults.length)return;
  const sumBox=$('aiSummary');sumBox.style.display='block';
  sumBox.innerHTML='<span class="spinner"></span> <span class="loading-text">جارٍ التلخيص مع إعادة محاولة تلقائية…</span>';
  const sources=lastSearchResults.map(r=>'['+r.num+'] '+r.title+': '+r.snippet).join('\n');
  const q=$('searchQuery').value.trim();
  try{
    const full=await callAI([{role:'user',content:'سؤال البحث: "'+q+'"\n\nمراجع من ويكيبيديا:\n'+sources+'\n\nلخص المعلومات من هذه المراجع فقط بإجابة واضحة ومنظمة بالعربية. استخدم أرقام المراجع [1] [2] عند ذكر معلومة، واذكر صراحة إن كانت المراجع لا تجيب السؤال كاملًا. لا تخترع معلومات ليست في المراجع.'}],{maxAttempts:4});
    sumBox.innerHTML='<strong style="color:var(--accent-blue)"><i class="fa-solid fa-brain me-1"></i>الملخص الذكي:</strong><hr style="border-color:rgba(255,255,255,0.1)">'+renderMarkdown(full);
  }catch(err){sumBox.innerHTML='<div class="error-box">تعذر التلخيص: '+escapeHtmlText(friendlyError(err))+'<br>المصادر أعلاه متاحة للقراءة المباشرة.</div>'}
}
function initSearchUI(){
  if(!$('searchBtn'))return;
  $('searchBtn').addEventListener('click',wikiSearch);
  $('searchQuery').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();wikiSearch()}});
  $('summarizeBtn').addEventListener('click',wikiSummarize);
}

/* ================= PRAYER TIMES (aladhan API — free, CORS) ================= */
const SAUDI_CITIES=['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','أبها','تبوك','الطائف','بريدة','حائل','نجران','جازان','ينبع','الخبر','الأحساء'];
const PRAYER_NAMES=[['Fajr','الفجر'],['Sunrise','الشروق'],['Dhuhr','الظهر'],['Asr','العصر'],['Maghrib','المغرب'],['Isha','العشاء']];
function nextPrayerIdx(timings){
  const now=new Date();
  const toMin=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
  const cur=now.getHours()*60+now.getMinutes();
  for(let i=0;i<PRAYER_NAMES.length;i++){
    const t=timings[PRAYER_NAMES[i][0]];
    if(t&&toMin(t.split(' ')[0])>cur)return i;
  }
  return 0;
}
async function prayerGo(city){
  city=city||$('prayerCity').value;
  const out=$('prayerResult');
  out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ جلب أوقات الصلاة…</span></div>';
  try{
    const url='https://api.aladhan.com/v1/timingsByCity?city='+encodeURIComponent(city)+'&country=Saudi%20Arabia&method=4';
    const r=await fetch(url);const d=await r.json();
    if(!d.data||!d.data.timings)throw new Error(d.status||'استجابة غير متوقعة');
    const t=d.data.timings;const h=d.data.date.hijri;
    const nextIdx=nextPrayerIdx(t);
    let html='<div class="hijri-big">🕌 '+h.day+' '+h.month.ar+' '+h.year+' هـ</div><div class="prayer-grid">';
    PRAYER_NAMES.forEach(([key,name],i)=>{
      const cls=i===nextIdx?'prayer-card next':'prayer-card';
      html+='<div class="'+cls+'"><div class="p-name">'+name+(i===nextIdx?' ⬅ التالية':'')+'</div><div class="p-time">'+String(t[key]).split(' ')[0]+'</div></div>';
    });
    html+='</div><div class="foot-note" style="padding:0.4rem">حسب تقويم أم القرى — مدينة '+escapeHtmlText(city)+'</div>';
    out.innerHTML=html;
  }catch(err){out.innerHTML='<div class="error-box">تعذر جلب أوقات الصلاة: '+escapeHtmlText(err.message||'تحقق من الاتصال')+'</div>'}
}
function initPrayerUI(){
  if(!$('prayerBtn'))return;
  SAUDI_CITIES.forEach(c=>{const o=document.createElement('option');o.textContent=c;$('prayerCity').appendChild(o)});
  $('prayerBtn').addEventListener('click',()=>prayerGo());
  prayerGo('الرياض');
}

/* ================= HIJRI DATE (offline — Intl API) ================= */
function hijriOf(date){
  try{
    const f=new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{day:'numeric',month:'long',year:'numeric'});
    return f.format(date);
  }catch{return 'غير مدعوم في هذا المتصفح'}
}
function gregorianOf(date){
  try{return new Intl.DateTimeFormat('ar',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(date)}
  catch{return date.toDateString()}
}
function hijriUpdate(){
  const v=$('hijriDateInput').value;
  const date=v?new Date(v+'T12:00:00'):new Date();
  if(isNaN(date)){toast('تاريخ غير صالح');return}
  $('hijriResult').innerHTML='<div class="hijri-big">🌙 '+hijriOf(date)+'</div><div style="text-align:center;color:var(--text-muted);font-size:0.85rem">'+gregorianOf(date)+'</div>';
}
function initHijriUI(){
  if(!$('hijriDateInput'))return;
  const today=new Date();
  $('hijriDateInput').value=today.toISOString().slice(0,10);
  $('hijriDateInput').addEventListener('change',hijriUpdate);
  $('hijriToday').addEventListener('click',()=>{$('hijriDateInput').value=new Date().toISOString().slice(0,10);hijriUpdate()});
  hijriUpdate();
}

/* ================= WEATHER (Open-Meteo — free, CORS, no key) ================= */
const WEATHER_CITIES=[['الرياض',24.71,46.68],['جدة',21.49,39.19],['مكة المكرمة',21.39,39.86],['المدينة المنورة',24.52,39.59],['الدمام',26.42,50.09],['أبها',18.22,42.5],['تبوك',28.38,36.57],['الطائف',21.27,40.42],['بريدة',26.36,43.99],['القاهرة',30.04,31.24],['دبي',25.2,55.27],['عمّان',31.95,35.93]];
const WCODES={0:['☀️','صافٍ'],1:['🌤️','صافٍ جزئيًا'],2:['⛅','غائم جزئيًا'],3:['☁️','غائم'],45:['🌫️','ضباب'],48:['🌫️','ضباب متجمد'],51:['🌦️','رذاذ خفيف'],53:['🌦️','رذاذ'],55:['🌧️','رذاذ كثيف'],61:['🌧️','مطر خفيف'],63:['🌧️','مطر'],65:['⛈️','مطر غزير'],71:['🌨️','ثلج خفيف'],73:['🌨️','ثلج'],75:['❄️','ثلج كثيف'],80:['🌦️','زخات مطر'],81:['🌧️','زخات قوية'],82:['⛈️','زخات عنيفة'],95:['⛈️','عاصفة رعدية'],96:['⛈️','عاصفة برد'],99:['⛈️','عاصفة شديدة']};
function wIcon(code){return WCODES[code]||['🌡️','غير محدد']}
async function weatherGo(lat,lon,label){
  const out=$('weatherResult');
  out.innerHTML='<div class="loading-block"><span class="spinner"></span><br><span class="loading-text">جارٍ جلب حالة الطقس…</span></div>';
  try{
    const url='https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&current_weather=true&daily=temperature_2m_max,temperature_2m_min,weathercode&forecast_days=4&timezone=auto';
    const r=await fetch(url);const d=await r.json();
    const cw=d.current_weather;const[icon,desc]=wIcon(cw.weather_code);
    const daily=d.daily;const days=['اليوم','غدًا','بعد غد','بعد ثلاثة'];
    let html='<div class="weather-now"><div class="weather-big" style="font-size:2.6rem">'+icon+'</div><div><div class="weather-big">'+Math.round(cw.temperature)+'°C</div><div class="weather-desc">'+desc+' — '+escapeHtmlText(label)+' • رياح '+Math.round(cw.windspeed)+' كم/س</div></div></div>';
    html+='<div class="forecast-row">';
    for(let i=0;i<daily.time.length;i++){
      const[fi,fd]=wIcon(daily.weathercode[i]);
      const dateLbl=i===0?'اليوم':i===1?'غدًا':new Date(daily.time[i]).toLocaleDateString('ar',{weekday:'long'});
      html+='<div class="forecast-card"><div class="fc-icon">'+fi+'</div><div style="font-weight:700;margin-bottom:0.2rem">'+dateLbl+'</div><div style="direction:ltr">'+Math.round(daily.temperature_2m_min[i])+'° / <strong>'+Math.round(daily.temperature_2m_max[i])+'°</strong></div><div style="color:var(--text-muted);font-size:0.72rem">'+fd+'</div></div>';
    }
    html+='</div>';
    out.innerHTML=html;
  }catch(err){out.innerHTML='<div class="error-box">تعذر جلب الطقس: '+escapeHtmlText(err.message||'تحقق من الاتصال')+'</div>'}
}
function initWeatherUI(){
  if(!$('weatherBtn'))return;
  WEATHER_CITIES.forEach(([name,lat,lon])=>{const o=document.createElement('option');o.value=JSON.stringify([lat,lon,name]);o.textContent=name;$('citySelect').appendChild(o)});
  $('weatherBtn').addEventListener('click',()=>{const sel=$('citySelect').value;const[lat,lon,name]=JSON.parse(sel);weatherGo(lat,lon,name)});
  $('geoBtn').addEventListener('click',()=>{
    if(!navigator.geolocation){toast('المتصفح لا يدعم تحديد الموقع');return}
    toast('جارٍ تحديد موقعك…');
    navigator.geolocation.getCurrentPosition(p=>weatherGo(p.coords.latitude,p.coords.longitude,'موقعك الحالي'),()=>toast('تعذر تحديد الموقع — اختر مدينة من القائمة'),{timeout:10000});
  });
  weatherGo(24.71,46.68,'الرياض');
}

/* ================= CRYPTO PRICES (CoinGecko — free, CORS) ================= */
const COINS=[['bitcoin','Bitcoin','BTC'],['ethereum','Ethereum','ETH'],['tether','Tether','USDT'],['solana','Solana','SOL'],['ripple','XRP','XRP'],['binancecoin','BNB','BNB'],['dogecoin','Dogecoin','DOGE'],['cardano','Cardano','ADA']];
async function cryptoGo(){
  const grid=$('cryptoGrid');
  grid.innerHTML='<div class="loading-block" style="grid-column:1/-1"><span class="spinner"></span><br><span class="loading-text">جارٍ جلب الأسعار المباشرة…</span></div>';
  try{
    const ids=COINS.map(c=>c[0]).join(',');
    const url='https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids='+ids+'&price_change_percentage=24h';
    const r=await fetch(url);const d=await r.json();
    if(!Array.isArray(d)||!d.length)throw new Error('استجابة غير متوقعة');
    grid.innerHTML='';
    d.sort((a,b)=>b.market_cap-a.market_cap).forEach(c=>{
      const change=c.price_change_percentage_24h;
      const cls=change>=0?'up':'down';const sign=change>=0?'▲':'▼';
      const fmt=n=>n>=1000?Math.round(n).toLocaleString('en-US'):n>=1?n.toFixed(2):n.toFixed(4);
      const div=document.createElement('div');div.className='crypto-card';
      div.innerHTML='<div class="c-name">'+escapeHtmlText(c.name)+'</div><div class="c-sym">'+escapeHtmlText(c.symbol.toUpperCase())+'</div><div class="c-price">$'+fmt(c.current_price)+'</div><div class="c-change '+cls+'">'+sign+' '+Math.abs(change||0).toFixed(1)+'%</div>';
      grid.appendChild(div)});
    const upd=$('cryptoUpdated');if(upd)upd.textContent='آخر تحديث: '+new Date().toLocaleTimeString('ar');
  }catch(err){grid.innerHTML='<div class="error-box" style="grid-column:1/-1">تعذر جلب الأسعار: '+escapeHtmlText(err.message||'تحقق من الاتصال')+'</div>'}
}
function initCryptoUI(){
  if(!$('cryptoRefresh'))return;
  $('cryptoRefresh').addEventListener('click',cryptoGo);
  cryptoGo();
  setInterval(cryptoGo,120000);
}
