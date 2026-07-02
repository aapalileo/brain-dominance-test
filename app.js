const state = { participant:{}, likert:{}, forced:{}, likertItems:[], chart:null };
const $ = s => document.querySelector(s);
function escapeHtml(s){return String(s).replace(/[&<>"']/g,function(c){return({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c];});}
const order = ["A","B","C","D"];
const LEVELDESC = {
  Primary:"You lead with this. Your strongest, most natural thinking style.",
  Secondary:"Your reliable back-up. You use it comfortably when needed.",
  Tertiary:"Available when required, but it takes more effort and energy.",
  Fourth:"Your least preferred style. You tend to avoid it."
};

// interleave Likert A,B,C,D
for(let i=0;i<9;i++){ for(const q of order){ state.likertItems.push({q, text: LIKERT[q][i]}); } }

function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  $('#screen-'+id).classList.remove('hidden');
  window.scrollTo({top:0,behavior:'smooth'});
}
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.remove('hidden'); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.add('hidden'),2600); }

// Style grid (intro)
(function(){
  const g=$('#style-grid');
  order.forEach(q=>{ const m=QUADRANTS[q];
    const d=document.createElement('div'); d.className='style-card';
    d.innerHTML=`<span class="style-letter">${q}</span><div class="style-icon">${QICON[q]}</div>
      <h3>${m.name}</h3><p>${m.tag}</p>`;
    g.appendChild(d);
  });
})();

// Participant fields
(function(){
  const c=$('#participant-fields');
  const urlOrg=new URLSearchParams(location.search).get('org');
  const wrap=document.createElement('div'); wrap.className='field';
  if(urlOrg){
    state.participant["Company"]=urlOrg.trim();
    wrap.innerHTML=`<label>Company / Organization</label><input type="text" value="${escapeHtml(urlOrg.trim())}" readonly style="opacity:.7;cursor:not-allowed">`;
  } else if(typeof COMPANIES!=="undefined" && COMPANIES.length){
    wrap.innerHTML=`<label for="pf-company">Company / Organization</label><select id="pf-company"><option value="">Select your company…</option>${COMPANIES.map(x=>`<option value="${escapeHtml(x)}">${escapeHtml(x)}</option>`).join('')}</select>`;
  } else {
    wrap.innerHTML=`<label for="pf-company">Company / Organization</label><input id="pf-company" type="text" autocomplete="off">`;
  }
  c.appendChild(wrap);
  PARTICIPANT_FIELDS.forEach((f,i)=>{
    const id='pf'+i;
    const div=document.createElement('div'); div.className='field';
    div.innerHTML=`<label for="${id}">${f}</label><input id="${id}" type="text" data-field="${f}" autocomplete="off" placeholder="">`;
    c.appendChild(div);
  });
})();

// Likert
const SCALE=[["Strongly Disagree",1],["Disagree",2],["Agree",3],["Strongly Agree",4]];
(function(){
  const list=$('#likert-list'); list.parentNode.insertBefore(makeProgress('likert'),list);
  state.likertItems.forEach((it,idx)=>{
    const card=document.createElement('div'); card.className='qcard'; card.id='lk'+idx;
    let opts=''; SCALE.forEach(([lab,val])=>{ opts+=`<label class="opt"><input type="radio" name="lk${idx}" value="${val}"><span>${lab}</span></label>`; });
    card.innerHTML=`<div class="qtext"><span class="qnum">${String(idx+1).padStart(2,'0')}</span>${it.text}</div><div class="opts">${opts}</div>`;
    list.appendChild(card);
    card.addEventListener('change',e=>{ state.likert[idx]={q:it.q,val:+e.target.value}; card.classList.add('answered'); updateProgress('likert'); });
  });
})();

