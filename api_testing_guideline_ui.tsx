import { useState } from "react";

const METHODS = ["GET","POST","PUT","PATCH","DELETE","Cross-Method"];

const DATA = {
  GET: {
    note: "Idempotent — calling N times must return the same result",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1,"GET resource with valid ID","200 + complete resource body","Happy Path"],
      [2,"GET resource with valid ID twice (idempotency check)","200 both times, identical response body","Happy Path"],
      [3,"GET list of resources","200 + array of objects","Happy Path"],
      [4,"GET list with valid pagination params (page, limit)","200 + correct page data + pagination metadata","Happy Path"],
      [5,"GET list with valid filter param","200 + only filtered results returned","Happy Path"],
      [6,"GET resource with non-existent ID","404 + error message","Negative"],
      [7,"GET without authentication token","401","Negative"],
      [8,"GET with valid token but no permission for this resource","403","Negative"],
      [9,"GET with ID in wrong format (string instead of int)","400","Negative"],
      [10,"GET list when database has 0 records","200 + empty array [] (not 404)","Edge Case"],
      [11,"GET with ID = 0 or negative number","400 or 404 per business rule","Edge Case"],
      [12,"GET with unknown/unsupported query parameter","200 (ignored) or 400 per API design","Edge Case"],
      [13,"GET list with page number exceeding total pages","200 + empty array []","Edge Case"],
      [14,"GET resource owned by another user (IDOR check)","403","Security"],
      [15,"GET sensitive fields in response — verify masking (e.g. account no. last 4 only, no password hash)","Sensitive fields masked or absent","Security"],
    ]
  },
  POST: {
    note: "Not idempotent — each call creates a new resource",
    noteColor: "#b45309",
    noteBg: "#fffbeb",
    noteBorder: "#fde68a",
    rows: [
      [1,"POST with complete valid request body","201 + newly created resource with generated ID","Happy Path"],
      [2,"POST then GET the created resource (persistence check)","200 + data matches what was POSTed","Happy Path"],
      [3,"POST without authentication token","401","Negative"],
      [4,"POST with valid token but no create permission","403","Negative"],
      [5,"POST with missing required field","400 + error specifying which field is missing","Negative"],
      [6,"POST with wrong data type for a field (number instead of string)","400","Negative"],
      [7,"POST with empty string in required field","400","Negative"],
      [8,"POST with no request body","400","Negative"],
      [9,"POST duplicate resource (unique constraint violation)","409 + error message","Negative"],
      [10,"POST with value violating business rule (e.g. amount exceeds limit)","422 + error message","Negative"],
      [11,"POST with string exceeding max length","400","Edge Case"],
      [12,"POST with special characters in string fields","201 or 400 per validation rule","Edge Case"],
      [13,"POST with numeric field = 0 or negative","201 or 400 per business rule","Edge Case"],
      [14,"POST with extra unknown fields not in schema","201 (fields ignored) or 400 per API design","Edge Case"],
      [15,"POST with privileged fields in body (e.g. role, is_admin, balance)","Fields ignored or 400 — must not be applied","Security"],
      [16,"POST financial transaction with same idempotency key twice","2nd request returns same result — no duplicate charge","Security"],
    ]
  },
  PUT: {
    note: "Idempotent — updating with the same data N times must produce the same state",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1,"PUT existing resource with complete valid data","200 + updated resource body","Happy Path"],
      [2,"PUT same data twice (idempotency check)","200 both times, same resulting state","Happy Path"],
      [3,"PUT then GET to verify update persisted (persistence check)","200 + data matches what was PUT","Happy Path"],
      [4,"PUT without authentication token","401","Negative"],
      [5,"PUT with valid token but no update permission","403","Negative"],
      [6,"PUT with non-existent resource ID","404","Negative"],
      [7,"PUT with missing required field","400 + error specifying which field is missing","Negative"],
      [8,"PUT with wrong data type for a field","400","Negative"],
      [9,"PUT with ID in wrong format","400","Negative"],
      [10,"PUT with value violating business rule","422 + error message","Negative"],
      [11,"PUT with string exceeding max length","400","Edge Case"],
      [12,"PUT with same data as current state (no-op update)","200 (no change, no error)","Edge Case"],
      [13,"PUT with extra unknown fields not in schema","200 (fields ignored) or 400 per API design","Edge Case"],
      [14,"PUT resource owned by another user (IDOR check)","403","Security"],
      [15,"PUT with immutable/privileged fields (e.g. id, created_at, balance)","Fields ignored or 400 — must not be overwritten","Security"],
    ]
  },
  PATCH: {
    note: "Partial update — unspecified fields must remain unchanged",
    noteColor: "#b45309",
    noteBg: "#fffbeb",
    noteBorder: "#fde68a",
    rows: [
      [1,"PATCH single field with valid value","200 + only that field updated","Happy Path"],
      [2,"PATCH multiple fields with valid values","200 + all patched fields updated","Happy Path"],
      [3,"PATCH then GET to verify unpatched fields unchanged (persistence check)","200 + non-patched fields retain original values","Happy Path"],
      [4,"PATCH without authentication token","401","Negative"],
      [5,"PATCH with valid token but no update permission","403","Negative"],
      [6,"PATCH with non-existent resource ID","404","Negative"],
      [7,"PATCH with wrong data type for a field","400","Negative"],
      [8,"PATCH with invalid field value","400","Negative"],
      [9,"PATCH with ID in wrong format","400","Negative"],
      [10,"PATCH with value violating business rule (e.g. invalid status transition)","422 + error message","Negative"],
      [11,"PATCH with empty body {}","200 (no-op) or 400 per API design","Edge Case"],
      [12,"PATCH with null value on a field","field cleared or 400 per nullable contract","Edge Case"],
      [13,"PATCH on immutable field (e.g. id, created_at)","400 or silently ignored per API design","Edge Case"],
      [14,"PATCH with unknown field not in schema","200 (ignored) or 400 per API design","Edge Case"],
      [15,"PATCH resource owned by another user (IDOR check)","403","Security"],
      [16,"PATCH with privileged fields (e.g. role, is_admin)","Fields ignored or 400 — must not be applied","Security"],
    ]
  },
  DELETE: {
    note: "Idempotent by design — second DELETE on same ID must return 404, not 500",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1,"DELETE existing resource","200 or 204","Happy Path"],
      [2,"DELETE then GET to verify resource is gone (persistence check)","404 after DELETE","Happy Path"],
      [3,"DELETE without authentication token","401","Negative"],
      [4,"DELETE with valid token but no delete permission","403","Negative"],
      [5,"DELETE with non-existent resource ID","404","Negative"],
      [6,"DELETE already-deleted resource (second call)","404 (not 500)","Negative"],
      [7,"DELETE with ID in wrong format","400","Negative"],
      [8,"DELETE resource that has dependencies (linked data)","409 or 422 per business rule","Edge Case"],
      [9,"DELETE with ID = 0 or negative number","400 or 404 per business rule","Edge Case"],
      [10,"Soft delete (if applicable) — verify via GET","Record exists but status/flag changed","Edge Case"],
      [11,"DELETE resource owned by another user (IDOR check)","403","Security"],
    ]
  },
  "Cross-Method": {
    note: "Apply to all endpoints — verify at least once per API",
    noteColor: "#4f46e5",
    noteBg: "#eef2ff",
    noteBorder: "#c7d2fe",
    rows: [
      [1,"Send wrong HTTP method to endpoint (e.g. POST to GET-only endpoint)","405 Method Not Allowed","General"],
      [2,"Send request without Content-Type: application/json header","415 Unsupported Media Type","General"],
      [3,"Exceed rate limit (if applicable)","429 + Retry-After header","General"],
      [4,"Verify error response structure is consistent across all endpoints","Same error schema everywhere","General"],
      [5,"Verify success response structure is consistent across all endpoints","Same success schema everywhere","General"],
      [6,"Verify HTTP status codes are semantically correct (not 200 for everything)","Status code matches operation result","General"],
      [7,"Use expired token","401","Security"],
      [8,"Use malformed token (random string)","401","Security"],
      [9,"Use valid token of User A to access resource owned by User B","403","Security"],
      [10,"Use lower-privileged role to perform admin-only action","403","Security"],
      [11,"Use read-only token to perform write operation","403","Security"],
      [12,"Logout then use the same token","401 — token must be invalidated","Security"],
    ]
  }
};

