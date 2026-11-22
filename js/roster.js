'use strict';
let rtRosterQuery='';
function rtRosterIcon(type){
 const shapes={
 users:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20v-2a6 6 0 0 1 12 0v2H2zM15 15a5 5 0 0 1 7 5h-6"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
 chevron:'<path d="m9 5 7 7-7 7"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 edit:'<path d="m4 20 4-.8L19 8.2l-4.2-4.2L4 14.9V20zM13 6l4 4"/>',
 more:'<circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
 score:'<circle cx="12" cy="12" r="8"/><path d="M12 1v7m0 8v7M1 12h7m8 0h7"/>',
 courses:'<path d="M3 5h7l4 3 7-3v14l-7 3-4-3-7 1zM10 5v14M14 8v14"/>',
 report:'<path d="M6 2h8l5 5v15H6zM14 2v5h5M9 12h7M9 16h7"/>'
 };
 return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(shapes[type]||'')+'</svg>';
}
function rtRosterSort(mode){
 const s=current();if(!s)return;
 s.rosterSort=mode==='name'?'name':'lane';save();render();
}
function rtSelectRosterShooter(id){
 const s=current();if(!s)return;
 s.selected=id;save();
 document.querySelectorAll('.rt-shooter-row').forEach(el=>{
  const active=el.dataset.shooterId===id;
  el.classList.toggle('selected',active);
  el.setAttribute('aria-pressed',String(active));
 });
 const edit=document.getElementById('rt-roster-edit');if(edit)edit.disabled=false;
}
function rtFilterRoster(value){
 rtRosterQuery=String(value||'');
 const needle=rtRosterQuery.trim().toLocaleLowerCase();
 let shown=0;
 document.querySelectorAll('.rt-shooter-row').forEach(el=>{
  const match=!needle||el.dataset.search.includes(needle);
  el.hidden=!match;if(match)shown++;
 });
 const status=document.getElementById('rt-roster-search-status');
 if(status)status.textContent=needle?(shown+' matching '+(shown===1?'shooter':'shooters')):'';
}
function rtClearRoster(){
 const s=current();if(!s||!s.shooters.length)return;
 if(!window.confirm('Clear all '+s.shooters.length+' shooters from this class? This permanently removes their saved scores and personnel details from this class.'))return;
 s.shooters=[];s.selected='';save();rtRosterQuery='';render();
}
function rtRosterRemove(){
 const s=current(),p=s?.shooters.find(shooter=>shooter.id===s.selected);
 if(!p){window.alert('Select the shooter you want to remove from the roster first.');return;}
 if(!window.confirm('Remove '+p.name+' from this class? Their saved scores and personnel details for this class will also be deleted.'))return;
 s.shooters=s.shooters.filter(shooter=>shooter.id!==p.id);
 s.selected='';
 save();
 render();
}
function rtRosterEdit(){
 const s=current();if(!s)return;
 if(!s.selected||!s.shooters.some(p=>p.id===s.selected)){
  window.alert('Select a shooter from the roster first.');
  return;
 }
 openScoreShooterModal('edit');
}
function rtRosterMoreToggle(){
 const menu=document.getElementById('rt-roster-menu');
 if(menu)menu.hidden=!menu.hidden;
}
function roster(){
 const s=current();
 if(!s)return '<section class="panel">No active class.</section>';
 const shooters=s.shooters||[];
 const ordered=[...shooters].sort((a,b)=>s.rosterSort==='name'
  ?a.name.localeCompare(b.name)
  :(Number(a.lane)>0?Number(a.lane):Number.MAX_SAFE_INTEGER)-(Number(b.lane)>0?Number(b.lane):Number.MAX_SAFE_INTEGER)||a.name.localeCompare(b.name));
 const assigned=shooters.filter(p=>Number(p.lane)>0).length;
 const incomplete=shooters.filter(p=>!p.name?.trim()||!p.grade?.trim()||!p.organization?.trim()).length;
 const rifle=rifleForCard();
 return `<div class="rt-shooters-view">
  <section class="rt-shooters-card">
   <header class="rt-shooters-card-head">
    <div class="rt-roster-heading">${rtRosterIcon('users')}<h2>Shooters</h2></div>
    <span class="rt-roster-count">${shooters.length} ${shooters.length===1?'Shooter':'Shooters'}</span>
   </header>
   <div class="rt-shooters-body">
    <div class="rt-shooters-stats">
     <div class="rt-stat-total"><strong>${shooters.length}</strong><span>Total Shooters</span></div>
     <div class="rt-stat-assigned"><strong>${assigned}</strong><span>Lane Assigned</span></div>
     <div class="rt-stat-incomplete"><strong>${incomplete}</strong><span title="Missing personnel information">Missing Prsnl Info</span></div>
    </div>
    <label class="rt-roster-search">${rtRosterIcon('search')}<span class="sr-only">Search shooters</span><input type="search" placeholder="Search shooters..." aria-label="Search shooters" autocomplete="off" oninput="rtFilterRoster(this.value)" value="${safe(rtRosterQuery)}"></label>
    <div class="rt-roster-table" role="group" aria-label="Class shooter roster">
     <div class="rt-roster-columns"><span>#</span><span>Shooter</span><span>Lane</span><span>Ammo</span><span></span></div>
     ${ordered.map((p,i)=>`<button type="button" class="rt-shooter-row ${s.selected===p.id?'selected':''}" data-shooter-id="${safe(p.id)}" data-search="${safe((p.name+' '+p.grade+' '+p.organization+' '+p.lane).toLocaleLowerCase())}" aria-pressed="${s.selected===p.id?'true':'false'}" onclick="rtSelectRosterShooter('${p.id}')">
       <span class="rt-roster-number">${i+1}</span><strong class="rt-shooter-name">${safe(shortScoreName(p.name))}</strong><span class="rt-lane-value">${p.lane?'<b>'+safe(p.lane)+'</b>':'—'}</span><span class="rt-ammo-value">${safe(Number(p.initial)||0)}</span><span class="rt-roster-chevron">${rtRosterIcon('chevron')}</span>
      </button>`).join('')||'<p class="rt-roster-empty">No shooters added yet. Tap Add Shooter below to get started.</p>'}
    </div>
    <p id="rt-roster-search-status" class="rt-search-status" aria-live="polite"></p>
    <details class="rt-class-settings">
     <summary>Class settings</summary>
     <div class="rt-class-settings-fields">
      <label>Class / qualification date<input type="date" value="${safe(s.date)}" onchange="updateSession('date',this.value)"></label>
      <label>Authenticating Official<input value="${safe(s.authenticatingOfficial||'')}" onchange="updateSession('authenticatingOfficial',this.value)" placeholder="Name and grade"></label>
      <label>Default initial rounds<input type="number" min="0" value="${safe(s.defaultRounds||0)}" onchange="updateSession('defaultRounds',this.value)"></label>
     </div>
     <button type="button" onclick="applyRounds()">Apply rounds to all shooters</button>
     <p class="muted">The qualification date and authenticating official are used on draft DAF 629 cards. ${rifle?'Rifle butt numbers can be edited in shooter details.':''}</p>
    </details>
   </div>
  </section>
  <div id="rt-modal-root"></div>
 </div>
 <div class="rt-roster-more-menu" id="rt-roster-menu" hidden role="group" aria-label="More shooter options">
  <strong>Roster options</strong>
  <button type="button" onclick="rtRosterSort('lane')">Sort by lane ${s.rosterSort!=='name'?'✓':''}</button>
  <button type="button" onclick="rtRosterSort('name')">Sort by name ${s.rosterSort==='name'?'✓':''}</button>
  <button type="button" class="rt-clear-roster" onclick="rtRosterRemove()" ${shooters.length?'':'disabled'}>Remove Shooter</button>
  <button type="button" class="rt-clear-roster" onclick="rtClearRoster()" ${shooters.length?'':'disabled'}>Clear Roster</button>
 </div>
 <nav class="rt-roster-footer" aria-label="Shooter management">
  <button type="button" class="rt-add-shooter" onclick="openScoreShooterModal('add')">${rtRosterIcon('plus')}<span>Add Shooter</span></button>
  <button type="button" id="rt-roster-edit" onclick="rtRosterEdit()" ${shooters.length?'':'disabled'}>${rtRosterIcon('edit')}<span>Edit</span></button>
  <button type="button" class="rt-more-shooters" onclick="rtRosterMoreToggle()" aria-controls="rt-roster-menu">${rtRosterIcon('more')}<span>More</span></button>
 </nav>`;
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

