import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { FilterSidebar } from './components/filters/FilterSidebar.jsx';
import { IcdSearchBar } from './components/search/IcdSearchBar.jsx';
import { BenefitOptionScope } from './components/options/BenefitOptionScope.jsx';
import { ClinicalGuidelinesPanel } from './components/guidelines/ClinicalGuidelinesPanel.jsx';
import { useSavedSearch } from './hooks/useSavedSearch.js';
import { getEmptyFilterState } from './lib/filters.js';
import pmbData from './data/pmb/pmb-data.json';

// ════════════════════════════════════════════════════════════════════════════
// CLAIMGUARD SA — PMB Regulatory Lookup Engine (Full CMS Dataset)
// Author: Dr Francis Ngema · Medical Advisory Services · GEMS
// Data: CMS PMB ICD-10 Coded List (Circular 47 of 2022) — 267 DTPs, 11,190+ ICD-10 codes
// Architecture: Inverted Index Search · Prefix Matching · Relevance Scoring · Lazy-Loaded Cache
// ════════════════════════════════════════════════════════════════════════════

// Stop words: Common terms filtered to improve search relevance
const STOP_WORDS = new Set(["the","of","and","in","to","a","with","or","for","is","by","an","on","at","as","it","its","not","be","no","are","was","has","had","but","from","this","that","which","other","than","into","also","such","can","may","been","have","will","more","most","some","any","all","each","both","few","only","own","same","so","very","just","because","through","during","before","after","above","below","between","under","over","about","up","out","off","down","then","once","here","there","when","where","why","how","what","who","whom","whose","unspecified","site","sites","multiple","region"]);

// DATA: Each entry = {d:DTP, n:description, t:treatment, c:category, l:CDL, codes:[[icd10,desc],...]}
const D = pmbData;


