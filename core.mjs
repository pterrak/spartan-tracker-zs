export const VERSION = 4;
export const LEGACY_KEY = 'spartanTrackerFirebaseV2';
export const THRESHOLD = 4;
export const METRICS = {
  weight: {label:'Hmotnost', unit:'kg', step:0.1, min:20, max:400},
  sleepMinutes: {label:'Spánek', unit:'h', step:0.25, min:0, max:24},
  restingHr: {label:'Klidový tep', unit:'tepů/min', step:1, min:20, max:250},
  systolicBp: {label:'Systolický tlak', unit:'mmHg', step:1, min:40, max:300},
  diastolicBp: {label:'Diastolický tlak', unit:'mmHg', step:1, min:20, max:200},
  waist: {label:'Obvod pasu', unit:'cm', step:0.5, min:30, max:250},
  energy: {label:'Energie', unit:'/ 5', step:1, min:1, max:5},
  pain: {label:'Bolest', unit:'/ 10', step:1, min:0, max:10},
  kmTime: {label:'Čas na 1 km', unit:'min', step:0.1, min:1, max:60},
  hang: {label:'Výdrž ve visu', unit:'s', step:1, min:0, max:600},
  pushups: {label:'Kliky', unit:'opakování', step:1, min:0, max:300}
};
export const WORKOUT_FIELDS = {
  distanceKm:{label:'Vzdálenost',unit:'km',min:0,max:300,step:0.01},
  swimMeters:{label:'Uplavaná vzdálenost',unit:'m',min:0,max:30000,step:1},
  avgHr:{label:'Průměrný tep',unit:'tepů/min',min:20,max:250,step:1},
  rpe:{label:'Náročnost',unit:'/ 10',min:1,max:10,step:1},
  pain:{label:'Bolest',unit:'/ 10',min:0,max:10,step:1},
  feeling:{label:'Pocit',unit:'/ 5',min:1,max:5,step:1},
  notes:{label:'Poznámka',text:true},
  equipment:{label:'Vybavení',text:true},
  route:{label:'Trasa',text:true}
};
export const SUPPLEMENTS = {creatine1:'Kreatin – 1. dávka',creatine2:'Kreatin – 2. dávka',collagen:'Kolagen',magnesium:'Magnezium',multivitamin:'Multivitamin',cholesterolSupplement:'Doplněk na cholesterol'};
export const hasValue = v => v !== null && v !== undefined && v !== '' && !(typeof v === 'number' && !Number.isFinite(v));
export function today(date=new Date()) {return new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Prague',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);}
export function validDate(v) {return typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;}
export function addDays(v,n){const d=new Date(v+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
export function dayDiff(a,b){return Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/86400000);}
export function monday(v=today()){const d=new Date(v+'T12:00:00Z');return addDays(v,-((d.getUTCDay()+6)%7));}
export function formatDate(v,withYear=false){return validDate(v)?new Date(v+'T12:00:00Z').toLocaleDateString('cs-CZ',{day:'numeric',month:'numeric',...(withYear?{year:'numeric'}:{})}):'Termín bude upřesněn';}
export function emptyState(){return {version:VERSION,profile:{name:'',goal:'Liberec Super 2027',restartDate:today(),planLevel:0,weekMode:'normal',familyDate:'',raceDate:'',milestoneDate:'2027-04-10',swimOptional:true},completions:{},customWorkouts:[],measurements:[],supplements:{},updatedAt:0,createdAt:new Date().toISOString()};}
export function normalize(raw={}){
  const base=emptyState();
  const s={...base,...raw,version:VERSION,profile:{...base.profile,...raw.profile},completions:{...(raw.completions||{})},customWorkouts:Array.isArray(raw.customWorkouts)?raw.customWorkouts.map(x=>({...x})):[],measurements:Array.isArray(raw.measurements)?raw.measurements.map(x=>({...x})):[],supplements:{...(raw.supplements||{})}};
  s.measurements=s.measurements.map(m=>({...m,...(!hasValue(m.sleepMinutes)&&hasValue(m.sleep)?{sleepMinutes:Math.round(Number(m.sleep)*60)}:{})}));
  if(!raw.profile?.restartDate)s.profile.restartDate=today();
  if(Number(raw.version||0)<4){s.profile.raceDate='';s.profile.goal='Liberec Super 2027';}
  s.profile.planLevel=Math.max(0,Math.min(3,Math.floor(Number(s.profile.planLevel)||0)));
  if(!['normal','busy','family'].includes(s.profile.weekMode))s.profile.weekMode='normal';
  return s;
}
export function workouts(s){return [...Object.entries(s.completions).map(([id,w])=>({...w,id,planned:true})),...s.customWorkouts.map(w=>({...w,planned:false}))].filter(w=>w.completed!==false&&validDate(w.date));}
export function usage(s){
  const ms={},ws={},ss={}; const rows=workouts(s);
  for(const key of Object.keys(METRICS))ms[key]=new Set(s.measurements.filter(m=>validDate(m.date)&&hasValue(m[key])&&Number.isFinite(Number(m[key]))).map(m=>m.date)).size;
  for(const key of Object.keys(WORKOUT_FIELDS))ws[key]=rows.filter(w=>hasValue(w[key])&&(typeof w[key]!=='string'||w[key].trim()!=='')&&(!['distanceKm','swimMeters','avgHr'].includes(key)||Number(w[key])>0)).length;
  for(const key of Object.keys(SUPPLEMENTS))ss[key]=Object.entries(s.supplements).filter(([date,v])=>validDate(date)&&v[key]===true).length;
  return {metrics:ms,workoutFields:ws,supplements:ss,workouts:rows.length,measurementDays:new Set(s.measurements.filter(m=>validDate(m.date)).map(m=>m.date)).size};
}
export function visibleFields(s){
  const u=usage(s),saved=s.profile.tracking;
  const metricMinimum=Math.max(THRESHOLD,Math.ceil(u.measurementDays*.2)),workoutMinimum=Math.max(THRESHOLD,Math.ceil(u.workouts*.2));
  const routineDays=Object.entries(s.supplements).filter(([date,v])=>validDate(date)&&Object.keys(SUPPLEMENTS).some(k=>v[k]===true)).length;
  const routineMinimum=Math.max(THRESHOLD,Math.ceil(routineDays*.2));
  return {metrics:(saved?.metrics||Object.keys(METRICS).filter(k=>u.metrics[k]>=metricMinimum)).filter(k=>METRICS[k]),workoutFields:(saved?.workoutFields||Object.keys(WORKOUT_FIELDS).filter(k=>u.workoutFields[k]>=workoutMinimum)).filter(k=>WORKOUT_FIELDS[k]),supplements:(saved?.supplements||Object.keys(SUPPLEMENTS).filter(k=>u.supplements[k]>=routineMinimum)).filter(k=>SUPPLEMENTS[k])};
}
export function freezeTracking(s){if(!s.profile.tracking)s.profile.tracking={...visibleFields(s),reviewedAt:new Date().toISOString(),threshold:THRESHOLD};return s;}
export function familyPeriod(profile,date=today()){return validDate(profile.familyDate)&&date>=addDays(profile.familyDate,-28)&&date<=addDays(profile.familyDate,56);}
export function mode(s,date=today()){return s.profile.weekMode==='family'||familyPeriod(s.profile,date)?'family':s.profile.weekMode;}
export const LEVELS=[
  {name:'Znovu do pohybu',subtitle:'Dvě krátké jednotky. Třetí, jen když zbývá energie.',sessions:[{type:'Chůze',title:'Svižná procházka',duration:20,details:'5 min volně, 10 min svižně, 5 min zvolnění. Tempo, při kterém pohodlně mluvíš.',exercise:null},{type:'Silový A',title:'Krátká síla doma',duration:20,details:'5 min zahřátí + jeden lehký okruh A. Nech si rezervu, bez cvičení do selhání.',exercise:'A'},{type:'Terén',title:'Procházka venku',duration:25,details:'Pohodové tempo, klidně s rodinou. Bez cíle na vzdálenost.',optional:true}]},
  {name:'Pravidelnost',subtitle:'Klidný běh s chůzí, síla a pobyt venku.',sessions:[{type:'Běh',title:'Lehký běh s chůzí',duration:28,details:'5 min chůze + 6× (1 min klusu / 2 min chůze) + 5 min chůze. Klus pouze bez bolesti.',exercise:null},{type:'Silový A',title:'Síla celého těla',duration:25,details:'5 min zahřátí + 1–2 okruhy A. Zátěž podle techniky, klidné dýchání.',exercise:'A'},{type:'Terén',title:'Čas venku',duration:35,details:'Lehká chůze po členitém povrchu. Do kopce klidně zpomal.',optional:true}]},
  {name:'Vytrvalost',subtitle:'Tři jednotky, pořád v lehkém tempu.',sessions:[{type:'Běh',title:'Lehký běh / běh s chůzí',duration:30,details:'5 min chůze, 20 min lehkého běhu s pauzami chůzí podle potřeby, 5 min zvolnění.'},{type:'Silový B',title:'Síla a stabilita',duration:25,details:'5 min zahřátí + 2 lehké okruhy B. Nech si 2–3 opakování v rezervě.',exercise:'B'},{type:'Terén',title:'Delší pobyt v terénu',duration:50,details:'Chůze nebo běh s chůzí, mírné kopce. Cílem je skončit s rezervou.'}]},
  {name:'Terén a závody',subtitle:'Výdrž do kopců. Závodní ambice podle regenerace.',sessions:[{type:'Běh',title:'Lehký běh',duration:35,details:'Pohodové tempo, včetně zahřátí a zvolnění. Když jsi unavený, vystřídej běh chůzí.'},{type:'Silový A',title:'Síla a úchop',duration:30,details:'5 min zahřátí + 2 okruhy A, krátké přenášení. Bez maximálních pokusů.',exercise:'A'},{type:'Terén',title:'Delší terén',duration:70,details:'Začni 60–70 min lehce. Po opakovaně dobré regeneraci můžeš po malých krocích prodlužovat k 90 min. Délka nikdy není povinnost.'}]}
];
export function weekPlan(s,date=today()){
  const start=monday(date),effectiveMode=mode(s,date); const index=s.profile.planLevel;
  const base=effectiveMode==='family'?[{type:'Chůze',title:'Chvíle na vzduchu',duration:15,details:'Krátká klidná procházka, kdy se vejde do dne.'},{type:'Silový A',title:'Deset minut pro tělo',duration:10,details:'Krátké zahřátí, pár lehkých dřepů k židli, kliků o zeď a přítahů gumy. Při únavě jen mobilita.',exercise:'A',optional:true}]:effectiveMode==='busy'?[{type:'Chůze',title:'Krátká procházka',duration:15,details:'Patnáct minut svižné chůze. Můžeš rozdělit na dvě kratší části.'},{type:'Silový A',title:'Krátká síla doma',duration:15,details:'Krátké zahřátí a jeden lehký okruh A.',exercise:'A'}]:LEVELS[index].sessions;
  return base.map((x,i)=>({...x,id:`v4-${start}-${effectiveMode}-${i}`,week:start,slot:i}));
}
export function weekStats(s,date=today()){
  const start=monday(date),end=addDays(start,6),rows=workouts(s).filter(w=>w.date>=start&&w.date<=end);
  return {rows,minutes:rows.reduce((a,w)=>a+(Number(w.duration)||0),0),days:new Set(rows.map(w=>w.date)).size,count:rows.length,start,end};
}
export function weeklySeries(s,date=today(),count=8){const current=monday(date),all=workouts(s);return Array.from({length:count},(_,i)=>{const start=addDays(current,-7*(count-i-1));return {date:start,minutes:all.filter(w=>w.date>=start&&w.date<=addDays(start,6)).reduce((n,w)=>n+(Number(w.duration)||0),0)};});}
export function metricPoints(s,key){const dates=new Map();for(const m of s.measurements){if(validDate(m.date)&&hasValue(m[key])&&Number.isFinite(Number(m[key])))dates.set(m.date,{date:m.date,value:Number(m[key])});}return [...dates.values()].sort((a,b)=>a.date.localeCompare(b.date));}
export function metricValue(key,value){if(!hasValue(value))return '—';if(key==='sleepMinutes')return `${Math.floor(Number(value)/60)} h ${Math.round(Number(value)%60)} min`;return Number(value).toLocaleString('cs-CZ',{maximumFractionDigits:2})+' '+METRICS[key].unit;}
export function personalRecordCount(s){return workouts(s).length+s.measurements.length+Object.keys(s.supplements).length;}

// Field-level merge: edits only touch their own record. Unknown legacy fields survive.
export function mergeChanges(remote,local,changes){
  const result=normalize(remote);
  for(const key of changes.profile||[])result.profile[key]=structuredClone(local.profile[key]);
  for(const id of changes.completions||[]){if(local.completions[id])result.completions[id]=structuredClone(local.completions[id]);}
  for(const id of changes.workouts||[]){const record=local.customWorkouts.find(w=>w.id===id);if(!record)continue;const i=result.customWorkouts.findIndex(w=>w.id===id);if(i<0)result.customWorkouts.push(structuredClone(record));else result.customWorkouts[i]={...result.customWorkouts[i],...structuredClone(record)};}
  for(const [date,keys] of Object.entries(changes.measurements||{})){const source=local.measurements.find(m=>m.date===date);if(!source)continue;let target=result.measurements.find(m=>m.date===date);if(!target){target={id:source.id||`d-${date}`,date};result.measurements.push(target);}for(const key of keys)target[key]=source[key];target.updatedAt=source.updatedAt;}
  for(const [date,keys] of Object.entries(changes.supplements||{})){result.supplements[date]={...result.supplements[date]};for(const key of keys)result.supplements[date][key]=local.supplements[date]?.[key];}
  result.updatedAt=Date.now();return result;
}
export const EXERCISES={
  A:[['Dřep k židli','6–10 opakování','Vlastní váha nebo lehký kettlebell. Stabilní židle, kolena ve směru špiček.'],['Klik o zeď nebo stůl','6–10 opakování','Pevná opora, tělo v jedné linii. Zvol dostatečně lehkou variantu.'],['Přítah gumy','8–12 opakování','Bezpečné ukotvení, ramena daleko od uší.'],['Kufříková chůze','20–30 s na stranu','Lehký kettlebell, vzpřímený postoj a klidné dýchání.']],
  B:[['Výstup na nízký schod','6–8 na stranu','Pevná opora, kontrolovaný sestup.'],['Hýžďový most','8–12 opakování','Zvedej pánev přes hýždě, ne prohnutím zad.'],['Přítah gumy','8–12 opakování','Plynule bez trhání, nepropínej bedra.'],['Bird dog','5–8 na stranu','Pomalu natáhni opačnou ruku a nohu. Trup drž stabilní.']]
};
