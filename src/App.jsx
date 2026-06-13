import { useState, useEffect } from "react"

// ── Live current week calculation ──────────────────────────────────────────────
function getWeekDates() {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 1=Mon...
  const monday = new Date(today)
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({length: 5}, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function fmtDate(d) {
  return d.toISOString().split("T")[0] // YYYY-MM-DD
}

function fmtShort(d) {
  return d.toLocaleDateString("de-DE", {day:"2-digit", month:"2-digit"})
}

function fmtWeekday(d) {
  return d.toLocaleDateString("de-DE", {weekday:"short"}) // Mo, Di...
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dayNum = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

const WEEK_DATES = getWeekDates()
const TODAY = fmtDate(new Date())
const WEEK_NUM = getWeekNumber(new Date())
const ZEITEN = ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00"]

// ── Mock data with real dates ──────────────────────────────────────────────────
const INITIAL_KURSE = [
  {id:1, name:"Yoga Basic",      kurstyp_name:"Yoga",           datum:fmtDate(WEEK_DATES[0]), uhrzeit:"08:00", studio_name:"Studio 1", trainer_name:"Max Müller",    status:"aktiv"},
  {id:2, name:"Spinning",        kurstyp_name:"Spinning",       datum:fmtDate(WEEK_DATES[1]), uhrzeit:"09:00", studio_name:"Studio 1", trainer_name:"Anna Weber",    status:"aktiv"},
  {id:3, name:"Pilates",         kurstyp_name:"Pilates",        datum:fmtDate(WEEK_DATES[0]), uhrzeit:"10:00", studio_name:"Studio 1", trainer_name:"Sara Bauer",    status:"aktiv"},
  {id:4, name:"Kraft & Fit",     kurstyp_name:"Krafttraining",  datum:fmtDate(WEEK_DATES[2]), uhrzeit:"11:00", studio_name:"Studio 1", trainer_name:"Jonas Klein",   status:"aktiv"},
  {id:5, name:"Functional Fit",  kurstyp_name:"Functional Fit", datum:fmtDate(WEEK_DATES[3]), uhrzeit:"08:00", studio_name:"Studio 1", trainer_name:"Max Müller",    status:"aktiv"},
  {id:6, name:"Pilates Adv.",    kurstyp_name:"Pilates",        datum:fmtDate(WEEK_DATES[4]), uhrzeit:"12:00", studio_name:"Studio 2", trainer_name:"Sara Bauer",    status:"aktiv"},
  {id:7, name:"Yoga Flow",       kurstyp_name:"Yoga",           datum:fmtDate(WEEK_DATES[1]), uhrzeit:"17:00", studio_name:"Studio 2", trainer_name:"Anna Weber",    status:"aktiv"},
  {id:8, name:"Spinning Pro",    kurstyp_name:"Spinning",       datum:fmtDate(WEEK_DATES[3]), uhrzeit:"18:00", studio_name:"Studio 2", trainer_name:"Tim Schulz",    status:"ausgefallen"},
]

// ── User accounts (stored in localStorage to simulate SQLite ──────────────────
const DEFAULT_USERS = [
  {id:1, email:"admin@fit-aktiv.de",   passwort:"admin123",   name:"Lisa Fit",      rolle:"admin",   trainer_id:null},
  {id:2, email:"max@fit-aktiv.de",     passwort:"max123",     name:"Max Müller",    rolle:"trainer", trainer_id:1},
  {id:3, email:"anna@fit-aktiv.de",    passwort:"anna123",    name:"Anna Weber",    rolle:"trainer", trainer_id:2},
  {id:4, email:"jonas@fit-aktiv.de",   passwort:"jonas123",   name:"Jonas Klein",   rolle:"trainer", trainer_id:3},
  {id:5, email:"sara@fit-aktiv.de",    passwort:"sara123",    name:"Sara Bauer",    rolle:"trainer", trainer_id:4},
  {id:6, email:"tim@fit-aktiv.de",     passwort:"tim123",     name:"Tim Schulz",    rolle:"trainer", trainer_id:5},
  {id:7, email:"lisa.h@fit-aktiv.de",  passwort:"lisa123",    name:"Lisa Hoffmann", rolle:"trainer", trainer_id:6},
]

const INITIAL_MITARBEITER = [
  {id:1, name:"Max Müller",    rolle:"Trainer",  modell:"Vollzeit", qualifikationen:"Yoga, Functional Fit",       kurse_diese_woche:2, max_kurse_woche:20, verfuegbar:1, email:"max@fit-aktiv.de"},
  {id:2, name:"Anna Weber",    rolle:"Trainerin",modell:"Vollzeit", qualifikationen:"Spinning, Pilates",          kurse_diese_woche:2, max_kurse_woche:20, verfuegbar:1, email:"anna@fit-aktiv.de"},
  {id:3, name:"Jonas Klein",   rolle:"Coach",    modell:"Vollzeit", qualifikationen:"Krafttraining, Functional Fit",kurse_diese_woche:1, max_kurse_woche:20, verfuegbar:1, email:"jonas@fit-aktiv.de"},
  {id:4, name:"Sara Bauer",    rolle:"Trainerin",modell:"Vollzeit", qualifikationen:"Pilates, Yoga",              kurse_diese_woche:2, max_kurse_woche:20, verfuegbar:1, email:"sara@fit-aktiv.de"},
  {id:5, name:"Tim Schulz",    rolle:"Trainer",  modell:"Teilzeit", qualifikationen:"Spinning",                   kurse_diese_woche:1, max_kurse_woche:8,  verfuegbar:0, email:"tim@fit-aktiv.de"},
  {id:6, name:"Lisa Hoffmann", rolle:"Trainerin",modell:"Teilzeit", qualifikationen:"Yoga, Pilates",              kurse_diese_woche:0, max_kurse_woche:8,  verfuegbar:1, email:"lisa.h@fit-aktiv.de"},
]

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
      const user = DEFAULT_USERS.find(u => u.email === email.trim() && u.passwort === passwort)
      if (user) {
        onLogin(user)
      } else {
        setFehler("E-Mail oder Passwort falsch. Bitte erneut versuchen.")
      }
      setLoading(false)
    }, 600)
  }

  return (
    <div style={{minHeight:"100vh",background:"#F1EFE8",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{width:380,background:"#fff",borderRadius:16,padding:36,border:"0.5px solid #D3D1C7",boxShadow:"0 4px 24px rgba(0,0,0,.08)"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,background:"#185FA5",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 12px",fontSize:24}}>💪</div>
          <div style={{fontSize:20,fontWeight:600,color:"#2C2C2A"}}>Fit &amp; Aktiv</div>
          <div style={{fontSize:13,color:"#888780",marginTop:2}}>Kursplanungssystem</div>
        </div>

        {fehler && (
          <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#791F1F",marginBottom:16,display:"flex",gap:8}}>
            ⚠️ {fehler}
          </div>
        )}

        <div style={{marginBottom:14}}>
          <label style={labelStyle}>E-Mail</label>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="z.B. max@fit-aktiv.de" style={{...inputStyle,width:"100%"}}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={labelStyle}>Passwort</label>
          <input type="password" value={passwort} onChange={e=>setPasswort(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            placeholder="Passwort eingeben" style={{...inputStyle,width:"100%"}}/>
        </div>

        <button onClick={submit} disabled={loading}
          style={{...btnStyle("#185FA5","#fff"),width:"100%",justifyContent:"center",padding:"10px 0",fontSize:14,opacity:loading?.7:1}}>
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        {/* Demo accounts hint */}
        <div style={{marginTop:24,padding:14,background:"#F1EFE8",borderRadius:10,fontSize:12}}>
          <div style={{fontWeight:500,marginBottom:8,color:"#5F5E5A"}}>Demo-Zugänge:</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {[
              ["Admin","admin@fit-aktiv.de","admin123"],
              ["Max Müller","max@fit-aktiv.de","max123"],
              ["Anna Weber","anna@fit-aktiv.de","anna123"],
              ["Tim Schulz","tim@fit-aktiv.de","tim123"],
            ].map(([name,mail,pw])=>(
              <div key={mail} onClick={()=>{setEmail(mail);setPasswort(pw)}}
                style={{padding:"6px 8px",background:"#fff",borderRadius:6,cursor:"pointer",border:"0.5px solid #D3D1C7",
                  transition:"all .1s"}}
                onMouseOver={e=>e.currentTarget.style.borderColor="#185FA5"}
                onMouseOut={e=>e.currentTarget.style.borderColor="#D3D1C7"}>
                <div style={{fontWeight:500,color:"#2C2C2A"}}>{name}</div>
                <div style={{color:"#888780",fontSize:11}}>{pw}</div>
              </div>
            ))}
          </div>
          <div style={{color:"#888780",marginTop:8}}>Klicke einen Eintrag um ihn einzutragen.</div>
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
  const [page, setPage] = useState("dashboard")
  const [kurse, setKurse] = useState(INITIAL_KURSE)
  const [mitarbeiter, setMitarbeiter] = useState(INITIAL_MITARBEITER)
  const [benachrichtigungen, setBenachrichtigungen] = useState([
    {id:1, inhalt:"Krankmeldung: Tim Schulz – Spinning Pro ausgefallen.", kanal:"system", gelesen:0, zeit:"vor 1 Std."},
    {id:2, inhalt:"Vertretung benötigt für Spinning Pro.", kanal:"system", gelesen:0, zeit:"vor 1 Std."},
    {id:3, inhalt:"Max Müller wurde Functional Fit zugewiesen.", kanal:"email", gelesen:0, zeit:"vor 3 Std."},
    {id:4, inhalt:"Yoga Flow erfolgreich erstellt.", kanal:"email", gelesen:1, zeit:"gestern"},
  ])
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)

  const showToast = (msg, color="#185FA5") => {
    setToast({msg, color})
    setTimeout(() => setToast(null), 3500)
  }

  const addBenachrichtigung = (inhalt, kanal="system") => {
    setBenachrichtigungen(prev => [{id:Date.now(), inhalt, kanal, gelesen:0, zeit:"gerade"}, ...prev])
  }

  if (!currentUser) return <LoginPage onLogin={u => { setCurrentUser(u); setPage("dashboard") }} />

  const isAdmin = currentUser.rolle === "admin"
  const ungelesen = benachrichtigungen.filter(b=>!b.gelesen).length
  const krank = mitarbeiter.filter(m=>!m.verfuegbar)

  // Trainer only sees their own courses
  const meineMitarbeiterId = currentUser.trainer_id
  const meinKurse = isAdmin ? kurse : kurse.filter(k => k.trainer_name === currentUser.name)

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
      <div style={{width:220,background:"#fff",borderRight:"0.5px solid #D3D1C7",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 16px 14px",borderBottom:"0.5px solid #D3D1C7"}}>
          <div style={{fontWeight:600,fontSize:16}}>💪 Fit &amp; Aktiv</div>
          <div style={{fontSize:11,color:"#888780",marginTop:2}}>Kursplanungssystem</div>
        </div>
        <div style={{padding:"8px 0",flex:1}}>
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
        <div style={{padding:16,borderTop:"0.5px solid #D3D1C7"}}>
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
          <div style={{fontWeight:500,fontSize:16}}>{PAGE_TITLES[page]||page}</div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:12,color:"#888780"}}>
              KW {WEEK_NUM} – {fmtShort(WEEK_DATES[0])} bis {fmtShort(WEEK_DATES[4])} {WEEK_DATES[0].getFullYear()}
            </span>
            {isAdmin && <button onClick={()=>setModal("neuer-kurs")} style={btnStyle("#185FA5","#fff")}>+ Neuer Kurs</button>}
          </div>
        </div>

        <div style={{padding:24}}>
          {page==="dashboard"    && <Dashboard kurse={kurse} mitarbeiter={mitarbeiter} krank={krank} setPage={setPage} isAdmin={isAdmin}/>}
          {page==="kursplan"     && <Kursplan kurse={kurse}/>}
          {page==="meinplan"     && <MeinPlan kurse={meinKurse} currentUser={currentUser} mitarbeiter={mitarbeiter}/>}
          {page==="kurse"        && <Kurse kurse={kurse} setKurse={setKurse} showToast={showToast} addBenachrichtigung={addBenachrichtigung}/>}
          {page==="mitarbeiter"  && <Mitarbeiter mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} showToast={showToast} addBenachrichtigung={addBenachrichtigung}/>}
          {page==="krankmeldung" && <Krankmeldung mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} showToast={showToast} addBenachrichtigung={addBenachrichtigung} currentUser={currentUser} isAdmin={isAdmin}/>}
          {page==="benachrichtigungen" && <Benachrichtigungen benachrichtigungen={benachrichtigungen} setBenachrichtigungen={setBenachrichtigungen}/>}
        </div>
      </div>

      {modal==="neuer-kurs" && <NeuerKursModal onClose={()=>setModal(null)} kurse={kurse} setKurse={setKurse} mitarbeiter={mitarbeiter} showToast={showToast} addBenachrichtigung={addBenachrichtigung}/>}
      {toast && <div style={{position:"fixed",bottom:24,right:24,background:toast.color,color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,zIndex:200,maxWidth:340,boxShadow:"0 4px 16px rgba(0,0,0,.15)"}}>{toast.msg}</div>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MEIN PLAN (Trainer-only view)
// ══════════════════════════════════════════════════════════════════════════════
function MeinPlan({kurse, currentUser, mitarbeiter}) {
  const ma = mitarbeiter.find(m=>m.name===currentUser.name)
  const meineKurse = kurse.filter(k=>k.trainer_name===currentUser.name)
  const heute = meineKurse.filter(k=>k.datum===TODAY)
  const woche = meineKurse.filter(k=>WEEK_DATES.map(fmtDate).includes(k.datum))

  return (
    <div>
      <div style={{background:"#fff",borderRadius:12,padding:20,border:"0.5px solid #D3D1C7",marginBottom:20}}>
        <div style={{fontSize:18,fontWeight:500,marginBottom:4}}>Guten Tag, {currentUser.name}! 👋</div>
        <div style={{fontSize:13,color:"#888780"}}>Dein Einsatzplan – KW {WEEK_NUM}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:16}}>
          {[
            {label:"Kurse diese Woche", value:woche.length, max:ma?.max_kurse_woche||20},
            {label:"Heute", value:heute.length, max:null},
            {label:"Status", value:ma?.verfuegbar?"✅ Verfügbar":"❌ Krank", max:null},
            {label:"Modell", value:ma?.modell||"Vollzeit", max:null},
          ].map(m=>(
            <div key={m.label} style={{background:"#F1EFE8",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:11,color:"#888780",marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:18,fontWeight:500}}>{m.value}</div>
              {m.max && <div style={{fontSize:11,color:"#888780"}}>von {m.max} max.</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Week calendar for trainer */}
      <div style={cardStyle}>
        <div style={{fontWeight:500,marginBottom:16}}>📅 Mein Wochenplan</div>
        <div style={{display:"grid",gridTemplateColumns:"70px repeat(5,1fr)",gap:1,background:"#D3D1C7",borderRadius:8,overflow:"hidden"}}>
          <div style={wkHeader}/>
          {WEEK_DATES.map(d=>(
            <div key={fmtDate(d)} style={{...wkHeader,background:fmtDate(d)===TODAY?"#E6F1FB":"#F1EFE8"}}>
              <div style={{fontWeight:500}}>{fmtWeekday(d)}</div>
              <div style={{fontSize:11,color:fmtDate(d)===TODAY?"#185FA5":"#888780",fontWeight:fmtDate(d)===TODAY?600:400}}>
                {fmtShort(d)}{fmtDate(d)===TODAY?" ●":""}
              </div>
            </div>
          ))}
          {ZEITEN.slice(1,10).map(zeit=>(
            <>
              <div key={"t"+zeit} style={{background:"#F1EFE8",padding:"4px 8px",fontSize:11,color:"#888780",textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>{zeit}</div>
              {WEEK_DATES.map(datum=>{
                const ks = meineKurse.filter(k=>k.datum===fmtDate(datum)&&k.uhrzeit===zeit)
                return (
                  <div key={fmtDate(datum)} style={{background:fmtDate(datum)===TODAY?"#F7FBFF":"#fff",padding:3,minHeight:44}}>
                    {ks.map(k=>(
                      <div key={k.id} style={{borderRadius:5,padding:"3px 6px",fontSize:11,lineHeight:1.3,
                        background:k.status==="ausgefallen"?"#D3D1C7":FARBEN[k.kurstyp_name]||"#B5D4F4",
                        color:k.status==="ausgefallen"?"#5F5E5A":FARBEN_TEXT[k.kurstyp_name]||"#042C53"}}>
                        <div style={{fontWeight:500}}>{k.name}</div>
                        <div style={{opacity:.8}}>{k.studio_name}</div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {meineKurse.length===0 && (
        <div style={{textAlign:"center",padding:40,color:"#888780"}}>
          <div style={{fontSize:36,marginBottom:8}}>📭</div>
          <div>Keine Kurse diese Woche zugewiesen.</div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({kurse, mitarbeiter, krank, setPage, isAdmin}) {
  const aktiv = kurse.filter(k=>k.status==="aktiv").length
  const ausgefallen = kurse.filter(k=>k.status==="ausgefallen").length
  return (
    <div>
      {krank.length>0&&(
        <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#791F1F"}}>
          <span>⚠️</span>
          <strong>{krank.length} Trainer krank:</strong> {krank.map(m=>m.name).join(", ")}
          {isAdmin&&<button onClick={()=>setPage("krankmeldung")} style={{...btnStyle("#A32D2D","#fff",true),marginLeft:"auto"}}>Vertretung suchen</button>}
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {icon:"📅", label:"Kurse diese Woche", value:kurse.length, sub:`${aktiv} aktiv, ${ausgefallen} ausgefallen`},
          {icon:"👥", label:"Verfügbare Trainer", value:mitarbeiter.filter(m=>m.verfuegbar).length, sub:`${krank.length} krank gemeldet`},
          {icon:"🏢", label:"Studios", value:3, sub:"Krefeld Mitte, Nord, Süd"},
          {icon:"👤", label:"Mitglieder", value:"~1.000", sub:"im System verwaltet"},
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
                ? <tr><td colSpan={4} style={{padding:"16px 8px",color:"#888780",textAlign:"center"}}>Keine Kurse heute</td></tr>
                : kurse.filter(k=>k.datum===TODAY).map(k=>(
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
          <div style={{fontWeight:500,marginBottom:14}}>Trainer – Wochenauslastung</div>
          {mitarbeiter.map(m=>(
            <div key={m.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name} size={24}/>
                  <span style={{fontSize:13}}>{m.name}</span>
                  {!m.verfuegbar&&<span style={{background:"#FCEBEB",color:"#791F1F",fontSize:10,padding:"1px 6px",borderRadius:10}}>Krank</span>}
                </div>
                <span style={{fontSize:12,color:"#888780"}}>{m.kurse_diese_woche}/{m.max_kurse_woche}</span>
              </div>
              <div style={{height:5,background:"#F1EFE8",borderRadius:4}}>
                <div style={{height:"100%",borderRadius:4,background:m.verfuegbar?"#185FA5":"#A32D2D",width:`${Math.round(m.kurse_diese_woche/m.max_kurse_woche*100)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KURSPLAN (Live calendar)
// ══════════════════════════════════════════════════════════════════════════════
function Kursplan({kurse}) {
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontWeight:500,fontSize:13}}>KW {WEEK_NUM} – {WEEK_DATES[0].toLocaleDateString("de-DE",{month:"long",year:"numeric"})}</span>
        <div style={{display:"flex",gap:8,marginLeft:"auto",flexWrap:"wrap"}}>
          {Object.entries(FARBEN).map(([typ,bg])=>(
            <span key={typ} style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
              <span style={{width:10,height:10,background:bg,borderRadius:2,display:"inline-block"}}/>
              {typ}
            </span>
          ))}
          <span style={{display:"flex",alignItems:"center",gap:4,fontSize:11}}>
            <span style={{width:10,height:10,background:"#D3D1C7",borderRadius:2,display:"inline-block"}}/>Ausgefallen
          </span>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"64px repeat(5,1fr)",gap:1,background:"#D3D1C7",border:"0.5px solid #D3D1C7",borderRadius:10,overflow:"hidden"}}>
        <div style={wkHeader}/>
        {WEEK_DATES.map(d=>(
          <div key={fmtDate(d)} style={{...wkHeader,background:fmtDate(d)===TODAY?"#E6F1FB":"#F1EFE8",padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontWeight:500,fontSize:12}}>{fmtWeekday(d)}</div>
            <div style={{fontSize:11,color:fmtDate(d)===TODAY?"#185FA5":"#888780",fontWeight:fmtDate(d)===TODAY?600:400}}>
              {fmtShort(d)}{fmtDate(d)===TODAY?" ●":""}
            </div>
          </div>
        ))}
        {ZEITEN.map(zeit=>(
          <>
            <div key={"t"+zeit} style={{background:"#F1EFE8",padding:"4px 6px",fontSize:11,color:"#888780",textAlign:"right",display:"flex",alignItems:"flex-start",justifyContent:"flex-end",paddingTop:6}}>{zeit}</div>
            {WEEK_DATES.map(datum=>{
              const ks = kurse.filter(k=>k.datum===fmtDate(datum)&&k.uhrzeit===zeit)
              return (
                <div key={fmtDate(datum)} style={{background:fmtDate(datum)===TODAY?"#F7FBFF":"#fff",padding:3,minHeight:52}}>
                  {ks.map(k=>(
                    <div key={k.id} style={{borderRadius:5,padding:"3px 6px",marginBottom:2,fontSize:11,lineHeight:1.3,cursor:"default",
                      background:k.status==="ausgefallen"?"#D3D1C7":FARBEN[k.kurstyp_name]||"#B5D4F4",
                      color:k.status==="ausgefallen"?"#5F5E5A":FARBEN_TEXT[k.kurstyp_name]||"#042C53"}}>
                      <div style={{fontWeight:500}}>{k.name}</div>
                      <div style={{opacity:.75}}>{k.trainer_name?.split(" ")[0]}</div>
                    </div>
                  ))}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KURSE
// ══════════════════════════════════════════════════════════════════════════════
function Kurse({kurse, setKurse, showToast, addBenachrichtigung}) {
  const toggle = (id) => {
    const k = kurse.find(x=>x.id===id)
    setKurse(kurse.map(x=>x.id===id?{...x,status:x.status==="aktiv"?"ausgefallen":"aktiv"}:x))
    const neu = k.status==="aktiv"?"ausgefallen":"aktiv"
    showToast(`${k.name}: Status → ${neu}`, neu==="aktiv"?"#3B6D11":"#A32D2D")
    addBenachrichtigung(`Kurs "${k.name}" als ${neu} markiert.`)
  }
  return (
    <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Kurs","Typ","Datum","Zeit","Studio","Trainer","Status","Aktion"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {kurse.map(k=>(
            <tr key={k.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
              <td style={tdStyle}><strong style={{fontWeight:500}}>{k.name}</strong></td>
              <td style={tdStyle}><span style={{background:"#E6F1FB",color:"#0C447C",fontSize:11,padding:"2px 7px",borderRadius:20}}>{k.kurstyp_name}</span></td>
              <td style={{...tdStyle,fontSize:12}}>{new Date(k.datum+"T00:00:00").toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit"})}</td>
              <td style={tdStyle}>{k.uhrzeit}</td>
              <td style={{...tdStyle,color:"#888780",fontSize:12}}>{k.studio_name}</td>
              <td style={tdStyle}><div style={{display:"flex",alignItems:"center",gap:6}}><Avatar name={k.trainer_name} size={22}/>{k.trainer_name}</div></td>
              <td style={tdStyle}><StatusBadge status={k.status}/></td>
              <td style={{...tdStyle,textAlign:"right"}}>
                <button onClick={()=>toggle(k.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>
                  {k.status==="aktiv"?"Ausgefallen markieren":"Reaktivieren"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MITARBEITER
// ══════════════════════════════════════════════════════════════════════════════
function Mitarbeiter({mitarbeiter, setMitarbeiter, showToast, addBenachrichtigung}) {
  const toggle = (id) => {
    const m = mitarbeiter.find(x=>x.id===id)
    setMitarbeiter(mitarbeiter.map(x=>x.id===id?{...x,verfuegbar:x.verfuegbar?0:1}:x))
    const status = m.verfuegbar ? "krank gemeldet" : "wieder verfügbar"
    showToast(`${m.name}: ${status}`, m.verfuegbar?"#A32D2D":"#3B6D11")
    addBenachrichtigung(`${m.name} ist ${status}.`)
  }
  return (
    <div style={{...cardStyle,padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Name","Rolle","Modell","Qualifikationen","Kurse/Woche","Status","Aktion"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {mitarbeiter.map(m=>(
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
                {m.kurse_diese_woche}/{m.max_kurse_woche}
                <div style={{height:4,background:"#F1EFE8",borderRadius:4,marginTop:3,minWidth:50}}>
                  <div style={{height:"100%",borderRadius:4,background:"#185FA5",width:`${Math.round(m.kurse_diese_woche/m.max_kurse_woche*100)}%`}}/>
                </div>
              </td>
              <td style={tdStyle}><StatusBadge status={m.verfuegbar?"aktiv":"krank"}/></td>
              <td style={{...tdStyle,textAlign:"right"}}>
                <button onClick={()=>toggle(m.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>{m.verfuegbar?"Krankmelden":"Reaktivieren"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KRANKMELDUNG
// ══════════════════════════════════════════════════════════════════════════════
function Krankmeldung({mitarbeiter, setMitarbeiter, showToast, addBenachrichtigung, currentUser, isAdmin}) {
  const defaultTrainer = isAdmin ? mitarbeiter[0]?.id : mitarbeiter.find(m=>m.name===currentUser.name)?.id
  const [sel, setSel] = useState(defaultTrainer||"")
  const [von, setVon] = useState(TODAY)
  const [bis, setBis] = useState(TODAY)
  const [grund, setGrund] = useState("Krankheit")
  const [vertretungFuer, setVertretungFuer] = useState(null)

  const krank = mitarbeiter.filter(m=>!m.verfuegbar)
  const verfuegbar = mitarbeiter.filter(m=>m.verfuegbar)

  const submit = () => {
    const m = mitarbeiter.find(x=>x.id===Number(sel))
    if (!m) return
    setMitarbeiter(mitarbeiter.map(x=>x.id===Number(sel)?{...x,verfuegbar:0}:x))
    addBenachrichtigung(`Krankmeldung: ${m.name} (${grund}) von ${von} bis ${bis}.`)
    showToast(`Krankmeldung für ${m.name} eingereicht. Vertretungssuche läuft...`,"#A32D2D")
    setVertretungFuer(m)
  }

  const assign = (ersatzName) => {
    showToast(`${ersatzName} als Ersatz zugewiesen. Benachrichtigung gesendet.`,"#3B6D11")
    addBenachrichtigung(`${ersatzName} übernimmt Vertretung für ${vertretungFuer?.name}.`, "email")
    setVertretungFuer(null)
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>🚨 Krankmeldung einreichen</div>
          <div style={{background:"#FAEEDA",border:"0.5px solid #FAC775",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#633806",marginBottom:14}}>
            ℹ️ Das System startet automatisch eine Vertretungssuche.
          </div>
          {isAdmin
            ? <><label style={labelStyle}>Trainer auswählen</label>
              <select value={sel} onChange={e=>setSel(e.target.value)} style={{...inputStyle,width:"100%"}}>
                {mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
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
            <div style={{fontWeight:500,marginBottom:12}}>Aktuell abwesend</div>
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
        )}
      </div>
      <div style={cardStyle}>
        <div style={{fontWeight:500,marginBottom:12}}>🔄 Verfügbare Ersatztrainer</div>
        <div style={{background:"#E6F1FB",border:"0.5px solid #B5D4F4",borderRadius:8,padding:"10px 12px",fontSize:13,color:"#0C447C",marginBottom:14}}>
          ℹ️ Das System prüft Verfügbarkeit, Qualifikation und Fahrtzeiten (1h Puffer).
        </div>
        {vertretungFuer&&<div style={{fontSize:13,fontWeight:500,marginBottom:8,padding:"6px 10px",background:"#FAEEDA",borderRadius:6}}>Ersatz für: {vertretungFuer.name}</div>}
        {verfuegbar.map(m=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:10,border:"0.5px solid #D3D1C7",borderRadius:8,marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Avatar name={m.name}/>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{m.name}</div>
                <div style={{fontSize:11,color:"#888780"}}>{m.kurse_diese_woche}/{m.max_kurse_woche} Kurse – {m.qualifikationen}</div>
              </div>
            </div>
            <button onClick={()=>assign(m.name)} style={btnStyle("#185FA5","#fff",true)}>✓ Zuweisen</button>
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
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// NEUER KURS MODAL
// ══════════════════════════════════════════════════════════════════════════════
function NeuerKursModal({onClose, kurse, setKurse, mitarbeiter, showToast, addBenachrichtigung}) {
  const [name, setName] = useState("")
  const [typ, setTyp] = useState("Yoga")
  const [datum, setDatum] = useState(TODAY)
  const [zeit, setZeit] = useState("09:00")
  const [studio, setStudio] = useState("Studio 1 – Krefeld Mitte")
  const [trainer, setTrainer] = useState("")

  const save = () => {
    if (!name.trim()) return
    setKurse([...kurse,{id:Date.now(),name,kurstyp_name:typ,datum,uhrzeit:zeit,studio_name:studio,trainer_name:trainer||"Nicht zugewiesen",status:"aktiv"}])
    addBenachrichtigung(`Neuer Kurs "${name}" am ${new Date(datum+"T00:00:00").toLocaleDateString("de-DE")} um ${zeit} erstellt.`)
    showToast(`Kurs "${name}" angelegt.`,"#3B6D11")
    onClose()
  }

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
      <div style={{background:"#fff",borderRadius:14,padding:28,width:480,maxWidth:"95vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
          <div style={{fontWeight:500,fontSize:15}}>Neuen Kurs anlegen</div>
          <button onClick={onClose} style={btnStyle("#F1EFE8","#2C2C2A",true)}>✕</button>
        </div>
        <label style={labelStyle}>Kursname</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="z.B. Yoga Basic" style={{...inputStyle,width:"100%"}}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          <div><label style={labelStyle}>Kurstyp</label>
            <select value={typ} onChange={e=>setTyp(e.target.value)} style={{...inputStyle,width:"100%"}}>
              {["Yoga","Pilates","Spinning","Krafttraining","Functional Fit"].map(t=><option key={t}>{t}</option>)}
            </select></div>
          <div><label style={labelStyle}>Studio</label>
            <select value={studio} onChange={e=>setStudio(e.target.value)} style={{...inputStyle,width:"100%"}}>
              {["Studio 1 – Krefeld Mitte","Studio 2 – Krefeld Nord","Studio 3 – Krefeld Süd"].map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><label style={labelStyle}>Datum</label>
            <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={{...inputStyle,width:"100%"}}/></div>
          <div><label style={labelStyle}>Uhrzeit</label>
            <input type="time" value={zeit} onChange={e=>setZeit(e.target.value)} style={{...inputStyle,width:"100%"}}/></div>
        </div>
        <label style={{...labelStyle,marginTop:12}}>Trainer zuweisen</label>
        <select value={trainer} onChange={e=>setTrainer(e.target.value)} style={{...inputStyle,width:"100%"}}>
          <option value="">– Noch nicht zugewiesen –</option>
          {mitarbeiter.filter(m=>m.verfuegbar).map(m=><option key={m.id}>{m.name}</option>)}
        </select>
        <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginTop:20}}>
          <button onClick={onClose} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Abbrechen</button>
          <button onClick={save} style={btnStyle("#185FA5","#fff")}>✓ Speichern</button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ────────────────────────────────────────────────────────────────────
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