// Forced
(function(){
  const list=$('#forced-list'); list.parentNode.insertBefore(makeProgress('forced'),list);
  FORCED.forEach((p,idx)=>{
    const [o1,q1,o2,q2]=p;
    const card=document.createElement('div'); card.className='qcard'; card.id='fc'+idx;
    card.innerHTML=`<div class="qtext"><span class="qnum">${String(idx+1).padStart(2,'0')}</span>Which is more like you?</div>
      <div class="fpair">
        <label class="fopt"><input type="radio" name="fc${idx}" value="1"><span>${o1}</span></label>
        <div class="vs">vs</div>
        <label class="fopt"><input type="radio" name="fc${idx}" value="2"><span>${o2}</span></label>
      </div>`;
    list.appendChild(card);
    card.addEventListener('change',e=>{ state.forced[idx]= (+e.target.value===1)?q1:q2; card.classList.add('answered'); updateProgress('forced'); });
  });
})();

function makeProgress(which){
  const d=document.createElement('div'); d.className='progress-bar no-print';
  d.innerHTML=`<div class="progress-track"><div class="progress-fill" id="pf-${which}"></div></div><div class="progress-label" id="pl-${which}"></div>`;
  return d;
}
function updateProgress(which){
  const total=which==='likert'?state.likertItems.length:FORCED.length;
  const done =which==='likert'?Object.keys(state.likert).length:Object.keys(state.forced).length;
  $('#pf-'+which).style.width=(done/total*100)+'%';
  $('#pl-'+which).textContent=`${done} / ${total} answered`;
}

$('#start-btn').addEventListener('click',()=>{
  document.querySelectorAll('#participant-fields input').forEach(i=>{ if(i.dataset.field && i.value.trim()) state.participant[i.dataset.field]=i.value.trim(); });
  const comp=document.getElementById('pf-company'); if(comp && comp.value.trim()) state.participant["Company"]=comp.value.trim();
  show('likert'); updateProgress('likert');
});
document.querySelectorAll('[data-goto]').forEach(b=>b.addEventListener('click',()=>show(b.dataset.goto)));
$('#to-forced').addEventListener('click',()=>{
  const miss=state.likertItems.length-Object.keys(state.likert).length;
  if(miss>0){ toast(`Please answer all ${state.likertItems.length} statements (${miss} left).`); firstUnanswered('lk',state.likert,state.likertItems.length); return; }
  show('forced'); updateProgress('forced');
});
$('#submit-btn').addEventListener('click',()=>{
  const miss=FORCED.length-Object.keys(state.forced).length;
  if(miss>0){ toast(`Please answer all ${FORCED.length} pairs (${miss} left).`); firstUnanswered('fc',state.forced,FORCED.length); return; }
  renderResults(); saveToSheet(); show('results');
});
function firstUnanswered(prefix,store,n){
  for(let i=0;i<n;i++){ if(store[i]===undefined){ const el=$('#'+prefix+i); el.scrollIntoView({behavior:'smooth',block:'center'}); el.animate([{borderColor:'#FB5000'},{borderColor:'#2A2A2A'}],{duration:1300}); break; } }
}
$('#print-btn').addEventListener('click',()=>window.print());

// Scoring (identical to the Excel workbook)
function computeScores(){
  const r={};
  for(const q of order){
    let sum=0; Object.values(state.likert).forEach(a=>{ if(a.q===q) sum+=a.val; });
    const likertPct=sum/(9*4);
    let fc=0; Object.values(state.forced).forEach(cq=>{ if(cq===q) fc++; });
    const forcedPct=fc/12;
    const combined=WEIGHTS.likert*likertPct+WEIGHTS.forced*forcedPct;
    r[q]={q,likertPct,forcedPct,fcPoints:fc,combined};
  }
  const eps={A:4e-9,B:3e-9,C:2e-9,D:1e-9};
  const ranked=order.map(q=>({...r[q],adj:r[q].combined+r[q].likertPct/1e5+r[q].forcedPct/1e8+eps[q]})).sort((a,b)=>b.adj-a.adj);
  const labels=["Primary","Secondary","Tertiary","Fourth"];
  ranked.forEach((x,i)=>{ r[x.q].rank=i; r[x.q].label=labels[i]; });
  return {byQ:r,ranked};
}

