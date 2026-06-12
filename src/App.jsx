import { useState } from "react"

const API = "https://fit-aktiv-backend.onrender.com/api"

const MOCK = {
  kurse: [
    {id:1,name:"Yoga Basic",kurstyp_name:"Yoga",datum:"2026-06-09",uhrzeit:"08:00",studio_name:"Studio 1",trainer_name:"Max Müller",status:"aktiv"},
    {id:2,name:"Spinning",kurstyp_name:"Spinning",datum:"2026-06-10",uhrzeit:"09:00",studio_name:"Studio 1",trainer_name:"Anna Weber",status:"aktiv"},
    {id:3,name:"Pilates",kurstyp_name:"Pilates",datum:"2026-06-09",uhrzeit:"10:00",studio_name:"Studio 1",trainer_name:"Sara Bauer",status:"aktiv"},
    {id:4,name:"Kraft & Fit",kurstyp_name:"Krafttraining",datum:"2026-06-11",uhrzeit:"11:00",studio_name:"Studio 1",trainer_name:"Jonas Klein",status:"aktiv"},
    {id:5,name:"Functional Fit",kurstyp_name:"Functional Fit",datum:"2026-06-12",uhrzeit:"08:00",studio_name:"Studio 1",trainer_name:"Max Müller",status:"aktiv"},
    {id:6,name:"Pilates Adv.",kurstyp_name:"Pilates",datum:"2026-06-13",uhrzeit:"12:00",studio_name:"Studio 2",trainer_name:"Sara Bauer",status:"aktiv"},
    {id:7,name:"Yoga Flow",kurstyp_name:"Yoga",datum:"2026-06-10",uhrzeit:"17:00",studio_name:"Studio 2",trainer_name:"Anna Weber",status:"aktiv"},
    {id:8,name:"Spinning Pro",kurstyp_name:"Spinning",datum:"2026-06-12",uhrzeit:"18:00",studio_name:"Studio 2",trainer_name:"Tim Schulz",status:"ausgefallen"},
  ],
  mitarbeiter: [
    {id:1,name:"Max Müller",rolle:"Trainer",modell:"Vollzeit",qualifikationen:"Yoga, Functional Fit",kurse_diese_woche:5,max_kurse_woche:20,verfuegbar:1,email:"max@fit-aktiv.de"},
    {id:2,name:"Anna Weber",rolle:"Trainerin",modell:"Vollzeit",qualifikationen:"Spinning, Pilates",kurse_diese_woche:4,max_kurse_woche:20,verfuegbar:1,email:"anna@fit-aktiv.de"},
    {id:3,name:"Jonas Klein",rolle:"Coach",modell:"Vollzeit",qualifikationen:"Krafttraining, Functional Fit",kurse_diese_woche:3,max_kurse_woche:20,verfuegbar:1,email:"jonas@fit-aktiv.de"},
    {id:4,name:"Sara Bauer",rolle:"Trainerin",modell:"Vollzeit",qualifikationen:"Pilates, Yoga",kurse_diese_woche:6,max_kurse_woche:20,verfuegbar:1,email:"sara@fit-aktiv.de"},
    {id:5,name:"Tim Schulz",rolle:"Trainer",modell:"Teilzeit",qualifikationen:"Spinning",kurse_diese_woche:2,max_kurse_woche:8,verfuegbar:0,email:"tim@fit-aktiv.de"},
    {id:6,name:"Lisa Hoffmann",rolle:"Trainerin",modell:"Teilzeit",qualifikationen:"Yoga, Pilates",kurse_diese_woche:1,max_kurse_woche:8,verfuegbar:1,email:"lisa.h@fit-aktiv.de"},
  ],
  benachrichtigungen: [
    {id:1,inhalt:"Krankmeldung: Tim Schulz – Spinning Pro ausgefallen.",kanal:"system",gelesen:0,erstellt_am:"2026-06-12 07:00"},
    {id:2,inhalt:"Vertretung benötigt für Spinning Pro am 12.06 um 18:00.",kanal:"system",gelesen:0,erstellt_am:"2026-06-12 07:01"},
    {id:3,inhalt:"Max Müller wurde Functional Fit am Donnerstag zugewiesen.",kanal:"email",gelesen:0,erstellt_am:"2026-06-12 06:00"},
    {id:4,inhalt:"Yoga Flow wurde erfolgreich für Dienstag 17:00 erstellt.",kanal:"email",gelesen:1,erstellt_am:"2026-06-11 15:00"},
  ]
}