const CATEGORY_COLOR = {
  "Happy Path": "#22c55e",
  "Negative":   "#ef4444",
  "Edge Case":  "#f59e0b",
  "Security":   "#8b5cf6",
  "General":    "#6366f1",
};

const CODES = [
  ["200","OK","Successful GET, PUT, PATCH"],
  ["201","Created","Successful POST that creates a resource"],
  ["204","No Content","Successful DELETE or operation with no response body"],
  ["400","Bad Request","Wrong format, missing/invalid fields"],
  ["401","Unauthorized","No token or invalid/expired token"],
  ["403","Forbidden","Valid token but no permission for this resource"],
  ["404","Not Found","Resource ID does not exist"],
  ["405","Method Not Allowed","Wrong HTTP method for this endpoint"],
  ["409","Conflict","Duplicate resource or state conflict"],
  ["422","Unprocessable Entity","Format valid but business rule violation"],
  ["429","Too Many Requests","Rate limit exceeded"],
  ["500","Internal Server Error","Server-side bug — should never occur in healthy API"],
];

export default function App() {
  const [tab, setTab] = useState("GET");
  const [filter, setFilter] = useState("All");
  const [showCodes, setShowCodes] = useState(false);
  const [showPrinciple, setShowPrinciple] = useState(false);
  const [showAssert, setShowAssert] = useState(false);
  const [showUnitNote, setShowUnitNote] = useState(false);

  const d = DATA[tab];
  const allCats = [...new Set(d.rows.map(r=>r[3]))];
  const cats = ["All", ...allCats];
  const rows = filter === "All" ? d.rows : d.rows.filter(r => r[3] === filter);

  const counts = allCats.reduce((acc,c) => {
    acc[c] = d.rows.filter(r=>r[3]===c).length;
    return acc;
  }, {});

  const s = {
    wrap: { fontFamily: "system-ui,sans-serif", maxWidth: 900, margin: "0 auto", padding: "24px 16px", color: "#1e293b" },
    h1: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    sub: { color: "#64748b", fontSize: 13, marginBottom: 20 },
    card: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 12, overflow: "hidden" },
    cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", userSelect: "none" },
    cardTitle: { fontWeight: 600, fontSize: 14 },
    cardBody: { padding: "0 14px 14px" },
    tabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 },
    tab: a => ({ padding: "6px 14px", borderRadius: 20, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: a?700:400, background: a?"#1e293b":"#fff", color: a?"#fff":"#475569" }),
    filterRow: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" },
    filterBtn: (a,cat) => ({ padding: "4px 12px", borderRadius: 20, border: `1px solid ${CATEGORY_COLOR[cat]||"#e2e8f0"}`, cursor: "pointer", fontSize: 12, fontWeight: a?700:400, background: a?(CATEGORY_COLOR[cat]||"#1e293b"):"#fff", color: a?"#fff":(CATEGORY_COLOR[cat]||"#475569") }),
    note: (bg,border,color) => ({ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color, marginBottom: 8 }),
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { background: "#f1f5f9", padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" },
    td: { padding: "8px 10px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
    badge: cat => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: (CATEGORY_COLOR[cat]||"#64748b")+"22", color: CATEGORY_COLOR[cat]||"#64748b" }),
    stat: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" },
    statBox: cat => ({ padding: "6px 12px", borderRadius: 8, background: (CATEGORY_COLOR[cat]||"#64748b")+"15", border: `1px solid ${(CATEGORY_COLOR[cat]||"#64748b")}44`, fontSize: 12, fontWeight: 600, color: CATEGORY_COLOR[cat]||"#64748b" }),
    code: { display: "inline-block", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#0f172a" },
  };

  return (
    <div style={s.wrap}>
      <div style={s.h1}>REST API Functional + Security Testing Standard</div>
      <div style={s.sub}>Functional · Security (QA perspective) · v1.1</div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={()=>setShowPrinciple(v=>!v)}>
          <span style={s.cardTitle}>📌 Core Principle</span>
          <span style={{color:"#94a3b8"}}>{showPrinciple?"▲":"▼"}</span>
        </div>
        {showPrinciple && (
          <div style={s.cardBody}>
            <div style={{fontSize:13,lineHeight:1.7,color:"#334155"}}>
              REST APIs share the same rules regardless of business logic — HTTP methods behave consistently, status codes carry universal meaning, and auth/validation patterns are standard.<br/><br/>
              <strong>What changes per API:</strong> endpoint paths, request body fields, business rules, response schema<br/>
              <strong>What never changes:</strong> the scenarios in this checklist — these apply to every REST API<br/><br/>
              <span style={{color:"#64748b",fontSize:12}}>This standard covers ~90% of any REST API. The remaining 10% is business logic unique to each API.</span>
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={()=>setShowUnitNote(v=>!v)}>
          <span style={s.cardTitle}>🔄 Relationship with Unit Testing</span>
          <span style={{color:"#94a3b8"}}>{showUnitNote?"▲":"▼"}</span>
        </div>
        {showUnitNote && (
          <div style={s.cardBody}>
            <div style={{fontSize:13,lineHeight:1.7,color:"#334155",marginBottom:10}}>
              Some scenarios (input validation — missing fields, wrong types, max length) overlap with Unit Tests. <strong>They are intentionally kept here.</strong>
            </div>
            <table style={s.table}>
              <thead><tr><th style={s.th}></th><th style={s.th}>Unit Test</th><th style={s.th}>API Test</th></tr></thead>
              <tbody>
                {[
                  ["What it tests","Logic in isolation","Behavior through real HTTP stack"],
                  ["Validates HTTP layer","✗","✓"],
                  ["Validates response structure/contract","✗","✓"],
                  ["Catches framework/wiring bugs","✗","✓"],
                ].map(([label,ut,at])=>(
                  <tr key={label}>
                    <td style={{...s.td,fontWeight:500,color:"#475569"}}>{label}</td>
                    <td style={{...s.td,color:ut==="✓"?"#22c55e":ut==="✗"?"#ef4444":"#475569",fontWeight:ut==="✗"||ut==="✓"?700:400}}>{ut}</td>
                    <td style={{...s.td,color:at==="✓"?"#22c55e":at==="✗"?"#ef4444":"#475569",fontWeight:at==="✗"||at==="✓"?700:400}}>{at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{...s.note("#fffbeb","#fde68a","#92400e"), marginTop:10, marginBottom:0}}>
              A validation rule may pass Unit Test but still return 500 instead of 400 if the error is not wired correctly through the framework. API tests catch this gap.<br/><br/>
              <strong>Focus of API test on overlapping cases:</strong> status code is correct (400, not 500) · response body follows agreed error structure · error message does not leak internals
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={()=>setShowAssert(v=>!v)}>
          <span style={s.cardTitle}>✅ Assertion Checklist (Every Test Case)</span>
          <span style={{color:"#94a3b8"}}>{showAssert?"▲":"▼"}</span>
        </div>
        {showAssert && (
          <div style={s.cardBody}>
            <div style={{fontSize:13,lineHeight:1.8,color:"#334155"}}>
              <strong>Always assert:</strong>
              <ol style={{margin:"6px 0 12px 18px",padding:0}}>
                <li><strong>Status Code</strong> — must match expected exactly</li>
                <li><strong>Response Body</strong> — key fields exist, correct data type, correct value</li>
                <li><strong>Response Header</strong> — <span style={s.code}>Content-Type: application/json</span> present</li>
              </ol>
              <strong>For error scenarios, additionally assert:</strong>
              <ul style={{margin:"6px 0 0 18px",padding:0}}>
                <li>Error message is meaningful and describes the problem</li>
                <li>Error structure is consistent across all endpoints</li>
                <li>No sensitive data leaked (stack trace, DB error, internal path)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={()=>setShowCodes(v=>!v)}>
          <span style={s.cardTitle}>📊 HTTP Status Code Reference</span>
          <span style={{color:"#94a3b8"}}>{showCodes?"▲":"▼"}</span>
        </div>
        {showCodes && (
          <div style={s.cardBody}>
            <div style={s.note("#fffbeb","#fde68a","#92400e")}>
              <strong>400 vs 422:</strong> Use 400 for malformed input (wrong type, missing field). Use 422 when input is structurally valid but violates business rules (e.g. transfer amount exceeds balance, invalid status transition).
            </div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Code</th><th style={s.th}>Meaning</th><th style={s.th}>When to Expect</th></tr></thead>
              <tbody>
                {CODES.map(([code,meaning,when])=>(
                  <tr key={code}>
                    <td style={s.td}><span style={{...s.code,color:+code>=500?"#dc2626":+code>=400?"#d97706":+code>=300?"#2563eb":"#16a34a"}}>{code}</span></td>
                    <td style={{...s.td,fontWeight:500}}>{meaning}</td>
                    <td style={{...s.td,color:"#64748b"}}>{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{fontWeight:600,fontSize:14,marginBottom:8,color:"#475569"}}>CHECKLIST BY METHOD</div>
      <div style={s.tabs}>
        {METHODS.map(m=><button key={m} style={s.tab(tab===m)} onClick={()=>{setTab(m);setFilter("All")}}>{m}</button>)}
      </div>

      <div style={s.stat}>
        {Object.entries(counts).map(([cat,n])=>(
          <div key={cat} style={s.statBox(cat)}>{cat}: {n}</div>
        ))}
        <div style={{padding:"6px 12px",borderRadius:8,background:"#f1f5f9",fontSize:12,fontWeight:600,color:"#475569"}}>Total: {d.rows.length}</div>
      </div>

      <div style={s.note(d.noteBg, d.noteBorder, d.noteColor)}>{d.note}</div>

      <div style={s.filterRow}>
        <span style={{fontSize:12,color:"#94a3b8"}}>Filter:</span>
        {cats.map(c=>(
          <button key={c} style={s.filterBtn(filter===c,c)} onClick={()=>setFilter(c)}>{c}</button>
        ))}
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={{...s.th,width:36}}>#</th>
            <th style={s.th}>Scenario</th>
            <th style={s.th}>Expected Result</th>
            <th style={{...s.th,width:100}}>Category</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n,scenario,expected,cat])=>(
            <tr key={n} style={{background:n%2===0?"#fafafa":"#fff"}}>
              <td style={{...s.td,color:"#94a3b8",fontSize:12}}>{n}</td>
              <td style={s.td}>{scenario}</td>
              <td style={{...s.td,color:"#475569"}}>{expected}</td>
              <td style={s.td}><span style={s.badge(cat)}>{cat}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{marginTop:24,padding:"12px 0",borderTop:"1px solid #e2e8f0",fontSize:12,color:"#94a3b8",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <span>v1.1 · Functional + Security (QA Perspective)</span>
        <span>Pending: Performance · Contract Testing</span>
      </div>
    </div>
  );
}
