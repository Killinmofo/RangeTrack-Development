'use strict';
function dashboard(){return `<h2 class="dashboard-title">Dashboard</h2><section class="dashboard-section"><button class="dashboard-card" onclick="toggleDashboardSection('weapon')"><span class="dash-icon">◎</span><span class="dash-copy"><strong>Select Weapon System</strong><small>${db.weapon?'Selected: '+safe(db.weapon):'Choose M18, M4A1, or another weapon.'}</small></span><span class="dash-chevron">›</span></button>${dashboardSection==='weapon'?`<div class="panel"><h2>Choose weapon system</h2><div class="weapons">${WEAPONS.map((w,i)=>`<button class="${db.weapon===w?'selected active':''}" onclick="chooseWeapon(WEAPONS[${i}])">${safe(w)}</button>`).join('')}</div></div>`:''}<button class="dashboard-card" onclick="toggleDashboardSection('course')"><span class="dash-icon">⊕</span><span class="dash-copy"><strong>Select Course</strong><small>${selectedCourse()?'Selected: '+safe(selectedCourse().name):'Choose and start a qualification course.'}</small></span><span class="dash-chevron">›</span></button>${dashboardSection==='course'?`<div class="panel"><h2>${db.weapon?safe(db.weapon)+' courses':'Select a weapon first'}</h2>${db.weapon?`<div class="courses">${availableCourses(db.weapon).map(c=>`<button class="${db.course===c.id?'selected active':''}" onclick="chooseCourse('${c.id}')">${safe(c.name)}</button>`).join('')||'<p class="muted">No courses assigned. Use Course Editor to assign one.</p>'}</div>${selectedCourse()?`<div class="dashboard-selection"><p class="muted">${safe(selectedCourse().notes)}</p><button class="primary dashboard-action" onclick="openCourse()">${db.sessions[sessionKey()]?'Continue':'Start'} ${safe(selectedCourse().name)} →</button></div>`:''}`:'<p class="muted">Select a weapon system above to see its courses.</p>'}</div>`:''}<button class="dashboard-card" onclick="tab('active')"><span class="dash-icon">♟</span><span class="dash-copy"><strong>Active Courses</strong><small>Open, manage, or delete saved classes (${Object.keys(db.sessions).length}).</small></span><span class="dash-chevron">›</span></button><button class="dashboard-card" onclick="tab('editor')"><span class="dash-icon">⚙</span><span class="dash-copy"><strong>Course Editor</strong><small>Create and manage reusable course templates.</small></span><span class="dash-chevron">›</span></button><button class="dashboard-card" onclick="tab('weapons')"><span class="dash-icon">✎</span><span class="dash-copy"><strong>Manage Weapon Systems</strong><small>Add or remove weapons available at this location.</small></span><span class="dash-chevron">›</span></button></section>`}
let dashboardSection='';
function toggleDashboardSection(section){dashboardSection=dashboardSection===section?'':section;render()}

function activeCourses(){return `<section class="panel"><div class="row between"><h2>Active Courses</h2><button onclick="home()">⌂ Dashboard</button></div><p class="muted">Manage saved class sessions. Deleting a class does not delete its course template.</p>${Object.entries(db.sessions).length?Object.entries(db.sessions).map(([k,s])=>`<div class="entry row between"><span><strong>${safe(k.split('|')[0])} • ${safe(s.template?.name||courseById(k.split('|')[1])?.name||'Legacy course')}</strong><div class="muted">${s.shooters.length} shooter(s) • ${safe(s.date||'Date not set')}</div></span><div class="row"><button class="primary" onclick="resume('${safe(k)}')">Open</button><button class="danger" onclick="deleteSession('${safe(k)}')" aria-label="Delete saved class">Delete</button></div></div>`).join(''):'<p class="muted">No active courses yet. Start a course from the dashboard.</p>'}</section>`}

function manageWeapons(){
 const used=w=>Object.entries(db.sessions).filter(([k])=>k.startsWith(w+'|')).length;
 return `<section class="panel"><div class="row between"><h2>Manage Weapon Systems</h2><button onclick="home()">⌂ Home</button></div><p class="muted">Choose which weapons are available at this location. Removing a weapon hides it from selection and the Course Editor, but does not delete saved classes or course templates.</p>
 ${WEAPONS.map((w,i)=>`<div class="entry row between"><div><strong>${safe(w)}</strong><div class="muted">${db.courses.filter(c=>c.weapons.includes(w)).length} assigned course templates • ${used(w)} saved classes</div></div><button class="danger" onclick="removeWeapon(${i})">Remove</button></div>`).join('')||'<p class="muted">No weapon systems configured.</p>'}
 <h3 style="margin-top:18px">Add Weapon System</h3><div class="row"><label style="flex:1">Weapon name<input id="newWeaponName" maxlength="70" placeholder="e.g., M249"></label><button class="primary" onclick="addWeapon()">+ Add</button></div><p class="muted">After adding a weapon, open Course Editor and assign existing or new course templates to it.</p></section>`;
}
function addWeapon(){
 const el=document.getElementById('newWeaponName');const name=el?.value.trim().replace(/\s+/g,' ');
 if(!name)return alert('Enter a weapon system name.');
 if(WEAPONS.some(w=>w.toLowerCase()===name.toLowerCase()))return alert('That weapon system already exists.');
 WEAPONS.push(name);save();render();
}
function removeWeapon(i){
 const name=WEAPONS[i];if(!name)return;
 const saved=Object.keys(db.sessions).filter(k=>k.startsWith(name+'|')).length;
 if(!confirm('Remove '+name+' from this location?'+(saved?'\n\n'+saved+' saved class(es) will be preserved under Active Courses.':'')+'\n\nCourse templates and scoring data will NOT be deleted.'))return;
 WEAPONS.splice(i,1);
 if(db.weapon===name){db.weapon='';db.course='';dashboardSection='';}
 save();render();
}