const FARBEN = {Yoga:"#B5D4F4",Pilates:"#CECBF6",Spinning:"#FAC775","Krafttraining":"#C0DD97","Functional Fit":"#C0DD97"}
const FARBEN_TEXT = {Yoga:"#042C53",Pilates:"#26215C",Spinning:"#412402","Krafttraining":"#173404","Functional Fit":"#173404"}
const TAGE = ["Mo","Di","Mi","Do","Fr"]
const TAGE_DATUM = ["09.06.","10.06.","11.06.","12.06.","13.06."]
const TAGE_VOLL = ["2026-06-09","2026-06-10","2026-06-11","2026-06-12","2026-06-13"]
const ZEITEN = ["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"]

export default function App() {
  const [page, setPage] = useState("dashboard")
  const [kurse, setKurse] = useState(MOCK.kurse)
  const [mitarbeiter, setMitarbeiter] = useState(MOCK.mitarbeiter)
  const [benachrichtigungen, setBenachrichtigungen] = useState(MOCK.benachrichtigungen)
  const [toast, setToast] = useState(null)
  const [modal, setModal] = useState(null)

  const showToast = (msg, color="#185FA5") => {
    setToast({msg, color})
    setTimeout(() => setToast(null), 3000)
  }

  const ungelesen = benachrichtigungen.filter(b => !b.gelesen).length
  const krank = mitarbeiter.filter(m => !m.verfuegbar)

  const navItems = [
    {id:"dashboard", icon:"ti-layout-dashboard", label:"Dashboard"},
    {id:"kursplan",  icon:"ti-calendar",          label:"Kursplan"},
    {id:"kurse",     icon:"ti-activity",           label:"Kurse"},
    {id:"mitarbeiter",icon:"ti-users",             label:"Mitarbeiter"},
    {id:"krankmeldung",icon:"ti-alert-circle",     label:"Krankmeldung"},
    {id:"benachrichtigungen",icon:"ti-bell",       label:"Benachrichtigungen"},
  ]

  return (
    <div style={{display:"flex",minHeight:"100vh",background:"#F1EFE8",fontFamily:"system-ui,sans-serif",fontSize:14,color:"#2C2C2A"}}>
      {/* Sidebar */}
      <div style={{width:220,background:"#fff",borderRight:"0.5px solid #D3D1C7",display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"20px 16px 14px",borderBottom:"0.5px solid #D3D1C7"}}>
          <div style={{fontWeight:500,fontSize:16}}>Fit &amp; Aktiv</div>
          <div style={{fontSize:11,color:"#888780",marginTop:2}}>Kursplanungssystem</div>
        </div>
        <div style={{padding:"8px 0"}}>
          {navItems.map(n => (
            <div key={n.id} onClick={() => setPage(n.id)}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",cursor:"pointer",
                borderLeft:`3px solid ${page===n.id?"#185FA5":"transparent"}`,
                background:page===n.id?"#F1EFE8":"transparent",
                color:page===n.id?"#2C2C2A":"#888780",fontSize:13}}>
              <i className={`ti ${n.icon}`} style={{fontSize:16}} />
              {n.label}
              {n.id==="benachrichtigungen" && ungelesen>0 &&
                <span style={{marginLeft:"auto",background:"#A32D2D",color:"#fff",fontSize:10,padding:"1px 6px",borderRadius:10}}>{ungelesen}</span>}
            </div>
          ))}
        </div>
        <div style={{marginTop:"auto",padding:16,borderTop:"0.5px solid #D3D1C7"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"#B5D4F4",color:"#042C53",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:500}}>AL</div>
            <div>
              <div style={{fontSize:13,fontWeight:500}}>Admin Lisa</div>
              <div style={{fontSize:11,color:"#888780"}}>Administrator</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,overflow:"auto"}}>
        <div style={{background:"#fff",borderBottom:"0.5px solid #D3D1C7",padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontWeight:500,fontSize:16}}>
            {{dashboard:"Dashboard",kursplan:"Kursplan – Woche 24",kurse:"Kursverwaltung",mitarbeiter:"Mitarbeiterverwaltung",krankmeldung:"Krankmeldung & Vertretung",benachrichtigungen:"Benachrichtigungen"}[page]}
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:12,color:"#888780"}}>Mo 09.06. – Fr 13.06.2026</span>
            <button onClick={() => setModal("neuer-kurs")} style={btnStyle("#185FA5","#fff")}>+ Neuer Kurs</button>
          </div>
        </div>

        <div style={{padding:24}}>
          {page==="dashboard"    && <Dashboard kurse={kurse} mitarbeiter={mitarbeiter} krank={krank} showToast={showToast} setModal={setModal} setPage={setPage} />}
          {page==="kursplan"     && <Kursplan kurse={kurse} />}
          {page==="kurse"        && <Kurse kurse={kurse} setKurse={setKurse} showToast={showToast} />}
          {page==="mitarbeiter"  && <Mitarbeiter mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} showToast={showToast} setBenachrichtigungen={setBenachrichtigungen} />}
          {page==="krankmeldung" && <Krankmeldung mitarbeiter={mitarbeiter} setMitarbeiter={setMitarbeiter} showToast={showToast} setBenachrichtigungen={setBenachrichtigungen} />}
          {page==="benachrichtigungen" && <Benachrichtigungen benachrichtigungen={benachrichtigungen} setBenachrichtigungen={setBenachrichtigungen} />}
        </div>
      </div>

      {/* Modal: Neuer Kurs */}
      {modal==="neuer-kurs" && <NeuerKursModal onClose={() => setModal(null)} kurse={kurse} setKurse={setKurse} mitarbeiter={mitarbeiter} showToast={showToast} />}

      {/* Toast */}
      {toast && <div style={{position:"fixed",bottom:24,right:24,background:toast.color,color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:13,zIndex:200,maxWidth:320}}>{toast.msg}</div>}
    </div>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