function renderResults(){
  const {byQ,ranked}=computeScores();
  const primary=ranked[0]; const pm=QUADRANTS[primary.q];
  const who=state.participant["Name"]||"";
  const pct=v=>Math.round(v*100)+'%';

  let ranksHtml='';
  ranked.forEach((x,i)=>{ const m=QUADRANTS[x.q];
    ranksHtml+=`<div class="rank ${i===0?'is-primary':''}">
      <div class="badge">${x.q}</div>
      <div><div class="lvl">${byQ[x.q].label}</div><div class="qn">${m.name} &middot; <span style="color:var(--muted);font-weight:400;font-size:14px">${m.tag}</span></div><div class="qblurb">${LEVELDESC[byQ[x.q].label]}</div></div>
      <div class="score">${pct(x.combined)}<small>combined</small></div>
    </div>`;
  });

  let flag='';
  for(const q of order){ const x=byQ[q];
    if(x.likertPct>=0.75 && x.fcPoints<=3 && x.label!=="Primary"){
      flag=`<div class="flag no-print"><b>Note</b> &mdash; you rated <b>${QUADRANTS[q].name}</b> highly, but when forced to choose you leaned elsewhere: a comfortable style you don't always lead with.</div>`; break;
    }
  }

  $('#results-content').innerHTML=`
    <div class="result-hero">
      <div class="eyebrow">Your Whole-Brain Profile</div>
      <h1 class="primary-name">${pm.name}</h1>
      <div class="ptag">${pm.tag} &middot; your primary preference</div>
      ${who?`<div class="who">${who}${state.participant["Position"]?' / '+state.participant["Position"]:''}</div>`:''}
    </div>
    <div class="card-dark">${radarSVG(byQ)}</div>
    ${flag}
    <div class="ranks">${ranksHtml}</div>
    <div class="card-dark share-block">
      <h3>Save your profile</h3>
      <canvas id="sharecard" class="share-canvas" width="1080" height="1350"></canvas>
      <button id="dl-image" class="btn btn-primary btn-block" style="margin-top:16px">Download image</button>
    </div>`;
  drawShareCard();
  var dl=document.getElementById('dl-image');
  if(dl) dl.onclick=downloadShareCard;
}

