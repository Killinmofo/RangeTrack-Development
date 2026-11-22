'use strict';
function roster(){
 const session=current(),rifle=rifleForCard();
 const editor=p=>`<details class="card-shooter-editor"><summary>Edit DAF 629 details</summary><div class="grid">
 <label>Name<input value="${safe(p.name)}" onchange="updateShooterCardField('${p.id}','name',this.value)"></label>
 <label>Grade<input value="${safe(p.grade||'')}" onchange="updateShooterCardField('${p.id}','grade',this.value)"></label>
 <label>DoD ID (optional)<input inputmode="numeric" value="${safe(p.dodId||'')}" onchange="updateShooterCardField('${p.id}','dodId',this.value)"></label>
 <label>Organization<input value="${safe(p.organization||'')}" onchange="updateShooterCardField('${p.id}','organization',this.value)"></label>
 <label>Weapon serial # (optional)<input value="${safe(p.weaponSerial||'')}" onchange="updateShooterCardField('${p.id}','weaponSerial',this.value)"></label>
 ${rifle?`<label>Rifle Butt #<input value="${safe(p.buttNumber||'')}" onchange="updateShooterCardField('${p.id}','buttNumber',this.value)"></label>`:''}
 </div></details>`;
 return `<section class="panel"><div class="row between"><h2>${safe(db.weapon)} · ${safe(session.template?.name||db.course)}</h2><span class="tag">CLASS ROSTER</span></div>
 <div class="grid"><label>Class / qualification date<input type="date" value="${safe(session.date)}" onchange="updateSession('date',this.value)"></label><label>Authenticating Official<input value="${safe(session.authenticatingOfficial||'')}" onchange="updateSession('authenticatingOfficial',this.value)" placeholder="Name and grade"></label>
 <label>Default initial rounds<input type="number" min="0" value="${session.defaultRounds}" onchange="updateSession('defaultRounds',this.value)"></label></div><p><button onclick="applyRounds()">Apply rounds to all</button></p>
 <p class="muted">All DAF 629 draft cards in this class use this authenticating official and qualification date.</p></section>
 <section class="panel"><h2>Class Shooters (${session.shooters.length})</h2>
 ${session.shooters.map(p=>`<div class="entry"><div class="row between"><div><strong>${safe(p.name)}</strong><div class="muted">${safe(p.grade||'Grade missing')} · Lane ${safe(p.lane||'—')} · ${progress(p)}/${tableList().length} tables</div></div><div class="row"><button class="primary" onclick="openShooter('${p.id}')">Score</button><button class="danger" onclick="removeShooter('${p.id}')" aria-label="Remove shooter">×</button></div></div>${editor(p)}</div>`).join('')||'<p class="muted">No shooters added yet.</p>'}
 <h3>Add Shooter</h3><div class="grid"><label>Full name *<input id="newName" autocomplete="off" placeholder="Last, First"></label><label>Grade *<input id="newGrade" placeholder="SSgt"></label><label>Organization *<input id="newOrganization" placeholder="Unit"></label><label>DoD ID (optional)<input id="newDodId" inputmode="numeric" autocomplete="off" placeholder="Optional"></label><label>Lane<input id="newLane" type="number" min="1" placeholder="Lane"></label>
 <label>Weapon serial # (optional)<input id="newWeaponSerial" autocomplete="off" placeholder="Optional assignment"></label>
 ${rifle?'<label>Rifle Butt # (optional)<input id="newButtNumber" autocomplete="off" placeholder="Butt number"></label>':'<input id="newButtNumber" type="hidden" value="">'}
 </div><p><button class="primary" onclick="addShooter()">Add Shooter</button></p></section>`;
}
function phaseCell(p,attempt,phase){const obj=(attempt==='initial'?p.initialScores:p.refireScores)[phase]||blank();return `<td>${['head','body','exterior'].map(k=>`<label class="cellfield"><span>${k==='exterior'?'Exterior':k==='head'?'Head':'Body'}</span><input type="number" min="0" inputmode="numeric" placeholder="—" value="${safe(obj[k])}" oninput="setScore('${p.id}','${attempt}','${phase}','${k}',this.value)"></label>`).join('')}<div class="overall"><strong>Overall</strong><strong id="sum-${attempt}-${phase.replace(' ','')}">${sumPhase(obj)}</strong></div></td>`}

let scoreTableIndex=0;
function scoringTableMissingCount(){
 const s=current(),table=tableList()[scoreTableIndex];
 if(!s||!table||db.view!=='score')return 0;
 let missing=0;
 for(const p of s.shooters||[]){
  for(const attempt of ['initial','refire']){
   if(attempt==='refire'&&!refireEligible(p,table))continue;
   const scores=attemptRecord(p,attempt,table);
   for(const a of table.areas||[]){
    if(a.mode==='sum')continue;
    if(scores[a.id]===undefined||scores[a.id]===null||scores[a.id]==='')missing++;
   }
  }
 }
 return missing;
}
function rtSetScoringTable(target){
 const tables=tableList();
 if(!tables.length || !Number.isInteger(target)||target<0||target>=tables.length)return false;
 if(target===scoreTableIndex)return true;
 const missing=scoringTableMissingCount();
 if(missing>0&&!window.confirm('This firing table has '+missing+' incomplete scoring '+(missing===1?'field':'fields')+'. Continue to another table?'))return false;
 scoreTableIndex=target;
 if(typeof rtLastField!=='undefined')rtLastField='';
 render();
 document.getElementById('app')?.scrollIntoView({block:'start'});
 return true;
}
function selectScoringTable(select){
 const target=Number(select.value);
 if(!rtSetScoringTable(target))select.value=String(scoreTableIndex);
}
function changeScoringTable(delta){
 rtSetScoringTable(scoreTableIndex+delta);
}
function initiateRemedialRow(id){const t=tableList()[scoreTableIndex],p=current()?.shooters.find(x=>x.id===id);if(!t||!p||tableStatus(p,'initial',t)!=='Fail')return;if(!p.remedialTables)p.remedialTables={};p.remedialTables[t.id]=true;save();render()}
function refreshScoringTable(){
 const t=tableList()[scoreTableIndex],session=current();if(!t||!session||db.view!=='score')return;
 for(const p of session.shooters){
  for(const attempt of ['initial','refire']){
   const row=[...document.querySelectorAll('.rt-score-person[data-shooter-id]')].find(el=>el.dataset.shooterId===p.id&&el.dataset.attemptRow===attempt);
   if(!row)continue;
   const record=attemptRecord(p,attempt,t);
   for(const a of t.areas)if(a.mode==='sum'){
    const el=[...row.querySelectorAll('[data-cell]')].find(x=>x.dataset.cell===p.id+'|'+attempt+'|'+a.id);
    if(el){const value=areaValue(record,t,a);el.textContent=value===''?'—':value}
   }
   const hits=row.querySelector('.rt-score-paper');
   if(hits){const value=scoreTotals(record,t).qualifying;hits.textContent=value===''?'—':value}
   const status=attempt==='initial'?effectiveTableStatus(p,t):tableStatus(p,'refire',t),abbr=shortScoreStatus(status);
   const badge=row.querySelector('.rt-status');
   if(badge){badge.textContent=abbr;badge.className='rt-status '+(abbr==='UQ'?'rt-uq':abbr==='Q'?'rt-q':abbr==='E'?'rt-e':'rt-empty')}
  }
 }
 const shooters=session.shooters;
 const stats=[['[data-rt-completed]',shooters.filter(p=>tableStatus(p,'initial',t)!=='Incomplete').length],['[data-rt-passing]',shooters.filter(p=>['Qualified','Expert'].includes(effectiveTableStatus(p,t))).length],['[data-rt-failing]',shooters.filter(p=>effectiveTableStatus(p,t)==='Fail').length]];
 for(const [selector,value] of stats){const el=document.querySelector(selector);if(el)el.textContent=value}
 const pending=remedialPendingForTable(t).length,button=document.querySelector('.rt-remedial-btn');
 if(button){
  button.disabled=!pending;button.classList.toggle('rt-has-pending',pending>0);
  const icon=button.querySelector('.rt-footer-icon');
  if(icon)icon.innerHTML='↻'+(pending?'<b class="rt-remedial-count">'+pending+'</b>':'');
 }
 if(typeof rtUpdateNextScoreButton==='function')rtUpdateNextScoreButton();
}

const refireOpenIds=new Set();
function setScoringRefireOpen(id,isOpen){
 if(isOpen)refireOpenIds.add(id);else refireOpenIds.delete(id);
}
function shortScoreName(name){
 const raw=String(name||'').trim();if(!raw)return '—';
 if(raw.includes(',')){const [last,first]=raw.split(',');return last.trim().toUpperCase()+', '+(first.trim().charAt(0)||'').toUpperCase()+'.'}
 const parts=raw.split(/\s+/);return parts.length>1?parts.at(-1).toUpperCase()+', '+parts[0].charAt(0).toUpperCase()+'.':raw.toUpperCase();
}

function shortScoreStatus(v){return v==='Expert'?'E':v==='Qualified'||v==='Pass'?'Q':v==='Fail'?'UQ':'—'}

function selectScoreShooter(id){
 const session=current();if(!session)return;session.selected=id;save();
 document.querySelectorAll('.rt-score-person').forEach(row=>row.classList.toggle('rt-selected',row.dataset.shooterId===id));
}

function openScoreShooterModal(mode){
 const s=current();if(!s)return;
 const p=mode==='edit'?s.shooters.find(x=>x.id===s.selected):null;
 if(mode==='edit'&&!p){alert('Select a shooter from the score table first.');return}
 const root=document.getElementById('rt-modal-root');if(!root)return;
 const rifle=rifleForCard();
 root.innerHTML=`<div class="rt-modal-overlay" onclick="closeScoreShooterModal(event)"><section class="rt-modal" role="dialog" aria-modal="true" aria-labelledby="rt-dialog-title"><header><div><small>CLASS ROSTER</small><h3 id="rt-dialog-title">${p?'Edit Shooter':'Add Shooter'}</h3></div><button type="button" class="rt-modal-close" onclick="closeScoreShooterModal()">✕</button></header>
 <form id="rt-shooter-form" onsubmit="saveScoreShooterModal(event,'${p?p.id:''}')">
 <label>Full name<input name="name" required autocomplete="off" value="${safe(p?.name||'')}" placeholder="Smith, John"></label>
 <div class="rt-modal-grid"><label>Lane<input name="lane" type="number" min="1" value="${safe(p?.lane??'')}"></label><label>Initial Ammo<input name="initial" type="number" min="0" value="${safe(p?.initial??s.defaultRounds??0)}"></label></div>
 <div class="rt-modal-grid"><label>Grade<input name="grade" autocomplete="off" value="${safe(p?.grade||'')}"></label><label>Organization<input name="organization" autocomplete="off" value="${safe(p?.organization||'')}"></label></div>
 <label>DoD ID (optional)<input name="dodId" inputmode="numeric" autocomplete="off" value="${safe(p?.dodId||'')}"></label>
 <label>Weapon serial number (optional)<input name="weaponSerial" autocomplete="off" value="${safe(p?.weaponSerial||'')}"></label>
 ${rifle?`<label>Rifle Butt #<input name="buttNumber" value="${safe(p?.buttNumber||'')}"></label>`:''}
 <footer><button type="button" onclick="closeScoreShooterModal()">Cancel</button><button type="submit" class="primary">${p?'Save Changes':'Add Shooter'}</button></footer>
 </form></section></div>`;
 document.body.classList.add('rt-modal-open');
 root.querySelector('[name="name"]')?.focus();
}

function closeScoreShooterModal(e){if(e&&e.target!==e.currentTarget)return;const root=document.getElementById('rt-modal-root');if(root)root.innerHTML='';document.body.classList.remove('rt-modal-open')}

function saveScoreShooterModal(e,id){
 e.preventDefault();const data=new FormData(e.target),s=current();if(!s)return;
 const name=String(data.get('name')||'').trim();if(!name)return;
 let p=s.shooters.find(x=>x.id===id);
 if(!p){p=makeShooter(name,'',n(s.defaultRounds));s.shooters.push(p)}
 for(const key of ['name','grade','organization','dodId','weaponSerial','buttNumber'])if(data.has(key))p[key]=String(data.get(key)||'').trim();
 p.lane=data.get('lane')===''?'':n(data.get('lane'));p.initial=n(data.get('initial'));
 s.selected=p.id;save();closeScoreShooterModal();render();
}

