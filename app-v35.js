import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

(() => {
  "use strict";
  const STORAGE_KEY = "spartanTrackerFirebaseV2";
  const STATE_VERSION = 3;
  const titles = {dashboard:"Přehled",plan:"Tréninkový plán",measurements:"Měření a grafy",exercises:"Cviky a videa",data:"Data a nastavení"};
  const measurementDates = ["2026-07-26","2026-08-10","2026-08-24","2026-09-07","2026-09-21","2026-10-05"];
  const supplementItems = [
    {key:"creatine1",label:"Kreatin – 1. dávka"},
    {key:"creatine2",label:"Kreatin – 2. dávka"},
    {key:"collagen",label:"Kolagen"},
    {key:"magnesium",label:"Magnezium"},
    {key:"multivitamin",label:"Multivitamin"},
    {key:"cholesterolSupplement",label:"Doplněk na cholesterol"}
  ];

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
      ["2026-08-28","Silový B","Silový trénink B","3 série; guma na přítahy, Bird Dog a Suitcase carry",50,false],
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

    {group:"B",name:"Výstupy na nízký schod",dose:"3× 8 / strana",equipment:"Schod; později KB 4–5 kg",url:"https://www.youtube.com/watch?v=URHdW9js6DM",tips:["Začni nízkým schodem.","Odraz zadní nohy minimalizuj.","Koleno drž v ose chodidla."]},
    {group:"B",name:"Glute bridge s gumou",dose:"3× 12",equipment:"Krátká odporová guma",url:"https://www.youtube.com/results?search_query=banded+glute+bridge+proper+form",tips:["Gumu dej nad kolena.","Zvedej se přes hýždě, ne prohnutím beder.","Nahoře krátce zatni hýždě."]},
    {group:"B",name:"Stahování gumy / přítahy gumy",dose:"3× 8–12",equipment:"Dlouhá odporová guma",url:"https://www.youtube.com/results?search_query=resistance+band+lat+pulldown+proper+form",tips:["Gumu bezpečně ukotvi.","Ramena drž dál od uší.","Pohyb kontroluj i při návratu."]},
    {group:"B",name:"Tlak kettlebellu nad hlavu",dose:"3× 8 / strana",equipment:"KB 4 nebo 5 kg",url:"https://www.youtube.com/results?search_query=single+arm+kettlebell+overhead+press+proper+form",tips:["Žebra drž pod kontrolou.","Netlač přes bolest ramene.","Začni lehčí vahou."]},
    {group:"B",name:"Bird Dog",dose:"3× 8 / strana",equipment:"Podložka; bez dalšího vybavení",url:"https://www.youtube.com/watch?v=ZdAHe9_HeEw",tips:["Zvedej současně opačnou ruku a nohu.","Nenech bedra prohýbat ani pánev rotovat.","Na konci pohybu krátce zastav."]},
    {group:"B",name:"Suitcase carry / kettlebell hold",dose:"4× 30–40 s / strana",equipment:"Kettlebell 5 nebo 8 kg",url:"https://www.youtube.com/watch?v=jKnLY_MXIoA",tips:["Drž se vzpřímeně a nenakláněj se k zátěži.","Když nemáš prostor, pochoduj na místě nebo drž kettlebell staticky.","Střídej pravou a levou stranu."]},

    {group:"C",name:"McGill curl-up",dose:"3× 5 / strana, výdrž 8–10 s",equipment:"Podložka; bez vybavení",url:"https://www.youtube.com/watch?v=vLpHJ1Cxj6k",tips:["Jedna noha je pokrčená, druhá natažená.","Zvedni jen hlavu a ramena bez kulacení beder.","Každé opakování drž klidně, nešvihej trupem."]},
    {group:"C",name:"Reverse crunch",dose:"3× 8–12",equipment:"Podložka; bez vybavení",url:"https://www.youtube.com/watch?v=hQ1QoEOojM0",tips:["Pánev zvedej silou břicha, ne švihem nohou.","Pohyb drž krátký a kontrolovaný.","Bedra při návratu nepouštěj do výrazného prohnutí."]},
    {group:"C",name:"Plank na předloktích",dose:"3× 20–40 s",equipment:"Podložka; bez vybavení",url:"https://www.youtube.com/watch?v=mwlp75MS6Rg",tips:["Tělo drž v jedné linii.","Zatni hýždě a lehce podsad pánev.","Sérii ukonči dříve, než se začne propadat technika."]},
    {group:"C",name:"Boční plank",dose:"3× 15–30 s / strana",equipment:"Podložka; bez vybavení",url:"https://www.youtube.com/watch?v=44ND4bOB-T0",tips:["Loket drž přímo pod ramenem.","Lehčí varianta je s oporou o kolena.","Boky drž vysoko bez rotace trupu."]},
    {group:"C",name:"Plank s dotykem ramen",dose:"3× 6–10 / strana",equipment:"Podložka; bez vybavení",url:"https://www.youtube.com/watch?v=0PrTUpElJ44",tips:["Rozkroč nohy více pro snazší stabilitu.","Pánev se má pohybovat co nejméně.","Dotýkej se ramene pomalu, bez přenášení váhy švihem."]},
    {group:"C",name:"Bear crawl",dose:"4× 8–12 m nebo 20 s",equipment:"Volný prostor; bez vybavení",url:"https://www.youtube.com/watch?v=lRolga8vTyc",tips:["Kolena drž jen několik centimetrů nad zemí.","Pohybuj opačnou rukou a nohou současně.","Začni krátkými úseky a drž rovná záda."]},

    {group:"D",name:"Shyb s dopomocí gumy",dose:"3× 4–8",equipment:"Hrazda + podpůrná guma",url:"https://www.youtube.com/watch?v=B_VkNQS5YLs",tips:["Gumu bezpečně upevni a nastupuj přes stupínek.","Začni stažením lopatek, ne záklonem hlavy.","Použij tak silnou gumu, abys zvládl čistá opakování."]},
    {group:"D",name:"Australský přítah / inverted row",dose:"3× 6–10",equipment:"Nízká hrazda",url:"https://www.youtube.com/watch?v=Fl0UMfdEzsE",tips:["Čím vzpřímenější tělo, tím lehčí varianta.","Tělo drž pevné od hlavy k patám.","Táhni hrudník směrem k hrazdě."]},
    {group:"D",name:"Dip s dopomocí gumy",dose:"3× 5–8",equipment:"Bradelní konstrukce + podpůrná guma",url:"https://www.youtube.com/watch?v=5-mYIBU5IDk",tips:["Ramena drž dole a pohyb kontroluj.","Neklesej hlouběji, než dovolí bezbolestný rozsah.","Pokud je upevnění gumy nejisté, nahraď cvik kliky o vysokou hrazdu."]},
    {group:"D",name:"Výstupy na lavičku",dose:"3× 8 / strana",equipment:"Nízká stabilní lavička",url:"https://www.youtube.com/watch?v=URHdW9js6DM",tips:["Celé chodidlo polož na lavičku.","Nevytlačuj se výrazně zadní nohou.","Výšku zvol tak, aby koleno zůstalo stabilní."]},
    {group:"D",name:"Face pull s gumou",dose:"3× 12–15",equipment:"Dlouhá guma ukotvená k hrazdě",url:"https://www.youtube.com/watch?v=PYj77in44ms",tips:["Gumu ukotvi přibližně ve výšce obličeje.","Táhni ruce k obličeji a lokty drž výše.","Ramena nezvedej k uším a neprohýbej bedra."]},
    {group:"D",name:"Švihadlo – základní přeskok",dose:"6× 30–45 s, pauza 30–45 s",equipment:"Švihadlo",url:"https://www.youtube.com/watch?v=Y3wzaWE9QRY",tips:["Skákej nízko a dopadej měkce.","Lano roztáčej hlavně zápěstím.","Začni bez dvojskoků a klidně střídej přeskok s chůzí."]},

    {group:"WR",name:"3min rozcvička před během – Fleet Feet",dose:"3 min · follow-along",equipment:"Bez vybavení",url:"https://www.youtube.com/watch?v=hYj0wsLEF7I",tips:["Krátká dynamická aktivace před lehkým během nebo během–chůzí.","Obsahuje švihy nohou, dřepy a mobilitu ramen.","Začni pomalu a postupně zvětšuj rozsah pohybu."]},
    {group:"WR",name:"5min dynamická rozcvička před během – Run and Stretch",dose:"5 min · follow-along",equipment:"Bez vybavení",url:"https://www.youtube.com/watch?v=hmV1csq5oE8",tips:["Dynamická mobilita kyčlí, nohou a kotníků.","Vhodná před běžeckou nebo terénní jednotkou.","Nejde o statické protažení; pohyby drž kontrolované."]},
    {group:"WS",name:"5min rozcvička před silovým tréninkem – Kaleigh Cohen Strength",dose:"5 min · follow-along",equipment:"Bez vybavení nebo velmi lehká zátěž",url:"https://www.youtube.com/watch?v=kNLCnNHN238",tips:["Celotělová dynamická rozcvička před silovým tréninkem.","Na konci může použít lehkou zátěž; u tebe klidně jen KB 4 kg nebo bez ní.","Potom ještě udělej jednu lehkou přípravnou sérii prvního hlavního cviku."]},
    {group:"WS",name:"5min full-body warm-up – Caroline Girvan",dose:"5 min · follow-along",equipment:"Bez vybavení",url:"https://www.youtube.com/watch?v=c0VxUFHdYzs",tips:["Krátké celotělové zahřátí před A, B, C nebo D.","Pohyby přizpůsob rozsahu, který je příjemný.","Před těžším cvikem navazuj lehčí přípravnou sérií daného pohybu."]}
  ];

  const initialState = () => ({
    version:STATE_VERSION,
    profile:{name:"",startDate:"2026-07-26",raceDate:"2026-10-10",goal:"Liberec Super 2027"},
    completions:{},
    customWorkouts:[],
    measurements:[],
    supplements:{},
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

  function hasValue(value){
    return value!=="" && value!==null && value!==undefined && !(typeof value==="number" && Number.isNaN(value));
  }
  function sleepMinutesFrom(record){
    if(hasValue(record?.sleepMinutes))return Math.round(Number(record.sleepMinutes));
    if(hasValue(record?.sleep))return Math.round(Number(record.sleep)*60);
    return null;
  }
  function migrateMeasurements(records=[]){
    const byDate=new Map();
    [...records].sort((a,b)=>(a.date||"").localeCompare(b.date||"")).forEach(record=>{
      if(!record?.date)return;
      const target=byDate.get(record.date)||{id:`d-${record.date}`,date:record.date};
      ["weight","waist","restingHr","systolicBp","diastolicBp","kmTime","hang","pushups","energy","pain","notes"].forEach(key=>{
        if(hasValue(record[key]))target[key]=record[key];
      });
      const mins=sleepMinutesFrom(record);
      if(mins!==null)target.sleepMinutes=mins;
      target.updatedAt=record.updatedAt||target.updatedAt||new Date().toISOString();
      byDate.set(record.date,target);
    });
    return [...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  function normalizeState(value){
    const base=initialState();
    const normalized={...base,...(value||{}),version:STATE_VERSION,profile:{...base.profile,...(value?.profile||{})},completions:value?.completions||{},customWorkouts:value?.customWorkouts||[],measurements:migrateMeasurements(value?.measurements||[]),supplements:value?.supplements||{}};
    return normalized;
  }
  function loadState(){
    try{
      const raw=localStorage.getItem(STORAGE_KEY)||localStorage.getItem("spartanTrackerV1");
      return raw?normalizeState(JSON.parse(raw)):initialState();
    }catch(e){return initialState();}
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
  function formatSleep(minutes){
    if(!hasValue(minutes))return "—";
    const total=Math.max(0,Math.round(Number(minutes)));
    return `${Math.floor(total/60)} h ${String(total%60).padStart(2,"0")} min`;
  }
  function sleepAxis(minutes){
    if(!Number.isFinite(Number(minutes)))return "—";
    const total=Math.round(Number(minutes));
    return `${Math.floor(total/60)}:${String(total%60).padStart(2,"0")}`;
  }
  function findMeasurement(date){return state.measurements.find(m=>m.date===date)||null}
  function upsertMeasurement(date,patch){
    let record=findMeasurement(date);
    if(!record){record={id:`d-${date}`,date};state.measurements.push(record);}
    Object.entries(patch).forEach(([key,value])=>{if(hasValue(value))record[key]=value;});
    record.updatedAt=new Date().toISOString();
    state.measurements=migrateMeasurements(state.measurements);
    saveState();
  }
  function dateRange(endIso,count){
    const result=[];const end=parseDate(endIso);
    for(let i=count-1;i>=0;i--){const d=new Date(end);d.setDate(d.getDate()-i);result.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`);}
    return result;
  }
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
    if(page==="measurements"){
      initMeasureFormDates();
      renderMeasurements();
    }
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
    const last7Dates=new Set(dateRange(today,7));
    const sleepsWeek=ms.filter(m=>last7Dates.has(m.date)&&hasValue(m.sleepMinutes)).map(m=>Number(m.sleepMinutes)).filter(Number.isFinite);
    const sleepsAll=ms.filter(m=>hasValue(m.sleepMinutes)).map(m=>Number(m.sleepMinutes)).filter(Number.isFinite);
    qs("#sleepMetric").textContent=sleepsWeek.length?formatSleep(Math.round(sleepsWeek.reduce((a,b)=>a+b,0)/sleepsWeek.length)):"—";
    qs("#sleepHint").textContent=sleepsAll.length?`Celkový průměr: ${formatSleep(Math.round(sleepsAll.reduce((a,b)=>a+b,0)/sleepsAll.length))}`:"Celkový průměr: —";

    const future=plan.filter(s=>s.date>=today&&!completedSession(s.id)).slice(0,5);
    const upcoming=future.length?future:plan.filter(s=>!completedSession(s.id)).slice(-5);
    qs("#upcomingList").innerHTML=upcoming.length?upcoming.map(s=>`
      <div class="session-row">
        <div class="session-date"><strong>${parseDate(s.date).getDate()}</strong>${parseDate(s.date).toLocaleDateString("cs-CZ",{month:"short"})}</div>
        <div class="session-info"><strong>${esc(s.title)}</strong><small>${esc(s.details)}</small></div>
        <span class="tag ${sessionClass(s.type)}">${esc(s.type)}</span>
      </div>`).join(""):`<div class="empty">Všechny plánované jednotky jsou splněné.</div>`;

    renderSupplementChecklist();
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

  function initMeasureFormDates(){
    const today=isoToday();
    ["sleepForm","weightForm","pressureForm","dailyStatusForm","performanceForm"].forEach(id=>{
      const form=qs(`#${id}`);
      const dateInput=form?.querySelector('[name="date"]');
      if(dateInput)dateInput.value=today;
    });
  }
  function populateMeasureForm(formId){
    const form=qs(`#${formId}`);if(!form)return;
    const dateInput=form.querySelector('[name="date"]');const record=findMeasurement(dateInput?.value||isoToday());
    if(formId==="sleepForm"){
      const mins=record?.sleepMinutes;
      form.sleepHours.value=hasValue(mins)?Math.floor(Number(mins)/60):"";
      form.sleepMins.value=hasValue(mins)?Number(mins)%60:"";
      qs("#sleepLastValue").textContent=record&&hasValue(mins)?`Uloženo pro tento den: ${formatSleep(mins)}`:"Pro tento den zatím spánek není uložen.";
    }
    if(formId==="weightForm"){
      form.weight.value=record&&hasValue(record.weight)?record.weight:"";
      qs("#weightLastValue").textContent=record&&hasValue(record.weight)?`Uloženo pro tento den: ${Number(record.weight).toFixed(1)} kg`:"Pro tento den zatím váha není uložená.";
    }
    if(formId==="pressureForm"){
      form.systolicBp.value=record&&hasValue(record.systolicBp)?record.systolicBp:"";
      form.diastolicBp.value=record&&hasValue(record.diastolicBp)?record.diastolicBp:"";
      const hasBp=record&&hasValue(record.systolicBp)&&hasValue(record.diastolicBp);
      qs("#pressureLastValue").textContent=hasBp?`Uloženo pro tento den: ${Math.round(Number(record.systolicBp))}/${Math.round(Number(record.diastolicBp))} mmHg`:"Pro tento den zatím tlak není uložen.";
    }
    if(formId==="dailyStatusForm"){
      ["restingHr","energy","pain","notes"].forEach(k=>form[k].value=record&&hasValue(record[k])?record[k]:"");
    }
    if(formId==="performanceForm"){
      ["waist","kmTime","hang","pushups"].forEach(k=>form[k].value=record&&hasValue(record[k])?record[k]:"");
    }
  }
  function renderMeasurements(){
    initMeasureFormDates();
    ["sleepForm","weightForm","pressureForm","dailyStatusForm","performanceForm"].forEach(populateMeasureForm);
    const arr=[...state.measurements].sort((a,b)=>b.date.localeCompare(a.date));
    qs("#measurementTable").innerHTML=arr.length?arr.map(m=>`<tr>
      <td>${fmtDate(m.date)}</td><td>${hasValue(m.weight)?Number(m.weight).toFixed(1):"—"}</td><td>${hasValue(m.waist)?m.waist:"—"}</td>
      <td>${hasValue(m.systolicBp)&&hasValue(m.diastolicBp)?`${Math.round(Number(m.systolicBp))}/${Math.round(Number(m.diastolicBp))}`:"—"}</td>
      <td>${hasValue(m.restingHr)?m.restingHr:"—"}</td><td>${formatSleep(m.sleepMinutes)}</td><td>${hasValue(m.kmTime)?m.kmTime:"—"}</td>
      <td>${hasValue(m.hang)?m.hang:"—"}</td><td>${hasValue(m.pushups)?m.pushups:"—"}</td><td>${hasValue(m.energy)?m.energy:"—"}</td>
      <td>${hasValue(m.pain)?m.pain:"—"}</td><td class="history-note">${esc(m.notes||"")}</td>
      <td><button class="btn small danger" data-del-measure="${m.id}">Smazat den</button></td></tr>`).join(""):`<tr><td colspan="13" class="empty">Zatím není uložené žádné měření.</td></tr>`;
    renderSupplementHistory();
    drawMetricChart();drawMinutesChart();drawRunChart();drawSwimChart();
  }

  const exerciseIntros = {
    all:"Tréninky A a B zůstávají základem plánu. C je domácí alternativa zaměřená na břicho a stabilitu středu; D je venkovní alternativa pro workoutové hřiště. Tréninky C a D nejsou automaticky vloženy do kalendáře.",
    A:"Domácí full-body základ: nohy, kyčelní ohyb, tlak, přítah, přenášení a stabilita středu. Obvykle 2–3 série, pauza 60–90 sekund.",
    B:"Domácí full-body alternativa bez visu a Pallof pressu. Bird Dog rozvíjí kontrolu trupu, Suitcase carry nebo kettlebell hold úchop a odolnost proti úklonu.",
    C:"Core-dominant domácí alternativa. Pro přípravu na Spartan ji používej zpravidla nejvýše jednou týdně místo A nebo B, aby v týdnu zůstala práce nohou a přítahů.",
    D:"Venkovní full-body alternativa na workoutovém hřišti. Použij podpůrnou gumu, která dovolí čistou techniku; mezi silovými sériemi odpočívej 75–120 sekund.",
    WR:"Krátké 3–5minutové dynamické rozcvičky před během. Po videu začni první minuty běhu opravdu lehce.",
    WS:"Krátké 5minutové rozcvičky před silovým tréninkem. U prvního hlavního cviku na ně navazuj lehkou přípravnou sérií."
  };

  function renderExercises(filter="all"){
    const list=exercises.filter(e=>filter==="all"||e.group===filter);
    const intro=qs("#exerciseIntro");if(intro)intro.textContent=exerciseIntros[filter]||exerciseIntros.all;
    qs("#exerciseGrid").innerHTML=list.map((e,i)=>`<article class="card exercise">
      <div class="ex-number">${e.group==="WR"?"BĚH":e.group==="WS"?"SÍLA":e.group}</div><h3>${esc(e.name)}</h3><p><strong>${esc(e.dose)}</strong><br><span style="color:var(--muted)">${esc(e.equipment||"")}</span></p>
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

  function handleSleep(e){
    e.preventDefault();const form=e.currentTarget;
    const hours=form.sleepHours.value===""?0:Number(form.sleepHours.value);
    const minutes=form.sleepMins.value===""?0:Number(form.sleepMins.value);
    if(hours===0&&minutes===0){toast("Vyplň délku spánku");return;}
    upsertMeasurement(form.date.value,{sleepMinutes:hours*60+minutes});
    renderAll();toast("Spánek uložen");
  }
  function handleWeight(e){
    e.preventDefault();const form=e.currentTarget;
    upsertMeasurement(form.date.value,{weight:Number(form.weight.value)});
    renderAll();toast("Váha uložena");
  }
  function handlePressure(e){
    e.preventDefault();const form=e.currentTarget;
    const systolic=Number(form.systolicBp.value),diastolic=Number(form.diastolicBp.value);
    if(!Number.isFinite(systolic)||!Number.isFinite(diastolic)){toast("Vyplň systolický i diastolický tlak");return;}
    upsertMeasurement(form.date.value,{systolicBp:systolic,diastolicBp:diastolic});
    renderAll();toast("Krevní tlak uložen");
  }
  function handleDailyStatus(e){
    e.preventDefault();const form=e.currentTarget;const patch={};
    ["restingHr","energy","pain"].forEach(k=>{if(form[k].value!=="")patch[k]=Number(form[k].value)});
    if(form.notes.value.trim())patch.notes=form.notes.value.trim();
    if(!Object.keys(patch).length){toast("Vyplň alespoň jednu hodnotu");return;}
    upsertMeasurement(form.date.value,patch);renderAll();toast("Denní stav uložen");
  }
  function handlePerformance(e){
    e.preventDefault();const form=e.currentTarget;const patch={};
    ["waist","kmTime","hang","pushups"].forEach(k=>{if(form[k].value!=="")patch[k]=Number(form[k].value)});
    if(!Object.keys(patch).length){toast("Vyplň alespoň jednu hodnotu");return;}
    upsertMeasurement(form.date.value,patch);renderAll();toast("Kontrolní hodnoty uloženy");
  }

  function fillProfile(){
    const f=qs("#profileForm");Object.entries(state.profile).forEach(([k,v])=>{if(f.elements[k])f.elements[k].value=v||""});
  }

  function niceTicks(min,max,count=4){
    if(min===max){const pad=Math.max(1,Math.abs(min)*.05);min-=pad;max+=pad;}
    const range=max-min;
    const rough=range/count;
    const pow=Math.pow(10,Math.floor(Math.log10(Math.max(rough,0.0001))));
    const norm=rough/pow;
    const step=(norm<=1?1:norm<=2?2:norm<=5?5:10)*pow;
    const start=Math.floor(min/step)*step,end=Math.ceil(max/step)*step;
    const ticks=[];for(let v=start;v<=end+step*.1;v+=step)ticks.push(Number(v.toFixed(8)));
    return {min:start,max:end,ticks};
  }
  function chartEmpty(host,text="Zatím není dost dat"){host.innerHTML=`<div class="chart-empty">${esc(text)}</div>`}
  function lineChart(host,points,{formatY=v=>String(v),formatPoint=v=>String(v),referenceLines=[]}={}){
    if(!host)return;
    if(!points.length){chartEmpty(host);return;}
    const W=760,H=280,p={l:68,r:24,t:22,b:46};
    const values=points.map(x=>Number(x.value)).filter(Number.isFinite);
    const refs=referenceLines.map(x=>Number(x.value)).filter(Number.isFinite);
    if(!values.length){chartEmpty(host);return;}
    const scale=niceTicks(Math.min(...values,...refs),Math.max(...values,...refs),4);
    const x=i=>points.length===1?(p.l+W-p.r)/2:p.l+(W-p.l-p.r)*i/(points.length-1);
    const y=v=>p.t+(scale.max-v)/(scale.max-scale.min)*(H-p.t-p.b);
    const grid=scale.ticks.map(v=>`<g><line x1="${p.l}" y1="${y(v)}" x2="${W-p.r}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${p.l-10}" y="${y(v)+4}" text-anchor="end" fill="#718096" font-size="12">${esc(formatY(v))}</text></g>`).join("");
    const refsSvg=referenceLines.map(ref=>`<g><line x1="${p.l}" y1="${y(Number(ref.value))}" x2="${W-p.r}" y2="${y(Number(ref.value))}" stroke="${ref.color||'#d98d1d'}" stroke-width="2.5" stroke-dasharray="8 6"/><text x="${W-p.r-4}" y="${y(Number(ref.value))-7}" text-anchor="end" fill="${ref.color||'#a45c00'}" font-size="11" font-weight="700">${esc(ref.label||formatPoint(Number(ref.value)))}</text></g>`).join("");
    const step=Math.max(1,Math.ceil(points.length/6));
    const xlabels=points.map((pt,i)=>(i%step===0||i===points.length-1)?`<text x="${x(i)}" y="${H-14}" text-anchor="middle" fill="#718096" font-size="12">${esc(pt.label)}</text>`:"").join("");
    const path=points.map((pt,i)=>`${i?"L":"M"} ${x(i).toFixed(1)} ${y(Number(pt.value)).toFixed(1)}`).join(" ");
    const dots=points.map((pt,i)=>`<circle cx="${x(i)}" cy="${y(Number(pt.value))}" r="5" fill="#fff" stroke="#ef5b4c" stroke-width="3"><title>${esc(pt.label)}: ${esc(formatPoint(Number(pt.value)))}</title></circle>`).join("");
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vývoj hodnot">${grid}${refsSvg}<path d="${path}" fill="none" stroke="#ef5b4c" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${dots}${xlabels}</svg>`;
  }
  function barChart(host,points,{formatY=v=>String(Math.round(v)),formatPoint=v=>String(v),goal=null,colorByGoal=false}={}){
    if(!host)return;
    if(!points.length){chartEmpty(host);return;}
    const W=760,H=280,p={l:62,r:20,t:22,b:48};
    const maxValue=Math.max(1,...points.map(x=>Number(x.value)||0),goal||0);
    const scale=niceTicks(0,maxValue,4);
    const plotWidth=W-p.l-p.r;
    const slot=plotWidth/points.length;
    const bw=Math.max(16,Math.min(76,slot*.62));
    const y=v=>p.t+(scale.max-v)/(scale.max-scale.min)*(H-p.t-p.b);
    const grid=scale.ticks.map(v=>`<g><line x1="${p.l}" y1="${y(v)}" x2="${W-p.r}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${p.l-10}" y="${y(v)+4}" text-anchor="end" fill="#718096" font-size="12">${esc(formatY(v))}</text></g>`).join("");
    const goalLine=goal!==null?`<line x1="${p.l}" y1="${y(goal)}" x2="${W-p.r}" y2="${y(goal)}" stroke="#d98d1d" stroke-width="2" stroke-dasharray="7 6"><title>Cíl ${goal}</title></line>`:"";
    const bars=points.map((pt,i)=>{
      const val=Number(pt.value)||0,x=p.l+i*slot+(slot-bw)/2,top=y(val),height=Math.max(0,H-p.b-top);
      const fill=colorByGoal?(val>=Number(goal||3)?"#1f9d72":"#ef5b4c"):"#1f9d72";
      return `<rect x="${x}" y="${top}" width="${bw}" height="${height}" rx="7" fill="${fill}"><title>${esc(pt.label)}: ${esc(formatPoint(val))}</title></rect><text x="${x+bw/2}" y="${H-16}" text-anchor="middle" fill="#718096" font-size="12">${esc(pt.label)}</text>`;
    }).join("");
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Sloupcový graf">${grid}${goalLine}${bars}</svg>`;
  }
  function currentWeekSeries(values){
    const maxIndex=Math.max(0,Math.min(currentWeekIndex(),values.length-1));
    return values.slice(0,maxIndex+1);
  }
  function drawWeightMini(){
    const pts=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)).filter(m=>hasValue(m.weight)&&Number.isFinite(Number(m.weight))).slice(-12).map(m=>({label:fmtDate(m.date,{day:"numeric",month:"numeric"}),value:Number(m.weight)}));
    lineChart(qs("#weightMiniChart"),pts,{formatY:v=>`${v.toFixed(1)}`,formatPoint:v=>`${v.toFixed(1)} kg`});
  }
  function weeklyStats(){
    return weeks.map((w,wi)=>({label:`T${wi+1}`,value:plan.filter(s=>s.week===wi&&!s.optional&&completedSession(s.id)).length}));
  }
  function drawWeekly(){barChart(qs("#weeklyChart"),currentWeekSeries(weeklyStats()),{goal:3,colorByGoal:true,formatPoint:v=>`${v} splněné`})}
  function bloodPressureChart(host,measurements){
    if(!host)return;
    const points=[...measurements]
      .sort((a,b)=>a.date.localeCompare(b.date))
      .filter(m=>(hasValue(m.systolicBp)&&Number.isFinite(Number(m.systolicBp)))||(hasValue(m.diastolicBp)&&Number.isFinite(Number(m.diastolicBp))));
    if(!points.length){chartEmpty(host,"Zatím není uložen žádný krevní tlak");return;}

    const W=760,H=300,p={l:68,r:24,t:42,b:48};
    const vals=points.flatMap(m=>[Number(m.systolicBp),Number(m.diastolicBp)]).filter(Number.isFinite);
    const scale=niceTicks(Math.min(50,...vals),Math.max(145,...vals),5);
    const x=i=>points.length===1?(p.l+W-p.r)/2:p.l+(W-p.l-p.r)*i/(points.length-1);
    const y=v=>p.t+(scale.max-v)/(scale.max-scale.min)*(H-p.t-p.b);
    const grid=scale.ticks.map(v=>`<g><line x1="${p.l}" y1="${y(v)}" x2="${W-p.r}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${p.l-10}" y="${y(v)+4}" text-anchor="end" fill="#718096" font-size="12">${Math.round(v)}</text></g>`).join("");

    const band=(low,high,label)=>`<g>
      <rect x="${p.l}" y="${y(high)}" width="${W-p.l-p.r}" height="${Math.max(1,y(low)-y(high))}" fill="#48bb78" opacity=".10"/>
      <text x="${W-p.r-6}" y="${y(high)+14}" text-anchor="end" fill="#2f855a" font-size="11">${label}</text>
    </g>`;
    const bands=band(90,119,"SYS 90–119")+band(60,79,"DIA 60–79");

    const step=Math.max(1,Math.ceil(points.length/6));
    const xlabels=points.map((pt,i)=>(i%step===0||i===points.length-1)?`<text x="${x(i)}" y="${H-15}" text-anchor="middle" fill="#718096" font-size="12">${esc(fmtDate(pt.date,{day:"numeric",month:"numeric"}))}</text>`:"").join("");

    function series(key,color,label){
      const available=points.map((pt,i)=>({pt,i,value:Number(pt[key])})).filter(x=>Number.isFinite(x.value));
      if(!available.length)return "";
      let path="";
      let previousIndex=null;
      available.forEach((item,j)=>{
        if(previousIndex===null||item.i!==previousIndex+1)path+=`${path?" ":""}M ${x(item.i).toFixed(1)} ${y(item.value).toFixed(1)}`;
        else path+=` L ${x(item.i).toFixed(1)} ${y(item.value).toFixed(1)}`;
        previousIndex=item.i;
      });
      const dots=available.map(item=>`<circle cx="${x(item.i)}" cy="${y(item.value)}" r="4.5" fill="#fff" stroke="${color}" stroke-width="3"><title>${esc(fmtDate(item.pt.date))}: ${Math.round(item.value)} mmHg</title></circle>`).join("");
      return `<path d="${path}" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>${dots}`;
    }

    const legend=`<g font-size="12" font-weight="700">
      <line x1="${p.l}" y1="18" x2="${p.l+22}" y2="18" stroke="#ef5b4c" stroke-width="4"/><text x="${p.l+28}" y="22" fill="#4a5568">Systolický</text>
      <line x1="${p.l+125}" y1="18" x2="${p.l+147}" y2="18" stroke="#3182ce" stroke-width="4"/><text x="${p.l+153}" y="22" fill="#4a5568">Diastolický</text>
    </g>`;
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Vývoj krevního tlaku">${bands}${grid}${series("systolicBp","#ef5b4c","Systolický")}${series("diastolicBp","#3182ce","Diastolický")}${xlabels}${legend}</svg>`;
  }

  function restingHrTrendChart(host,measurements){
    if(!host)return;
    const points=[...measurements]
      .sort((a,b)=>a.date.localeCompare(b.date))
      .filter(m=>hasValue(m.restingHr)&&Number.isFinite(Number(m.restingHr)))
      .map(m=>({date:m.date,label:fmtDate(m.date,{day:"numeric",month:"numeric"}),value:Number(m.restingHr)}));
    if(!points.length){chartEmpty(host,"Zatím není uložená klidová TF");return;}

    const avg=points.reduce((sum,p)=>sum+p.value,0)/points.length;
    const rolling=points.map((p,i)=>{
      const start=Math.max(0,i-4),slice=points.slice(start,i+1);
      return {...p,trend:slice.reduce((sum,x)=>sum+x.value,0)/slice.length};
    });
    const W=760,H=300,p={l:68,r:24,t:42,b:48};
    const values=[...points.map(p=>p.value),...rolling.map(p=>p.trend),avg];
    const scale=niceTicks(Math.min(...values),Math.max(...values),5);
    const x=i=>points.length===1?(p.l+W-p.r)/2:p.l+(W-p.l-p.r)*i/(points.length-1);
    const y=v=>p.t+(scale.max-v)/(scale.max-scale.min)*(H-p.t-p.b);
    const grid=scale.ticks.map(v=>`<g><line x1="${p.l}" y1="${y(v)}" x2="${W-p.r}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${p.l-10}" y="${y(v)+4}" text-anchor="end" fill="#718096" font-size="12">${Math.round(v)}</text></g>`).join("");
    const avgLine=`<g><line x1="${p.l}" y1="${y(avg)}" x2="${W-p.r}" y2="${y(avg)}" stroke="#d98d1d" stroke-width="2.5" stroke-dasharray="8 6"/><text x="${W-p.r-4}" y="${y(avg)-7}" text-anchor="end" fill="#a45c00" font-size="11" font-weight="700">Dlouhodobý průměr ${avg.toFixed(1)}</text></g>`;
    const rawPath=points.map((pt,i)=>`${i?"L":"M"} ${x(i).toFixed(1)} ${y(pt.value).toFixed(1)}`).join(" ");
    const trendPath=rolling.map((pt,i)=>`${i?"L":"M"} ${x(i).toFixed(1)} ${y(pt.trend).toFixed(1)}`).join(" ");
    const dots=points.map((pt,i)=>{
      const above=pt.value>avg+.05,below=pt.value<avg-.05;
      const stroke=above?"#dd6b20":below?"#3182ce":"#718096";
      const relation=above?"nad průměrem":below?"pod průměrem":"na průměru";
      return `<circle cx="${x(i)}" cy="${y(pt.value)}" r="5" fill="#fff" stroke="${stroke}" stroke-width="3"><title>${esc(pt.label)}: ${Math.round(pt.value)} tepů/min (${relation})</title></circle>`;
    }).join("");
    const step=Math.max(1,Math.ceil(points.length/6));
    const xlabels=points.map((pt,i)=>(i%step===0||i===points.length-1)?`<text x="${x(i)}" y="${H-15}" text-anchor="middle" fill="#718096" font-size="12">${esc(pt.label)}</text>`:"").join("");
    const legend=`<g font-size="11" font-weight="700"><line x1="${p.l}" y1="18" x2="${p.l+22}" y2="18" stroke="#ef5b4c" stroke-width="3"/><text x="${p.l+28}" y="22" fill="#4a5568">Denní TF</text><line x1="${p.l+100}" y1="18" x2="${p.l+122}" y2="18" stroke="#3182ce" stroke-width="4"/><text x="${p.l+128}" y="22" fill="#4a5568">5 měření – trend</text></g>`;
    host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Klidová tepová frekvence vůči dlouhodobému průměru">${grid}${avgLine}<path d="${rawPath}" fill="none" stroke="#ef5b4c" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity=".62"/><path d="${trendPath}" fill="none" stroke="#3182ce" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${dots}${xlabels}${legend}</svg>`;
  }

  function drawMetricChart(){
    const key=qs("#metricSelect").value;
    const refNote=qs("#metricReferenceNote");
    if(key==="bloodPressure"){
      if(refNote)refNote.innerHTML=`<strong>Orientační kontrola:</strong> AHA uvádí normální krevní tlak jako méně než 120/80 mmHg. Hodnoty pod 90/60 mmHg se běžně označují jako nízký tlak. Zelená pásma v grafu proto pouze prakticky zvýrazňují 90–119 mmHg systolicky a 60–79 mmHg diastolicky; nejde o diagnózu ani individuální léčebný cíl.`;
      bloodPressureChart(qs("#metricChart"),state.measurements);
      return;
    }
    if(key==="restingHr"){
      const vals=[...state.measurements].filter(m=>hasValue(m.restingHr)&&Number.isFinite(Number(m.restingHr))).map(m=>Number(m.restingHr));
      const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:null;
      if(refNote)refNote.innerHTML=avg!==null?`<strong>Dlouhodobý průměr:</strong> ${avg.toFixed(1)} tepů/min. Oranžový bod je nad tvým dlouhodobým průměrem, modrý pod ním. Modrá křivka je klouzavý průměr z posledních až 5 měření; jde o trend, ne zdravotní hranici.`:"";
      restingHrTrendChart(qs("#metricChart"),state.measurements);
      return;
    }
    if(refNote)refNote.textContent="";
    const config={
      weight:{axis:v=>v.toFixed(1),point:v=>`${v.toFixed(1)} kg`},
      waist:{axis:v=>v.toFixed(0),point:v=>`${v.toFixed(1)} cm`},
      restingHr:{axis:v=>Math.round(v),point:v=>`${Math.round(v)} tepů/min`},
      sleepMinutes:{axis:sleepAxis,point:formatSleep},
      kmTime:{axis:v=>v.toFixed(1),point:v=>`${v.toFixed(2)} min`},
      hang:{axis:v=>Math.round(v),point:v=>`${Math.round(v)} s`},
      pushups:{axis:v=>Math.round(v),point:v=>`${Math.round(v)}`},
      energy:{axis:v=>v.toFixed(0),point:v=>`${v}/5`},
      pain:{axis:v=>v.toFixed(0),point:v=>`${v}/10`}
    }[key];
    const pts=[...state.measurements].sort((a,b)=>a.date.localeCompare(b.date)).filter(m=>hasValue(m[key])&&Number.isFinite(Number(m[key]))).map(m=>({label:fmtDate(m.date,{day:"numeric",month:"numeric"}),value:Number(m[key])}));
    if(key==="sleepMinutes"){
      if(refNote)refNote.innerHTML=`Přerušovaná čára označuje tvůj referenční cíl <strong>7 h</strong>.`;
      lineChart(qs("#metricChart"),pts,{formatY:config.axis,formatPoint:config.point,referenceLines:[{value:420,label:"7 h – cíl"}]});
    }else{
      lineChart(qs("#metricChart"),pts,{formatY:config.axis,formatPoint:config.point});
    }
  }
  function weeklyMinutes(){
    return weeks.map((w,wi)=>{
      const ids=plan.filter(s=>s.week===wi).map(s=>s.id);let total=ids.reduce((a,id)=>a+(Number(state.completions[id]?.duration)||0),0);
      total+=state.customWorkouts.filter(x=>x.date>=w.start&&x.date<=w.end).reduce((a,x)=>a+(Number(x.duration)||0),0);
      return {label:`T${wi+1}`,value:total};
    });
  }
  function drawMinutesChart(){barChart(qs("#minutesChart"),currentWeekSeries(weeklyMinutes()),{formatPoint:v=>`${Math.round(v)} min`})}
  function weeklyDistance(key){
    return weeks.map((w,wi)=>{
      const total=allWorkouts().filter(x=>x.date>=w.start&&x.date<=w.end).reduce((a,x)=>a+(Number(x[key])||0),0);
      return {label:`T${wi+1}`,value:key==="swimMeters"?Math.round(total):Number(total.toFixed(2))};
    });
  }
  function drawRunChart(){barChart(qs("#runChart"),currentWeekSeries(weeklyDistance("distanceKm")),{formatY:v=>v.toFixed(v<10?1:0),formatPoint:v=>`${v.toFixed(2)} km`})}
  function drawSwimChart(){barChart(qs("#swimChart"),currentWeekSeries(weeklyDistance("swimMeters")),{formatPoint:v=>`${Math.round(v)} m`})}

  function renderSupplementChecklist(){
    const date=isoToday();
    const values=state.supplements[date]||{};
    qs("#supplementDateLabel").textContent=fmtDate(date,{weekday:"long",day:"numeric",month:"long"});
    qs("#supplementChecklist").innerHTML=supplementItems.map(item=>`<div class="supplement-item"><label><input type="checkbox" data-supplement="${item.key}" ${values[item.key]?"checked":""}><span>${esc(item.label)}</span></label><span>${values[item.key]?"✓":""}</span></div>`).join("");
    const done=supplementItems.filter(item=>values[item.key]).length;
    qs("#supplementScore").textContent=`${done} / ${supplementItems.length}`;
    qs("#supplementBar").style.width=`${done/supplementItems.length*100}%`;
  }
  function toggleSupplement(key,checked){
    const date=isoToday();
    state.supplements[date]={...(state.supplements[date]||{}),[key]:checked,updatedAt:new Date().toISOString()};
    saveState();renderSupplementChecklist();renderSupplementHistory();toast(checked?"Doplněk odškrtnut":"Odškrtnutí zrušeno");
  }
  function supplementMark(value){return value?'<span class="status-yes">✓</span>':'<span class="status-no">–</span>'}
  function renderSupplementHistory(){
    const body=qs("#supplementHistory");if(!body)return;
    const dates=dateRange(isoToday(),14).reverse();
    body.innerHTML=dates.map(date=>{
      const values=state.supplements[date]||{},done=supplementItems.filter(item=>values[item.key]).length;
      return `<tr><td>${fmtDate(date,{weekday:"short",day:"numeric",month:"numeric"})}</td>${supplementItems.map(item=>`<td>${supplementMark(!!values[item.key])}</td>`).join("")}<td><strong>${done}/${supplementItems.length}</strong></td></tr>`;
    }).join("");
  }

  function exportJSON(){
    const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});downloadBlob(blob,`spartan-tracker-zaloha-${isoToday()}.json`);
  }
  function exportCSV(){
    const cols=["date","weight","waist","systolicBp","diastolicBp","restingHr","sleepMinutes","sleepFormatted","kmTime","hang","pushups","energy","pain","notes"];
    const lines=[cols.join(";"),...state.measurements.map(m=>cols.map(k=>{
      const value=k==="sleepFormatted"?formatSleep(m.sleepMinutes):m[k];
      return `"${String(value??"").replaceAll('"','""')}"`;
    }).join(";"))];
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
    const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.profile||!data.measurements)throw new Error();state=normalizeState(data);saveState();renderAll();toast("Záloha importována")}catch(e){alert("Soubor není platná záloha Spartan Trackeru.")}};r.readAsText(file);
  }
  function renderAll(){renderDashboard();renderPlan();renderMeasurements();renderExercises();fillProfile()}

  qsa("[data-page]").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.page)));
  qsa("[data-go]").forEach(b=>b.addEventListener("click",()=>switchPage(b.dataset.go)));
  document.addEventListener("click",e=>{
    const log=e.target.closest("[data-log]");if(log)openWorkout(log.dataset.log);
    const del=e.target.closest("[data-del-measure]");if(del&&confirm("Smazat všechna měření pro tento den?")){state.measurements=state.measurements.filter(m=>m.id!==del.dataset.delMeasure);saveState();renderAll();toast("Denní měření smazáno")}
    const dw=e.target.closest("[data-del-workout]");if(dw&&confirm("Smazat tento tréninkový záznam?")){if(dw.dataset.planned==="1")delete state.completions[dw.dataset.delWorkout];else state.customWorkouts=state.customWorkouts.filter(w=>w.id!==dw.dataset.delWorkout);saveState();renderAll();toast("Trénink smazán")}
    const wt=e.target.closest(".week-toggle");if(wt){const body=wt.closest(".week").querySelector(".week-sessions");const open=body.style.display!=="none";body.style.display=open?"none":"block";wt.textContent=open?"Zobrazit":"Skrýt"}
  });
  document.addEventListener("change",e=>{
    if(e.target.matches("[data-supplement]"))toggleSupplement(e.target.dataset.supplement,e.target.checked);
    if(e.target.matches("[data-check]")){
      const id=e.target.dataset.check;
      if(e.target.checked)openWorkout(id);else if(confirm("Označit jednotku jako nesplněnou?")){delete state.completions[id];saveState();renderAll()}else e.target.checked=true;
    }
  });
  qs("#modalClose").addEventListener("click",closeWorkout);qs("#workoutModal").addEventListener("click",e=>{if(e.target===e.currentTarget)closeWorkout()});
  qs("#workoutForm").addEventListener("submit",handleWorkoutSubmit);qs("#markIncompleteBtn").addEventListener("click",markIncomplete);
  qs("#sleepForm").addEventListener("submit",handleSleep);qs("#weightForm").addEventListener("submit",handleWeight);qs("#pressureForm").addEventListener("submit",handlePressure);
  qs("#dailyStatusForm").addEventListener("submit",handleDailyStatus);qs("#performanceForm").addEventListener("submit",handlePerformance);
  ["sleepForm","weightForm","pressureForm","dailyStatusForm","performanceForm"].forEach(id=>{
    const input=qs(`#${id}`)?.querySelector('[name="date"]');
    if(input)input.addEventListener("change",()=>populateMeasureForm(id));
  });
  qs("#metricSelect").addEventListener("change",drawMetricChart);
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
  initMeasureFormDates();
  renderAll();
  window.SPARTAN_APP_READY = true;
  window.SPARTAN_APP_VERSION = "3.5-r2";
  initFirebase();
})();