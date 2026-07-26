import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

(() => {
  "use strict";
  const STORAGE_KEY = "spartanTrackerFirebaseV2";
  const titles = {dashboard:"Přehled",plan:"Tréninkový plán",measurements:"Měření a grafy",exercises:"Cviky a videa",data:"Data a nastavení"};
  const measurementDates = ["2026-07-26","2026-08-10","2026-08-24","2026-09-07","2026-09-21","2026-10-05"];

  const weeks = [
    {label:"Start • 26. 7.–2. 8.",start:"2026-07-26",end:"2026-08-02",sessions:[
      ["2026-07-26","Chůze","Start: svižná chůze + mobilita + úchop","30 min chůze, 8 min mobilita, 3×20 s vis nebo úchop ručníku",38,false],
      ["2026-07-27","Chůze","Lehká chůze","25–30 min chůze + 5 min mobilita",30,false],
      ["2026-07-28","Silový A","Silový trénink A","Kettlebell 4–8 kg + guma; 2 série každého cviku, technicky čistě",40,false],
      ["2026-07-29","Plavání","Návrat do bazénu","Volitelně místo regenerační chůze: 20–25 min velmi lehce, časté pauzy",25,true],
      ["2026-07-30","Běh","Běh–chůze","5 min chůze + 6× (2 min svižně + 1 min lehký klus/chůze) + 5 min zklidnění",30,false],
      ["2026-07-31","Silový B","Silový trénink B","Kettlebell 4–5 kg + guma; 2 série každého cviku, klidné tempo",40,false],
      ["2026-08-01","Terén","Delší chůze / terén","45–60 min v lehké intenzitě",50,false]
    ]},
    {label:"Týden 2 • 3. 8.–9. 8.",start:"2026-08-03",end:"2026-08-09",sessions:[
      ["2026-08-03","Chůze","Chůze + mobilita","25 min lehká chůze a 8 min mobilita",33,false],
      ["2026-08-04","Silový A","Silový trénink A","2 série; goblet dřep, KB tah, přítahy gumy a přenášení",42,false],
      ["2026-08-05","Plavání","Lehké plavání","Volitelně 25–30 min; střídej krátké úseky a odpočinek",28,true],
      ["2026-08-06","Běh","Běh–chůze","6×: 4 min chůze + 1 min velmi lehký klus",35,false],
      ["2026-08-07","Silový B","Silový trénink B","2 série; guma + KB 4–5 kg",42,false],
      ["2026-08-08","Terén","Členitá chůze","55 min, mírné kopce",55,false]
    ]},
    {label:"Týden 3 • 10. 8.–16. 8.",start:"2026-08-10",end:"2026-08-16",sessions:[
      ["2026-08-10","Chůze","Regenerační chůze","25–30 min lehce",28,false],
      ["2026-08-11","Silový A","Silový trénink A","3 série u prvních 4 cviků, jinak 2; KB podle techniky",48,false],
      ["2026-08-12","Plavání","Technika + klidné tempo","Volitelně 30 min; nepřidávej, pokud jsi unavený",30,true],
      ["2026-08-13","Běh","Běh–chůze","7×: 3 min chůze + 2 min klus",40,false],
      ["2026-08-14","Silový B","Silový trénink B","3 série u prvních 4 cviků, jinak 2",48,false],
      ["2026-08-15","Terén","Delší terén","65 min chůze / běh–chůze",65,false]
    ]},
    {label:"Týden 4 • 17. 8.–23. 8. • odlehčení",start:"2026-08-17",end:"2026-08-23",sessions:[
      ["2026-08-18","Silový A","Lehký silový A","Jen 2 série, přibližně 70 % běžné zátěže",35,false],
      ["2026-08-19","Plavání","Regenerační plavání","Volitelně 20–25 min velmi lehce",23,true],
      ["2026-08-20","Běh","Lehkých 30 min","Souvislá chůze nebo velmi lehký běh–chůze",30,false],
      ["2026-08-21","Silový B","Lehký silový B","Jen 2 série, bez výkonových testů",35,false],
      ["2026-08-22","Terén","Lehký terén","50 min pohodově",50,false]
    ]},
    {label:"Týden 5 • 24. 8.–30. 8.",start:"2026-08-24",end:"2026-08-30",sessions:[
      ["2026-08-25","Silový A","Silový trénink A","3 série; KB 8 kg jen tam, kde zůstává čistá technika",50,false],
      ["2026-08-26","Plavání","Lehké souvislé úseky","Volitelně 30 min; klidné dýchání",30,true],
      ["2026-08-27","Běh","Běh–chůze","8×: 2 min chůze + 3 min klus",45,false],
      ["2026-08-28","Silový B","Silový trénink B","3 série; guma na přítahy a Pallof press",50,false],
      ["2026-08-29","Terén","Terén + přenášení","70 min v kopcích, 4 krátké úseky s KB 5–8 kg",70,false]
    ]},
    {label:"Týden 6 • 31. 8.–6. 9.",start:"2026-08-31",end:"2026-09-06",sessions:[
      ["2026-09-01","Silový A","Silový trénink A","3 série",52,false],
      ["2026-09-02","Plavání","Vytrvalost v bazénu","Volitelně 30–35 min lehce",33,true],
      ["2026-09-03","Běh","Běh–chůze","9×: 1 min chůze + 4 min klus",50,false],
      ["2026-09-04","Silový B","Silový trénink B","3 série",52,false],
      ["2026-09-05","Terén","Delší terén","80 min v lehké intenzitě",80,false]
    ]},
    {label:"Týden 7 • 7. 9.–13. 9.",start:"2026-09-07",end:"2026-09-13",sessions:[
      ["2026-09-08","Silový A","Silový trénink A","3 série, bez selhání",52,false],
      ["2026-09-09","Plavání","Lehké plavání","Volitelně 30 min jako regenerace",30,true],
      ["2026-09-10","Běh","Plynulý běh–chůze","45 min + volitelně 6×30 s svižná chůze do kopce",48,false],
      ["2026-09-11","Silový B","Silový trénink B","3 série",52,false],
      ["2026-09-12","Terén","Dlouhý terén","90 min lehce",90,false]
    ]},
    {label:"Týden 8 • 14. 9.–20. 9. • kontrolní",start:"2026-09-14",end:"2026-09-20",sessions:[
      ["2026-09-15","Silový A","Lehký silový A","2 série",38,false],
      ["2026-09-16","Plavání","Regenerační plavání","Volitelně 20–25 min",23,true],
      ["2026-09-17","Běh","Lehkých 25–30 min","Bez intenzivních intervalů",28,false],
      ["2026-09-18","Silový B","Lehký silový B","2 série",38,false],
      ["2026-09-19","Terén","Kontrolních 5 km","Smíšený povrch, kontrolované tempo; zaznamenej čas, vzdálenost a stav další den",60,false]
    ]},
    {label:"Týden 9 • 21. 9.–27. 9.",start:"2026-09-21",end:"2026-09-27",sessions:[
      ["2026-09-22","Silový A","Silový trénink A","3 série",48,false],
      ["2026-09-23","Plavání","Lehké plavání","Volitelně 30 min",30,true],
      ["2026-09-24","Běh","Kopce","35 min lehce + 4×1 min svižná chůze do kopce",40,false],
      ["2026-09-25","Silový B","Silový trénink B","2–3 série",45,false],
      ["2026-09-26","Terén","Lehký terén","55–60 min",58,false]
    ]},
    {label:"Týden 10 • 28. 9.–4. 10.",start:"2026-09-28",end:"2026-10-04",sessions:[
      ["2026-09-29","Silový A","Lehký silový A","2 série, žádná svalová horečka",35,false],
      ["2026-09-30","Plavání","Velmi lehké plavání","Volitelně 20 min, pouze pokud dobře regeneruješ",20,true],
      ["2026-10-01","Běh","Lehká kondice","30 min + 3 krátká svižná zrychlení",32,false],
      ["2026-10-02","Silový B","Lehký silový B","2 série",35,false],
      ["2026-10-03","Terén","Lehký terén","50–55 min",52,false]
    ]},
    {label:"Závodní týden • 5. 10.–11. 10.",start:"2026-10-05",end:"2026-10-11",sessions:[
      ["2026-10-06","Mobilita","Aktivace + mobilita","20 min velmi lehce",20,false],
      ["2026-10-08","Běh","Krátké rozhýbání","20 min velmi lehce, bez únavy",20,false],
      ["2026-10-10","Terén","Lipno Sprint 2026","Kontrolovaný dokončovací závod – žádné honění času",90,false]
    ]}
  ];
  let counter = 0;
  const plan = weeks.flatMap((w,wi) => w.sessions.map(s => ({
    id:`w${wi}-s${counter++}`,week:wi,date:s[0],type:s[1],title:s[2],details:s[3],plannedDuration:s[4],optional:!!s[5]
  })));

  const exercises = [
    {group:"A",name:"Goblet dřep na box / lavičku",dose:"3× 8",equipment:"Kettlebell 4, 5 nebo 8 kg",url:"https://www.youtube.com/results?search_query=goblet+squat+to+box+proper+form",tips:["Začni s 4–5 kg a vyšší lavičkou.","Kettlebell drž u hrudníku.","Kolena sledují směr špiček."]},
    {group:"A",name:"Rumunský mrtvý tah s kettlebellem",dose:"3× 10",equipment:"Kettlebell 5 nebo 8 kg",url:"https://www.youtube.com/results?search_query=kettlebell+romanian+deadlift+proper+form",tips:["Pohyb začíná posunem kyčlí dozadu.","Záda drž neutrálně.","Kettlebell vede blízko nohou."]},
    {group:"A",name:"Kliky o lavičku / stůl",dose:"3× 8–12",equipment:"Lavička nebo pevný stůl",url:"https://www.youtube.com/watch?v=W8C7tChZ1CE",tips:["Tělo drž jako jednu pevnou linii.","Výšku opory zvol podle techniky.","Neklesej v bedrech."]},
    {group:"A",name:"Přítah gumy nebo kettlebellu",dose:"3× 10 / strana",equipment:"Odporová guma nebo KB 4–8 kg",url:"https://www.youtube.com/results?search_query=resistance+band+row+proper+form",tips:["Nerotuj trupem.","Loket táhni směrem k boku.","Rameno netahej k uchu."]},
    {group:"A",name:"Farmářská / kufříková chůze",dose:"4× 30–40 s",equipment:"KB 5 a 8 kg",url:"https://www.youtube.com/watch?v=oLiQAFxXsIQ",tips:["Vysoký postoj, pevný střed.","Střídej strany, pokud neseš jednu KB.","Krátké kontrolované kroky."]},
    {group:"A",name:"Dead bug",dose:"3× 8 / strana",equipment:"Bez vybavení",url:"https://www.youtube.com/watch?v=8NBNM8haZx0",tips:["Bedra udržuj pod kontrolou.","Pohybuj se pomalu.","Zkrať rozsah, když se záda odlepují."]},
    {group:"B",name:"Výstupy na nízký schod",dose:"3× 8 / strana",equipment:"Schod; později KB 4–5 kg",url:"https://www.youtube.com/watch?v=lzEmooZu7ZM",tips:["Začni nízkým schodem.","Odraz zadní nohy minimalizuj.","Koleno drž v ose chodidla."]},
    {group:"B",name:"Glute bridge s gumou",dose:"3× 12",equipment:"Krátká odporová guma",url:"https://www.youtube.com/results?search_query=banded+glute+bridge+proper+form",tips:["Gumu dej nad kolena.","Zvedej se přes hýždě, ne prohnutím beder.","Nahoře krátce zatni hýždě."]},
    {group:"B",name:"Stahování gumy / přítahy gumy",dose:"3× 8–12",equipment:"Dlouhá odporová guma",url:"https://www.youtube.com/results?search_query=resistance+band+lat+pulldown+proper+form",tips:["Gumu bezpečně ukotvi.","Ramena drž dál od uší.","Pohyb kontroluj i při návratu."]},
    {group:"B",name:"Tlak kettlebellu nad hlavu",dose:"3× 8 / strana",equipment:"KB 4 nebo 5 kg",url:"https://www.youtube.com/results?search_query=single+arm+kettlebell+overhead+press+proper+form",tips:["Žebra drž pod kontrolou.","Netlač přes bolest ramene.","Začni lehčí vahou."]},
    {group:"B",name:"Vis / úchop ručníku",dose:"4× 15–20 s",equipment:"Hrazda nebo pevný ručník",url:"https://www.youtube.com/playlist?list=PL0x4y82l3bmJPR8ZODtxDgzRJGk_Y6pkZ",tips:["Začni krátkými úseky.","Úchop nepouštěj náhle.","Použij stupínek pro bezpečný nástup."]},
    {group:"B",name:"Pallof press s gumou",dose:"3× 8–10 / strana",equipment:"Dlouhá odporová guma",url:"https://www.youtube.com/results?search_query=band+pallof+press+proper+form",tips:["Trup se nesmí otáčet za gumou.","Stůj stabilně a dýchej.","Použij lehký odpor."]}
  ];

  const initialState = () => ({
    version:2,
    profile:{name:"",startDate:"2026-07-26",raceDate:"2026-10-10",goal:"Liberec Super 2027"},
    completions:{},
    customWorkouts:[],
    measurements:[],
    createdAt:new Date().toISOString(),
    updatedAt:Date.now()
  });
  let state = loadState();
  let currentPage = "dashboard";
  let deferredPrompt = null;
  let auth = null;
  let db = null;
  let currentUser = null;
  let cloudUnsubscribe = null;
  let cloudSyncTimer = null;
  let firebaseAvailable = false;
  let syncBusy = false;

  function loadState(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY)||localStorage.getItem("spartanTrackerV1");
      if(!raw) return initialState();
      const parsed=JSON.parse(raw);
      return {...initialState(),...parsed,profile:{...initialState().profile,...(parsed.profile||{})},completions:parsed.completions||{},customWorkouts:parsed.customWorkouts||[],measurements:parsed.measurements||[]};
    }catch(e){return initialState();}
  }
  function normalizeState(value){
    const base=initialState();
    return {...base,...value,profile:{...base.profile,...(value?.profile||{})},completions:value?.completions||{},customWorkouts:value?.customWorkouts||[],measurements:value?.measurements||[]};
  }
  function saveLocal(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
  function saveState(){
    state.updatedAt=Date.now();
    saveLocal();
    scheduleCloudSync();
  }
  function configuredFirebase(){
    return !!firebaseConfig?.apiKey && !String(firebaseConfig.apiKey).includes("VLOZTE") && !!firebaseConfig?.projectId;
  }
  function setSyncUi(mode,text,detail=""){
    const dot=qs("#syncDot");
    if(dot){dot.className=`sync-dot ${mode||""}`;qs("#syncText").textContent=text;qs("#syncEmail").textContent=detail||" ";}
    const account=qs("#accountStatus"), accountDetail=qs("#accountDetail");
    if(account)account.textContent=text;
    if(accountDetail)accountDetail.textContent=detail||" ";
  }
  function updateAuthUi(){
    const signed=!!currentUser;
    const email=currentUser?.email||"";
    qs("#sidebarAuthBtn").textContent=signed?"Odhlásit":"Přihlásit";
    qs("#authTopBtn").textContent=signed?"☁ "+email:"☁ Přihlásit";
    qs("#accountLoginBtn").style.display=signed?"none":"inline-flex";
    qs("#logoutBtn").style.display=signed?"inline-flex":"none";
    qs("#syncNowBtn").style.display=signed?"inline-flex":"none";
    if(!firebaseAvailable)setSyncUi("","Lokální režim","Doplň firebase-config.js");
    else if(signed)setSyncUi(syncBusy?"busy":"online",syncBusy?"Synchronizuji…":"Synchronizováno",email);
    else setSyncUi("","Firebase připraven","Přihlas se pro synchronizaci");
  }
  function scheduleCloudSync(){
    if(!currentUser||!db)return;
    clearTimeout(cloudSyncTimer);
    cloudSyncTimer=setTimeout(()=>pushCloudState(false),500);
  }
  async function pushCloudState(showMessage=true){
    if(!currentUser||!db)return;
    syncBusy=true;updateAuthUi();
    try{
      const ref=doc(db,"users",currentUser.uid,"app","state");
      await setDoc(ref,{payload:state,updatedAt:state.updatedAt,email:currentUser.email||"",savedAt:new Date().toISOString()},{merge:true});
      if(showMessage)toast("Data synchronizována");
    }catch(err){
      console.error(err);setSyncUi("error","Chyba synchronizace",friendlyFirebaseError(err));
      if(showMessage)alert("Synchronizace selhala: "+friendlyFirebaseError(err));
    }finally{syncBusy=false;updateAuthUi();}
  }
  async function attachCloud(user){
    if(cloudUnsubscribe){cloudUnsubscribe();cloudUnsubscribe=null;}
    const ref=doc(db,"users",user.uid,"app","state");
    syncBusy=true;updateAuthUi();
    try{
      const snap=await getDoc(ref);
      if(snap.exists()&&snap.data()?.payload){
        const cloud=normalizeState(snap.data().payload);
        if(Number(cloud.updatedAt||0)>Number(state.updatedAt||0)){
          state=cloud;saveLocal();renderAll();toast("Načtena novější cloudová data");
        }else{
          await pushCloudState(false);
        }
      }else{
        await pushCloudState(false);
      }
      cloudUnsubscribe=onSnapshot(ref,snapshot=>{
        const remote=snapshot.data()?.payload;
        if(remote&&Number(remote.updatedAt||0)>Number(state.updatedAt||0)){
          state=normalizeState(remote);saveLocal();renderAll();toast("Data aktualizována z jiného zařízení");
        }
      },err=>{console.error(err);setSyncUi("error","Chyba synchronizace",friendlyFirebaseError(err));});
    }catch(err){
      console.error(err);setSyncUi("error","Chyba Firebase",friendlyFirebaseError(err));
    }finally{syncBusy=false;updateAuthUi();}
  }
  function friendlyFirebaseError(err){
    const code=err?.code||"";
    const map={
      "auth/popup-closed-by-user":"Přihlašovací okno bylo zavřeno.",
      "auth/popup-blocked":"Prohlížeč zablokoval přihlašovací okno. Povol vyskakovací okna a zkus to znovu.",
      "auth/cancelled-popup-request":"Předchozí přihlašovací pokus byl zrušen.",
      "auth/account-exists-with-different-credential":"Účet už existuje s jiným způsobem přihlášení.",
      "auth/unauthorized-domain":"Tato GitHub Pages doména není přidaná ve Firebase Authorized domains.",
      "auth/too-many-requests":"Příliš mnoho pokusů. Zkus to později.",
      "auth/network-request-failed":"Síťová chyba.",
      "permission-denied":"Firestore pravidla nepovolila přístup."
    };
    return map[code]||err?.message||"Neznámá chyba.";
  }
  async function initFirebase(){
    firebaseAvailable=configuredFirebase();
    updateAuthUi();
    if(!firebaseAvailable)return;
    try{
      const app=initializeApp(firebaseConfig);
      auth=getAuth(app);db=getFirestore(app);
      await setPersistence(auth,browserLocalPersistence);
      onAuthStateChanged(auth,async user=>{
        currentUser=user;updateAuthUi();
        if(user)await attachCloud(user);
        else if(cloudUnsubscribe){cloudUnsubscribe();cloudUnsubscribe=null;}
      });
    }catch(err){
      firebaseAvailable=false;console.error(err);setSyncUi("error","Firebase se nespustil",friendlyFirebaseError(err));
    }
  }
  function openAuthModal(){
    qs("#firebaseMissingNotice").style.display=firebaseAvailable?"none":"block";
    qs("#authModal").classList.add("open");
  }
  function closeAuthModal(){qs("#authModal").classList.remove("open");}
  async function googleLogin(){
    if(!firebaseAvailable){openAuthModal();return;}
    try{
      const provider=new GoogleAuthProvider();
      provider.setCustomParameters({prompt:"select_account"});
      await signInWithPopup(auth,provider);
      closeAuthModal();toast("Přihlášení přes Google proběhlo");
    }catch(err){
      console.error(err);
      if(err?.code!=="auth/popup-closed-by-user")alert(friendlyFirebaseError(err));
    }
  }
  function qs(s,r=document){return r.querySelector(s)}
  function qsa(s,r=document){return [...r.querySelectorAll(s)]}
  function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
  function isoToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function parseDate(iso){const [y,m,d]=iso.split("-").map(Number);return new Date(y,m-1,d)}
  function fmtDate(iso,opts={day:"numeric",month:"numeric",year:"numeric"}){return parseDate(iso).toLocaleDateString("cs-CZ",opts)}
  function daysBetween(a,b){return Math.ceil((parseDate(b)-parseDate(a))/86400000)}
  function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
  function toast(msg){const t=qs("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
  function sessionClass(type){return type.startsWith("Silový")?"strength":(["Běh","Plavání","Kondice"].includes(type)?"cardio":type==="Terén"?"terrain":"recovery")}
  function completedSession(id){return !!state.completions[id]}
  function allWorkouts(){
    const planned=Object.entries(state.completions).map(([id,v])=>({id,planned:true,...v}));
    return [...planned,...state.customWorkouts.map(v=>({...v,planned:false}))].filter(x=>x.completed!==false);
  }
  function currentWeekIndex(){
    const t=isoToday();
    const found=weeks.findIndex(w=>t>=w.start&&t<=w.end);
    if(found>=0)return found;
    if(t<weeks[0].start)return 0;
    return weeks.length-1;
  }

  function switchPage(page){
    currentPage=page;
    qsa(".page").forEach(x=>x.classList.toggle("active",x.id===`page-${page}`));
    qsa("[data-page]").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
    qs("#topTitle").textContent=titles[page];
    window.scrollTo({top:0,behavior:"smooth"});
    if(page==="measurements")renderMeasurements();
    if(page==="plan")renderPlan();
    if(page==="exercises")renderExercises(qs("#exerciseTabs .active")?.dataset.filter||"all");
    if(page==="data"){fillProfile();updateAuthUi();}
  }

  function renderDashboard(){
    const requiredPlan=plan.filter(s=>!s.optional), total=requiredPlan.length, done=requiredPlan.filter(s=>completedSession(s.id)).length;
    const percent=total?Math.round(done/total*100):0;
    qs("#heroPercent").textContent=`${percent} %`;qs("#heroBar").style.width=`${percent}%`;
    const name=state.profile.name?.trim();
    qs("#heroGreeting").textContent=name?`${name}, pokračuj v cestě k cíli.`:"Začíná cesta k závodu.";
    const start=state.profile.startDate||"2026-07-26", today=isoToday();
    const dtrain=daysBetween(start,today)+1;
    qs("#daysTraining").textContent=today<start?"Start je před tebou":`Den ${Math.max(1,dtrain)}`;
    const race=state.profile.raceDate;
    const countdown=race?daysBetween(today,race):null;
    qs("#raceCountdown").textContent=countdown===null?"Cíl bez data":countdown>=0?`${countdown} dní do závodu`:"Závod proběhl";

    const wi=currentWeekIndex(), ws=plan.filter(s=>s.week===wi&&!s.optional), wd=ws.filter(s=>completedSession(s.id)).length;
    qs("#weekDone").textContent=`${wd} / ${ws.length}`;
    const workouts=allWorkouts();
    const mins=workouts.reduce((a,b)=>a+(Number(b.duration)||0),0);
    qs("#totalMinutes").textContent=mins>=60?`${Math.floor(mins/60)} h ${mins%60} min`:`${mins} min`;
    const runKm=workouts.reduce((a,b)=>a+(Number(b.distanceKm)||0),0);
    const swimM=workouts.reduce((a,b)=>a+(Number(b.swimMeters)||0),0);
    qs("#runMetric").textContent=`${runKm.toFixed(runKm<10?1:0)} km`;
    qs("#swimMetric").textContent=`${Math.round(swimM)} m`;

    const ms=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date));
    const weights=ms.filter(m=>Number.isFinite(Number(m.weight))&&m.weight!=="");
    if(weights.length){
      const last=Number(weights.at(-1).weight), first=Number(weights[0].weight), diff=last-first;
      qs("#weightMetric").textContent=`${last.toFixed(1)} kg`;
      qs("#weightHint").textContent=weights.length>1?`${diff>0?"+":""}${diff.toFixed(1)} kg od začátku`:"výchozí hodnota";
    }else{qs("#weightMetric").textContent="—";qs("#weightHint").textContent="zatím bez měření"}
    const sleeps=ms.slice(-6).map(m=>Number(m.sleep)).filter(Number.isFinite);
    qs("#sleepMetric").textContent=sleeps.length?`${(sleeps.reduce((a,b)=>a+b,0)/sleeps.length).toFixed(1)} h`:"—";

    const future=plan.filter(s=>s.date>=today&&!completedSession(s.id)).slice(0,5);
    const upcoming=future.length?future:plan.filter(s=>!completedSession(s.id)).slice(-5);
    qs("#upcomingList").innerHTML=upcoming.length?upcoming.map(s=>`
      <div class="session-row">
        <div class="session-date"><strong>${parseDate(s.date).getDate()}</strong>${parseDate(s.date).toLocaleDateString("cs-CZ",{month:"short"})}</div>
        <div class="session-info"><strong>${esc(s.title)}</strong><small>${esc(s.details)}</small></div>
        <button class="btn small" data-log="${s.id}">Zapsat</button>
      </div>`).join(""):`<div class="empty">Všechny plánované jednotky jsou splněné.</div>`;

    const next=measurementDates.find(d=>d>=today) || measurementDates.at(-1);
    qs("#nextMeasureDate").textContent=fmtDate(next,{weekday:"long",day:"numeric",month:"long",year:"numeric"});
    drawWeightMini();
    drawWeekly();
  }

  function renderPlan(){
    const now=isoToday();
    qs("#planContainer").innerHTML=weeks.map((w,wi)=>{
      const sessions=plan.filter(s=>s.week===wi),required=sessions.filter(s=>!s.optional),done=required.filter(s=>completedSession(s.id)).length;
      const isCurrent=wi===currentWeekIndex();
      return `<div class="card week" data-week="${wi}">
        <div class="week-head"><div><h3>${esc(w.label)}</h3><small>${done} z ${required.length} povinných splněno</small></div><button class="btn small week-toggle">${isCurrent?"Skrýt":"Zobrazit"}</button></div>
        <div class="week-sessions" style="${isCurrent?"":"display:none"}">
          ${sessions.map(s=>{const c=state.completions[s.id];return `<div class="plan-row ${c?"done":""}">
            <input class="check" type="checkbox" data-check="${s.id}" ${c?"checked":""} aria-label="Splněno">
            <div class="plan-day"><strong>${parseDate(s.date).toLocaleDateString("cs-CZ",{weekday:"short"})}</strong>${fmtDate(s.date,{day:"numeric",month:"numeric"})}</div>
            <div class="plan-main"><strong>${esc(s.title)} <span class="tag ${sessionClass(s.type)}">${esc(s.type)}</span> ${s.optional?`<span class="optional-badge">VOLITELNÉ</span>`:""}</strong><small>${esc(s.details)}${c&&c.duration?` · zapsáno ${c.duration} min, RPE ${c.rpe||"—"}`:""}</small></div>
            <button class="btn small" data-log="${s.id}">${c?"Upravit":"Zapsat"}</button>
          </div>`}).join("")}
        </div>
      </div>`;
    }).join("");
    renderWorkoutTable();
  }

  function paceText(workout){
    const km=Number(workout.distanceKm),min=Number(workout.duration);
    if(!km||!min)return "";
    const pace=min/km;
    let whole=Math.floor(pace),sec=Math.round((pace-whole)*60);
    if(sec===60){whole+=1;sec=0;}
    return `${whole}:${String(sec).padStart(2,"0")} min/km`;
  }
  function renderWorkoutTable(){
    const rows=allWorkouts().sort((a,b)=>b.date.localeCompare(a.date));
    qs("#workoutTable").innerHTML=rows.length?rows.map(w=>`<tr>
      <td>${fmtDate(w.date)}</td><td>${esc(w.type||"—")}</td><td>${w.duration||"—"} min</td>
      <td>${w.distanceKm?`${Number(w.distanceKm).toFixed(2)} km${paceText(w)?` · ${paceText(w)}`:""}`:"—"}</td>
      <td>${w.swimMeters?`${Math.round(w.swimMeters)} m`:"—"}</td><td>${w.rpe||"—"}</td>
      <td>${esc(w.equipment||"—")}</td><td style="white-space:normal;min-width:180px">${esc(w.notes||"")}</td>
      <td><button class="btn small danger" data-del-workout="${w.id}" data-planned="${w.planned?"1":"0"}">Smazat</button></td>
    </tr>`).join(""):`<tr><td colspan="9" class="empty">Zatím není uložen žádný trénink.</td></tr>`;
  }

  function renderMeasurements(){
    const f=qs("#measurementForm");
    if(!f.date.value)f.date.value=isoToday();
    const arr=[...state.measurements].sort((a,b)=>b.date.localeCompare(a.date));
    qs("#measurementTable").innerHTML=arr.length?arr.map(m=>`<tr>
      <td>${fmtDate(m.date)}</td><td>${m.weight||"—"}</td><td>${m.waist||"—"}</td><td>${m.restingHr||"—"}</td><td>${m.sleep||"—"}</td>
      <td>${m.kmTime||"—"}</td><td>${m.hang||"—"}</td><td>${m.pushups||"—"}</td><td>${m.energy||"—"}</td>
      <td><button class="btn small danger" data-del-measure="${m.id}">Smazat</button></td></tr>`).join(""):`<tr><td colspan="10" class="empty">Zatím není uložené žádné měření.</td></tr>`;
    drawMetricChart();drawMinutesChart();drawRunChart();drawSwimChart();
  }

  function renderExercises(filter="all"){
    const list=exercises.filter(e=>filter==="all"||e.group===filter);
    qs("#exerciseGrid").innerHTML=list.map((e,i)=>`<article class="card exercise">
      <div class="ex-number">${e.group}</div><h3>${esc(e.name)}</h3><p><strong>${esc(e.dose)}</strong><br><span style="color:var(--muted)">${esc(e.equipment||"")}</span></p>
      <ul>${e.tips.map(t=>`<li>${esc(t)}</li>`).join("")}</ul>
      <a class="btn primary" href="${e.url}" target="_blank" rel="noopener noreferrer">▶ Otevřít video</a>
    </article>`).join("");
  }

  function openWorkout(id=null){
    const form=qs("#workoutForm");form.reset();
    const session=id?plan.find(s=>s.id===id):null;
    const existing=id?state.completions[id]:null;
    form.sessionId.value=id||"";
    form.date.value=existing?.date||session?.date||isoToday();
    form.type.value=existing?.type||session?.type||"Jiné";
    form.duration.value=existing?.duration||session?.plannedDuration||30;
    form.distanceKm.value=existing?.distanceKm||"";
    form.swimMeters.value=existing?.swimMeters||"";
    form.avgHr.value=existing?.avgHr||"";
    form.rpe.value=existing?.rpe||"";
    form.pain.value=existing?.pain||"";
    form.feeling.value=existing?.feeling||"";
    form.equipment.value=existing?.equipment||"";
    form.route.value=existing?.route||"";
    form.notes.value=existing?.notes||"";
    qs("#modalTitle").textContent=session?session.title:"Vlastní trénink";
    qs("#markIncompleteBtn").style.display=existing?"inline-flex":"none";
    qs("#workoutModal").classList.add("open");
  }
  function closeWorkout(){qs("#workoutModal").classList.remove("open")}

  function handleWorkoutSubmit(e){
    e.preventDefault();const fd=new FormData(e.currentTarget);const obj=Object.fromEntries(fd.entries());
    const id=obj.sessionId;delete obj.sessionId;
    obj.duration=Number(obj.duration)||0;["distanceKm","swimMeters","avgHr","rpe","pain","feeling"].forEach(k=>obj[k]=obj[k]!==""?Number(obj[k]):"");
    obj.completed=true;obj.updatedAt=new Date().toISOString();
    if(id)state.completions[id]=obj;
    else state.customWorkouts.push({id:`custom-${Date.now()}`,...obj});
    saveState();closeWorkout();renderAll();toast("Trénink uložen");
  }

  function markIncomplete(){
    const id=qs("#workoutForm").sessionId.value;
    if(id){delete state.completions[id];saveState();closeWorkout();renderAll();toast("Jednotka označena jako nesplněná")}
  }

  function handleMeasure(e){
    e.preventDefault();const fd=new FormData(e.currentTarget);const obj=Object.fromEntries(fd.entries());
    ["weight","waist","restingHr","sleep","kmTime","hang","pushups","energy","pain"].forEach(k=>{if(obj[k]!=="")obj[k]=Number(obj[k])});
    obj.id=`m-${Date.now()}`;state.measurements.push(obj);state.measurements.sort((a,b)=>a.date.localeCompare(b.date));
    saveState();e.currentTarget.reset();e.currentTarget.date.value=isoToday();renderAll();switchPage("measurements");toast("Měření uloženo");
  }

  function fillProfile(){
    const f=qs("#profileForm");Object.entries(state.profile).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v||""});
  }

  function drawBase(canvas){
    const ratio=window.devicePixelRatio||1;const rect=canvas.getBoundingClientRect();
    const w=Math.max(320,rect.width),h=Number(canvas.getAttribute("height"))||260;
    canvas.width=w*ratio;canvas.height=h*ratio;const ctx=canvas.getContext("2d");ctx.scale(ratio,ratio);ctx.clearRect(0,0,w,h);
    return {ctx,w,h};
  }
  function drawEmpty(ctx,w,h,text="Zatím není dost dat"){
    ctx.fillStyle="#718096";ctx.font="14px -apple-system,Segoe UI,Arial";ctx.textAlign="center";ctx.fillText(text,w/2,h/2);
  }
  function drawLine(canvas,points,{suffix="",inverse=false}={}){
    const {ctx,w,h}=drawBase(canvas);if(points.length<1){drawEmpty(ctx,w,h);return}
    const pad={l:48,r:18,t:20,b:38};const vals=points.map(p=>p.value);let min=Math.min(...vals),max=Math.max(...vals);
    if(min===max){min-=1;max+=1}else{const extra=(max-min)*.15;min-=extra;max+=extra}
    ctx.strokeStyle="#e2e8f0";ctx.lineWidth=1;ctx.font="11px -apple-system,Segoe UI,Arial";ctx.fillStyle="#718096";
    for(let i=0;i<5;i++){const y=pad.t+(h-pad.t-pad.b)*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();
      const val=max-(max-min)*i/4;ctx.textAlign="right";ctx.fillText(`${val.toFixed(max-min<10?1:0)}${suffix}`,pad.l-7,y+4)}
    const x=i=>points.length===1?(pad.l+w-pad.r)/2:pad.l+(w-pad.l-pad.r)*i/(points.length-1);
    const y=v=>pad.t+(max-v)/(max-min)*(h-pad.t-pad.b);
    ctx.strokeStyle="#ef5b4c";ctx.lineWidth=3;ctx.lineJoin="round";ctx.lineCap="round";ctx.beginPath();
    points.forEach((p,i)=>i?ctx.lineTo(x(i),y(p.value)):ctx.moveTo(x(i),y(p.value)));ctx.stroke();
    points.forEach((p,i)=>{ctx.fillStyle="#fff";ctx.strokeStyle="#ef5b4c";ctx.lineWidth=2;ctx.beginPath();ctx.arc(x(i),y(p.value),4,0,Math.PI*2);ctx.fill();ctx.stroke()});
    ctx.fillStyle="#718096";ctx.textAlign="center";ctx.font="10px -apple-system,Segoe UI,Arial";
    const step=Math.max(1,Math.ceil(points.length/6));points.forEach((p,i)=>{if(i%step===0||i===points.length-1)ctx.fillText(p.label,x(i),h-13)});
  }
  function drawBars(canvas,points,{suffix=""}={}){
    const {ctx,w,h}=drawBase(canvas);if(points.length<1){drawEmpty(ctx,w,h);return}
    const pad={l:38,r:14,t:20,b:42};const max=Math.max(1,...points.map(p=>p.value));const area=w-pad.l-pad.r;const gap=8;const bw=Math.max(10,(area-gap*(points.length-1))/points.length);
    ctx.strokeStyle="#e2e8f0";ctx.fillStyle="#718096";ctx.font="10px -apple-system,Segoe UI,Arial";
    for(let i=0;i<4;i++){const y=pad.t+(h-pad.t-pad.b)*i/3;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.textAlign="right";ctx.fillText(`${Math.round(max-(max*i/3))}${suffix}`,pad.l-5,y+3)}
    points.forEach((p,i)=>{const x=pad.l+i*(bw+gap);const bh=(h-pad.t-pad.b)*p.value/max;const y=h-pad.b-bh;
      ctx.fillStyle=p.value>=3?"#1f9d72":"#ef5b4c";roundRect(ctx,x,y,bw,bh,5);ctx.fill();
      ctx.fillStyle="#718096";ctx.textAlign="center";ctx.fillText(p.label,x+bw/2,h-17);
    });
  }
  function roundRect(ctx,x,y,w,h,r){r=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
  function drawWeightMini(){
    const pts=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)).filter(m=>m.weight!==""&&Number.isFinite(Number(m.weight))).slice(-12).map(m=>({label:fmtDate(m.date,{day:"numeric",month:"numeric"}),value:Number(m.weight)}));
    drawLine(qs("#weightMiniChart"),pts,{suffix:""});
  }
  function weeklyStats(){
    return weeks.map((w,wi)=>({label:`T${wi+1}`,value:plan.filter(s=>s.week===wi&&completedSession(s.id)).length}));
  }
  function drawWeekly(){drawBars(qs("#weeklyChart"),weeklyStats())}
  function drawMetricChart(){
    const key=qs("#metricSelect").value;const labels={weight:["kg",""],waist:["cm",""],restingHr:["",""],sleep:["h",""],kmTime:["min",""],hang:["s",""],pushups:["",""],energy:["",""],pain:["",""]};
    const pts=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)).filter(m=>m[key]!==""&&m[key]!=null&&Number.isFinite(Number(m[key]))).map(m=>({label:fmtDate(m.date,{day:"numeric",month:"numeric"}),value:Number(m[key])}));
    drawLine(qs("#metricChart"),pts,{suffix:labels[key][0]});
  }
  function weeklyMinutes(){
    return weeks.map((w,wi)=>{
      const ids=plan.filter(s=>s.week===wi).map(s=>s.id);let total=ids.reduce((a,id)=>a+(Number(state.completions[id]?.duration)||0),0);
      total+=state.customWorkouts.filter(x=>x.date>=w.start&&x.date<=w.end).reduce((a,x)=>a+(Number(x.duration)||0),0);
      return {label:`T${wi+1}`,value:total};
    });
  }
  function drawMinutesChart(){drawBars(qs("#minutesChart"),weeklyMinutes(),{suffix:""})}
  function weeklyDistance(key){
    return weeks.map((w,wi)=>{
      const total=allWorkouts().filter(x=>x.date>=w.start&&x.date<=w.end).reduce((a,x)=>a+(Number(x[key])||0),0);
      return {label:`T${wi+1}`,value:key==="swimMeters"?Math.round(total):Number(total.toFixed(2))};
    });
  }
  function drawRunChart(){drawBars(qs("#runChart"),weeklyDistance("distanceKm"),{suffix:""})}
  function drawSwimChart(){drawBars(qs("#swimChart"),weeklyDistance("swimMeters"),{suffix:""})}

  function exportJSON(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});downloadBlob(blob,`spartan-tracker-zaloha-${isoToday()}.json`);
  }
  function exportCSV(){
    const cols=["date","weight","waist","restingHr","sleep","kmTime","hang","pushups","energy","pain","notes"];
    const lines=[cols.join(";"),...state.measurements.map(m=>cols.map(k=>`"${String(m[k]??"").replaceAll('"','""')}"`).join(";"))];
    downloadBlob(new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),`spartan-mereni-${isoToday()}.csv`);
  }
  function exportWorkoutCSV(){
    const cols=["date","type","duration","distanceKm","swimMeters","avgHr","rpe","pain","feeling","equipment","route","notes"];
    const rows=allWorkouts().sort((a,b)=>a.date.localeCompare(b.date));
    const lines=[cols.join(";"),...rows.map(w=>cols.map(k=>`"${String(w[k]??"").replaceAll('"','""')}"`).join(";"))];
    downloadBlob(new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"}),`spartan-treninky-${isoToday()}.csv`);
  }
  function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
  function importJSON(){
    const file=qs("#importFile").files[0];if(!file){toast("Vyber soubor zálohy");return}
    const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.profile||!data.measurements)throw new Error();state={...initialState(),...data};saveState();renderAll();toast("Záloha importována")}catch(e){alert("Soubor není platná záloha Spartan Trackeru.")}};r.readAsText(file);
  }
  function renderAll(){renderDashboard();renderPlan();renderMeasurements();renderExercises();fillProfile()}

  qsa("[data-page]").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));
  qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.go)));
  document.addEventListener("click",e=>{
    const log=e.target.closest("[data-log]");if(log)openWorkout(log.dataset.log);
    const del=e.target.closest("[data-del-measure]");if(del&&confirm("Smazat toto měření?")){state.measurements=state.measurements.filter(m=>m.id!==del.dataset.delMeasure);saveState();renderAll();toast("Měření smazáno")}
    const dw=e.target.closest("[data-del-workout]");if(dw&&confirm("Smazat tento tréninkový záznam?")){if(dw.dataset.planned==="1")delete state.completions[dw.dataset.delWorkout];else state.customWorkouts=state.customWorkouts.filter(w=>w.id!==dw.dataset.delWorkout);saveState();renderAll();toast("Trénink smazán")}
    const wt=e.target.closest(".week-toggle");if(wt){const body=wt.closest(".week").querySelector(".week-sessions");const open=body.style.display!=="none";body.style.display=open?"none":"block";wt.textContent=open?"Zobrazit":"Skrýt"}
  });
  document.addEventListener("change",e=>{
    if(e.target.matches("[data-check]")){
      const id=e.target.dataset.check;
      if(e.target.checked)openWorkout(id);else if(confirm("Označit jednotku jako nesplněnou?")){delete state.completions[id];saveState();renderAll()}else e.target.checked=true;
    }
  });
  qs("#quickLogBtn").addEventListener("click",()=>openWorkout());
  qs("#modalClose").addEventListener("click",closeWorkout);qs("#workoutModal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeWorkout()});
  qs("#workoutForm").addEventListener("submit",handleWorkoutSubmit);qs("#markIncompleteBtn").addEventListener("click",markIncomplete);
  qs("#measurementForm").addEventListener("submit",handleMeasure);qs("#metricSelect").addEventListener("change",drawMetricChart);
  qs("#profileForm").addEventListener("submit",e=>{e.preventDefault();state.profile=Object.fromEntries(new FormData(e.currentTarget).entries());saveState();renderAll();toast("Profil uložen")});
  qs("#exportBtn").addEventListener("click",exportJSON);qs("#csvBtn").addEventListener("click",exportCSV);qs("#workoutCsvBtn").addEventListener("click",exportWorkoutCSV);qs("#importBtn").addEventListener("click",importJSON);
  [qs("#sidebarAuthBtn"),qs("#authTopBtn"),qs("#accountLoginBtn")].forEach(btn=>btn.addEventListener("click",async()=>{if(currentUser){await signOut(auth);toast("Odhlášeno")}else openAuthModal()}));
  qs("#logoutBtn").addEventListener("click",async()=>{if(auth)await signOut(auth)});
  qs("#syncNowBtn").addEventListener("click",()=>pushCloudState(true));
  qs("#authModalClose").addEventListener("click",closeAuthModal);qs("#authModal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeAuthModal()});
  qs("#googleLoginBtn").addEventListener("click",googleLogin);
  qs("#resetBtn").addEventListener("click",()=>{if(confirm("Opravdu vymazat všechna data? Tato akce je nevratná.")){localStorage.removeItem(STORAGE_KEY);localStorage.removeItem("spartanTrackerV1");state=initialState();saveState();renderAll();toast("Data vymazána")}});
  qs("#printBtn").addEventListener("click",()=>window.print());
  qs("#expandAllBtn").addEventListener("click",()=>{qsa(".week-sessions").forEach(x=>x.style.display="block");qsa(".week-toggle").forEach(x=>x.textContent="Skrýt")});
  qsa("#exerciseTabs button").forEach(b=>b.addEventListener("click",()=>{qsa("#exerciseTabs button").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderExercises(b.dataset.filter)}));
  window.addEventListener("resize",()=>{renderDashboard();if(currentPage==="measurements")renderMeasurements()});
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e});
  qs("#installBtn").addEventListener("click",async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}else{qs("#installHelp").style.display="block";qs("#installHelp").scrollIntoView({behavior:"smooth"})}});
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});

  qs("#todayLabel").textContent=new Date().toLocaleDateString("cs-CZ",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  qs("#measurementForm").date.value=isoToday();
  renderAll();
  initFirebase();
})();