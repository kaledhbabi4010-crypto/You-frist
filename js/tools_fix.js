'use strict';
/* KHALED AI â€” tools_fix.js (v3): ØªØ´Ø®ÙŠØµ Ø¬Ø°Ø±ÙŠ Ù…ØªØ¹Ø¯Ø¯ Ø§Ù„Ù…Ù„ÙØ§Øª
   Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙŠØµÙ Ù "Ø§Ù„Ù…Ø´ÙƒÙ„Ø©" ÙÙ‚Ø·ØŒ ÙˆØ§Ù„Ù…Ø­Ø±Ùƒ ÙŠØ­Ø¯Ø¯ Ø¨Ù†ÙØ³Ù‡ Ø£ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª ØªØ­ØªØ§Ø¬ Ù‚Ø±Ø§Ø¡Ø© ÙˆØªØ¹Ø¯ÙŠÙ„. */
const FX_REPO='kaledhbabi4010-crypto/Dad';
const FX_FILES=['index.html','css/app.css','js/core.js','js/tools_ai.js','js/tools_knowledge.js','js/tools_util.js','js/tools_pro.js','js/tools_fix.js'];
let fxBatch=[];

function fxTok(){return (lsGet('khaled_gh_token','')||'').trim()}

function fxCheckSyntax(file, content){
  const errors=[];
  if(file.endsWith('.js')){ try{ new Function(content);}catch(e){errors.push('Ø®Ø·Ø£ JS: '+e.message)} }
  if(file.endsWith('.html')){
    [...content.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((m,i)=>{
      if(!m[1].trim())return;
      try{ new Function(m[1]);}catch(e){errors.push('Ø®Ø·Ø£ JS Ø¯Ø§Ø®Ù„ <script> #'+(i+1)+': '+e.message)}
    });
    ['div','section','script','style'].forEach(tag=>{
      const o=(content.match(new RegExp('<'+tag+'(\\s|>)','gi'))||[]).length;
      const c=(content.match(new RegExp('</'+tag+'>','gi'))||[]).length;
      if(o!==c) errors.push('Ø§Ø®ØªÙ„Ø§Ù„ ØªÙˆØ§Ø²Ù† <'+tag+'>: ÙØªØ­ '+o+' / Ø¥ØºÙ„Ø§Ù‚ '+c);
    });
  }
  if(file.endsWith('.json')){ try{ JSON.parse(content);}catch(e){errors.push('JSON ØºÙŠØ± ØµØ§Ù„Ø­: '+e.message)} }
  return errors;
}
function fxExtractIdentifiers(c){
  return {ids:new Set([...c.matchAll(/\bid=["']([a-zA-Z0-9_-]+)["']/g)].map(m=>m[1])),
          fns:new Set([...c.matchAll(/\bfunction\s+([a-zA-Z0-9_$]+)\s*\(/g)].map(m=>m[1]))};
}
function fxCheckPreservation(orig, patched){
  const b=fxExtractIdentifiers(orig), a=fxExtractIdentifiers(patched);
  return {missingIds:[...b.ids].filter(x=>!a.ids.has(x)), missingFns:[...b.fns].filter(x=>!a.fns.has(x))};
}
function fxLineDiff(oldT,newT){
  const a=oldT.split('\n'), b=newT.split('\n'), n=a.length, m=b.length;
  const dp=Array.from({length:n+1},()=>new Uint32Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--) dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const out=[];let i=0,j=0;
  while(i<n&&j<m){ if(a[i]===b[j]){i++;j++} else if(dp[i+1][j]>=dp[i][j+1]){out.push({t:'-',l:a[i]});i++} else{out.push({t:'+',l:b[j]});j++} }
  while(i<n){out.push({t:'-',l:a[i]});i++} while(j<m){out.push({t:'+',l:b[j]});j++}
  return out;
}
function fxRenderDiff(diffLines){
  const shown=diffLines.filter(d=>d.t!==' ').slice(0,300);
  if(!shown.length) return '(Ù„Ø§ ÙØ±Ù‚ Ù…Ù„Ù…ÙˆØ³)';
  return shown.map(d=>'<div class="'+(d.t==='+'?'fx-diff-add':'fx-diff-del')+'">'+(d.t==='+'?'+ ':'- ')+escapeHtmlText(d.l)+'</div>').join('');
}

async function fxSelectFiles(problem){
  const list=FX_FILES.map(f=>'- '+f).join('\n');
  const prompt='Ù…Ø³ØªÙˆØ¯Ø¹ Ù…ÙˆÙ‚Ø¹ ÙˆÙŠØ¨ ÙÙŠÙ‡ Ù‡Ø°ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª:\n'+list+'\n\nÙˆØµÙ Ø§Ù„Ù…Ø´ÙƒÙ„Ø©: "'+problem+'"\n\nØ£ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª ÙŠØ¬Ø¨ Ù‚Ø±Ø§Ø¡ØªÙ‡Ø§ Ù„ØªØ´Ø®ÙŠØµ ÙˆØ­Ù„ Ù‡Ø°ÙŠ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© Ù…Ù† Ø¬Ø°ÙˆØ±Ù‡Ø§ØŸ Ø§ÙƒØªØ¨ Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ù…Ù„ÙØ§Øª ÙÙ‚Ø· (Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø© Ø£Ø¹Ù„Ø§Ù‡ Ø¨Ø§Ù„Ø¶Ø¨Ø·)ØŒ ÙƒÙ„ Ø§Ø³Ù… Ø¨Ø³Ø·Ø±ØŒ Ø¨Ø¯ÙˆÙ† Ø£ÙŠ Ø´Ø±Ø­. Ù„Ø§ ØªØ®ØªØ± Ø£ÙƒØ«Ø± Ù…Ù† 3 Ø¥Ù„Ø§ Ù„Ùˆ Ø¶Ø±ÙˆØ±ÙŠ.';
  const reply=await callAI([{role:'user',content:prompt}],{maxAttempts:3});
  const picked=reply.split('\n').map(l=>l.trim().replace(/^[-*]\s*/,'')).filter(l=>FX_FILES.includes(l));
  return picked.length?[...new Set(picked)]:['index.html'];
}

async function fxDiagnoseAndFix(problem, filesContent){
  const block=Object.entries(filesContent).map(([f,c])=>'FILE: '+f+'\n```\n'+c+'\n```').join('\n\n');
  const prompt='Ø£Ù†Øª Ù…Ù‡Ù†Ø¯Ø³ ØµÙŠØ§Ù†Ø© Ø¬Ø°Ø±ÙŠ Ù„Ù…ÙˆÙ‚Ø¹ ÙˆÙŠØ¨ Ø­Ù‚ÙŠÙ‚ÙŠ. Ù‡Ø°ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª Ø°Ø§Øª Ø§Ù„Ø¹Ù„Ø§Ù‚Ø©:\n\n'+block
    +'\n\nÙ…Ø´ÙƒÙ„Ø© Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…: "'+problem+'"\n\n'
    +'Ø´Ø®Ù‘Øµ Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ø¬Ø°Ø±ÙŠ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠ (Ù…Ùˆ ÙÙ‚Ø· Ø§Ù„Ø£Ø¹Ø±Ø§Ø¶)ØŒ Ø«Ù… Ø£ØµÙ„Ø­Ù‡ Ø¹Ø¨Ø± Ø£ÙŠ Ù…Ù† Ø§Ù„Ù…Ù„ÙØ§Øª Ø£Ø¹Ù„Ø§Ù‡ ÙŠØ­ØªØ§Ø¬ ØªØ¹Ø¯ÙŠÙ„.\n\n'
    +'Ø£Ø¬Ø¨ Ø¨Ù‡Ø°Ø§ Ø§Ù„Ø´ÙƒÙ„ Ø¨Ø§Ù„Ø¶Ø¨Ø·:\n\nROOT_CAUSE:\n(Ø³Ø¨Ø¨Ø§Ù† Ø£Ùˆ Ø«Ù„Ø§Ø«Ø© Ø£Ø³Ø·Ø± ØªØ´Ø±Ø­ Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ø¬Ø°Ø±ÙŠ Ø§Ù„Ø­Ù‚ÙŠÙ‚ÙŠØŒ Ø¨Ø¯Ù„ÙŠÙ„ Ù…Ù† Ø§Ù„ÙƒÙˆØ¯ Ù†ÙØ³Ù‡)\n\n'
    +'Ø«Ù… Ù„ÙƒÙ„ Ù…Ù„Ù ØªØ­ØªØ§Ø¬ ØªØ¹Ø¯ÙŠÙ„Ù‡ ÙÙ‚Ø· (Ù„Ø§ ØªÙƒØ±Ø± Ù…Ù„ÙØ§Øª Ù…Ø§ ØºÙŠÙ‘Ø±ØªÙ‡Ø§):\nFILE: (Ø§Ø³Ù… Ø§Ù„Ù…Ù„Ù Ø¨Ø§Ù„Ø¶Ø¨Ø· ÙƒÙ…Ø§ ÙˆØ±Ø¯ Ø£Ø¹Ù„Ø§Ù‡)\n```\n(Ø§Ù„Ù…Ù„Ù ÙƒØ§Ù…Ù„Ù‹Ø§ Ø¨Ø¹Ø¯ Ø§Ù„ØªØ¹Ø¯ÙŠÙ„ØŒ Ù…Ù† Ø£ÙˆÙ„ Ø³Ø·Ø± Ù„Ø¢Ø®Ø± Ø³Ø·Ø±ØŒ Ø¨Ø¯ÙˆÙ† Ø§Ø®ØªØµØ§Ø±)\n```\n\n'
    +'Ù‚ÙˆØ§Ø¹Ø¯ ØµØ§Ø±Ù…Ø©: 1) Ù„Ø§ ØªØ­Ø°Ù Ø£ÙŠ Ø¯Ø§Ù„Ø©/id Ø¥Ù„Ø§ Ù„Ùˆ Ø¶Ø±ÙˆØ±ÙŠ Ù„Ù„Ø­Ù„ 2) Ø¹Ø¯Ù‘Ù„ Ø£Ù‚Ù„ Ø¹Ø¯Ø¯ Ù…Ù„ÙØ§Øª Ù…Ù…ÙƒÙ† 3) Ù„Ø§ ØªÙƒØªØ¨ Ø£ÙŠ Ø´ÙŠØ¡ Ø®Ø§Ø±Ø¬ ROOT_CAUSE ÙˆÙƒØªÙ„ FILE.';
  return await callAI([{role:'user',content:prompt}],{maxAttempts:4,onStatus:s=>{$('fxStatus').textContent='â³ '+s}});
}

function fxParseMultiFile(reply){
  const rootMatch=reply.match(/ROOT_CAUSE:\s*([\s\S]*?)(?=FILE:|$)/i);
  const rootCause=rootMatch?rootMatch[1].trim():'(Ù„Ù… ÙŠÙˆØ¶Ø­ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ø¬Ø°Ø±ÙŠ Ø¨Ø´ÙƒÙ„ Ù…Ù†ÙØµÙ„)';
  const fileBlocks=[...reply.matchAll(/FILE:\s*([^\n]+)\n```[a-z]*\s*\n?([\s\S]*?)```/gi)];
  const files={};
  fileBlocks.forEach(m=>{ const name=m[1].trim(); if(FX_FILES.includes(name)) files[name]=m[2].trim(); });
  return {rootCause, files};
}

async function fxRun(){
  const token=fxTok(), problem=$('fxCmd').value.trim();
  const st=$('fxStatus'), pv=$('fxPreview'), commitBtn=$('fxCommitBtn');
  commitBtn.style.display='none'; pv.style.display='none'; pv.innerHTML=''; fxBatch=[];

  if(!token){st.style.color='var(--accent-rose)';st.textContent='âœ— Ø§Ù„ØµÙ‚ Ù…ÙØªØ§Ø­ GitHub Ø£ÙˆÙ„Ù‹Ø§';return}
  if(!problem){st.style.color='var(--accent-rose)';st.textContent='âœ— Ø§ÙƒØªØ¨ ÙˆØµÙ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© Ø§Ù„Ù„ÙŠ ØªÙˆØ§Ø¬Ù‡Ù‡Ø§';return}

  st.style.color='var(--accent-amber)'; st.textContent='â³ 1/5 â€” ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ù„ÙØ§Øª Ø°Ø§Øª Ø§Ù„Ø¹Ù„Ø§Ù‚Ø© Ø¨Ø§Ù„Ù…Ø´ÙƒÙ„Ø©â€¦';
  let targetFiles;
  try{ targetFiles=await fxSelectFiles(problem); }
  catch(e){ st.style.color='var(--accent-rose)'; st.textContent='âœ— ØªØ¹Ø°Ø± ØªØ­Ø¯ÙŠØ¯ Ø§Ù„Ù…Ù„ÙØ§Øª: '+friendlyError(e); return; }

  st.textContent='â³ 2/5 â€” Ø¬Ø§Ø±Ù Ù‚Ø±Ø§Ø¡Ø© '+targetFiles.length+' Ù…Ù„Ù Ù…Ù† Ø§Ù„Ù…Ø³ØªÙˆØ¯Ø¹ ('+targetFiles.join('ØŒ ')+')â€¦';
  const filesContent={}, filesMeta={};
  for(const f of targetFiles){
    try{
      const r=await fetch('https://api.github.com/repos/'+FX_REPO+'/contents/'+f,{headers:{Authorization:'Bearer '+token,'Accept':'application/vnd.github+json'}});
      if(!r.ok){ st.style.color='var(--accent-rose)'; st.textContent='âœ— ØªØ¹Ø°Ø± Ù‚Ø±Ø§Ø¡Ø© '+f+' (HTTP '+r.status+')'; return; }
      const meta=await r.json();
      filesContent[f]=atob((meta.content||'').replace(/\n/g,''));
      filesMeta[f]=meta.sha;
    }catch(e){ st.style.color='var(--accent-rose)'; st.textContent='âœ— ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù€ GitHub Ø¹Ù†Ø¯ Ù‚Ø±Ø§Ø¡Ø© '+f; return; }
  }

  st.textContent='â³ 3/5 â€” Ø¬Ø§Ø±Ù Ø§Ù„ØªØ´Ø®ÙŠØµ Ø§Ù„Ø¬Ø°Ø±ÙŠ ÙˆØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø­Ù„â€¦';
  let reply;
  try{ reply=await fxDiagnoseAndFix(problem, filesContent); }
  catch(e){ st.style.color='var(--accent-rose)'; st.textContent='âœ— ØªØ¹Ø°Ø± ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ø­Ù„: '+friendlyError(e); return; }

  const {rootCause, files:patchedFiles}=fxParseMultiFile(reply);
  if(!Object.keys(patchedFiles).length){
    st.style.color='var(--accent-rose)'; st.textContent='âœ— Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ù„Ù… ÙŠÙØ±Ø¬Ø¹ Ø£ÙŠ Ù…Ù„Ù Ù…Ø¹Ø¯Ù‘Ù„ â€” Ø£Ø¹Ø¯ ØµÙŠØ§ØºØ© ÙˆØµÙ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© Ø¨ØªÙØµÙŠÙ„ Ø£ÙƒØ«Ø±';
    pv.style.display='block'; pv.innerHTML='<div class="fx-plan"><strong>Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ù…Ø°ÙƒÙˆØ±:</strong><br>'+escapeHtmlText(rootCause)+'</div>';
    return;
  }

  st.textContent='â³ 4/5 â€” Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¢Ù„ÙŠ Ù…Ù† ÙƒÙ„ Ù…Ù„Ù (ØµØ­Ø© Ø§Ù„ÙƒÙˆØ¯ + Ø¨Ù‚Ø§Ø¡ Ø§Ù„Ø¯ÙˆØ§Ù„)â€¦';
  let reportHtml='<div class="fx-plan"><strong>ðŸ§­ Ø§Ù„Ø³Ø¨Ø¨ Ø§Ù„Ø¬Ø°Ø±ÙŠ Ø§Ù„Ù…ÙƒØªØ´Ù:</strong><br>'+escapeHtmlText(rootCause).replace(/\n/g,'<br>')+'</div>';
  let anyPassed=false;

  for(const [file, patched] of Object.entries(patchedFiles)){
    const original=filesContent[file];
    if(!patched || patched.length<original.length*0.5){
      reportHtml+='<div class="fx-block" style="color:var(--accent-rose);margin-top:14px"><strong>ðŸš« '+file+' â€” Ø±ÙÙØ¶ (Ø§Ù„Ù…Ù„Ù Ø§Ù†Ø¨ØªØ±: '+patched.length+' Ù…Ù† '+original.length+' Ø­Ø±ÙÙ‹Ø§)</strong></div>';
      continue;
    }
    const synErrors=fxCheckSyntax(file, patched);
    const preserve=fxCheckPreservation(original, patched);
    const blocking = synErrors.length>0 || preserve.missingFns.length>0;
    const diff=fxLineDiff(original, patched);

    reportHtml+='<div style="margin-top:16px;border-top:1px solid rgba(255,255,255,.12);padding-top:10px">'
      +'<strong>ðŸ“„ '+file+' â€” '+(blocking?'<span style="color:var(--accent-rose)">ÙØ´Ù„ Ø§Ù„ØªØ­Ù‚Ù‚ âœ—</span>':'<span style="color:var(--accent-emerald)">Ø§Ø¬ØªØ§Ø² Ø§Ù„ØªØ­Ù‚Ù‚ âœ“</span>')+'</strong>';
    if(synErrors.length) reportHtml+='<div style="color:var(--accent-rose);margin-top:6px">Ø£Ø®Ø·Ø§Ø¡: '+synErrors.map(escapeHtmlText).join('<br>')+'</div>';
    if(preserve.missingFns.length) reportHtml+='<div style="color:var(--accent-rose);margin-top:6px">Ø¯ÙˆØ§Ù„ Ø§Ø®ØªÙØª: '+preserve.missingFns.join(', ')+'</div>';
    if(preserve.missingIds.length) reportHtml+='<div style="color:var(--accent-amber);margin-top:6px">âš  Ù…Ø¹Ø±Ù‘ÙØ§Øª id Ø§Ø®ØªÙØª (Ø±Ø§Ø¬Ø¹Ù‡Ø§ ÙŠØ¯ÙˆÙŠÙ‹Ø§): '+preserve.missingIds.join(', ')+'</div>';
    reportHtml+='<div class="fx-diff-box">'+fxRenderDiff(diff)+'</div></div>';

    if(!blocking){
      anyPassed=true;
      fxBatch.push({file, content:patched, sha:filesMeta[file], message:'fix-engine: '+problem.slice(0,80), passed:true});
    }
  }

  pv.style.display='block'; pv.innerHTML=reportHtml;
  st.textContent='â³ 5/5 â€” Ø¬Ø§Ù‡Ø² Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø©';

  if(!anyPassed){
    st.style.color='var(--accent-rose)'; st.textContent='âœ— ÙˆÙ„Ø§ Ù…Ù„Ù Ø§Ø¬ØªØ§Ø² Ø§Ù„ØªØ­Ù‚Ù‚ Ø§Ù„Ø¢Ù„ÙŠ â€” Ù„Ù† ÙŠØ¸Ù‡Ø± Ø²Ø± Ø§Ù„Ù†Ø´Ø±. Ø±Ø§Ø¬Ø¹ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ Ø£Ø¹Ù„Ø§Ù‡';
    return;
  }
  st.style.color='var(--accent-emerald)';
  st.textContent='âœ“ '+fxBatch.length+' Ù…Ù† '+Object.keys(patchedFiles).length+' Ù…Ù„Ù Ø§Ø¬ØªØ§Ø² Ø§Ù„ØªØ­Ù‚Ù‚ â€” Ø±Ø§Ø¬Ø¹ Ø§Ù„ÙØ±Ù‚ Ø«Ù… Ø£ÙƒÙ‘Ø¯ Ø§Ù„Ù†Ø´Ø± (Ø§Ù„Ù…Ù„ÙØ§Øª Ø§Ù„ÙØ§Ø´Ù„Ø© Ù„Ù† ØªÙÙ†Ø´Ø± ØªÙ„Ù‚Ø§Ø¦ÙŠÙ‹Ø§)';
  commitBtn.style.display='inline-block'; commitBtn.disabled=false;
}

async function fxCommit(){
  if(!fxBatch.length)return;
  const st=$('fxStatus'), token=fxTok();
  let okCount=0;
  for(const item of fxBatch){
    st.style.color='var(--accent-amber)'; st.textContent='â³ Ø¬Ø§Ø±Ù Ù†Ø´Ø± '+item.file+'â€¦';
    try{
      const b64=btoa(unescape(encodeURIComponent(item.content)));
      const r=await fetch('https://api.github.com/repos/'+FX_REPO+'/contents/'+item.file,{
        method:'PUT',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({message:item.message,content:b64,sha:item.sha})});
      if(r.ok) okCount++;
      else{ let d='';try{d=(await r.json()).message||''}catch{}; st.style.color='var(--accent-rose)'; st.textContent='âœ— ÙØ´Ù„ Ù†Ø´Ø± '+item.file+' (HTTP '+r.status+') '+d; return; }
    }catch(e){ st.style.color='var(--accent-rose)'; st.textContent='âœ— ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù€ GitHub Ø£Ø«Ù†Ø§Ø¡ Ù†Ø´Ø± '+item.file; return; }
  }
  st.style.color='var(--accent-emerald)';
  st.textContent='âœ… ØªÙ… Ù†Ø´Ø± '+okCount+' Ù…Ù„Ù Ø¨Ù†Ø¬Ø§Ø­! GitHub Pages Ø³ÙŠØ­Ø¯Ù‘Ø« Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø®Ù„Ø§Ù„ Ø¯Ù‚ÙŠÙ‚ØªÙŠÙ†';
  fxBatch=[]; $('fxCommitBtn').style.display='none';
}

function initFixUI(){
  if(!$('fxRunBtn'))return;
  const saved=fxTok(); if(saved)$('fxToken').value=saved;
  $('fxToken').addEventListener('change',()=>lsSet('khaled_gh_token',$('fxToken').value.trim()));

  const sel=$('fxFile');
  if(sel){
    sel.innerHTML='';
    const autoOpt=document.createElement('option'); autoOpt.value='__auto__'; autoOpt.textContent='ðŸ” ØªØ­Ø¯ÙŠØ¯ ØªÙ„Ù‚Ø§Ø¦ÙŠ Ø­Ø³Ø¨ Ø§Ù„Ù…Ø´ÙƒÙ„Ø© (Ù…ÙˆØµÙ‰ Ø¨Ù‡)';
    sel.appendChild(autoOpt);
    FX_FILES.forEach(f=>{const o=document.createElement('option'); o.value=f; o.textContent=f; sel.appendChild(o)});
  }
  const cmdBox=$('fxCmd');
  if(cmdBox) cmdBox.placeholder='ØµÙ Ù…Ø´ÙƒÙ„ØªÙƒ Ø¨Ø§Ù„ØªÙØµÙŠÙ„ â€” Ù…Ø«Ø§Ù„: "Ø§Ù„Ø´Ø§Øª Ù…Ø§ ÙŠØ±Ø¯ ÙˆÙŠÙ‚ÙˆÙ„ ØªØ¹Ø°Ø± Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ù…Ø­Ø±Ùƒ Groq" â€” Ø§Ù„Ù…Ø­Ø±Ùƒ ÙŠØ­Ø¯Ø¯ Ø¨Ù†ÙØ³Ù‡ Ø£ÙŠ Ø§Ù„Ù…Ù„ÙØ§Øª ØªØ­ØªØ§Ø¬ ÙØ­Øµ';

  $('fxRunBtn').addEventListener('click',fxRun);
  $('fxCommitBtn').addEventListener('click',fxCommit);

  if(!$('fxDiffStyles')){
    const style=document.createElement('style'); style.id='fxDiffStyles';
    style.textContent='.fx-diff-box{max-height:320px;overflow:auto;font-family:monospace;font-size:0.8rem;background:rgba(0,0,0,0.25);border-radius:8px;padding:10px;margin-top:6px}'
      +'.fx-diff-add{color:#4ade80;white-space:pre-wrap}.fx-diff-del{color:#f87171;white-space:pre-wrap;text-decoration:line-through;opacity:.75}'
      +'.fx-plan{background:rgba(255,255,255,0.04);border-radius:8px;padding:10px;font-size:0.85rem}';
    document.head.appendChild(style);
  }
}