function radarSVG(byQ){
  const cx=170, cy=152, R=106;
  const dir={A:[-0.7071,-0.7071], D:[0.7071,-0.7071], B:[-0.7071,0.7071], C:[0.7071,0.7071]};
  const orderC=["A","D","C","B"];
  const pt=(q,v)=>[cx+dir[q][0]*R*v, cy+dir[q][1]*R*v];
  const poly=(key)=>orderC.map(q=>pt(q,byQ[q][key]).map(n=>n.toFixed(1)).join(",")).join(" ");
  let grid="";
  [0.25,0.5,0.75,1].forEach(f=>{ grid+=`<circle cx="${cx}" cy="${cy}" r="${(R*f).toFixed(1)}" fill="none" stroke="#2A2A2A" stroke-width="1"/>`; });
  orderC.forEach(q=>{ const [x,y]=pt(q,1); grid+=`<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#2A2A2A" stroke-width="1"/>`; });
  const dots=(key,c)=>orderC.map(q=>{const[x,y]=pt(q,byQ[q][key]);return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.2" fill="${c}"/>`;}).join("");
  const meta={A:["Analyst","end"],D:["Dreamer","start"],B:["Builder","end"],C:["Connector","start"]};
  let labels="";
  orderC.forEach(q=>{ const [x,y]=pt(q,1.17); const [nm,anch]=meta[q];
    const yy = dir[q][1]<0 ? y-3 : y+13;
    labels+=`<text x="${x.toFixed(1)}" y="${yy.toFixed(1)}" fill="#fff" font-size="13.5" font-weight="500" text-anchor="${anch}" font-family="'General Sans',sans-serif">${nm}</text>`;
  });
  return `<svg viewBox="0 0 340 300" width="100%" style="max-width:430px;display:block;margin:0 auto" role="img" aria-label="Whole-Brain profile chart">
    ${grid}
    <polygon points="${poly('combined')}" fill="rgba(251,80,0,.18)" stroke="#FB5000" stroke-width="2.5"/>
    ${dots('combined','#FB5000')}
    ${labels}
  </svg>`;
}


// ---- Optional: save each submission to a Google Sheet (via Apps Script web app) ----
const QNAME={A:"Analyst",B:"Builder",C:"Connector",D:"Dreamer"};
function buildRecord(){
  const {byQ,ranked}=computeScores();
  const p=state.participant, r={};
  r["Timestamp"]=new Date().toISOString();
  r["Company"]=p["Company"]||"";
  PARTICIPANT_FIELDS.forEach(f=>{ r[f]=p[f]||""; });
  r["Primary"]=QNAME[ranked[0].q]; r["Secondary"]=QNAME[ranked[1].q];
  r["Tertiary"]=QNAME[ranked[2].q]; r["Fourth"]=QNAME[ranked[3].q];
  order.forEach(q=>{ r[QNAME[q]+" Likert %"]=Math.round(byQ[q].likertPct*100);
    r[QNAME[q]+" FC %"]=Math.round(byQ[q].forcedPct*100);
    r[QNAME[q]+" Combined %"]=Math.round(byQ[q].combined*100); });
  r["Raw answers (JSON)"]=JSON.stringify({likert:state.likert,forced:state.forced});
  return r;
}
function saveToSheet(){
  if(typeof SHEET_ENDPOINT==="undefined" || !SHEET_ENDPOINT) return;
  try{
    fetch(SHEET_ENDPOINT,{method:"POST",mode:"no-cors",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(buildRecord())});
  }catch(e){ /* never block the participant from seeing results */ }
}
(function(){
  if(typeof SHEET_ENDPOINT!=="undefined" && SHEET_ENDPOINT){
    const f=document.querySelector('.fineprint');
    if(f) f.textContent="About 8-10 minutes · No right or wrong answers · Your responses are recorded for your facilitator.";
  }
})();


// ---- Shareable profile image (canvas) ----
function ctxTextW(g,t,font){ var p=g.font; g.font=font; var w=g.measureText(t).width; g.font=p; return w; }
function drawCardChart(g,byQ,cx,cy,R){
  var dir={A:[-0.7071,-0.7071],D:[0.7071,-0.7071],B:[-0.7071,0.7071],C:[0.7071,0.7071]};
  var oc=["A","D","C","B"];
  g.strokeStyle="#2A2A2A"; g.lineWidth=2;
  [0.25,0.5,0.75,1].forEach(function(f){ g.beginPath(); g.arc(cx,cy,R*f,0,Math.PI*2); g.stroke(); });
  oc.forEach(function(q){ g.beginPath(); g.moveTo(cx,cy); g.lineTo(cx+dir[q][0]*R,cy+dir[q][1]*R); g.stroke(); });
  g.beginPath();
  oc.forEach(function(q,i){ var x=cx+dir[q][0]*R*byQ[q].combined, y=cy+dir[q][1]*R*byQ[q].combined; if(i) g.lineTo(x,y); else g.moveTo(x,y); });
  g.closePath(); g.fillStyle="rgba(251,80,0,.18)"; g.fill(); g.strokeStyle="#FB5000"; g.lineWidth=3; g.stroke();
  oc.forEach(function(q){ var x=cx+dir[q][0]*R*byQ[q].combined, y=cy+dir[q][1]*R*byQ[q].combined; g.beginPath(); g.arc(x,y,6,0,Math.PI*2); g.fillStyle="#FB5000"; g.fill(); });
  g.fillStyle="#fff"; g.font="500 23px 'General Sans',sans-serif";
  var meta={A:["Analyst","right","bottom"],D:["Dreamer","left","bottom"],B:["Builder","right","top"],C:["Connector","left","top"]};
  oc.forEach(function(q){ var x=cx+dir[q][0]*R*1.2, y=cy+dir[q][1]*R*1.2, m=meta[q]; g.textAlign=m[1]; g.textBaseline=m[2]; g.fillText(m[0],x,y); });
  g.textAlign="center"; g.textBaseline="alphabetic";
}
async function drawShareCard(){
  var cv=document.getElementById('sharecard'); if(!cv) return;
  var g=cv.getContext('2d'); if(!g) return;
  var W=1080,H=1350;
  try{ if(document.fonts&&document.fonts.ready) await document.fonts.ready; }catch(e){}
  var r=computeScores(), byQ=r.byQ, ranked=r.ranked;
  var nm=(state.participant["Name"]||"").trim();
  var title=nm?nm+"’s Whole Brain Profile":"My Whole Brain Profile";
  var pm=QUADRANTS[ranked[0].q];
  g.fillStyle="#0A0A0A"; g.fillRect(0,0,W,H);
  await new Promise(function(res){ var img=new Image();
    img.onload=function(){ var hh=48, ww=hh*img.width/img.height, tw=ctxTextW(g,"bootleg","600 34px 'General Sans',sans-serif"), total=ww+16+tw, sx=(W-total)/2;
      g.drawImage(img,sx,62,ww,hh);
      g.fillStyle="#fff"; g.font="600 34px 'General Sans',sans-serif"; g.textAlign="left"; g.textBaseline="middle"; g.fillText("bootleg",sx+ww+16,62+hh/2); res(); };
    img.onerror=res; img.src="logo-mark.png"; });
  g.textAlign="center"; g.textBaseline="alphabetic";
  g.fillStyle="#fff"; g.font="500 40px 'General Sans',sans-serif"; g.fillText(title,W/2,202);
  g.fillStyle="#FB5000"; g.font="500 20px 'IBM Plex Mono',monospace"; g.fillText("PRIMARY STYLE",W/2,258);
  g.fillStyle="#FB5000"; g.font="700 76px 'General Sans',sans-serif"; g.fillText(pm.name,W/2,328);
  g.fillStyle="#C8C8C8"; g.font="400 26px 'General Sans',sans-serif"; g.fillText(pm.tag,W/2,374);
  drawCardChart(g,byQ,W/2,588,172);
  var levels=["Primary","Secondary","Tertiary","Fourth"], y=852;
  ranked.forEach(function(x,i){ var isP=i===0;
    g.textAlign="left"; g.textBaseline="alphabetic";
    g.fillStyle=isP?"#FB5000":"#8A8A8A"; g.font="500 17px 'IBM Plex Mono',monospace"; g.fillText(levels[i].toUpperCase(),120,y);
    g.fillStyle="#fff"; g.font="600 34px 'General Sans',sans-serif"; g.fillText(QUADRANTS[x.q].name,120,y+36);
    g.textAlign="right"; g.fillStyle=isP?"#FB5000":"#C8C8C8"; g.font="700 40px 'General Sans',sans-serif"; g.fillText(Math.round(x.combined*100)+"%",960,y+26);
    y+=92; });
  g.textAlign="center"; g.fillStyle="#8A8A8A"; g.font="400 19px 'IBM Plex Mono',monospace";
  g.fillText("www.ciabootleg.ph    ·    info@bootleg.ph    ·    @ciabootlegmanila",W/2,1300);
}
function downloadShareCard(){
  var cv=document.getElementById('sharecard'); if(!cv) return;
  cv.toBlob(function(b){ if(!b) return; var url=URL.createObjectURL(b), a=document.createElement('a');
    a.href=url; a.download=((state.participant["Name"]||"whole-brain")+" whole brain profile").trim().replace(/\s+/g,'-').toLowerCase()+".png";
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){URL.revokeObjectURL(url);},1500);
  },'image/png');
}