function Dashboard({kurse, mitarbeiter, krank, showToast, setModal, setPage}) {
  const aktiv = kurse.filter(k=>k.status==="aktiv").length
  const ausgefallen = kurse.filter(k=>k.status==="ausgefallen").length
  return (
    <div>
      {krank.length>0 && (
        <div style={{background:"#FCEBEB",border:"0.5px solid #F7C1C1",borderRadius:8,padding:"10px 14px",marginBottom:20,display:"flex",alignItems:"center",gap:8,fontSize:13,color:"#791F1F"}}>
          <i className="ti ti-alert-triangle" />
          <strong>{krank.length} Trainer krank:</strong> {krank.map(m=>m.name).join(", ")} – bitte Vertretung organisieren.
          <button onClick={() => setPage("krankmeldung")} style={{...btnStyle("#A32D2D","#fff"),marginLeft:"auto",fontSize:12,padding:"4px 10px"}}>Vertretung suchen</button>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}}>
        {[
          {label:"Kurse diese Woche", value:kurse.length, sub:`${aktiv} aktiv, ${ausgefallen} ausgefallen`},
          {label:"Verfügbare Trainer", value:mitarbeiter.filter(m=>m.verfuegbar).length, sub:`${krank.length} krank gemeldet`},
          {label:"Studios", value:3, sub:"Krefeld Mitte, Nord, Süd"},
          {label:"Mitglieder", value:"~1.000", sub:"im System verwaltet"},
        ].map(m => (
          <div key={m.label} style={{background:"#F1EFE8",borderRadius:8,padding:"14px 16px"}}>
            <div style={{fontSize:12,color:"#888780",marginBottom:4}}>{m.label}</div>
            <div style={{fontSize:22,fontWeight:500}}>{m.value}</div>
            <div style={{fontSize:11,color:"#888780",marginTop:2}}>{m.sub}</div>
          </div>
        ))}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>Heutige Kurse</div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr>{["Zeit","Kurs","Trainer","Status"].map(h=><th key={h} style={{textAlign:"left",padding:"6px 8px",fontSize:11,color:"#888780",borderBottom:"0.5px solid #D3D1C7"}}>{h}</th>)}</tr></thead>
            <tbody>
              {kurse.slice(0,6).map(k=>(
                <tr key={k.id}>
                  <td style={{padding:"8px",color:"#888780"}}>{k.uhrzeit}</td>
                  <td style={{padding:"8px",fontWeight:500}}>{k.name}</td>
                  <td style={{padding:"8px"}}>{k.trainer_name}</td>
                  <td style={{padding:"8px"}}><StatusBadge status={k.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14}}>Trainer – Wochenauslastung</div>
          {mitarbeiter.map(m=>(
            <div key={m.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name}/>
                  <span style={{fontSize:13}}>{m.name}</span>
                  {!m.verfuegbar && <span style={{background:"#FCEBEB",color:"#791F1F",fontSize:10,padding:"1px 6px",borderRadius:10}}>Krank</span>}
                </div>
                <span style={{fontSize:12,color:"#888780"}}>{m.kurse_diese_woche}/{m.max_kurse_woche}</span>
              </div>
              <div style={{height:6,background:"#F1EFE8",borderRadius:4,overflow:"hidden"}}>
                <div style={{height:"100%",borderRadius:4,background:m.verfuegbar?"#185FA5":"#A32D2D",width:`${Math.round(m.kurse_diese_woche/m.max_kurse_woche*100)}%`}}/>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Kursplan ───────────────────────────────────────────────────────────────────
function Kursplan({kurse}) {
  return (
    <div>
      <div style={{display:"flex",gap:12,marginBottom:16,flexWrap:"wrap"}}>
        {Object.entries(FARBEN).map(([typ,bg])=>(
          <span key={typ} style={{display:"flex",alignItems:"center",gap:4,fontSize:12}}>
            <span style={{width:12,height:12,background:bg,borderRadius:3,display:"inline-block"}}/>
            {typ}
          </span>
        ))}
        <span style={{display:"flex",alignItems:"center",gap:4,fontSize:12}}>
          <span style={{width:12,height:12,background:"#D3D1C7",borderRadius:3,display:"inline-block"}}/>Ausgefallen
        </span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"60px repeat(5,1fr)",gap:1,background:"#D3D1C7",border:"0.5px solid #D3D1C7",borderRadius:8,overflow:"hidden"}}>
        <div style={wkHeader}/>
        {TAGE.map((t,i)=><div key={t} style={wkHeader}><div style={{fontWeight:500}}>{t}</div><div style={{fontSize:11,color:"#888780"}}>{TAGE_DATUM[i]}</div></div>)}
        {ZEITEN.map(zeit=>(
          <>
            <div key={"t"+zeit} style={{background:"#F1EFE8",padding:"6px 8px",fontSize:11,color:"#888780",textAlign:"right",display:"flex",alignItems:"center",justifyContent:"flex-end"}}>{zeit}</div>
            {TAGE_VOLL.map(datum=>{
              const ks = kurse.filter(k=>k.datum===datum && k.uhrzeit===zeit)
              return (
                <div key={datum} style={{background:"#fff",padding:4,minHeight:48}}>
                  {ks.map(k=>(
                    <div key={k.id} style={{borderRadius:4,padding:"3px 5px",marginBottom:2,fontSize:11,lineHeight:1.3,
                      background:k.status==="ausgefallen"?"#D3D1C7":FARBEN[k.kurstyp_name]||"#B5D4F4",
                      color:k.status==="ausgefallen"?"#5F5E5A":FARBEN_TEXT[k.kurstyp_name]||"#042C53"}}>
                      <div>{k.name}</div>
                      <div style={{opacity:.7}}>{k.trainer_name?.split(" ")[0]}</div>
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

// ── Kurse ──────────────────────────────────────────────────────────────────────
function Kurse({kurse, setKurse, showToast}) {
  const toggle = (id) => {
    setKurse(kurse.map(k=>k.id===id?{...k,status:k.status==="aktiv"?"ausgefallen":"aktiv"}:k))
    const k=kurse.find(x=>x.id===id)
    showToast(`${k.name}: Status geändert.`, k.status==="aktiv"?"#A32D2D":"#3B6D11")
  }
  return (
    <div style={cardStyle}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Kurs","Typ","Datum","Zeit","Studio","Trainer","Status",""].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {kurse.map(k=>(
            <tr key={k.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
              <td style={tdStyle}><strong style={{fontWeight:500}}>{k.name}</strong></td>
              <td style={tdStyle}><span style={{background:"#E6F1FB",color:"#0C447C",fontSize:11,padding:"2px 7px",borderRadius:20}}>{k.kurstyp_name}</span></td>
              <td style={tdStyle}>{k.datum}</td>
              <td style={tdStyle}>{k.uhrzeit}</td>
              <td style={{...tdStyle,color:"#888780",fontSize:12}}>{k.studio_name}</td>
              <td style={tdStyle}><div style={{display:"flex",alignItems:"center",gap:6}}><Avatar name={k.trainer_name} size={24}/>{k.trainer_name}</div></td>
              <td style={tdStyle}><StatusBadge status={k.status}/></td>
              <td style={{...tdStyle,textAlign:"right"}}>
                <button onClick={()=>toggle(k.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>{k.status==="aktiv"?"Ausgefallen markieren":"Reaktivieren"}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Mitarbeiter ────────────────────────────────────────────────────────────────
function Mitarbeiter({mitarbeiter, setMitarbeiter, showToast, setBenachrichtigungen}) {
  const toggle = (id) => {
    const m = mitarbeiter.find(x=>x.id===id)
    setMitarbeiter(mitarbeiter.map(x=>x.id===id?{...x,verfuegbar:x.verfuegbar?0:1}:x))
    setBenachrichtigungen(prev=>[{id:Date.now(),inhalt:`${m.name} ist ${m.verfuegbar?"jetzt krank gemeldet":"wieder verfügbar"}.`,kanal:"system",gelesen:0,erstellt_am:"gerade"},...prev])
    showToast(`${m.name}: Status geändert.`, m.verfuegbar?"#A32D2D":"#3B6D11")
  }
  return (
    <div style={cardStyle}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr>{["Name","Rolle","Modell","Qualifikationen","Kurse diese Woche","Status",""].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
        <tbody>
          {mitarbeiter.map(m=>(
            <tr key={m.id} style={{borderBottom:"0.5px solid #D3D1C7"}}>
              <td style={tdStyle}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name}/>
                  <div>
                    <div style={{fontWeight:500}}>{m.name}</div>
                    <div style={{fontSize:11,color:"#888780"}}>{m.email}</div>
                  </div>
                </div>
              </td>
              <td style={tdStyle}>{m.rolle}</td>
              <td style={tdStyle}><span style={{background:m.modell==="Vollzeit"?"#E6F1FB":"#F1EFE8",color:m.modell==="Vollzeit"?"#0C447C":"#5F5E5A",fontSize:11,padding:"2px 7px",borderRadius:20}}>{m.modell}</span></td>
              <td style={{...tdStyle,fontSize:12,color:"#888780"}}>{m.qualifikationen}</td>
              <td style={tdStyle}>
                <span style={{fontSize:13}}>{m.kurse_diese_woche}/{m.max_kurse_woche}</span>
                <div style={{height:5,background:"#F1EFE8",borderRadius:4,marginTop:3,minWidth:60}}>
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

// ── Krankmeldung ───────────────────────────────────────────────────────────────
function Krankmeldung({mitarbeiter, setMitarbeiter, showToast, setBenachrichtigungen}) {
  const [sel, setSel] = useState(mitarbeiter[0]?.id)
  const [von, setVon] = useState("2026-06-12")
  const [bis, setBis] = useState("2026-06-12")
  const [grund, setGrund] = useState("Krankheit")
  const [vertretungFuer, setVertretungFuer] = useState(null)

  const krank = mitarbeiter.filter(m=>!m.verfuegbar)
  const verfuegbar = mitarbeiter.filter(m=>m.verfuegbar)

  const submit = () => {
    const m = mitarbeiter.find(x=>x.id===Number(sel))
    setMitarbeiter(mitarbeiter.map(x=>x.id===Number(sel)?{...x,verfuegbar:0}:x))
    setBenachrichtigungen(prev=>[{id:Date.now(),inhalt:`Krankmeldung: ${m.name} (${grund}) von ${von} bis ${bis}.`,kanal:"system",gelesen:0,erstellt_am:"gerade"},...prev])
    showToast(`Krankmeldung für ${m.name} eingereicht. Vertretungssuche läuft...`,"#A32D2D")
    setVertretungFuer(m)
  }

  const assign = (ersatzName) => {
    showToast(`${ersatzName} als Ersatz zugewiesen. Benachrichtigung gesendet.`,"#3B6D11")
    setBenachrichtigungen(prev=>[{id:Date.now(),inhalt:`${ersatzName} übernimmt Vertretung für ${vertretungFuer?.name}.`,kanal:"email",gelesen:0,erstellt_am:"gerade"},...prev])
    setVertretungFuer(null)
  }

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
      <div>
        <div style={cardStyle}>
          <div style={{fontWeight:500,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><i className="ti ti-alert-circle" style={{color:"#A32D2D"}}/>Krankmeldung einreichen</div>
          <div style={{background:"#FAEEDA",border:"0.5px solid #FAC775",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#633806",marginBottom:14,display:"flex",gap:8}}>
            <i className="ti ti-info-circle"/>Das System startet automatisch eine Vertretungssuche.
          </div>
          <label style={labelStyle}>Trainer</label>
          <select value={sel} onChange={e=>setSel(e.target.value)} style={inputStyle}>
            {mitarbeiter.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
            <div><label style={labelStyle}>Von</label><input type="date" value={von} onChange={e=>setVon(e.target.value)} style={inputStyle}/></div>
            <div><label style={labelStyle}>Bis</label><input type="date" value={bis} onChange={e=>setBis(e.target.value)} style={inputStyle}/></div>
          </div>
          <label style={{...labelStyle,marginTop:12}}>Grund</label>
          <select value={grund} onChange={e=>setGrund(e.target.value)} style={inputStyle}>
            {["Krankheit","Fortbildung","Wettkampf","Sonstiges"].map(g=><option key={g}>{g}</option>)}
          </select>
          <button onClick={submit} style={{...btnStyle("#A32D2D","#fff"),marginTop:16,width:"100%",justifyContent:"center"}}>
            <i className="ti ti-alert-circle"/> Krankmeldung einreichen
          </button>
        </div>

        {krank.length>0 && (
          <div style={{...cardStyle,marginTop:16}}>
            <div style={{fontWeight:500,marginBottom:12}}>Aktuell abwesend</div>
            {krank.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:10,background:"#F1EFE8",borderRadius:8,marginBottom:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <Avatar name={m.name}/>
                  <div><div style={{fontWeight:500,fontSize:13}}>{m.name}</div><div style={{fontSize:11,color:"#888780"}}>{m.qualifikationen}</div></div>
                </div>
                <span style={{background:"#FCEBEB",color:"#791F1F",fontSize:11,padding:"2px 8px",borderRadius:20}}>Krank</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={cardStyle}>
        <div style={{fontWeight:500,marginBottom:12,display:"flex",alignItems:"center",gap:8}}><i className="ti ti-arrows-exchange" style={{color:"#185FA5"}}/>Vertretungssuche</div>
        <div style={{background:"#E6F1FB",border:"0.5px solid #B5D4F4",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#0C447C",marginBottom:14,display:"flex",gap:8}}>
          <i className="ti ti-info-circle"/>Das System prüft Verfügbarkeit, Qualifikation und Fahrtzeiten (1h Puffer).
        </div>
        {vertretungFuer && (
          <div style={{marginBottom:8,fontSize:13,fontWeight:500}}>Ersatz für {vertretungFuer.name}:</div>
        )}
        {verfuegbar.map(m=>(
          <div key={m.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:10,border:"0.5px solid #D3D1C7",borderRadius:8,marginBottom:6}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <Avatar name={m.name}/>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{m.name}</div>
                <div style={{fontSize:11,color:"#888780"}}>{m.kurse_diese_woche}/{m.max_kurse_woche} Kurse – {m.qualifikationen}</div>
              </div>
            </div>
            <button onClick={()=>assign(m.name)} style={btnStyle("#185FA5","#fff")}>✓ Zuweisen</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Benachrichtigungen ─────────────────────────────────────────────────────────
function Benachrichtigungen({benachrichtigungen, setBenachrichtigungen}) {
  const markRead = (id) => setBenachrichtigungen(b=>b.map(x=>x.id===id?{...x,gelesen:1}:x))
  const alleGelesen = () => setBenachrichtigungen(b=>b.map(x=>({...x,gelesen:1})))
  const ungelesen = benachrichtigungen.filter(b=>!b.gelesen).length
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div style={{fontSize:13,color:"#888780"}}>{ungelesen} ungelesene Benachrichtigung{ungelesen!==1?"en":""}</div>
        <button onClick={alleGelesen} style={btnStyle("#F1EFE8","#2C2C2A",true)}>✓ Alle als gelesen markieren</button>
      </div>
      {benachrichtigungen.map(b=>(
        <div key={b.id} style={{display:"flex",alignItems:"flex-start",gap:12,padding:12,borderRadius:8,marginBottom:8,
          border:b.gelesen?"0.5px solid #D3D1C7":"0.5px solid #B5D4F4",
          background:b.gelesen?"#fff":"#E6F1FB",
          borderLeft:b.gelesen?"0.5px solid #D3D1C7":"3px solid #185FA5"}}>
          <i className={`ti ${b.kanal==="system"?"ti-bell":"ti-mail"}`} style={{fontSize:18,color:b.gelesen?"#888780":"#185FA5",marginTop:1}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:13}}>{b.inhalt}</div>
            <div style={{fontSize:11,color:"#888780",marginTop:3}}>{b.erstellt_am}</div>
          </div>
          {!b.gelesen && <button onClick={()=>markRead(b.id)} style={btnStyle("#F1EFE8","#2C2C2A",true)}>Gelesen</button>}
        </div>
      ))}
    </div>
  )
}

// ── Neuer Kurs Modal ───────────────────────────────────────────────────────────
function NeuerKursModal({onClose, kurse, setKurse, mitarbeiter, showToast}) {
  const [name, setName] = useState("")
  const [typ, setTyp] = useState("Yoga")
  const [datum, setDatum] = useState("2026-06-09")
  const [zeit, setZeit] = useState("09:00")
  const [studio, setStudio] = useState("Studio 1 – Krefeld Mitte")
  const [trainer, setTrainer] = useState("")

  const save = () => {
    if(!name.trim()) return
    setKurse([...kurse,{id:Date.now(),name,kurstyp_name:typ,datum,uhrzeit:zeit,studio_name:studio,trainer_name:trainer||"Nicht zugewiesen",status:"aktiv"}])
    showToast(`Kurs "${name}" wurde angelegt.`,"#3B6D11")
    onClose()
  }

  return (
    <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}}>
      <div style={{background:"#fff",borderRadius:12,padding:24,width:480,maxWidth:"95vw"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div style={{fontWeight:500,fontSize:15}}>Neuen Kurs anlegen</div>
          <button onClick={onClose} style={btnStyle("#F1EFE8","#2C2C2A",true)}>✕</button>
        </div>
        <label style={labelStyle}>Kursname</label>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="z. B. Yoga Basic" style={inputStyle}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
          <div>
            <label style={labelStyle}>Kurstyp</label>
            <select value={typ} onChange={e=>setTyp(e.target.value)} style={inputStyle}>
              {["Yoga","Pilates","Spinning","Krafttraining","Functional Fit"].map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Studio</label>
            <select value={studio} onChange={e=>setStudio(e.target.value)} style={inputStyle}>
              {["Studio 1 – Krefeld Mitte","Studio 2 – Krefeld Nord","Studio 3 – Krefeld Süd"].map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Datum</label>
            <input type="date" value={datum} onChange={e=>setDatum(e.target.value)} style={inputStyle}/>
          </div>
          <div>
            <label style={labelStyle}>Uhrzeit</label>
            <input type="time" value={zeit} onChange={e=>setZeit(e.target.value)} style={inputStyle}/>
          </div>
        </div>
        <label style={{...labelStyle,marginTop:12}}>Trainer</label>
        <select value={trainer} onChange={e=>setTrainer(e.target.value)} style={inputStyle}>
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
  return <div style={{width:size,height:size,borderRadius:"50%",background:"#B5D4F4",color:"#042C53",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:500,flexShrink:0}}>{initials}</div>
}

function StatusBadge({status}) {
  const map = {aktiv:["#EAF3DE","#27500A","Aktiv"],ausgefallen:["#FCEBEB","#791F1F","Ausgefallen"],krank:["#FCEBEB","#791F1F","Krank"],verfügbar:["#EAF3DE","#27500A","Verfügbar"]}
  const [bg,color,label] = map[status]||["#F1EFE8","#5F5E5A",status]
  return <span style={{background:bg,color,fontSize:11,padding:"2px 8px",borderRadius:20,fontWeight:500}}>{label}</span>
}

const cardStyle = {background:"#fff",border:"0.5px solid #D3D1C7",borderRadius:12,padding:"16px 20px"}
const thStyle = {textAlign:"left",padding:"8px 12px",fontSize:11,color:"#888780",borderBottom:"0.5px solid #D3D1C7",fontWeight:500,textTransform:"uppercase",letterSpacing:.4}
const tdStyle = {padding:"10px 12px"}
const labelStyle = {display:"block",fontSize:12,color:"#888780",marginBottom:4}
const inputStyle = {width:"100%",padding:"7px 10px",border:"0.5px solid #B4B2A9",borderRadius:8,background:"#fff",color:"#2C2C2A",fontSize:13,fontFamily:"inherit"}
const wkHeader = {background:"#F1EFE8",padding:"8px 6px",fontSize:12,fontWeight:500,textAlign:"center"}
const btnStyle = (bg,color,sm=false) => ({display:"inline-flex",alignItems:"center",gap:6,padding:sm?"5px 10px":"7px 14px",border:"0.5px solid #B4B2A9",borderRadius:8,cursor:"pointer",fontSize:sm?12:13,background:bg,color,fontFamily:"inherit"})
