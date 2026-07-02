const state = { participant:{}, likert:{}, forced:{}, likertItems:[], chart:null };
const $ = s => document.querySelector(s);
const order = ["A","B","C","D"];

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
  document.querySelectorAll('#participant-fields input').forEach(i=>{ if(i.value.trim()) state.participant[i.dataset.field]=i.value.trim(); });
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
      <div><div class="lvl">${byQ[x.q].label}</div><div class="qn">${m.name} &middot; <span style="color:var(--muted);font-weight:400;font-size:14px">${m.tag}</span></div><div class="qblurb">${m.blurb}</div></div>
      <div class="score">${pct(x.combined)}<small>combined</small></div>
    </div>`;
  });

  let flag='';
  for(const q of order){ const x=byQ[q];
    if(x.likertPct>=0.75 && x.fcPoints<=3 && x.label!=="Primary"){
      flag=`<div class="flag no-print"><b>Note</b> &mdash; you rated <b>${QUADRANTS[q].name}</b> highly, but when forced to choose you leaned elsewhere: a comfortable style you don't always lead with.</div>`; break;
    }
  }

  let rows='';
  order.forEach(q=>{ const x=byQ[q]; const m=QUADRANTS[q];
    rows+=`<tr><td>${m.name}</td><td>${pct(x.likertPct)}</td><td>${pct(x.forcedPct)}</td><td><b>${pct(x.combined)}</b></td><td>${x.label}</td></tr>`;
  });

  $('#results-content').innerHTML=`
    <div class="result-hero">
      <div class="eyebrow">Your Whole-Brain Profile</div>
      <h1 class="primary-name">${pm.name}</h1>
      <div class="ptag">${pm.tag} &middot; your primary preference</div>
      ${who?`<div class="who">${who}${state.participant["Position"]?' / '+state.participant["Position"]:''}</div>`:''}
    </div>
    <div class="card-dark"><div class="chart-wrap"><canvas id="radar"></canvas></div></div>
    ${flag}
    <div class="ranks">${ranksHtml}</div>
    <div class="card-dark">
      <h3>Score detail</h3>
      <table class="detail-table">
        <thead><tr><th>Quadrant</th><th>Likert</th><th>Forced-Choice</th><th>Combined</th><th>Preference</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <p class="muted" style="margin-top:12px">Combined blends Likert preference with forced-choice tilt (weighted ${pct(WEIGHTS.likert)} / ${pct(WEIGHTS.forced)}).</p>
    </div>`;
  drawRadar(byQ);
}

function drawRadar(byQ){
  if(state.chart) state.chart.destroy();
  const ctx=$('#radar').getContext('2d');
  state.chart=new Chart(ctx,{
    type:'radar',
    data:{labels:order.map(q=>QUADRANTS[q].name),datasets:[
      {label:'Likert',data:order.map(q=>Math.round(byQ[q].likertPct*100)),borderColor:'#C8C8C8',backgroundColor:'rgba(200,200,200,.12)',borderWidth:2,pointBackgroundColor:'#C8C8C8',pointRadius:3},
      {label:'Forced-Choice',data:order.map(q=>Math.round(byQ[q].forcedPct*100)),borderColor:'#FB5000',backgroundColor:'rgba(251,80,0,.15)',borderWidth:2,pointBackgroundColor:'#FB5000',pointRadius:3}
    ]},
    options:{responsive:true,scales:{r:{suggestedMin:0,suggestedMax:100,angleLines:{color:'#2A2A2A'},grid:{color:'#2A2A2A'},ticks:{stepSize:25,color:'#666',backdropColor:'transparent',font:{size:10}},pointLabels:{color:'#fff',font:{size:14,weight:'600',family:"'General Sans'"}}}},plugins:{legend:{position:'bottom',labels:{color:'#C8C8C8',font:{family:"'IBM Plex Mono'",size:11},boxWidth:12}}}}
  });
}


// ---- Optional: save each submission to a Google Sheet (via Apps Script web app) ----
const QNAME={A:"Analyst",B:"Builder",C:"Connector",D:"Dreamer"};
function buildRecord(){
  const {byQ,ranked}=computeScores();
  const p=state.participant, r={};
  r["Timestamp"]=new Date().toISOString();
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
// If saving is enabled, make the intro fineprint honest about it.
(function(){
  if(typeof SHEET_ENDPOINT!=="undefined" && SHEET_ENDPOINT){
    const f=document.querySelector('.fineprint');
    if(f) f.textContent="About 8-10 minutes · No right or wrong answers · Your responses are recorded for your facilitator.";
  }
})();