// ════════════════════════════════════════════════════════════════════════════
// TOKENIZATION HELPER
// ════════════════════════════════════════════════════════════════════════════
function tokenize(text) {
  if (!text) return [];
  return text.toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

// ════════════════════════════════════════════════════════════════════════════
// SEARCH ENGINE — Inverted Index with Multi-Stage Relevance Scoring
// ════════════════════════════════════════════════════════════════════════════
class PMBSearch {
  constructor(dtps) {
    this.dtps = dtps;
    this.catSet = new Set();
    this._searchIndex = null;
  }
  
  buildIndex() {
    if (this._searchIndex) return this._searchIndex;
    
    const condIndex = new Map();
    const codeIndex = new Map();
    const icd10Map = new Map();
    
    this.dtps.forEach((dtp, ci) => {
      this.catSet.add(dtp.c);
      
      // Index condition description + treatment
      const condTokens = new Set([...tokenize(dtp.n), ...tokenize(dtp.t)]);
      condTokens.forEach(tok => {
        if (!condIndex.has(tok)) condIndex.set(tok, new Set());
        condIndex.get(tok).add(ci);
      });
      
      // Index each ICD-10 code
      dtp.codes.forEach((code, ki) => {
        const [icd10, desc] = code;
        const normCode = icd10.toLowerCase().replace(/\./g, "").replace(/\s/g, "");
        const withDot = icd10.toLowerCase();
        
        // Store both normalized and with-dot versions
        icd10Map.set(normCode, { ci, ki });
        if (normCode !== withDot.replace(/\./g, "").replace(/\s/g, "")) {
          icd10Map.set(withDot.replace(/\./g, "").replace(/\s/g, ""), { ci, ki });
        }
        
        // Index ICD-10 description tokens
        const descTokens = tokenize(desc);
        descTokens.forEach(tok => {
          if (!codeIndex.has(tok)) codeIndex.set(tok, []);
          codeIndex.get(tok).push({ ci, ki });
        });
      });
    });
    
    this._searchIndex = { condIndex, codeIndex, icd10Map };
    return this._searchIndex;
  }
  
  search(query, cat = 'All', maxResults = 40) {
    const idx = this.buildIndex();
    const q = query.trim();
    if (!q || q.length < 2) return [];
    
    const results = new Map();
    
    const addResult = (ci, score, ki = null) => {
      if (cat !== 'All' && this.dtps[ci].c !== cat) return;
      if (!results.has(ci)) results.set(ci, { score: 0, codes: new Set() });
      const r = results.get(ci);
      r.score = Math.max(r.score, score);
      if (ki !== null) r.codes.add(ki);
    };
    
    const normQ = q.toLowerCase().replace(/\./g, "").replace(/\s/g, "");
    
    // STAGE 1: EXACT ICD-10 CODE MATCH — Score: 1000
    const exact = idx.icd10Map.get(normQ);
    if (exact) {
      addResult(exact.ci, 1000, exact.ki);
    }
    
    // STAGE 2: ICD-10 PREFIX MATCH — Score: 800-100
    const isCodeLike = /^[A-Za-z]\d/.test(q);
    if (isCodeLike) {
      const prefix = normQ;
      idx.icd10Map.forEach((val, key) => {
        if (key.startsWith(prefix) && key !== normQ) {
          const lengthDiff = key.length - prefix.length;
          const score = Math.max(100, 800 - (lengthDiff * 15));
          addResult(val.ci, score, val.ki);
        }
      });
    }
    
    // STAGE 3: CONDITION NAME/TREATMENT TEXT SEARCH — Score: 300-600+
    const queryTokens = tokenize(q);
    if (queryTokens.length > 0) {
      const condScores = new Map();
      
      // Find conditions matching query tokens
      queryTokens.forEach(tok => {
        if (idx.condIndex.has(tok)) {
          idx.condIndex.get(tok).forEach(ci => {
            condScores.set(ci, (condScores.get(ci) || 0) + 3);
          });
        }
        // Prefix matching for tokens
        if (tok.length >= 3) {
          idx.condIndex.forEach((condSet, iTok) => {
            if (iTok.startsWith(tok) && iTok !== tok) {
              condSet.forEach(ci => condScores.set(ci, (condScores.get(ci) || 0) + 1.5));
            }
          });
        }
      });
      
      // Score conditions
      condScores.forEach((score, ci) => {
        const condText = (this.dtps[ci].n + " " + this.dtps[ci].t).toLowerCase();
        const matchCount = queryTokens.filter(tok => condText.includes(tok)).length;
        
        if (matchCount === queryTokens.length) {
          addResult(ci, 600 + score * 12);
        } else if (matchCount >= Math.ceil(queryTokens.length * 0.6)) {
          addResult(ci, 300 + score * 8);
        }
      });
    }
    
    // STAGE 4: ICD-10 DESCRIPTION TEXT SEARCH — Score: 200-300+
    if (queryTokens.length > 0) {
      const codeScores = new Map();
      
      queryTokens.forEach(tok => {
        if (idx.codeIndex.has(tok)) {
          idx.codeIndex.get(tok).forEach(({ ci, ki }) => {
            const key = ci + "-" + ki;
            codeScores.set(key, (codeScores.get(key) || 0) + 1);
          });
        }
        // Prefix matching for code descriptions
        if (tok.length >= 3) {
          idx.codeIndex.forEach((entries, iTok) => {
            if (iTok.startsWith(tok) && iTok !== tok) {
              entries.forEach(({ ci, ki }) => {
                const key = ci + "-" + ki;
                codeScores.set(key, (codeScores.get(key) || 0) + 0.5);
              });
            }
          });
        }
      });
      
      codeScores.forEach((matchCount, key) => {
        const [ci, ki] = key.split("-").map(Number);
        if (matchCount >= queryTokens.length * 0.7) {
          const codeText = this.dtps[ci].codes[ki][1].toLowerCase();
          const fullMatch = queryTokens.filter(tok => codeText.includes(tok)).length;
          if (fullMatch >= Math.ceil(queryTokens.length * 0.7)) {
            addResult(ci, 200 + fullMatch * 20, ki);
          }
        }
      });
    }
    
    // Return sorted results
    return Array.from(results.entries())
      .map(([ci, data]) => ({
        ...this.dtps[ci],
        _score: data.score,
        _matchedCodes: Array.from(data.codes).slice(0, 25)
      }))
      .sort((a, b) => b._score - a._score)
      .slice(0, maxResults);
  }
  
  categories() { return ['All', ...[...this.catSet].sort()]; }
  cdl() { return this.dtps.filter(d => d.l); }
  byCategory(cat) { return cat === 'All' ? this.dtps : this.dtps.filter(d => d.c === cat); }
}

function useDebounce(v, ms) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export default function ClaimGuardSA() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [sel, setSel] = useState(null);
  const [tab, setTab] = useState('search');
  const [catF, setCatF] = useState('All');
  const [searched, setSearched] = useState(false);
  const ref = useRef(null);
  const [filters, setFilters] = useState(getEmptyFilterState);
  const { saved, save: saveFilter, clear: clearFilter } = useSavedSearch();
  const dq = useDebounce(query, 150);
  const eng = useMemo(() => new PMBSearch(D), []);
  const cats = useMemo(() => eng.categories(), [eng]);
  const cdl = useMemo(() => eng.cdl(), [eng]);
  const totalCodes = useMemo(() => D.reduce((s, d) => s + d.codes.length, 0), []);

  useEffect(() => {
    if (dq.length >= 2) {
      setResults(eng.search(dq, catF));
      setSearched(true);
      setSel(null);
    } else { setResults([]); setSearched(false); }
  }, [dq, catF, eng]);

  const clear = useCallback(() => { setQuery(''); setResults([]); setSel(null); setSearched(false); ref.current?.focus(); }, []);

  const S = styles;
  return (
    <div style={S.wrap}>
      <div style={S.bg} />
      <header style={S.hdr}>
        <div style={S.hdrIn}>
          <div style={S.logo}>
            <div style={S.shield}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#shieldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><defs><linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#60A5FA"/><stop offset="100%" stopColor="#38BDF8"/></linearGradient></defs><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4" strokeWidth="2.5"/></svg></div>
            <div><h1 style={S.ttl}>ClaimGuard SA</h1><p style={S.sub}>PMB Regulatory Lookup Engine · CMS Coded List 2022</p></div>
          </div>
          <div style={S.stat}><span style={S.dot}/><span style={S.statTx}>{totalCodes.toLocaleString()} ICD-10 codes · {D.length} DTPs · 26 CDL</span></div>
        </div>
        <style>{`@keyframes pulse{0%,100%{opacity:1;box-shadow:0 0 10px rgba(96,165,250,.6)}50%{opacity:.5;box-shadow:0 0 4px rgba(96,165,250,.3)}}input::placeholder{color:rgba(139,163,188,.45)}button:hover{filter:brightness(1.1)}*::-webkit-scrollbar{width:6px}*::-webkit-scrollbar-track{background:transparent}*::-webkit-scrollbar-thumb{background:rgba(96,165,250,.15);border-radius:3px}*::-webkit-scrollbar-thumb:hover{background:rgba(96,165,250,.25)}@media(max-width:900px){.cg-grid{grid-template-columns:1fr!important}}`}</style>
      </header>
      <nav style={S.nav}>
        {[{id:'search',lb:'🔍 PMB Search'},{id:'cdl',lb:'📋 CDL Conditions'},{id:'browse',lb:'📂 Browse DTPs'},{id:'filters',lb:'⚙️ PMB Filters'},{id:'icd',lb:'🏥 ICD-10 Search'},{id:'options',lb:'💎 GEMS Options'},{id:'guidelines',lb:'📖 Guidelines'}].map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSel(null);}} style={{...S.tb,...(tab===t.id?S.tbA:{})}}>{t.lb}</button>
        ))}
      </nav>
      <main style={S.main}>
        {tab==='search'&&<SearchTab q={query} setQ={setQuery} res={results} searched={searched} sel={sel} setSel={setSel} cats={cats} catF={catF} setCatF={setCatF} clear={clear} iRef={ref}/>}
        {tab==='cdl'&&<CDLTab items={cdl}/>}
        {tab==='browse'&&<BrowseTab dtps={D} cats={cats}/>}
        {tab==='filters'&&<FiltersTab filters={filters} setFilters={setFilters} saved={saved} onSave={()=>saveFilter(filters)} onClear={clearFilter}/>}
        {tab==='icd'&&<div style={{maxWidth:780,margin:'0 auto'}}><IcdSearchBar/></div>}
        {tab==='options'&&<div style={{maxWidth:780,margin:'0 auto'}}><BenefitOptionScope/></div>}
        {tab==='guidelines'&&<div style={{maxWidth:780,margin:'0 auto'}}><ClinicalGuidelinesPanel/></div>}
      </main>
      <footer style={S.ftr}>
        <p style={{margin:0}}>ClaimGuard SA · Medical Advisory Services · GEMS · Data: CMS PMB ICD-10 Coded List (Circular 47/2022)</p>
        <p style={{fontSize:10,marginTop:5,color:'#5A7088',maxWidth:700,margin:'5px auto 0'}}>Disclaimer: This tool assists with PMB identification. Final eligibility depends on clinical criteria in Annexure A. Codes only serve to assist in identification of possible PMB conditions — the condition must fully meet the DTP descriptor criteria.</p>
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FILTERS TAB
// ---------------------------------------------------------------------------
function FiltersTab({ filters, setFilters, saved, onSave, onClear }) {
  const handleChange = (dimension, value) => setFilters(f => ({ ...f, [dimension]: value }));
  const handleClearAll = () => setFilters({ benefitCategory: [], benefitType: [], gemsOption: [], icd10Chapter: [], dtpAlgorithm: [], fundingModel: [] });
  const handleRestore = () => saved && setFilters(saved.filters);
  const C = { navy:'#0B4E80', green:'#19A349', gold:'#F0A920', blue:'#1376B7' };
  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
        <button onClick={onSave} style={{ padding:'6px 14px', fontSize:12, fontWeight:600, borderRadius:8, border:'1px solid rgba(25,163,73,.35)', background:'rgba(25,163,73,.1)', color:C.green, cursor:'pointer' }}>
          💾 Save filters
        </button>
        {saved && (
          <button onClick={handleRestore} style={{ padding:'6px 14px', fontSize:12, fontWeight:600, borderRadius:8, border:'1px solid rgba(19,118,183,.35)', background:'rgba(19,118,183,.1)', color:C.blue, cursor:'pointer' }}>
            ↩ Restore saved
          </button>
        )}
        {saved && (
          <button onClick={onClear} style={{ padding:'6px 14px', fontSize:12, fontWeight:600, borderRadius:8, border:'1px solid rgba(213,31,41,.25)', background:'rgba(213,31,41,.06)', color:'#D51F29', cursor:'pointer' }}>
            🗑 Clear saved
          </button>
        )}
        {saved && (
          <span style={{ fontSize:10, color:'#3A5068', alignSelf:'center' }}>
            Saved {new Date(saved.savedAt).toLocaleString()}
          </span>
        )}
      </div>
      <FilterSidebar filters={filters} onFilterChange={handleChange} onClearAll={handleClearAll} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEARCH TAB
// ---------------------------------------------------------------------------
function SearchTab({q,setQ,res,searched,sel,setSel,cats,catF,setCatF,clear,iRef}) {
  const matchedCodes = useMemo(() => {
    if (!q || q.length < 2) return 0;
    const ql = q.trim().toLowerCase();
    return res.reduce((s, r) => {
      return s + r.codes.filter(([c, d]) =>
        c.toLowerCase().includes(ql) || d.toLowerCase().includes(ql)
      ).length;
    }, 0);
  }, [res, q]);

  const S = styles;
  return (<div>
    <div style={S.sbar}>
      <div style={S.sinp}>
        <svg style={{flexShrink:0,opacity:.4}} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8BA3BC" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input ref={iRef} value={q} onChange={e=>setQ(e.target.value)} placeholder="Search ICD-10 code (e.g. I26.0), DTP (e.g. 945A), or condition name…" style={S.inp} autoFocus/>
        {q&&<button onClick={clear} style={S.clr}>✕</button>}
      </div>
      <div style={S.frow}>
        <span style={{fontSize:11,color:'#5A7088'}}>Category:</span>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
        {cats.map(c=>(
          <button key={c} onClick={()=>setCatF(c)} style={{...S.chip,...(catF===c?S.chipA:{})}}>{c.replace('And ','& ').replace('Haematological, Infectious & Miscellaneous Systemic Conditions','Haem/Infectious/Misc')}</button>
        ))}
        </div>
      </div>
    </div>
    {searched&&res.length===0&&(
      <div style={S.empty}><div style={{fontSize:44,marginBottom:10}}>🔎</div>
        <p style={{fontWeight:600}}>No PMB conditions found for "{q}"</p>
        <p style={{color:'#7B8FA6',fontSize:13}}>Try a different ICD-10 code, DTP number, or condition name. Ensure correct spelling or use partial codes.</p>
      </div>
    )}
    {!searched&&!sel&&(
      <div style={S.empty}><div style={{fontSize:48,marginBottom:14}}>🛡️</div>
        <p style={{fontWeight:700,fontSize:16,margin:'0 0 6px',background:'linear-gradient(135deg,#60A5FA,#38BDF8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',display:'inline-block'}}>Search the CMS PMB Coded List</p>
        <p style={{color:'#7B8FA6',fontSize:13,maxWidth:540,margin:'8px auto 18px',lineHeight:1.6}}>Enter an ICD-10 code, DTP code, or condition name to check PMB eligibility and retrieve the Treatment Component for scheme funding obligations.</p>
        <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap',alignItems:'center',marginBottom:10}}>
          <span style={{fontSize:11,color:'#5A7088'}}>Quick search:</span>
          {['I26.0','E11.9','G61.0','C50.9','945A','CDL'].map(x=>(
            <button key={x} onClick={()=>setQ(x)} style={{...S.qchip,background:'rgba(96,165,250,.08)',borderColor:'rgba(96,165,250,.15)'}}>{x}</button>
          ))}
        </div>
        <div style={{display:'flex',gap:6,justifyContent:'center',flexWrap:'wrap',alignItems:'center'}}>
          <span style={{fontSize:11,color:'#5A7088'}}>Common:</span>
          {['sepsis','diabetes','eclampsia','epilepsy','fracture hip','pregnancy','schizophrenia','hypertension'].map(x=>(
            <button key={x} onClick={()=>setQ(x)} style={S.qchip}>{x}</button>
          ))}
        </div>
      </div>
    )}
    {res.length>0&&(
      <div style={S.grid}>
        <div style={S.list}>
          <p style={{fontSize:12,color:'#64748B',marginBottom:6}}>{res.length} condition{res.length!==1?'s':''} matched{matchedCodes > 0 ? ` (${matchedCodes} ICD-10 codes)` : ''}</p>
          <div style={{maxHeight:'70vh',overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
          {res.map((r,i)=>(
            <button key={r.d+i} onClick={()=>setSel(r)} style={{...S.card,...(sel?.d===r.d?S.cardA:{})}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
                <span style={S.dtp}>{r.d}</span>
                <div style={{display:'flex',gap:5}}>
                  {r.l&&<span style={S.cdlB}>CDL</span>}
                  <span style={S.catB}>{r.c.split(' ')[0]}</span>
                </div>
              </div>
              <p style={{fontSize:13,fontWeight:600,margin:0,lineHeight:1.35}}>{r.n}</p>
              <div style={{display:'flex',gap:3,marginTop:6,flexWrap:'wrap'}}>
                {r.codes.slice(0,4).map(([c],j)=><span key={j} style={S.icdM}>{c}</span>)}
                {r.codes.length>4&&<span style={{fontSize:10,color:'#5A7088',alignSelf:'center'}}>+{r.codes.length-4}</span>}
              </div>
            </button>
          ))}
          </div>
        </div>
        {sel&&<DetailPanel r={sel} q={q}/>}
      </div>
    )}
  </div>);
}

// ---------------------------------------------------------------------------
// DETAIL PANEL
// ---------------------------------------------------------------------------
function DetailPanel({r, q}) {
  const [showAll, setShowAll] = useState(false);
  const [selCode, setSelCode] = useState(null);
  const S = styles;
  const ql = (q||'').trim().toLowerCase();
  const codes = showAll ? r.codes : r.codes.slice(0, 30);
  const hasMore = r.codes.length > 30;

  return (
    <div style={S.detail}>
      <div style={S.detHdr}>
        <div style={{fontSize:14,fontWeight:800,color:'#60A5FA',fontFamily:"'Source Code Pro',monospace",letterSpacing:'1px',marginBottom:3}}>{r.d}</div>
        <h3 style={{fontSize:17,fontWeight:700,margin:0,lineHeight:1.3}}>{r.n}</h3>
        <div style={{display:'flex',gap:7,marginTop:8}}>
          {r.l&&<span style={{...S.cdlB,padding:'3px 10px',fontSize:12}}>CDL Condition</span>}
          <span style={{background:'rgba(139,163,188,.1)',color:'#8BA3BC',padding:'3px 10px',borderRadius:7,fontSize:12}}>{r.c}</span>
          <span style={{background:'rgba(96,165,250,.1)',color:'#60A5FA',padding:'3px 10px',borderRadius:7,fontSize:12}}>{r.codes.length} ICD-10 codes</span>
        </div>
      </div>
      <div style={S.detSec}>
        <h4 style={S.detLbl}><span>💊</span> Treatment Component (Scheme Funding Obligation)</h4>
        <div style={S.treatBox}>{r.t || 'Refer to Annexure A of the Regulations for the specific treatment component.'}</div>
        <p style={{fontSize:11,color:'#7B8FA6',marginTop:8,lineHeight:1.5,fontStyle:'italic'}}>Per Medical Schemes Act s29(1)(o) read with Regulation 8(1): Schemes must fund diagnosis, treatment and care of PMB conditions in full, without co-payment or deductible, when obtained from a DSP.</p>
      </div>
      <div style={S.detSec}>
        <h4 style={S.detLbl}><span>🏷️</span> Associated ICD-10 Codes</h4>
        <div style={{maxHeight:showAll?'none':'360px',overflowY:showAll?'visible':'auto'}}>
        {codes.map(([c,d],j)=>{
          const hl = ql && (c.toLowerCase().includes(ql) || d.toLowerCase().includes(ql));
          const isSel = selCode && selCode[0]===c;
          return (
            <div key={j} onClick={()=>setSelCode([c,d])} style={{...S.icdRow,...(isSel?{background:'rgba(96,165,250,.12)',borderLeft:'2px solid #60A5FA',cursor:'pointer'}:hl?{background:'rgba(45,212,191,.08)',borderLeft:'2px solid #2DD4BF',cursor:'pointer'}:{cursor:'pointer'})}} title="Click to select for dispute letter">
              <span style={S.icdC}>{c}</span><span style={{fontSize:12,color:'#8BA3BC'}}>{d}</span>
            </div>
          );
        })}
        </div>
        {hasMore&&!showAll&&<button onClick={()=>setShowAll(true)} style={S.showMore}>Show all {r.codes.length} codes ▾</button>}
        {showAll&&hasMore&&<button onClick={()=>setShowAll(false)} style={S.showMore}>Collapse ▴</button>}
      </div>
      <div style={S.detSec}>
        <h4 style={S.detLbl}><span>⚖️</span> CMS Appeal Ammunition</h4>
        <div style={S.appealBox}>
          <p style={{margin:'0 0 6px',fontWeight:700}}>If this claim is denied or short-paid, cite:</p>
          <p style={{margin:'0 0 3px'}}>1. Medical Schemes Act 131 of 1998, Section 29(1)(o)</p>
          <p style={{margin:'0 0 3px'}}>2. Regulation 8(1) — full payment without co-payment for PMB at DSP</p>
          <p style={{margin:'0 0 3px'}}>3. CMS PMB Coded List DTP <strong>{r.d}</strong> — Treatment Component mandates: <em>"{r.t}"</em></p>
          {r.l&&<p style={{margin:'0 0 3px'}}>4. Chronic Disease List (CDL) — ongoing management is a PMB obligation regardless of benefit exhaustion</p>}
          <p style={{margin:'0 0 3px'}}>{r.l?'5':'4'}. Involuntary non-DSP usage preserves full PMB rights (CMS precedent)</p>
          <p style={{marginTop:10,fontSize:11,opacity:.5}}>CMS Complaints: complaints@medicalschemes.co.za · 0861 123 267</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CDL TAB
// ---------------------------------------------------------------------------
function CDLTab({items}) {
  const S = styles;
  return (<div>
    <div style={{marginBottom:24}}>
      <h2 style={{fontSize:20,fontWeight:700,margin:'0 0 8px',background:'linear-gradient(135deg,#FBBF24,#F59E0B)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',display:'inline-block'}}>Chronic Disease List (CDL) Conditions</h2>
      <p style={{fontSize:13,opacity:.5,margin:0,lineHeight:1.6,maxWidth:720}}>These {items.length} DTP conditions include CDL chronic conditions requiring ongoing medical management as a PMB obligation. The scheme must fund treatment in full according to the Treatment Component, regardless of benefit exhaustion.</p>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))',gap:12}}>
      {items.map((r,i)=>(
        <div key={i} style={{background:'#263545',borderRadius:11,border:'1px solid rgba(251,191,36,.1)',padding:'14px 16px',transition:'all .2s',borderLeft:'3px solid rgba(251,191,36,.3)'}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
            <span style={S.dtp}>{r.d}</span>
            <div style={{display:'flex',gap:6}}>
              <span style={S.cdlB}>CDL</span>
              <span style={{fontSize:10,color:'#5A7088',alignSelf:'center'}}>{r.codes.length} codes</span>
            </div>
          </div>
          <h4 style={{fontSize:14,fontWeight:600,margin:'0 0 6px',lineHeight:1.35}}>{r.n}</h4>
          <p style={{fontSize:11,color:'#7B8FA6',margin:0,lineHeight:1.5}}>{r.t}</p>
        </div>
      ))}
    </div>
  </div>);
}

// ---------------------------------------------------------------------------
// BROWSE TAB
// ---------------------------------------------------------------------------
function BrowseTab({dtps, cats}) {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const S = styles;
  const filtered = useMemo(() => {
    let f = cat === 'All' ? dtps : dtps.filter(d => d.c === cat);
    if (search.length >= 2) {
      const sl = search.toLowerCase();
      f = f.filter(d => d.d.toLowerCase().includes(sl) || d.n.toLowerCase().includes(sl));
    }
    return f;
  }, [dtps, cat, search]);

  return (<div>
    <div style={{marginBottom:18}}>
      <h2 style={{fontSize:20,fontWeight:700,margin:'0 0 8px'}}>Browse All {dtps.length} DTP Conditions</h2>
      <p style={{fontSize:13,opacity:.5,margin:0,maxWidth:720}}>Diagnosis Treatment Pairs per Annexure A of the Medical Schemes Act Regulations. Filter by category or search by name.</p>
    </div>
    <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap',alignItems:'center'}}>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Filter DTPs…" style={{background:'#263545',border:'1px solid rgba(96,165,250,.12)',borderRadius:9,padding:'8px 14px',fontSize:12,color:'#E8EDF3',outline:'none',maxWidth:260,fontFamily:'inherit'}}/>
      <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
      {cats.map(c=>(
        <button key={c} onClick={()=>setCat(c)} style={{...S.chip,...(cat===c?S.chipA:{})}}>{c.split(',')[0].replace('And ','& ')}</button>
      ))}
      </div>
    </div>
    <div style={{background:'rgba(30,50,68,.6)',borderRadius:12,border:'1px solid rgba(96,165,250,.08)',overflow:'hidden'}}>
      <div style={{display:'flex',padding:'10px 14px',gap:10,background:'linear-gradient(135deg,rgba(96,165,250,.08),rgba(56,189,248,.04))',fontSize:11,fontWeight:700,color:'#60A5FA',textTransform:'uppercase',letterSpacing:'.5px',borderBottom:'1px solid rgba(96,165,250,.08)'}}>
        <span style={{width:65}}>DTP</span><span style={{flex:1}}>Condition</span><span style={{width:55,textAlign:'center'}}>CDL</span><span style={{width:55,textAlign:'center'}}>Codes</span><span style={{width:130}}>Category</span>
      </div>
      <div style={{maxHeight:'65vh',overflowY:'auto'}}>
      {filtered.map((d,i)=>(
        <div key={d.d+i} style={{display:'flex',padding:'8px 14px',gap:10,borderBottom:'1px solid rgba(148,163,184,.03)',alignItems:'center',background:i%2===0?'transparent':'rgba(148,163,184,.015)',transition:'background .15s'}}>
          <span style={{width:65,color:'#60A5FA',fontSize:12,fontWeight:700,fontFamily:"'Source Code Pro',monospace"}}>{d.d}</span>
          <span style={{flex:1,fontSize:12,lineHeight:1.35}}>{d.n}</span>
          <span style={{width:55,textAlign:'center'}}>{d.l?'✅':'—'}</span>
          <span style={{width:55,textAlign:'center',fontSize:11,color:'#7B8FA6'}}>{d.codes.length}</span>
          <span style={{width:130,fontSize:10,color:'#7B8FA6'}}>{d.c.split(',')[0]}</span>
        </div>
      ))}
      </div>
    </div>
    <p style={{fontSize:11,color:'#5A7088',marginTop:10}}>Showing {filtered.length} of {dtps.length} DTPs</p>
  </div>);
}

// ---------------------------------------------------------------------------
// APPEAL GUIDE TAB
// ---------------------------------------------------------------------------
// LETTER TAB
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// STYLES
// ---------------------------------------------------------------------------
const styles = {
  wrap:{minHeight:'100vh',background:'#1E2A3A',color:'#E8EDF3',fontFamily:"'Source Sans 3','Segoe UI',system-ui,sans-serif",position:'relative',overflow:'hidden'},
  bg:{position:'fixed',top:0,left:0,right:0,bottom:0,background:'radial-gradient(ellipse at 15% -5%,rgba(59,130,246,.1) 0%,transparent 55%),radial-gradient(ellipse at 85% 100%,rgba(14,165,233,.07) 0%,transparent 55%),radial-gradient(circle at 50% 30%,rgba(30,58,90,.3) 0%,transparent 70%)',pointerEvents:'none',zIndex:0},
  hdr:{position:'relative',zIndex:1,borderBottom:'1px solid rgba(96,165,250,.15)',padding:'18px 24px',background:'linear-gradient(180deg,#243447 0%,#1E2A3A 100%)',boxShadow:'0 1px 8px rgba(0,0,0,.12)'},
  hdrIn:{maxWidth:1320,margin:'0 auto',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12},
  logo:{display:'flex',alignItems:'center',gap:12},
  shield:{width:48,height:48,borderRadius:13,background:'linear-gradient(135deg,rgba(59,130,246,.18),rgba(14,165,233,.12))',border:'1px solid rgba(96,165,250,.25)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(59,130,246,.12)'},
  ttl:{fontSize:23,fontWeight:800,margin:0,letterSpacing:'-.5px',background:'linear-gradient(135deg,#60A5FA 0%,#38BDF8 60%,#2DD4BF 100%)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'},
  sub:{fontSize:11,margin:'2px 0 0',color:'#7B8FA6',letterSpacing:'.3px'},
  stat:{display:'flex',alignItems:'center',gap:8,background:'rgba(59,130,246,.1)',borderRadius:20,padding:'6px 14px',border:'1px solid rgba(96,165,250,.15)'},
  dot:{width:7,height:7,borderRadius:'50%',background:'#60A5FA',boxShadow:'0 0 10px rgba(96,165,250,.6)',animation:'pulse 2s infinite'},
  statTx:{fontSize:11,color:'#8BA3BC',fontWeight:500},
  nav:{position:'relative',zIndex:1,maxWidth:1320,margin:'0 auto',padding:'10px 24px',display:'flex',gap:4,flexWrap:'wrap',borderBottom:'1px solid rgba(96,165,250,.08)'},
  tb:{background:'transparent',border:'1px solid transparent',color:'#7B8FA6',padding:'8px 16px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .2s',letterSpacing:'.2px'},
  tbA:{background:'rgba(96,165,250,.12)',borderColor:'rgba(96,165,250,.25)',color:'#60A5FA',boxShadow:'0 0 10px rgba(96,165,250,.06)'},
  main:{position:'relative',zIndex:1,maxWidth:1320,margin:'0 auto',padding:'16px 24px 48px'},
  ftr:{position:'relative',zIndex:1,borderTop:'1px solid rgba(96,165,250,.08)',padding:'16px 24px',textAlign:'center',fontSize:11,color:'#5A7088',background:'rgba(24,36,50,.5)'},
  sbar:{marginBottom:18},
  sinp:{display:'flex',alignItems:'center',background:'#263545',borderRadius:12,border:'1px solid rgba(96,165,250,.18)',padding:'4px 16px',gap:8,boxShadow:'0 2px 16px rgba(0,0,0,.15),0 0 0 1px rgba(96,165,250,.05)',transition:'border-color .2s'},
  inp:{flex:1,background:'transparent',border:'none',outline:'none',color:'#E8EDF3',fontSize:15,padding:'12px 0',fontFamily:'inherit',fontWeight:500},
  clr:{background:'rgba(96,165,250,.12)',border:'none',color:'#8BA3BC',width:28,height:28,borderRadius:8,cursor:'pointer',fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',transition:'all .15s'},
  frow:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'flex-start',marginTop:10},
  chip:{background:'rgba(30,50,68,.8)',border:'1px solid rgba(96,165,250,.1)',color:'#8BA3BC',padding:'4px 11px',borderRadius:16,fontSize:10,cursor:'pointer',fontWeight:500,transition:'all .2s',whiteSpace:'nowrap'},
  chipA:{background:'rgba(96,165,250,.15)',borderColor:'rgba(96,165,250,.35)',color:'#60A5FA'},
  empty:{textAlign:'center',padding:'48px 24px',background:'rgba(30,50,68,.5)',borderRadius:16,border:'1px solid rgba(96,165,250,.08)',backdropFilter:'blur(8px)'},
  qchip:{background:'rgba(96,165,250,.1)',border:'1px solid rgba(96,165,250,.18)',color:'#60A5FA',padding:'4px 12px',borderRadius:16,fontSize:11,cursor:'pointer',fontFamily:"'Source Code Pro',monospace",fontWeight:600,transition:'all .2s'},
  grid:{display:'grid',gridTemplateColumns:'380px 1fr',gap:18,alignItems:'start'},
  list:{display:'flex',flexDirection:'column',gap:5},
  card:{background:'#263545',border:'1px solid rgba(96,165,250,.08)',borderRadius:10,padding:'12px 14px',cursor:'pointer',textAlign:'left',width:'100%',color:'#E8EDF3',transition:'all .2s',fontFamily:'inherit',boxShadow:'0 1px 4px rgba(0,0,0,.08)'},
  cardA:{borderColor:'rgba(96,165,250,.35)',background:'rgba(96,165,250,.08)',boxShadow:'0 2px 16px rgba(96,165,250,.1)'},
  dtp:{background:'rgba(96,165,250,.15)',color:'#60A5FA',padding:'2px 8px',borderRadius:5,fontSize:11,fontWeight:700,fontFamily:"'Source Code Pro',monospace",letterSpacing:'.5px'},
  cdlB:{background:'rgba(251,191,36,.12)',color:'#FBBF24',padding:'2px 8px',borderRadius:5,fontSize:10,fontWeight:700,letterSpacing:'.5px'},
  catB:{background:'rgba(139,163,188,.1)',color:'#8BA3BC',padding:'2px 8px',borderRadius:5,fontSize:10},
  icdM:{background:'rgba(45,212,191,.08)',color:'#2DD4BF',padding:'2px 6px',borderRadius:4,fontSize:10,fontFamily:"'Source Code Pro',monospace",fontWeight:600},
  detail:{background:'#263545',borderRadius:14,border:'1px solid rgba(96,165,250,.1)',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,.1)'},
  detHdr:{padding:'18px 22px',background:'linear-gradient(135deg,rgba(96,165,250,.08),rgba(56,189,248,.04))',borderBottom:'1px solid rgba(96,165,250,.1)'},
  detSec:{padding:'16px 22px',borderBottom:'1px solid rgba(96,165,250,.06)'},
  detLbl:{fontSize:11,fontWeight:700,color:'#60A5FA',textTransform:'uppercase',letterSpacing:'1px',marginBottom:8,display:'flex',alignItems:'center',gap:6},
  treatBox:{background:'rgba(45,212,191,.06)',border:'1px solid rgba(45,212,191,.12)',borderRadius:10,padding:'14px 18px',fontSize:13,lineHeight:1.7,fontWeight:500,borderLeft:'3px solid #2DD4BF',color:'#C4D1DE'},
  icdRow:{display:'flex',alignItems:'center',gap:10,padding:'6px 12px',borderRadius:7,marginBottom:2,borderLeft:'2px solid transparent',transition:'all .15s'},
  icdC:{fontFamily:"'Source Code Pro',monospace",fontWeight:700,color:'#2DD4BF',fontSize:12,minWidth:58},
  showMore:{width:'100%',background:'rgba(96,165,250,.06)',border:'1px solid rgba(96,165,250,.12)',color:'#60A5FA',padding:'7px',borderRadius:8,fontSize:11,cursor:'pointer',marginTop:8,fontWeight:600,transition:'all .15s'},
  appealBox:{background:'rgba(251,191,36,.05)',border:'1px solid rgba(251,191,36,.12)',borderRadius:10,padding:'14px 18px',fontSize:12,lineHeight:1.8,borderLeft:'3px solid #FBBF24',color:'#C4D1DE'},
};
