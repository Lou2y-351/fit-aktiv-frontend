import { useState, useEffect } from "react"
import { api } from "./api"

// ══════════════════════════════════════════════════════════════════════════════
// DATE / WEEK HELPERS
// ══════════════════════════════════════════════════════════════════════════════
function pad(n){ return String(n).padStart(2,"0") }
function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function fmtShort(d){ return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.` }
function fmtWeekday(d){ return ["So","Mo","Di","Mi","Do","Fr","Sa"][d.getDay()] }
function getWeekNumber(d){
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1))
  return Math.ceil((((date - yearStart)/86400000)+1)/7)
}
function getMonday(offset=0){
  const today = new Date()
  const day = today.getDay()
  const monday = new Date(today)
  monday.setHours(0,0,0,0)
  monday.setDate(today.getDate() - (day===0?6:day-1) + offset*7)
  return monday
}
function getWeekDates(offset=0){
  const monday = getMonday(offset)
  return Array.from({length:5},(_,i)=>{
    const d = new Date(monday)
    d.setDate(monday.getDate()+i)
    return d
  })
}
function getWeekRange(dateStr){
  const d = new Date(dateStr+"T00:00:00")
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate()-(day===0?6:day-1))
  const friday = new Date(monday)
  friday.setDate(monday.getDate()+4)
  return [fmtDate(monday), fmtDate(friday)]
}
function weeklyCount(kurseListe, name, dateStr){
  const [mo,fr] = getWeekRange(dateStr)
  return kurseListe.filter(k=>k.trainer_name===name && k.status==="aktiv" && k.datum>=mo && k.datum<=fr).length
}
const TODAY = fmtDate(new Date())

// ══════════════════════════════════════════════════════════════════════════════
// CONFLICT CHECK (A11 / A14 / NF01 - exact error wording from report)
// ══════════════════════════════════════════════════════════════════════════════
function timeToMin(t){ const [h,m]=t.split(":").map(Number); return h*60+m }
function checkConflict(kurseListe, trainerName, datum, uhrzeit, studioName, excludeId=null){
  const newStart = timeToMin(uhrzeit)
  const newEnd = newStart + 60
  const bestehende = kurseListe.filter(k=>k.trainer_name===trainerName && k.datum===datum && k.status==="aktiv" && k.id!==excludeId)
  for (const k of bestehende){
    const kStart = timeToMin(k.uhrzeit)
    const kEnd = kStart + 60
    if (k.studio_name === studioName){
      if (newStart < kEnd && newEnd > kStart){
        return {conflict:true, message:`Dieser Trainer ist zu diesem Zeitpunkt bereits eingeteilt (${k.name}, ${k.uhrzeit} Uhr, ${k.studio_name}).`}
      }
    } else {
      const bufStart = kStart - 60, bufEnd = kEnd + 60
      if (newStart < bufEnd && newEnd > bufStart){
        return {conflict:true, message:`Dieser Trainer ist zu diesem Zeitpunkt bereits eingeteilt (${k.name}, ${k.uhrzeit} Uhr, ${k.studio_name}) und benötigt 1 Stunde Fahrtzeit zwischen Studios.`}
      }
    }
  }
  return {conflict:false}
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATISCHE VERTRETUNGSSUCHE (UC04 / A12 / A14)
// ══════════════════════════════════════════════════════════════════════════════
function findeErsatztrainer(kurs, mitarbeiterListe, kurseListe, excludeName){
  const wochentag = fmtWeekday(new Date(kurs.datum+"T00:00:00"))
  return mitarbeiterListe
    .filter(m=>m.verfuegbar && m.name!==excludeName)
    .filter(m=>m.qualifikationen.includes(kurs.kurstyp_name))
    .filter(m=>m.arbeitstage.includes(wochentag))
    .filter(m=>m.studios.includes(kurs.studio_name))
    .filter(m=>!checkConflict(kurseListe, m.name, kurs.datum, kurs.uhrzeit, kurs.studio_name, kurs.id).conflict)
    .filter(m=>weeklyCount(kurseListe, m.name, kurs.datum) < m.max_kurse_woche)
    .sort((a,b)=>weeklyCount(kurseListe,a.name,kurs.datum)-weeklyCount(kurseListe,b.name,kurs.datum))
    .slice(0,5)
}

// ══════════════════════════════════════════════════════════════════════════════
// SEEDED RANDOM (deterministisch - gleiche Daten bei jedem Laden)
// ══════════════════════════════════════════════════════════════════════════════
function mulberry32(seed){
  return function(){
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed>>>15, 1 | seed)
    t = t + Math.imul(t ^ t>>>7, 61 | t) ^ t
    return ((t ^ t>>>14) >>> 0) / 4294967296
  }
}
const rnd = mulberry32(20260609)
function pickN(arr, n){
  const copy=[...arr]; const out=[]
  for(let i=0;i<n && copy.length;i++){
    const idx = Math.floor(rnd()*copy.length)
    out.push(copy.splice(idx,1)[0])
  }
  return out
}
function slugify(s){
  return s.toLowerCase().replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
}

// ══════════════════════════════════════════════════════════════════════════════
// STAMMDATEN
// ══════════════════════════════════════════════════════════════════════════════
// Line 117 — replace this:
const STUDIO_NAMEN = ["Studio 1 – Krefeld Mitte","Studio 2 – Krefeld Nord","Studio 3 – Krefeld Süd"]

// With this:
const STUDIO_NAMEN = [
  "Studio 01 – Krefeld Mitte",
  "Studio 02 – Krefeld Nord",
  "Studio 03 – Krefeld Süd",
  "Studio 04 – Krefeld West",
  "Studio 05 – Krefeld Ost",
  "Studio 06 – Krefeld Uerdingen",
  "Studio 07 – Krefeld Bockum",
  "Studio 08 – Krefeld Hüls",
  "Studio 09 – Krefeld Fischeln",
  "Studio 10 – Krefeld Oppum",
  "Studio 11 – Krefeld Linn",
  "Studio 12 – Krefeld Gartenstadt",
  "Studio 13 – Krefeld Dießem",
  "Studio 14 – Krefeld Elfrath",
  "Studio 15 – Krefeld Traar",
  "Studio 16 – Duisburg Zentrum",
  "Studio 17 – Mönchengladbach",
  "Studio 18 – Neuss Innenstadt",
  "Studio 19 – Viersen",
  "Studio 20 – Willich",
  "Studio 21 – Kempen",
  "Studio 22 – Tönisvorst",
]
const KURSTYPEN   = ["Yoga","Pilates","Spinning","Krafttraining","Functional Fit"]
const STUDIO_NAMEN = ["Studio 1 – Krefeld Mitte","Studio 2 – Krefeld Nord","Studio 3 – Krefeld Süd"]
const WOCHENTAGE  = ["Mo","Di","Mi","Do","Fr"]
const ZEITEN      = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"]
const ZEITEN_KURS = ["08:00","09:00","10:00","11:00","12:00","14:00","15:00","16:00","17:00","18:00"]

const VORNAMEN_M = ["Max","Jonas","Tim","Lukas","Felix","Paul","Finn","Leon","Noah","Ben","David","Tom","Jan","Niklas","Moritz","Erik","Julian","Simon","Philipp","Daniel","Markus","Stefan","Florian","Sebastian","Andreas","Christian","Michael","Thomas","Alexander","Patrick"]
const VORNAMEN_W = ["Anna","Sara","Lisa","Laura","Lena","Mia","Emma","Hannah","Sophie","Marie","Julia","Lea","Nina","Clara","Maja","Lara","Johanna","Pia","Carla","Vanessa","Sandra","Katrin","Melanie","Stefanie","Nicole","Sabine","Christina","Jasmin","Franziska","Tanja"]
const NACHNAMEN  = ["Müller","Weber","Klein","Bauer","Schulz","Hoffmann","Schmidt","Fischer","Wagner","Becker","Schäfer","Koch","Richter","Wolf","Neumann","Schwarz","Zimmermann","Braun","Krüger","Hartmann","Lange","Werner","Krause","Meier","Lehmann","Schmid","Schulze","Maier","Köhler","Herrmann","Walter","König","Frank","Albrecht","Vogel","Friedrich","Keller","Günther","Berger","Peters"]

// Feste "bekannte" Mitarbeiter (IDs 1-6)
const FEATURED_MITARBEITER = [
  {id:1,name:"Max Müller",   rolle:"Trainer",  modell:"Vollzeit", qualifikationen:"Yoga, Functional Fit",         arbeitstage:["Mo","Di","Mi","Do","Fr"], studios:[STUDIO_NAMEN[0],STUDIO_NAMEN[1]],            max_kurse_woche:20, verfuegbar:1, email:"max@fit-aktiv.de",    passwort:"max123"},
  {id:2,name:"Anna Weber",   rolle:"Trainerin",modell:"Vollzeit", qualifikationen:"Spinning, Pilates",            arbeitstage:["Mo","Di","Mi","Do","Fr"], studios:[STUDIO_NAMEN[0],STUDIO_NAMEN[1]],            max_kurse_woche:20, verfuegbar:1, email:"anna@fit-aktiv.de",   passwort:"anna123"},
  {id:3,name:"Jonas Klein",  rolle:"Coach",    modell:"Vollzeit", qualifikationen:"Krafttraining, Functional Fit",arbeitstage:["Mo","Di","Mi","Do","Fr"], studios:[STUDIO_NAMEN[0]],                            max_kurse_woche:20, verfuegbar:1, email:"jonas@fit-aktiv.de",  passwort:"jonas123"},
  {id:4,name:"Sara Bauer",   rolle:"Trainerin",modell:"Vollzeit", qualifikationen:"Pilates, Yoga",                arbeitstage:["Mo","Di","Mi","Do","Fr"], studios:[STUDIO_NAMEN[0],STUDIO_NAMEN[1],STUDIO_NAMEN[2]], max_kurse_woche:20, verfuegbar:1, email:"sara@fit-aktiv.de",   passwort:"sara123"},
  {id:5,name:"Tim Schulz",   rolle:"Trainer",  modell:"Teilzeit", qualifikationen:"Spinning",                     arbeitstage:["Di","Do"],                studios:[STUDIO_NAMEN[1]],                            max_kurse_woche:8,  verfuegbar:0, email:"tim@fit-aktiv.de",    passwort:"tim123"},
  {id:6,name:"Lisa Hoffmann",rolle:"Trainerin",modell:"Teilzeit", qualifikationen:"Yoga, Pilates",                arbeitstage:["Mo","Mi","Fr"],            studios:[STUDIO_NAMEN[2]],                            max_kurse_woche:8,  verfuegbar:1, email:"lisa.h@fit-aktiv.de", passwort:"lisa123"},
]

// 104 weitere Mitarbeiter generieren -> insgesamt > 100 (A05/NF05)
function generateExtraMitarbeiter(startId, count){
  const list = []
  const used = new Set(FEATURED_MITARBEITER.map(m=>m.name))
  for (let i=0;i<count;i++){
    const isM = rnd() < 0.5
    const vornamenPool = isM ? VORNAMEN_M : VORNAMEN_W
    let vorname, nachname, fullName, tries=0
    do {
      vorname = vornamenPool[Math.floor(rnd()*vornamenPool.length)]
      nachname = NACHNAMEN[Math.floor(rnd()*NACHNAMEN.length)]
      fullName = `${vorname} ${nachname}`
      tries++
    } while (used.has(fullName) && tries<50)
    used.add(fullName)

    const modell = rnd()<0.65 ? "Vollzeit" : "Teilzeit"
    const qualifikationen = pickN(KURSTYPEN, 1+Math.floor(rnd()*2)).join(", ")
    const arbeitstage = modell==="Vollzeit"
      ? [...WOCHENTAGE]
      : pickN(WOCHENTAGE, 2+Math.floor(rnd()*2)).sort((a,b)=>WOCHENTAGE.indexOf(a)-WOCHENTAGE.indexOf(b))
    const studios = pickN(STUDIO_NAMEN, rnd()<0.25?2:1)
    const rolle = isM ? (rnd()<0.7?"Trainer":"Coach") : (rnd()<0.7?"Trainerin":"Coachin")
    const email = `${vorname.toLowerCase()}.${slugify(nachname)}@fit-aktiv.de`

    list.push({
      id:startId+i, name:fullName, rolle, modell, qualifikationen, arbeitstage, studios,
      max_kurse_woche: modell==="Vollzeit"?20:8,
      verfuegbar:1, email, passwort: vorname.toLowerCase()+"123"
    })
  }
  return list
}

const ALL_MITARBEITER_INITIAL = [...FEATURED_MITARBEITER, ...generateExtraMitarbeiter(7,104)]

// Kurse generieren (4 Wochen: letzte, aktuelle, +1, +2 -> Mehrwochen-Kalender)
const W0 = getWeekDates(0)
const FEATURED_KURSE = [
  {id:1, name:"Yoga Basic",     kurstyp_name:"Yoga",           datum:fmtDate(W0[0]), uhrzeit:"08:00", studio_name:STUDIO_NAMEN[0], trainer_name:"Max Müller",    status:"aktiv"},
  {id:2, name:"Spinning",       kurstyp_name:"Spinning",       datum:fmtDate(W0[1]), uhrzeit:"09:00", studio_name:STUDIO_NAMEN[0], trainer_name:"Anna Weber",    status:"aktiv"},
  {id:3, name:"Pilates",        kurstyp_name:"Pilates",        datum:fmtDate(W0[0]), uhrzeit:"10:00", studio_name:STUDIO_NAMEN[0], trainer_name:"Sara Bauer",    status:"aktiv"},
  {id:4, name:"Kraft & Fit",    kurstyp_name:"Krafttraining",  datum:fmtDate(W0[2]), uhrzeit:"11:00", studio_name:STUDIO_NAMEN[0], trainer_name:"Jonas Klein",   status:"aktiv"},
  {id:5, name:"Functional Fit", kurstyp_name:"Functional Fit", datum:fmtDate(W0[3]), uhrzeit:"08:00", studio_name:STUDIO_NAMEN[0], trainer_name:"Max Müller",    status:"aktiv"},
  {id:6, name:"Pilates Adv.",   kurstyp_name:"Pilates",        datum:fmtDate(W0[4]), uhrzeit:"12:00", studio_name:STUDIO_NAMEN[1], trainer_name:"Sara Bauer",    status:"aktiv"},
  {id:7, name:"Yoga Flow",      kurstyp_name:"Yoga",           datum:fmtDate(W0[1]), uhrzeit:"17:00", studio_name:STUDIO_NAMEN[1], trainer_name:"Anna Weber",    status:"aktiv"},
  {id:8, name:"Spinning Pro",   kurstyp_name:"Spinning",       datum:fmtDate(W0[3]), uhrzeit:"18:00", studio_name:STUDIO_NAMEN[1], trainer_name:"Tim Schulz",    status:"ausgefallen"},
]

function generateKurse(mitarbeiterListe){
  const kurse = []
  let id = 1000
  const usedSlots = {}
  for (let off=-1; off<=2; off++){
    getWeekDates(off).forEach(date=>{
      const datum = fmtDate(date)
      const wochentag = fmtWeekday(date)
      const anzahl = 2 + Math.floor(rnd()*3)
      for (let i=0;i<anzahl;i++){
        const kurstyp = KURSTYPEN[Math.floor(rnd()*KURSTYPEN.length)]
        const zeit = ZEITEN_KURS[Math.floor(rnd()*ZEITEN_KURS.length)]
        const studio = STUDIO_NAMEN[Math.floor(rnd()*STUDIO_NAMEN.length)]
        const eligible = mitarbeiterListe.filter(m=>
          m.verfuegbar &&
          m.qualifikationen.includes(kurstyp) &&
          m.arbeitstage.includes(wochentag) &&
          m.studios.includes(studio) &&
          !usedSlots[`${m.name}|${datum}|${zeit}`]
        )
        let trainerName = "Nicht zugewiesen"
        if (eligible.length){
          const t = eligible[Math.floor(rnd()*eligible.length)]
          trainerName = t.name
          usedSlots[`${t.name}|${datum}|${zeit}`] = true
        }
        const suffix = rnd()<0.25?" Basic":rnd()<0.4?" Pro":rnd()<0.55?" Flow":""
        kurse.push({id:id++, name:kurstyp+suffix, kurstyp_name:kurstyp, datum, uhrzeit:zeit, studio_name:studio, trainer_name:trainerName, status:"aktiv"})
      }
    })
  }
  return kurse
}

const ALL_KURSE_INITIAL = [...FEATURED_KURSE, ...generateKurse(ALL_MITARBEITER_INITIAL)]

// Login-Accounts (Admin + jeder Mitarbeiter)
const DEFAULT_USERS = [
  {email:"admin@fit-aktiv.de", passwort:"admin123", name:"Lisa Fit", rolle:"admin"},
  ...ALL_MITARBEITER_INITIAL.map(m=>({email:m.email, passwort:m.passwort, name:m.name, rolle:"trainer"}))
]
const BEISPIEL_MITARBEITER = ALL_MITARBEITER_INITIAL[50]

const FARBEN = {Yoga:"#B5D4F4",Pilates:"#CECBF6",Spinning:"#FAC775","Krafttraining":"#C0DD97","Functional Fit":"#C0DD97"}
const FARBEN_TEXT = {Yoga:"#042C53",Pilates:"#26215C",Spinning:"#412402","Krafttraining":"#173404","Functional Fit":"#173404"}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
function LoginPage({onLogin}) {
  const [email, setEmail] = useState("")
  const [passwort, setPasswort] = useState("")
  const [fehler, setFehler] = useState("")
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setFehler("")
    setLoading(true)
    setTimeout(() => {
      const user = DEFAULT_USERS.find(u => u.email === email.trim().toLowerCase() && u.passwort === passwort)
      if (user) onLogin(user)
      else setFehler("E-Mail oder Passwort falsch. Bitte erneut versuchen.")
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{minHeight:"100vh",background:"#F1EFE8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif",padding:20}}>
      <div style={{width:400,background:"#fff",borderRadius:16,padding:36,border:"0.5px solid #D3D1C7",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:56,height:56,background:"#185FA5",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:24}}>💪</div>
          <div style={{fontSize:20,fontWeight:600,color:"#2C2C2A"}}>Fit &amp; Aktiv</div>
          <div style={{fontSize:13,color:"#888780",marginTop:2}}>Kursplanungssystem · {ALL_MITARBEITER_INITIAL.length} Mitarbeiter</div>
        </div>

        {fehler && (
          <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#791F1F",marginBottom:16}}>
            ⚠️ {fehler}
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label style={labelStyle}>E-Mail</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="z.B. max@fit-aktiv.de" style={{...inputStyle,width:"100%"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={labelStyle}>Passwort</label>
          <input type="password" value={passwort} onChange={e=>setPasswort(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Passwort eingeben" style={{...inputStyle,width:"100%"}}/>
        </div>

        <button onClick={submit} disabled={loading}
          style={{...btnStyle("#185FA5","#fff"),width:"100%",justifyContent:"center",padding:"10px 0",fontSize:14,opacity:loading?.7:1}}>
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        <div style={{marginTop:24,padding:14,background:"#F1EFE8",borderRadius:10,fontSize:12}}>
          <div style={{fontWeight:500,marginBottom:8,color:"#5F5E5A"}}>Demo-Zugänge:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:8}}>
            {[["Admin","admin@fit-aktiv.de","admin123"],
              ["Max Müller","max@fit-aktiv.de","max123"],
              ["Anna Weber","anna@fit-aktiv.de","anna123"],
              ["Tim Schulz (krank)","tim@fit-aktiv.de","tim123"]].map(([name,mail,pw])=>(
              <div key={mail} onClick={()=>{setEmail(mail);setPasswort(pw)}}
                style={{padding:"6px 8px",background:"#fff",borderRadius:6,cursor:"pointer",border:"0.5px solid #D3D1C7"}}>
                <div style={{fontWeight:500,color:"#2C2C2A"}}>{name}</div>
                <div style={{color:"#888780",fontSize:11}}>{pw}</div>
              </div>
            ))}
          </div>
          <div style={{borderTop:"0.5px solid #D3D1C7",paddingTop:8,color:"#5F5E5A"}}>
            <strong>Alle {ALL_MITARBEITER_INITIAL.length} Mitarbeiter</strong> können sich anmelden:<br/>
            Muster: <code>vorname.nachname@fit-aktiv.de</code> / <code>vorname123</code><br/>
            Beispiel: <span onClick={()=>{setEmail(BEISPIEL_MITARBEITER.email);setPasswort(BEISPIEL_MITARBEITER.passwort)}} style={{cursor:"pointer",textDecoration:"underline"}}>{BEISPIEL_MITARBEITER.email} / {BEISPIEL_MITARBEITER.passwort}</span> ({BEISPIEL_MITARBEITER.name})
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)   
  const [page, setPage] = useState("dashboard")
  const [kurse, setKurse] = useState(ALL_KURSE_INITIAL)
  const [mitarbeiter, setMitarbeiter] = useState(ALL_MITARBEITER_INITIAL)
  const [benachrichtigungen, setBenachrichtigungen] = useState([
    {id:1, inhalt:"Krankmeldung: Tim Schulz – Spinning Pro ausgefallen.", kanal:"system", gelesen:0, zeit:"vor 1 Std."},
    {id:2, inhalt:"12 Mitglieder wurden über den Ausfall von Spinning Pro informiert.", kanal:"email", gelesen:0, zeit:"vor 1 Std."},
    {id:3, inhalt:"Max Müller wurde Functional Fit zugewiesen.", kanal:"email", gelesen:0, zeit:"vor 3 Std."},
    {id:4, inhalt:"Yoga Flow erfolgreich erstellt.", kanal:"email", gelesen:1, zeit:"gestern"},
  ])
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null) // {type:"neu"} | {type:"edit", kurs}

  const [studioNamen, setStudioNamen] = useState(STUDIO_NAMEN) // fallback to hardcoded

useEffect(() => {
  api.studios()
    .then(data => setStudioNamen(data.map(s => s.name)))
    .catch(() => console.warn("Backend nicht erreichbar, nutze lokale Daten"))
}, [])

  const showToast = (msg, color="#185FA5") => {
    setToast({msg, color})
    setTimeout(() => setToast(null), 3500)
  }
  const addBenachrichtigung = (inhalt, kanal="system") => {
    setBenachrichtigungen(prev => [{id:Date.now()+Math.random(), inhalt, kanal, gelesen:0, zeit:"gerade"}, ...prev])
  }

  // Geteilte Aktionen für Kurse (A01, A03, A16)
  const markiereKursAusgefallen = (kursId) => {
    const kurs = kurse.find(k=>k.id===kursId)
    if (!kurs) return
    setKurse(prev=>prev.map(k=>k.id===kursId?{...k,status:"ausgefallen"}:k))
    const mitgliederCount = 5+Math.floor(rnd()*20)
    if (kurs.trainer_name && kurs.trainer_name!=="Nicht zugewiesen"){
      addBenachrichtigung(`${kurs.trainer_name}: Dein Kurs "${kurs.name}" am ${kurs.datum} um ${kurs.uhrzeit} wurde abgesagt.`,"email")
    }
    addBenachrichtigung(`Kurs "${kurs.name}" am ${kurs.datum} ist ausgefallen. ${mitgliederCount} Mitglieder wurden automatisch per E-Mail informiert.`,"email")
    showToast(`"${kurs.name}" als ausgefallen markiert - Benachrichtigungen versendet.`,"#A32D2D")
  }
  const reaktiviereKurs = (kursId) => {
    setKurse(prev=>prev.map(k=>k.id===kursId?{...k,status:"aktiv"}:k))
    showToast("Kurs reaktiviert.","#3B6D11")
  }
  const loescheKurs = (kursId) => {
    const kurs = kurse.find(k=>k.id===kursId)
    if (!kurs) return
    if (!window.confirm(`Kurs "${kurs.name}" am ${kurs.datum} wirklich löschen?`)) return
    setKurse(prev=>prev.filter(k=>k.id!==kursId))
    addBenachrichtigung(`Kurs "${kurs.name}" wurde gelöscht.`)
    showToast(`Kurs "${kurs.name}" gelöscht.`,"#A32D2D")
  }
  const zuweiseErsatz = (kursId, ersatzName) => {
    const kurs = kurse.find(k=>k.id===kursId)
    setKurse(prev=>prev.map(k=>k.id===kursId?{...k,trainer_name:ersatzName,status:"aktiv"}:k))
    addBenachrichtigung(`${ersatzName} übernimmt Vertretung: "${kurs.name}" am ${kurs.datum} um ${kurs.uhrzeit}.`,"email")
    showToast(`${ersatzName} als Ersatz für "${kurs.name}" zugewiesen.`,"#3B6D11")
  }

  if (!currentUser) return <LoginPage onLogin={u => { setCurrentUser(u); setPage("dashboard") }} />

  const isAdmin = currentUser.rolle === "admin"
  const ungelesen = benachrichtigungen.filter(b=>!b.gelesen).length
  const krank = mitarbeiter.filter(m=>!m.verfuegbar)

  const PAGE_TITLES = {
    dashboard:"Dashboard", kursplan:"Kursplan", kurse:"Kursverwaltung",
    mitarbeiter:"Mitarbeiterverwaltung", krankmeldung:"Krankmeldung & Vertretung",
    benachrichtigungen:"Benachrichtigungen", meinplan:"Mein Einsatzplan"
  }
  const adminNav = [
    {id:"dashboard",    icon:"📊", label:"Dashboard"},
    {id:"kursplan",     icon:"📅", label:"Kursplan"},
    {id:"kurse",        icon:"🏃", label:"Kurse"},
    {id:"mitarbeiter",  icon:"👥", label:"Mitarbeiter"},
    {id:"krankmeldung", icon:"🚨", label:"Krankmeldung"},
    {id:"benachrichtigungen", icon:"🔔", label:"Benachrichtigungen"},
  ]
  const trainerNav = [
    {id:"meinplan",     icon:"📅", label:"Mein Einsatzplan"},
    {id:"kursplan",     icon:"🗓", label:"Wochenplan"},
    {id:"krankmeldung", icon:"🚨", label:"Krankmeldung"},
    {id:"benachrichtigungen", icon:"🔔", label:"Benachrichtigungen"},
  ]
  const navItems = isAdmin ? adminNav : trainerNav

  return (
  <div style={{display:"flex",minHeight:"100vh",background:"#F1EFE8",fontFamily:"system-ui,sans-serif",fontSize:14,color:"#2C2C2A"}}>
    {/* Sidebar */}
    <div style={{
      width: sidebarOpen ? 220 : 0,
      minWidth: sidebarOpen ? 220 : 0,
      background:"#fff",
      borderRight:"0.5px solid #D3D1C7",
      display:"flex",
      flexDirection:"column",
      flexShrink:0,
      overflow:"hidden",
      transition:"width 0.25s ease, min-width 0.25s ease"
    }}>
      <div style={{padding:"20px 16px 14px",borderBottom:"0.5px solid #D3D1C7",minWidth:220}}>
        <div style={{fontWeight:600,fontSize:16}}>💪 Fit &amp; Aktiv</div>
        <div style={{fontSize:11,color:"#888780",marginTop:2}}>Kursplanungssystem</div>
      </div>
      <div style={{padding:"8px 0",flex:1,minWidth:220}}>
        {navItems.map(n=>(
          <div key={n.id} onClick={()=>setPage(n.id)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",
              borderLeft:`3px solid ${page===n.id?"#185FA5":"transparent"}`,
              background:page===n.id?"#F1EFE8":"transparent",
              color:page===n.id?"#2C2C2A":"#888780",fontSize:13}}>
            <span>{n.icon}</span>{n.label}
            {n.id==="benachrichtigungen"&&ungelesen>0&&
              <span style={{marginLeft:"auto",background:"#A32D2D",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:10}}>{ungelesen}</span>}
          </div>
        ))}
      </div>
      <div style={{padding:16,borderTop:"0.5px solid #D3D1C7",minWidth:220}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <Avatar name={currentUser.name}/>
          <div>
            <div style={{fontSize:13,fontWeight:500}}>{currentUser.name}</div>
            <div style={{fontSize:11,color:"#888780"}}>{isAdmin?"Administrator":"Trainer"}</div>
          </div>
        </div>
        <button onClick={()=>setCurrentUser(null)}
          style={{...btnStyle("#FCEBEB","#791F1F",true),width:"100%",justifyContent:"center",fontSize:12}}>
          🚪 Abmelden
        </button>
      </div>
    </div>

      {/* Main */}
    <div style={{flex:1,overflow:"auto"}}>
      <div style={{background:"#fff",borderBottom:"0.5px solid #D3D1C7",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:10}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {/* Hamburger toggle */}
          <button onClick={()=>setSidebarOpen(o=>!o)}
            style={{background:"none",border:"0.5px solid #D3D1C7",borderRadius:6,cursor:"pointer",
              fontSize:16,padding:"4px 8px",color:"#5F5E5A",lineHeight:1}}>
            {sidebarOpen ? "✕" : "☰"}
          </button>
          <div style={{fontWeight:500,fontSize:16}}>{PAGE_TITLES[page]||page}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {isAdmin && <button onClick={()=>setModal({type:"neu"})} style={btnStyle("#185FA5","#fff")}>+ Neuer Kurs</button>}
        </div>
      </div>

        <div style={{padding:24}}>
          {page==="dashboard" && <Dashboard kurse={kurse} mitarbeiter={mitarbeiter} krank={krank} setPage={setPage} isAdmin={isAdmin} studioNamen={studioNamen}/>}
          {page==="kursplan"     && <Kursplan kurse={kurse}/>}
          {page==="meinplan"     && <MeinPlan kurse={kurse} currentUser={currentUser} mitarbeiter={mitarbeiter}/>}
          {page==="kurse"        && <Kurse kurse={kurse} setModal={setModal} markiereKursAusgefallen={markiereKursAusgefallen} reaktiviereKurs={reaktiviereKurs} loescheKurs={loescheKurs}/>}
          {page==="mitarbeiter"  && <Mitarbeiter mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} kurse={kurse} showToast={showToast} addBenachrichtigung={addBenachrichtigung} setPage={setPage}/>}
          {page==="krankmeldung" && <Krankmeldung mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} kurse={kurse} showToast={showToast} addBenachrichtigung={addBenachrichtigung} currentUser={currentUser} isAdmin={isAdmin} zuweiseErsatz={zuweiseErsatz} markiereKursAusgefallen={markiereKursAusgefallen}/>}
          {page==="benachrichtigungen" && <Benachrichtigungen benachrichtigungen={benachrichtigungen} setBenachrichtigungen={setBenachrichtigungen}/>}
        </div>
      </div>

      {modal && <KursModal modal={modal} onClose={()=>setModal(null)} kurse={kurse} setKurse={setKurse} mitarbeiter={mitarbeiter} showToast={showToast} addBenachrichtigung={addBenachrichtigung} studioNamen={studioNamen}/>}
      {toast && <div style={{position:"fixed",bottom:24,right:24,background:toast.color,color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,zIndex:200,maxWidth:360,boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>{toast.msg}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({kurse, mitarbeiter, krank, setPage, isAdmin}) {
  const aktiv = kurse.filter(k=>k.status==="aktiv").length
  const ausgefallen = kurse.filter(k=>k.status==="ausgefallen").length
  const vollzeit = mitarbeiter.filter(m=>m.modell==="Vollzeit").length
  const topAuslastung = [...mitarbeiter]
    .map(m=>({...m, last:weeklyCount(kurse,m.name,TODAY)}))
    .sort((a,b)=>b.last-a.last)
    .slice(0,8)

  return (
    <div>
      {krank.length>0&&(
        <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#791F1F",flexWrap:"wrap"}}>
          <span>⚠️</span>
          <strong>{krank.length} Trainer krank:</strong> {krank.slice(0,5).map(m=>m.name).join(", ")}{krank.length>5?` +${krank.length-5} weitere`:""}
          {isAdmin&&<button onClick={()=>setPage("krankmeldung")} style={{...btnStyle("#A32D2D","#fff",true),marginLeft:"auto"}}>Vertretung suchen</button>}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {icon:"📅", label:"Kurse diese Woche", value:kurse.filter(k=>{const [mo,fr]=getWeekRange(TODAY);return k.datum>=mo&&k.datum<=fr}).length, sub:`${aktiv} aktiv gesamt, ${ausgefallen} ausgefallen`},
          {icon:"👥", label:"Mitarbeiter gesamt", value:mitarbeiter.length, sub:`${vollzeit} Vollzeit, ${mitarbeiter.length-vollzeit} Teilzeit`},
          {icon:"🏢", label:"Studios", value:3, sub:"Krefeld Mitte, Nord, Süd"},
          {icon:"🚨", label:"Krank gemeldet", value:krank.length, sub:`${mitarbeiter.filter(m=>m.verfuegbar).length} verfügbar`},
        ].map(m=>(
          <div key={m.label} style={{background:"#F1EFE8",borderRadius:10,padding:"14px 16px"}}>
            <div style={{fontSize:20,marginBottom:4}}>{m.icon}</div>
            <div style={{fontSize:11,color:"#888780",marginBottom:2}}>{m.label}</div>
            <div style={{fontSize:22,fontWeight:500}}>{m.value}</div>
            <div style={{fontSize:11,color:"#888780",marginTop:2}}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>Heutige Kurse ({new Date().toLocaleDateString("de-DE")})</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Zeit","Kurs","Trainer","Status"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
            <tbody>
              {kurse.filter(k=>k.datum===TODAY).length===0
                ? <tr><td colSpan={4} style={{padding:"16px 8px",color:"#888780",textAlign:"center"}}>Keine Kurse heute (Mo–Fr Betrieb)</td></tr>
                : kurse.filter(k=>k.datum===TODAY).sort((a,b)=>a.uhrzeit.localeCompare(b.uhrzeit)).map(k=>(
                  <tr key={k.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
                    <td style={{padding:"8px",color:"#888780"}}>{k.uhrzeit}</td>
                    <td style={{padding:"8px",fontWeight:500}}>{k.name}</td>
                    <td style={{padding:"8px"}}>{k.trainer_name}</td>
                    <td style={{padding:"8px"}}><StatusBadge status={k.status}/></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>Top Auslastung - aktuelle Woche</div>
          {topAuslastung.map(m=>(
            <div key={m.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name} size={24}/>
                  <span style={{fontSize:13}}>{m.name}</span>
                  {!m.verfuegbar&&<span style={{background:"#FCEBEB",color:"#791F1F",fontSize:10,padding:"1px 6px",borderRadius:10}}>Krank</span>}
                </div>
                <span style={{fontSize:12,color:"#888780"}}>{m.last}/{m.max_kurse_woche}</span>
              </div>
              <div style={{height:5,background:"#F1EFE8",borderRadius:4}}>
                <div style={{height:"100%",borderRadius:4,background:m.verfuegbar?"#185FA5":"#A32D2D",width:`${Math.min(100,Math.round(m.last/m.max_kurse_woche*100))}%`}}/>
              </div>
            </div>
          ))}
          <div style={{fontSize:11,color:"#888780",marginTop:8}}>Zeigt die 8 am stärksten ausgelasteten von {mitarbeiter.length} Mitarbeitern. Alle Mitarbeiter unter "Mitarbeiter".</div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KURSPLAN (Mehrwochen-Kalender mit Navigation - Fix #3)
// ══════════════════════════════════════════════════════════════════════════════
function WeekNav({offset, setOffset}) {
  const dates = getWeekDates(offset)
  return (
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,flexWrap:"wrap"}}>
      <button onClick={()=>setOffset(offset-1)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>← Vorherige</button>
      <button onClick={()=>setOffset(0)} style={btnStyle(offset===0?"#185FA5":"#F1EFE8",offset===0?"#fff":"#2C2C2A",true)}>Heute</button>
      <button onClick={()=>setOffset(offset+1)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Nächste →</button>
      <span style={{fontWeight:500,fontSize:13,marginLeft:8}}>
        KW {getWeekNumber(dates[0])} - {dates[0].toLocaleDateString("de-DE",{month:"long",year:"numeric"})}
        {" "}({fmtShort(dates[0])}–{fmtShort(dates[4])})
        {offset!==0 && <span style={{color:"#888780",fontWeight:400}}> {offset>0?`(+${offset} Woche${offset>1?"n":""})`:`(${offset} Woche${offset<-1?"n":""})`}</span>}
      </span>
    </div>
  )
}

function WeekGrid({dates, kurse, highlightToday=true}) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"64px repeat(5,1fr)",gap:1,background:"#D3D1C7",border:"0.5px solid #D3D1C7",borderRadius:10,overflow:"hidden"}}>
      <div style={wkHeader}/>
      {dates.map(d=>(
        <div key={fmtDate(d)} style={{...wkHeader,background:(highlightToday&&fmtDate(d)===TODAY)?"#E6F1FB":"#F1EFE8",padding:"8px 6px",textAlign:"center"}}>
          <div style={{fontWeight:500,fontSize:12}}>{fmtWeekday(d)}</div>
          <div style={{fontSize:11,color:(highlightToday&&fmtDate(d)===TODAY)?"#185FA5":"#888780",fontWeight:(highlightToday&&fmtDate(d)===TODAY)?600:400}}>
            {fmtShort(d)}{(highlightToday&&fmtDate(d)===TODAY)?" ●":""}
          </div>
        </div>
      ))}
      {ZEITEN.map(zeit=>(
        <>
          <div key={"t"+zeit} style={{background:"#F1EFE8",padding:"4px 6px",fontSize:11,color:"#888780",textAlign:"right",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingTop:6}}>{zeit}</div>
          {dates.map(datum=>{
            const ks = kurse.filter(k=>k.datum===fmtDate(datum)&&k.uhrzeit===zeit)
            return (
              <div key={fmtDate(datum)} style={{background:(highlightToday&&fmtDate(datum)===TODAY)?"#F7FBFF":"#fff",padding:3,minHeight:52}}>
                {ks.map(k=>(
                  <div key={k.id} style={{borderRadius:5,padding:"3px 6px",marginBottom:2,fontSize:11,lineHeight:1.3,
                    background:k.status==="ausgefallen"?"#D3D1C7":FARBEN[k.kurstyp_name]||"#B5D4F4",
                    color:k.status==="ausgefallen"?"#5F5E5A":FARBEN_TEXT[k.kurstyp_name]||"#042C53"}}>
                    <div style={{fontWeight:500}}>{k.name}{k.status==="ausgefallen"?" ❌":""}</div>
                    <div style={{opacity:.75}}>{k.trainer_name?.split(" ")[0]}</div>
                  </div>
                ))}
              </div>
            )
          })}
        </>
      ))}
    </div>
  )
}

function Kursplan({kurse}) {
  const [offset, setOffset] = useState(0)
  const dates = getWeekDates(offset)
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:12}}>
        <WeekNav offset={offset} setOffset={setOffset}/>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {Object.entries(FARBEN).map(([typ,bg])=>(
            <span key={typ} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
              <span style={{width:10,height:10,background:bg,borderRadius:2,display:"inline-block"}}/>{typ}
            </span>
          ))}
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
            <span style={{width:10,height:10,background:"#D3D1C7",borderRadius:2,display:"inline-block"}}/>Ausgefallen
          </span>
        </div>
      </div>
      <WeekGrid dates={dates} kurse={kurse}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MEIN PLAN (Trainer-Ansicht - mit Wochennavigation)
// ══════════════════════════════════════════════════════════════════════════════
function MeinPlan({kurse, currentUser, mitarbeiter}) {
  const [offset, setOffset] = useState(0)
  const ma = mitarbeiter.find(m=>m.name===currentUser.name)
  const meineKurse = kurse.filter(k=>k.trainer_name===currentUser.name)
  const dates = getWeekDates(offset)
  const wocheKurse = meineKurse.filter(k=>dates.map(fmtDate).includes(k.datum))
  const heute = meineKurse.filter(k=>k.datum===TODAY)

  return (
    <div>
      <div style={{background:"#fff",borderRadius:12,padding:20,border:"0.5px solid #D3D1C7",marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>Guten Tag, {currentUser.name}! 👋</div>
        <div style={{fontSize:13,color:"#888780"}}>Dein persönlicher Einsatzplan</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:16}}>
          {[
            {label:"Kurse diese Woche", value:weeklyCount(kurse,currentUser.name,TODAY), max:ma?.max_kurse_woche||20},
            {label:"Heute", value:heute.length, max:null},
            {label:"Status", value:ma?.verfuegbar?"✅ Verfügbar":"❌ Krank", max:null},
            {label:"Arbeitstage", value:(ma?.arbeitstage||[]).join(", "), max:null},
          ].map(m=>(
            <div key={m.label} style={{background:"#F1EFE8",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"#888780",marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:m.label==="Arbeitstage"?14:18,fontWeight:500}}>{m.value}</div>
              {m.max && <div style={{fontSize:11,color:"#888780"}}>von {m.max} max.</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{fontWeight:500,marginBottom:8}}>📅 Mein Wochenplan</div>
        <WeekNav offset={offset} setOffset={setOffset}/>
        <WeekGrid dates={dates} kurse={wocheKurse}/>
      </div>

      {meineKurse.length===0 && (
        <div style={{textAlign:"center",padding:40,color:"#888780"}}>
          <div style={{fontSize:36,marginBottom:8}}>📭</div>
          <div>Aktuell keine Kurse zugewiesen.</div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KURSE (A01: anlegen/bearbeiten/löschen, A03: ausgefallen markieren - Fix #4 #5)
// ══════════════════════════════════════════════════════════════════════════════
function Kurse({kurse, setModal, markiereKursAusgefallen, reaktiviereKurs, loescheKurs}) {
  const [filter, setFilter] = useState("alle")
  const [suche, setSuche] = useState("")

  const gefiltert = kurse
    .filter(k=>filter==="alle"||k.status===filter)
    .filter(k=>!suche||k.name.toLowerCase().includes(suche.toLowerCase())||k.trainer_name.toLowerCase().includes(suche.toLowerCase()))
    .sort((a,b)=>(a.datum+a.uhrzeit).localeCompare(b.datum+b.uhrzeit))

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input value={suche} onChange={e=>setSuche(e.target.value)} placeholder="🔍 Kurs oder Trainer suchen..." style={{...inputStyle,minWidth:220}}/>
        {["alle","aktiv","ausgefallen"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={btnStyle(filter===f?"#185FA5":"#F1EFE8",filter===f?"#fff":"#2C2C2A",true)}>
            {f==="alle"?"Alle":f==="aktiv"?"Aktiv":"Ausgefallen"}
          </button>
        ))}
        <span style={{fontSize:12,color:"#888780",marginLeft:"auto"}}>{gefiltert.length} von {kurse.length} Kursen</span>
      </div>
      <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
        <div style={{maxHeight:600,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead style={{position:"sticky",top:0,background:"#fff",zIndex:1}}><tr>{["Kurs","Typ","Datum","Zeit","Studio","Trainer","Status","Aktionen"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {gefiltert.map(k=>(
              <tr key={k.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
                <td style={tdStyle}><strong style={{fontWeight:500}}>{k.name}</strong></td>
                <td style={tdStyle}><span style={{background:"#E6F1FB",color:"#0C447C",fontSize:11,padding:"2px 7px",borderRadius:20}}>{k.kurstyp_name}</span></td>
                <td style={{...tdStyle,fontSize:12,whiteSpace:"nowrap"}}>{new Date(k.datum+"T00:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"})}</td>
                <td style={tdStyle}>{k.uhrzeit}</td>
                <td style={{...tdStyle,color:"#888780",fontSize:12}}>{k.studio_name}</td>
                <td style={tdStyle}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <Avatar name={k.trainer_name==="Nicht zugewiesen"?"?":k.trainer_name} size={22}/>
                    <span style={{color:k.trainer_name==="Nicht zugewiesen"?"#A32D2D":"inherit"}}>{k.trainer_name}</span>
                  </div>
                </td>
                <td style={tdStyle}><StatusBadge status={k.status}/></td>
                <td style={{...tdStyle,textAlign:"right",whiteSpace:"nowrap"}}>
                  <button onClick={()=>setModal({type:"edit",kurs:k})} style={btnStyle("#F1EFE8","#2C2C2A",true)} title="Bearbeiten">✏️</button>
                  {" "}
                  {k.status==="aktiv"
                    ? <button onClick={()=>markiereKursAusgefallen(k.id)} style={{...btnStyle("#FCEBEB","#791F1F",true)}} title="Als ausgefallen markieren">❌ Ausfallen</button>
                    : <button onClick={()=>reaktiviereKurs(k.id)} style={btnStyle("#EAF3DE","#27500A",true)} title="Reaktivieren">✓ Reaktivieren</button>
                  }
                  {" "}
                  <button onClick={()=>loescheKurs(k.id)} style={btnStyle("#FCEBEB","#791F1F",true)} title="Löschen">🗑</button>
                </td>
              </tr>
            ))}
            {gefiltert.length===0 && <tr><td colSpan={8} style={{padding:24,textAlign:"center",color:"#888780"}}>Keine Kurse gefunden.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MITARBEITER (>100, mit Arbeitstagen - Fix #1 #6)
// ══════════════════════════════════════════════════════════════════════════════
function Mitarbeiter({mitarbeiter, setMitarbeiter, kurse, showToast, addBenachrichtigung, setPage}) {
  const [suche, setSuche] = useState("")
  const [filter, setFilter] = useState("alle")

  const toggle = (id) => {
    const m = mitarbeiter.find(x=>x.id===id)
    setMitarbeiter(mitarbeiter.map(x=>x.id===id?{...x,verfuegbar:x.verfuegbar?0:1}:x))
    const status = m.verfuegbar ? "krank gemeldet" : "wieder verfügbar"
    showToast(`${m.name}: ${status}.${m.verfuegbar?" Tipp: Nutze \"Krankmeldung\" für die automatische Vertretungssuche.":""}`, m.verfuegbar?"#A32D2D":"#3B6D11")
    addBenachrichtigung(`${m.name} ist ${status}.`)
  }

  const gefiltert = mitarbeiter
    .filter(m=>filter==="alle"||(filter==="verfuegbar"&&m.verfuegbar)||(filter==="krank"&&!m.verfuegbar))
    .filter(m=>!suche||m.name.toLowerCase().includes(suche.toLowerCase())||m.email.toLowerCase().includes(suche.toLowerCase())||m.qualifikationen.toLowerCase().includes(suche.toLowerCase()))

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input value={suche} onChange={e=>setSuche(e.target.value)} placeholder="🔍 Name, E-Mail oder Qualifikation..." style={{...inputStyle,minWidth:240}}/>
        {[["alle","Alle"],["verfuegbar","Verfügbar"],["krank","Krank"]].map(([f,l])=>(
          <button key={f} onClick={()=>setFilter(f)} style={btnStyle(filter===f?"#185FA5":"#F1EFE8",filter===f?"#fff":"#2C2C2A",true)}>{l}</button>
        ))}
        <span style={{fontSize:12,color:"#888780",marginLeft:"auto"}}>{gefiltert.length} von {mitarbeiter.length} Mitarbeitern</span>
        <button onClick={()=>setPage("krankmeldung")} style={btnStyle("#A32D2D","#fff",true)}>🚨 Zur Krankmeldung</button>
      </div>
      <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
        <div style={{maxHeight:620,overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead style={{position:"sticky",top:0,background:"#fff",zIndex:1}}><tr>{["Name","Rolle","Modell","Qualifikationen","Arbeitstage","Studios","Kurse/Woche","Status","Aktion"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
          <tbody>
            {gefiltert.map(m=>{
              const load = weeklyCount(kurse,m.name,TODAY)
              return (
              <tr key={m.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
                <td style={tdStyle}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <Avatar name={m.name}/>
                    <div><div style={{fontWeight:500}}>{m.name}</div><div style={{fontSize:11,color:"#888780"}}>{m.email}</div></div>
                  </div>
                </td>
                <td style={tdStyle}>{m.rolle}</td>
                <td style={tdStyle}><span style={{background:m.modell==="Vollzeit"?"#E6F1FB":"#F1EFE8",color:m.modell==="Vollzeit"?"#0C447C":"#5F5E5A",fontSize:11,padding:"2px 7px",borderRadius:20}}>{m.modell}</span></td>
                <td style={{...tdStyle,fontSize:12,color:"#888780"}}>{m.qualifikationen}</td>
                <td style={tdStyle}>
                  <div style={{display:"flex",gap:3}}>
                    {WOCHENTAGE.map(t=>(
                      <span key={t} style={{width:22,height:22,borderRadius:5,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:500,
                        background:m.arbeitstage.includes(t)?"#EAF3DE":"#F1EFE8",
                        color:m.arbeitstage.includes(t)?"#27500A":"#B4B2A9"}}>{t}</span>
                    ))}
                  </div>
                </td>
                <td style={{...tdStyle,fontSize:11,color:"#888780"}}>{m.studios.map(s=>s.split("–")[0].trim()).join(", ")}</td>
                <td style={tdStyle}>
                  {load}/{m.max_kurse_woche}
                  <div style={{height:4,background:"#F1EFE8",borderRadius:4,marginTop:3,minWidth:50}}>
                    <div style={{height:"100%",borderRadius:4,background:"#185FA5",width:`${Math.min(100,Math.round(load/m.max_kurse_woche*100))}%`}}/>
                  </div>
                </td>
                <td style={tdStyle}><StatusBadge status={m.verfuegbar?"aktiv":"krank"}/></td>
                <td style={{...tdStyle,textAlign:"right",whiteSpace:"nowrap"}}>
                  <button onClick={()=>toggle(m.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>{m.verfuegbar?"Krankmelden":"Reaktivieren"}</button>
                </td>
              </tr>
            )})}
            {gefiltert.length===0 && <tr><td colSpan={9} style={{padding:24,textAlign:"center",color:"#888780"}}>Keine Mitarbeiter gefunden.</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KRANKMELDUNG mit AUTOMATISCHER VERTRETUNGSSUCHE (Fix #2)
// ══════════════════════════════════════════════════════════════════════════════
function Krankmeldung({mitarbeiter, setMitarbeiter, kurse, showToast, addBenachrichtigung, currentUser, isAdmin, zuweiseErsatz, markiereKursAusgefallen}) {
  const defaultId = isAdmin ? mitarbeiter[0]?.id : mitarbeiter.find(m=>m.name===currentUser.name)?.id
  const [sel, setSel] = useState(defaultId)
  const [von, setVon] = useState(TODAY)
  const [bis, setBis] = useState(TODAY)
  const [grund, setGrund] = useState("Krankheit")
  const [ergebnis, setErgebnis] = useState(null)

  const krank = mitarbeiter.filter(m=>!m.verfuegbar)

  const submit = () => {
    const m = mitarbeiter.find(x=>x.id===Number(sel))
    if (!m) return
    const mitarbeiterNachher = mitarbeiter.map(x=>x.id===m.id?{...x,verfuegbar:0}:x)
    setMitarbeiter(mitarbeiterNachher)
    addBenachrichtigung(`Krankmeldung: ${m.name} (${grund}) von ${von} bis ${bis}.`)

    const betroffene = kurse.filter(k=>k.trainer_name===m.name && k.status==="aktiv" && k.datum>=von && k.datum<=bis)
    const details = betroffene
      .sort((a,b)=>(a.datum+a.uhrzeit).localeCompare(b.datum+b.uhrzeit))
      .map(k=>({ kurs:k, kandidaten: findeErsatztrainer(k, mitarbeiterNachher, kurse, m.name) }))

    setErgebnis({trainer:m, betroffene:details})

    showToast(
      betroffene.length===0
        ? `Krankmeldung für ${m.name} eingereicht. Keine Kurse im Zeitraum betroffen.`
        : `Krankmeldung für ${m.name}: ${betroffene.length} Kurs(e) betroffen - automatische Vertretungssuche läuft...`,
      "#A32D2D"
    )
  }

  const handleZuweisen = (kursId, ersatzName) => {
    zuweiseErsatz(kursId, ersatzName)
    setErgebnis(prev=>prev?{...prev, betroffene: prev.betroffene.filter(b=>b.kurs.id!==kursId)}:null)
  }
  const handleAusfallen = (kursId) => {
    markiereKursAusgefallen(kursId)
    setErgebnis(prev=>prev?{...prev, betroffene: prev.betroffene.filter(b=>b.kurs.id!==kursId)}:null)
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1.2fr",gap:16}}>
      <div>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>🚨 Krankmeldung einreichen</div>
          <div style={{background:"#FAEEDA",border:"0.5px solid #FAC775",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#633806",marginBottom:14}}>
            ℹ️ Das System sucht automatisch nach Ersatztrainern für alle betroffenen Kurse (Qualifikation, Arbeitstage, Fahrtzeit, Wochenkontingent).
          </div>
          {isAdmin
            ? <><label style={labelStyle}>Trainer auswählen</label>
              <select value={sel} onChange={e=>setSel(e.target.value)} style={{...inputStyle,width:"100%"}}>
                {mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name} {!m.verfuegbar?"(bereits krank)":""}</option>)}
              </select></>
            : <div style={{padding:"8px 12px",background:"#F1EFE8",borderRadius:8,marginBottom:12,fontWeight:500}}>{currentUser.name}</div>
          }
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <div><label style={labelStyle}>Von</label><input type="date" value={von} onChange={e=>setVon(e.target.value)} style={{...inputStyle,width:"100%"}}/></div>
            <div><label style={labelStyle}>Bis</label><input type="date" value={bis} onChange={e=>setBis(e.target.value)} style={{...inputStyle,width:"100%"}}/></div>
          </div>
          <label style={{...labelStyle,marginTop:12}}>Grund</label>
          <select value={grund} onChange={e=>setGrund(e.target.value)} style={{...inputStyle,width:"100%"}}>
            {["Krankheit","Fortbildung","Wettkampf","Sonstiges"].map(g=><option key={g}>{g}</option>)}
          </select>
          <button onClick={submit} style={{...btnStyle("#A32D2D","#fff"),marginTop:16,width:"100%",justifyContent:"center"}}>
            🚨 Krankmeldung einreichen
          </button>
        </div>
        {krank.length>0&&(
          <div style={{...cardStyle,marginTop:16}}>
            <div style={{fontWeight:500,marginBottom:12}}>Aktuell abwesend ({krank.length})</div>
            <div style={{maxHeight:280,overflow:"auto"}}>
            {krank.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:10,background:"#FCEBEB",borderRadius:8,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name}/>
                  <div><div style={{fontWeight:500,fontSize:13}}>{m.name}</div><div style={{fontSize:11,color:"#888780"}}>{m.qualifikationen}</div></div>
                </div>
                {isAdmin&&<button onClick={()=>{setMitarbeiter(mitarbeiter.map(x=>x.id===m.id?{...x,verfuegbar:1}:x));showToast(`${m.name} reaktiviert`,"#3B6D11")}} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Reaktivieren</button>}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{fontWeight:500,marginBottom:12}}>🔄 Automatische Vertretungssuche - Ergebnis</div>
        {!ergebnis && (
          <div style={{textAlign:"center",padding:40,color:"#888780"}}>
            <div style={{fontSize:32,marginBottom:8}}>🔍</div>
            <div>Noch keine Krankmeldung eingereicht.</div>
            <div style={{fontSize:12,marginTop:4}}>Nach dem Einreichen werden hier automatisch passende Ersatztrainer pro betroffenem Kurs angezeigt.</div>
          </div>
        )}
        {ergebnis && ergebnis.betroffene.length===0 && (
          <div style={{background:"#EAF3DE",border:"0.5px solid #C0DD97",borderRadius:8,padding:"12px 14px",fontSize:13,color:"#27500A"}}>
            ✅ Für {ergebnis.trainer.name} sind im gewählten Zeitraum keine (weiteren) Kurse betroffen - nichts zu tun.
          </div>
        )}
        {ergebnis && ergebnis.betroffene.map(({kurs,kandidaten})=>(
          <div key={kurs.id} style={{border:"0.5px solid #D3D1C7",borderRadius:8,padding:12,marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <div>
                <strong>{kurs.name}</strong>
                <span style={{fontSize:12,color:"#888780",marginLeft:8}}>
                  {new Date(kurs.datum+"T00:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})} · {kurs.uhrzeit} · {kurs.studio_name}
                </span>
              </div>
              <StatusBadge status="krank"/>
            </div>
            {kandidaten.length===0 ? (
              <div>
                <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:6,padding:"8px 10px",fontSize:12,color:"#791F1F",marginBottom:8}}>
                  ❌ Kein geeigneter Ersatztrainer verfügbar (Qualifikation/Arbeitstag/Fahrtzeit/Kontingent).
                </div>
                <button onClick={()=>handleAusfallen(kurs.id)} style={{...btnStyle("#A32D2D","#fff",true),width:"100%",justifyContent:"center"}}>
                  ❌ Kurs als ausgefallen markieren &amp; Mitglieder informieren
                </button>
              </div>
            ) : (
              <div>
                <div style={{fontSize:11,color:"#888780",marginBottom:6}}>{kandidaten.length} geeignete(r) Ersatztrainer gefunden (sortiert nach Auslastung):</div>
                {kandidaten.map(k=>(
                  <div key={k.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:8,border:"0.5px solid #D3D1C7",borderRadius:6,marginBottom:6}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <Avatar name={k.name} size={26}/>
                      <div>
                        <div style={{fontSize:13,fontWeight:500}}>{k.name}</div>
                        <div style={{fontSize:11,color:"#888780"}}>{weeklyCount(kurse,k.name,kurs.datum)}/{k.max_kurse_woche} Kurse · {k.qualifikationen}</div>
                      </div>
                    </div>
                    <button onClick={()=>handleZuweisen(kurs.id,k.name)} style={btnStyle("#185FA5","#fff",true)}>✓ Zuweisen</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// BENACHRICHTIGUNGEN
// ══════════════════════════════════════════════════════════════════════════════
function Benachrichtigungen({benachrichtigungen, setBenachrichtigungen}) {
  const markRead = (id) => setBenachrichtigungen(b=>b.map(x=>x.id===id?{...x,gelesen:1}:x))
  const alleGelesen = () => setBenachrichtigungen(b=>b.map(x=>({...x,gelesen:1})))
  const ungelesen = benachrichtigungen.filter(b=>!b.gelesen).length
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <span style={{fontSize:13,color:"#888780"}}>{ungelesen} ungelesen</span>
        <button onClick={alleGelesen} style={btnStyle("#F1EFE8","#2C2C2A",true)}>✓ Alle gelesen</button>
      </div>
      {benachrichtigungen.map(b=>(
        <div key={b.id} style={{display:"flex",gap:12,padding:12,borderRadius:8,marginBottom:8,
          background:b.gelesen?"#fff":"#E6F1FB",
          border:b.gelesen?"0.5px solid #D3D1C7":"0.5px solid #B5D4F4",
          borderLeft:b.gelesen?"0.5px solid #D3D1C7":"3px solid #185FA5"}}>
          <span style={{fontSize:18,flexShrink:0}}>{b.kanal==="email"?"📧":"🔔"}</span>
          <div style={{flex:1}}>
            <div style={{fontSize:13}}>{b.inhalt}</div>
            <div style={{fontSize:11,color:"#888780",marginTop:3}}>{b.zeit}</div>
          </div>
          {!b.gelesen&&<button onClick={()=>markRead(b.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Gelesen</button>}
        </div>
      ))}
      {benachrichtigungen.length===0 && <div style={{textAlign:"center",padding:40,color:"#888780"}}>Keine Benachrichtigungen.</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KURS MODAL (Anlegen + Bearbeiten, mit Konfliktprüfung - Fix #4 #7)
// ══════════════════════════════════════════════════════════════════════════════
function KursModal({modal, onClose, kurse, setKurse, mitarbeiter, showToast, addBenachrichtigung, studioNamen}) {
  const editKurs = modal.type==="edit" ? modal.kurs : null
  const [name, setName]   = useState(editKurs?.name || "")
  const [typ, setTyp]     = useState(editKurs?.kurstyp_name || "Yoga")
  const [datum, setDatum] = useState(editKurs?.datum || TODAY)
  const [zeit, setZeit]   = useState(editKurs?.uhrzeit || "09:00")
  const [studio, setStudio] = useState(editKurs?.studio_name || STUDIO_NAMEN[0])
  const [trainer, setTrainer] = useState(editKurs && editKurs.trainer_name!=="Nicht zugewiesen" ? editKurs.trainer_name : "")
  const [fehler, setFehler] = useState("")

  const passendeTrainer = mitarbeiter.filter(m=>m.verfuegbar && m.qualifikationen.includes(typ) && m.studios.includes(studio))

  const save = () => {
    setFehler("")
    if (!name.trim()){ setFehler("Bitte einen Kursnamen eingeben."); return }
    if (trainer){
      const check = checkConflict(kurse, trainer, datum, zeit, studio, editKurs?editKurs.id:null)
      if (check.conflict){ setFehler(check.message); return }
    }
    if (editKurs){
      setKurse(kurse.map(k=>k.id===editKurs.id?{...k,name,kurstyp_name:typ,datum,uhrzeit:zeit,studio_name:studio,trainer_name:trainer||"Nicht zugewiesen"}:k))
      addBenachrichtigung(`Kurs "${name}" wurde bearbeitet.`)
      showToast(`Kurs "${name}" aktualisiert.`,"#3B6D11")
    } else {
      const newId = Math.max(0,...kurse.map(k=>k.id))+1
      setKurse([...kurse,{id:newId,name,kurstyp_name:typ,datum,uhrzeit:zeit,studio_name:studio,trainer_name:trainer||"Nicht zugewiesen",status:"aktiv"}])
      addBenachrichtigung(`Neuer Kurs "${name}" am ${new Date(datum+"T00:00:00").toLocaleDateString("de-DE")} um ${zeit} erstellt.`)
      if (trainer) addBenachrichtigung(`${trainer}: Neue Kurszuweisung - ${name} am ${datum} um ${zeit}.`,"email")
      showToast(`Kurs "${name}" angelegt.`,"#3B6D11")
    }
    onClose()
  }

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}}>
      <div style={{background:"#fff",borderRadius:14,padding:28,width:480,maxWidth:"95vw",maxHeight:"92vh",overflow:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:500,fontSize:15}}>{editKurs?"Kurs bearbeiten":"Neuen Kurs anlegen"}</div>
          <button onClick={onClose} style={btnStyle("#F1EFE8","#2C2C2A",true)}>✕</button>
        </div>

        {fehler && (
          <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#791F1F",marginBottom:14}}>
            ⚠️ {fehler}
          </div>
        )}

        <label style={labelStyle}>Kursname</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Yoga Basic" style={{...inputStyle,width:"100%"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          <div><label style={labelStyle}>Kurstyp</label>
            <select value={typ} onChange={e=>{setTyp(e.target.value);setTrainer("")}} style={{...inputStyle,width:"100%"}}>
              {KURSTYPEN.map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={labelStyle}>Studio</label>
            <select value={studio} onChange={e=>{setStudio(e.target.value);setTrainer("")}} style={{...inputStyle,width:"100%"}}>
            {studioNamen.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><label style={labelStyle}>Datum</label>
            <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{...inputStyle,width:"100%"}}/></div>
          <div><label style={labelStyle}>Uhrzeit</label>
            <select value={zeit} onChange={e=>setZeit(e.target.value)} style={{...inputStyle,width:"100%"}}>
              {ZEITEN_KURS.map(z=><option key={z}>{z}</option>)}
            </select></div>
        </div>
        <label style={{...labelStyle,marginTop:12}}>Trainer zuweisen ({passendeTrainer.length} passend für {typ} @ {studio.split("–")[0].trim()})</label>
        <select value={trainer} onChange={e=>setTrainer(e.target.value)} style={{...inputStyle,width:"100%"}}>
          <option value="">– Noch nicht zugewiesen –</option>
          {passendeTrainer.map(m=><option key={m.id} value={m.name}>{m.name} ({weeklyCount(kurse,m.name,datum)}/{m.max_kurse_woche})</option>)}
        </select>
        <div style={{fontSize:11,color:"#888780",marginTop:4}}>
          ℹ️ Bei Doppelbelegung erscheint hier eine Fehlermeldung ("Dieser Trainer ist zu diesem Zeitpunkt bereits eingeteilt").
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20}}>
          <button onClick={onClose} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Abbrechen</button>
          <button onClick={save} style={btnStyle("#185FA5","#fff")}>✓ Speichern</button>
        </div>
      </div>
    </div>
  )
}

// Helpers
function Avatar({name, size=32}) {
  const initials = name?.split(" ").map(x=>x[0]).join("").slice(0,2)||"?"
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#B5D4F4",color:"#042C53",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:500,flexShrink:0}}>{initials}</div>
}
function StatusBadge({status}) {
  const m = {aktiv:["#EAF3DE","#27500A","✓ Aktiv"],ausgefallen:["#FCEBEB","#791F1F","✗ Ausgefallen"],krank:["#FCEBEB","#791F1F","✗ Krank"]}
  const [bg,color,label] = m[status]||["#F1EFE8","#5F5E5A",status]
  return <span style={{background:bg,color,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500,whiteSpace:"nowrap"}}>{label}</span>
}

const cardStyle  = {background:"#fff",border:"0.5px solid #D3D1C7",borderRadius:12,padding:"16px 20px"}
const thStyle    = {textAlign:"left",padding:"8px 12px",fontSize:11,color:"#888780",borderBottom:"0.5px solid #D3D1C7",fontWeight:500,textTransform:"uppercase",letterSpacing:.4,whiteSpace:"nowrap"}
const tdStyle    = {padding:"10px 12px"}
const labelStyle = {display:"block",fontSize:12,color:"#888780",marginBottom:4,marginTop:8}
const inputStyle = {padding:"7px 10px",border:"0.5px solid #B4B2A9",borderRadius:8,background:"#fff",color:"#2C2C2A",fontSize:13,fontFamily:"inherit"}
const wkHeader   = {background:"#F1EFE8",padding:"8px 6px",fontSize:12,fontWeight:500,textAlign:"center"}
const btnStyle   = (bg,color,sm=false) => ({display:"inline-flex",alignItems:"center",gap:6,padding:sm?"4px 10px":"7px 14px",border:"0.5px solid #B4B2A9",borderRadius:8,cursor:"pointer",fontSize:sm?12:13,background:bg,color,fontFamily:"inherit",whiteSpace:"nowrap"})
