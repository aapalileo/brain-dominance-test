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
    <div class="card-dark">${radarSVG(byQ)}
      <div class="radar-legend"><span><i style="background:#C8C8C8"></i>Likert</span><span><i style="background:#FB5000"></i>Forced-Choice</span></div>
    </div>
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
    <polygon points="${poly('likertPct')}" fill="rgba(200,200,200,.12)" stroke="#C8C8C8" stroke-width="2"/>
    <polygon points="${poly('forcedPct')}" fill="rgba(251,80,0,.15)" stroke="#FB5000" stroke-width="2"/>
    ${dots('likertPct','#C8C8C8')}${dots('forcedPct','#FB5000')}
    ${labels}
  </svg>`;
}
