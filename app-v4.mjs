import {LEGACY_KEY,METRICS,WORKOUT_FIELDS,hasValue,today,validDate,emptyState,normalize,workouts,visibleFields,freezeTracking,mergeChanges} from './core.mjs';
import {esc,icon,PAGES,field,sessionRows,renderToday,renderActivity,renderProgress,renderPlan,renderSettings} from './ui.mjs';
import {firebaseConfig} from './firebase-config.js';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let user=null,auth=null,db=null,api=null,unsubscribe=null,ready=false,syncing=false,authLoading=true,syncError='',timer=null,editor=null,deferredInstall=null,storageError=false,authGeneration=0;
let page=PAGES[location.hash.slice(1)]?location.hash.slice(1):'today';
let cacheKey='spartanTrackerV4:guest';
try{const uid=localStorage.getItem('spartanTrackerV4:lastAccount');if(uid)cacheKey='spartanTrackerV4:'+uid;}catch{}
function readCache(key){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v?.state?{state:normalize(v.state),ops:Array.isArray(v.ops)?v.ops:[]}:null;}catch{return null;}}
function initial(){const cached=readCache(cacheKey);if(cached)return cached;try{const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||localStorage.getItem('spartanTrackerV1')||'null');if(legacy)return {state:normalize(legacy),ops:[]};}catch{}return {state:emptyState(),ops:[]};}
let {state,ops}=initial();
function saveLocal(){try{localStorage.setItem(cacheKey,JSON.stringify({state,ops,owner:user?.uid||null}));storageError=false;}catch{storageError=true;toast('Úložiště zařízení je plné. Stáhni si zálohu v Nastavení.');}}
function aggregate(queue){const c={profile:[],workouts:[],completions:[],measurements:{},supplements:{}};for(const op of queue){if(['profile','workouts','completions'].includes(op.kind))c[op.kind].push(...op.keys);else if(c[op.kind])c[op.kind][op.date]=[...(c[op.kind][op.date]||[]),...op.keys];}return c;}
function change(op){state.updatedAt=Date.now();ops.push(op);saveLocal();render();clearTimeout(timer);timer=setTimeout(sync,400);}
let toastTimer;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3500);}
function status(){return storageError?'Úložiště je plné':syncError?'Čeká na synchronizaci':authLoading?'Připojuji účet…':syncing?'Ukládám…':user?(ready?(ops.length?'Čeká na synchronizaci':'Synchronizováno'):'Načítám data…'):'Uloženo v zařízení';}
function renderStatus(){
 $('#accountName').textContent=user?.displayName||state.profile.name||'Tvůj deník';$('#avatar').textContent=($('#accountName').textContent[0]||'S').toUpperCase();$('#syncStatus').textContent=status();if($('#settingsSyncStatus'))$('#settingsSyncStatus').textContent=status();
 const banner=$('#statusBanner');
 if(syncError){banner.hidden=false;banner.innerHTML=`${esc(syncError)} Záznamy zůstávají v tomto zařízení. <button data-action="retry">Zkusit znovu</button>`;}
 else if(user&&!ready){banner.hidden=false;banner.textContent='Načítám tvůj deník z cloudu. Chvíli prosím vyčkej.';}
 else if(!user&&!authLoading){banner.hidden=false;banner.innerHTML='Pro své cloudové záznamy se přihlas stejným Google účtem jako dříve. <button data-action="login">Přihlásit</button>';}
 else banner.hidden=true;
}
function render(){renderStatus();const renderers={today:renderToday,activity:renderActivity,progress:renderProgress,plan:renderPlan,settings:renderSettings};$('#page-'+page).innerHTML=renderers[page](state,{user,status:status()});}
function switchPage(next){if(!PAGES[next])return;page=next;history.replaceState(null,'','#'+page);for(const el of $$('.page')){el.hidden=el.id!=='page-'+page;el.classList.toggle('active',!el.hidden);}for(const b of $$('[data-page]')){b.classList.toggle('active',b.dataset.page===page);if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');}$('#pageTitle').textContent=PAGES[page];render();window.scrollTo(0,0);}
const errorText=e=>({'permission-denied':'Účet nemá přístup k záznamům.','auth/popup-blocked':'Prohlížeč zablokoval přihlášení. Povol přihlašovací okno.','auth/unauthorized-domain':'Tato doména není povolená pro přihlášení.','auth/network-request-failed':'Připojení k přihlášení se nezdařilo.','unavailable':'Cloud není dostupný.','auth/too-many-requests':'Příliš mnoho pokusů o přihlášení. Zkus to později.'}[e?.code]||'Připojení ke cloudu se nezdařilo.');
async function attachCloud(account){
 const generation=++authGeneration;ready=false;syncError='';unsubscribe?.();unsubscribe=null;
 user=account;cacheKey='spartanTrackerV4:'+account.uid;try{localStorage.setItem('spartanTrackerV4:lastAccount',account.uid);}catch{}
 const cached=readCache(cacheKey);state=cached?.state||emptyState();ops=cached?.ops||[];render();
 try{
  const ref=api.doc(db,'users',account.uid,'app','state'),snap=await api.getDocFromServer(ref);if(generation!==authGeneration)return;
  const remote=normalize(snap.exists()?snap.data().payload:emptyState());state=ops.length?mergeChanges(remote,state,aggregate(ops)):remote;
  if(!state.profile.tracking){freezeTracking(state);ops.push({kind:'profile',keys:['tracking']});}
  ready=true;saveLocal();render();
  unsubscribe=api.onSnapshot(ref,snapshot=>{if(generation!==authGeneration||snapshot.metadata.hasPendingWrites||syncing)return;const remote=snapshot.data()?.payload;if(remote){state=ops.length?mergeChanges(normalize(remote),state,aggregate(ops)):normalize(remote);saveLocal();if(!$('#editor').open&&!(page==='settings'&&document.activeElement?.closest('form')))render();}},e=>{syncError=errorText(e);renderStatus();});
  if(ops.length)sync();
 }catch(e){if(generation!==authGeneration)return;syncError=errorText(e);renderStatus();}
}
async function sync(){
 if(!user||!db||!ready||syncing||!ops.length)return;
 const count=ops.length,changes=aggregate(ops.slice(0,count)),local=structuredClone(state),uid=user.uid,email=user.email||'',generation=authGeneration;syncing=true;syncError='';renderStatus();
 try{
  const ref=api.doc(db,'users',uid,'app','state');
  const saved=await api.runTransaction(db,async transaction=>{const snap=await transaction.get(ref);const value=mergeChanges(snap.exists()?snap.data().payload:emptyState(),local,changes);transaction.set(ref,{payload:value,updatedAt:value.updatedAt,email,savedAt:new Date().toISOString()},{merge:true});return value;});
  if(generation!==authGeneration)return;ops.splice(0,count);state=ops.length?mergeChanges(saved,state,aggregate(ops)):saved;saveLocal();
 }catch(e){syncError=errorText(e);}
 finally{syncing=false;renderStatus();if(ops.length&&!syncError)timer=setTimeout(sync,200);}
}
let initializing;
async function initFirebase(){if(initializing)return initializing;initializing=(async()=>{try{
  const [appApi,authApi,firestoreApi]=await Promise.all([import('https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js'),import('https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js'),import('https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js')]);
  api={...authApi,...firestoreApi};const app=appApi.initializeApp(firebaseConfig);auth=api.getAuth(app);db=api.getFirestore(app);await api.setPersistence(auth,api.browserLocalPersistence);
  api.onAuthStateChanged(auth,account=>{authLoading=false;if(account)attachCloud(account);else{++authGeneration;unsubscribe?.();unsubscribe=null;ready=false;user=null;renderStatus();}});
 }catch(e){authLoading=false;syncError='Cloudové připojení se nenačetlo.';renderStatus();}finally{initializing=null;}})();return initializing;}
async function login(){if(!auth)await initFirebase();if(!auth)return;try{const provider=new api.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await api.signInWithPopup(auth,provider);}catch(e){if(e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request'){syncError=errorText(e);renderStatus();}}}
async function logout(){if(syncing){toast('Nejdříve nech dokončit ukládání.');return;}if(ops.length&&!confirm('Některé změny ještě nejsou v cloudu. Zůstanou uložené pro tento účet v zařízení. Odhlásit?'))return;saveLocal();await api.signOut(auth);try{localStorage.removeItem('spartanTrackerV4:lastAccount');}catch{}cacheKey='spartanTrackerV4:guest';state=readCache(cacheKey)?.state||emptyState();ops=readCache(cacheKey)?.ops||[];syncError='';render();}
async function retry(){if(!auth){await initFirebase();return;}if(user&&!ready)await attachCloud(user);else{syncError='';await sync();renderStatus();}}
function openDialog(title,html,context){editor=context;$('#dialogTitle').textContent=title;$('#dialogFields').innerHTML=html;$('#editor').showModal();}
function closeDialog(){$('#editor').close();editor=null;}
function openWorkout(id=null,session=null){const existing=id?workouts(state).find(w=>w.id===id):null,types=['Chůze','Běh','Terén','Silový A','Silový B','Síla','Mobilita','Jiné'];if(state.profile.swimOptional||existing?.type==='Plavání')types.splice(3,0,'Plavání');if(existing?.type&&!types.includes(existing.type))types.push(existing.type);const type=existing?.type||session?.type||'Chůze',keys=visibleFields(state).workoutFields;
 const html=`<div class="form-grid">${field('date','Datum',existing?.date||today(),{type:'date',required:true,max:today()})}<label class="field"><span>Druh pohybu</span><select name="type" required>${types.map(t=>`<option ${t===type?'selected':''}>${esc(t)}</option>`).join('')}</select></label>${field('duration','Délka · min',existing?.duration??session?.duration??20,{type:'number',min:1,max:1440,step:1,required:true})}${keys.map(k=>{const spec=WORKOUT_FIELDS[k];return `<div data-workout-field="${k}">${field(k,spec.label+(spec.unit?' · '+spec.unit:''),existing?.[k]??'',spec.text?{type:'text'}:{type:'number',min:spec.min,max:spec.max,step:spec.step})}</div>`;}).join('')}</div><p class="sources">Stačí datum, druh pohybu a délka. Ostatní údaje jsou dobrovolné.</p>`;
 openDialog(session?.title||'Zapsat pohyb',html,{kind:'workout',existing,session,keys});updateWorkoutFields();
}
function updateWorkoutFields(){const type=$('#editorForm').elements.type?.value;if(!type)return;for(const el of $$('[data-workout-field]')){const k=el.dataset.workoutField,hidden=(k==='distanceKm'&& !['Chůze','Běh','Terén','Kondice'].includes(type))||(k==='swimMeters'&&type!=='Plavání')||(k==='equipment'&&!type.startsWith('Silový')&&type!=='Síla');el.hidden=hidden;for(const input of el.querySelectorAll('input'))input.disabled=hidden;}}
function measurementHtml(keys,date){const record=state.measurements.find(m=>m.date===date)||{};return `<div class="form-grid">${field('date','Datum',date,{type:'date',required:true,max:today(),wide:true})}${keys.map(k=>{if(k==='sleepMinutes'){const v=record.sleepMinutes;return field('sleepHours','Spánek · hodiny',hasValue(v)?Math.floor(v/60):'',{type:'number',min:0,max:23,step:1})+field('sleepMins','Spánek · minuty',hasValue(v)?v%60:'',{type:'number',min:0,max:59,step:1});}const m=METRICS[k];return field(k,m.label+' · '+m.unit,record[k]??'',{type:'number',min:m.min,max:m.max,step:m.step});}).join('')}</div><p class="sources">Vyplň jen to, co dnes chceš sledovat. Prázdná pole ponechají dřívější hodnoty.</p>`;}
function openMeasure(metric=null,date=today()){let keys=visibleFields(state).metrics;if(metric){const pair=['systolicBp','diastolicBp'];keys=keys.filter(k=>pair.includes(metric)?pair.includes(k):k===metric);}if(!keys.length){toast('Žádná pravidelná měření nejsou vybraná.');return;}openDialog('Zapsat měření',measurementHtml(keys,date),{kind:'measurement',keys});}
$('#editorForm').addEventListener('submit',event=>{event.preventDefault();if(!editor)return;const data=Object.fromEntries(new FormData(event.currentTarget));if(!validDate(data.date)||data.date>today()){toast('Vyber platné datum, nejpozději dnešek.');return;}
 if(editor.kind==='workout'){
  const {existing,session,keys}=editor,record={...(existing||{}),date:data.date,type:data.type,duration:Number(data.duration),completed:true,updatedAt:new Date().toISOString()};delete record.planned;
  for(const k of keys)if(k in data)record[k]=data[k]===''?'':WORKOUT_FIELDS[k].text?data[k].trim():Number(data[k]);
  if(existing?.planned){delete record.id;state.completions[existing.id]=record;closeDialog();change({kind:'completions',keys:[existing.id]});}
  else if(session&&!existing){record.planSessionId=session.id;record.id='custom-'+crypto.randomUUID();state.customWorkouts.push(record);closeDialog();change({kind:'workouts',keys:[record.id]});}
  else {record.id=existing?.id||'custom-'+crypto.randomUUID();const i=state.customWorkouts.findIndex(w=>w.id===record.id);if(i<0)state.customWorkouts.push(record);else state.customWorkouts[i]=record;closeDialog();change({kind:'workouts',keys:[record.id]});}
  toast('Pohyb zapsaný. Každý krok se počítá.');
 }else{
  const patch={};for(const k of editor.keys){if(k==='sleepMinutes'){if(data.sleepHours!==''||data.sleepMins!==''){const mins=Number(data.sleepHours||0)*60+Number(data.sleepMins||0);if(mins>0)patch[k]=mins;}}else if(data[k]!=='')patch[k]=Number(data[k]);}
  if(!Object.keys(patch).length){toast('Vyplň alespoň jednu hodnotu.');return;}let record=state.measurements.find(m=>m.date===data.date);if(!record){record={id:'d-'+data.date,date:data.date};state.measurements.push(record);}Object.assign(record,patch,{updatedAt:new Date().toISOString()});closeDialog();change({kind:'measurements',date:data.date,keys:Object.keys(patch)});toast('Měření uložené.');
 }
});
$('#editorForm').addEventListener('change',event=>{if(event.target.name==='type')updateWorkoutFields();if(event.target.name==='date'&&editor?.kind==='measurement'&&validDate(event.target.value))$('#dialogFields').innerHTML=measurementHtml(editor.keys,event.target.value);});
$('#editor').addEventListener('cancel',()=>{editor=null;});
function download(content,type,name){const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([content],{type}));link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);}
function exportJSON(){download(JSON.stringify(state,null,2),'application/json',`spartan-zaloha-${today()}.json`);}
function exportCSV(){const keys=['date','type','duration','distanceKm','swimMeters','avgHr','rpe','pain','feeling','equipment','route','notes'];const cell=v=>'"'+String(v??'').replace(/^[=+@\-]/,"'$&").replaceAll('"','""')+'"';download('\ufeff'+[keys.join(';'),...workouts(state).map(w=>keys.map(k=>cell(w[k])).join(';'))].join('\r\n'),'text/csv;charset=utf-8',`spartan-pohyb-${today()}.csv`);}
async function importBackup(){const file=$('#importFile')?.files[0];if(!file){toast('Vyber JSON zálohu.');return;}try{const raw=JSON.parse(await file.text());if(!raw||!Array.isArray(raw.measurements)||!Array.isArray(raw.customWorkouts)||typeof raw.profile!=='object')throw Error();const incoming=normalize(raw);if(!confirm('Sloučit soubor se současným deníkem? Před sloučením se stáhne bezpečnostní záloha.'))return;exportJSON();
 const changes={profile:Object.keys(incoming.profile),workouts:incoming.customWorkouts.map(w=>w.id),completions:Object.keys(incoming.completions),measurements:Object.fromEntries(incoming.measurements.map(m=>[m.date,Object.keys(m).filter(k=>!['date','id'].includes(k))])),supplements:Object.fromEntries(Object.entries(incoming.supplements).map(([date,v])=>[date,Object.keys(v)]))};state=mergeChanges(state,incoming,changes);for(const kind of ['profile','workouts','completions'])ops.push({kind,keys:changes[kind]});for(const kind of ['measurements','supplements'])for(const [date,keys]of Object.entries(changes[kind]))ops.push({kind,date,keys});saveLocal();render();sync();toast('Záloha sloučená.');
 }catch{toast('Soubor není platnou zálohou tohoto deníku.');}}
document.addEventListener('submit',event=>{if(event.target.id!=='profileForm')return;event.preventDefault();const data=Object.fromEntries(new FormData(event.target));data.swimOptional=event.target.elements.swimOptional.checked;for(const k of ['restartDate','raceDate','milestoneDate','familyDate'])if(data[k]&&!validDate(data[k])){toast('Zkontroluj vyplněná data.');return;}Object.assign(state.profile,data);change({kind:'profile',keys:Object.keys(data)});toast('Nastavení uložené.');});
document.addEventListener('change',event=>{const k=event.target.dataset.supplement;if(k){const date=today();state.supplements[date]={...(state.supplements[date]||{}),[k]:event.target.checked};change({kind:'supplements',date,keys:[k]});}});
document.addEventListener('click',async event=>{const nav=event.target.closest('[data-page]');if(nav){switchPage(nav.dataset.page);return;}const button=event.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
 if(action==='log')openWorkout();else if(action==='session'){const session=sessionRows(state).find(s=>s.id===button.dataset.id);if(session)openWorkout(session.logged?.id,session);}else if(action==='edit-workout')openWorkout(button.dataset.id);else if(action==='measure')openMeasure(button.dataset.metric,button.dataset.date||today());else if(action==='close')closeDialog();
 else if(action==='mode'){state.profile.weekMode=button.dataset.mode;change({kind:'profile',keys:['weekMode']});}
 else if(action==='level-up'){if(confirm('Máš za sebou alespoň dva pohodové týdny, bez bolesti a s dobrou regenerací? Další úroveň není potřeba uspěchat.')){state.profile.planLevel=Math.min(3,state.profile.planLevel+1);change({kind:'profile',keys:['planLevel']});}}
 else if(action==='level-down'){state.profile.planLevel=Math.max(0,state.profile.planLevel-1);change({kind:'profile',keys:['planLevel']});}
 else if(action==='restart'){state.profile.planLevel=0;state.profile.restartDate=today();change({kind:'profile',keys:['planLevel','restartDate']});toast('Nový začátek. Historie zůstává.');}
 else if(action==='login')await login();else if(action==='logout')await logout();else if(action==='retry')await retry();else if(action==='export')exportJSON();else if(action==='csv')exportCSV();else if(action==='import')await importBackup();
 else if(action==='install'){if(deferredInstall){await deferredInstall.prompt();deferredInstall=null;}else toast('V menu prohlížeče zvol Přidat na plochu; na iPhonu v nabídce Sdílet.');}
 else if(action==='print'){switchPage('plan');window.print();}
});
$('#accountButton').addEventListener('click',()=>switchPage('settings'));
window.addEventListener('hashchange',()=>switchPage(location.hash.slice(1)));
window.addEventListener('online',retry);
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();deferredInstall=event;});
for(const el of $$('[data-icon]'))el.innerHTML=icon(el.dataset.icon);
$('#dateLabel').textContent=new Date().toLocaleDateString('cs-CZ',{timeZone:'Europe/Prague',weekday:'long',day:'numeric',month:'long',year:'numeric'});
switchPage(page);window.SPARTAN_APP_READY=true;window.SPARTAN_APP_VERSION='4.0';initFirebase();
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
