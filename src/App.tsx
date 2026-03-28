import { useState, type CSSProperties } from "react";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "Cross-Method";
type Category = "Happy Path" | "Negative" | "Edge Case" | "Security" | "General";
type Filter = "All" | Category;
type ScenarioRow = [number, string, string, Category];
type MethodData = {
  note: string;
  noteColor: string;
  noteBg: string;
  noteBorder: string;
  rows: ScenarioRow[];
};

const METHODS: Method[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "Cross-Method"];

const DATA: Record<Method, MethodData> = {
  GET: {
    note: "Idempotent — calling N times must return the same result",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1, "GET resource with valid ID", "200 + complete resource body", "Happy Path"],
      [2, "GET resource with valid ID twice (idempotency check)", "200 both times, identical response body", "Happy Path"],
      [3, "GET list of resources", "200 + array of objects", "Happy Path"],
      [4, "GET list with valid pagination params (page, limit)", "200 + correct page data + pagination metadata", "Happy Path"],
      [5, "GET list with valid filter param", "200 + only filtered results returned", "Happy Path"],
      [6, "GET resource with non-existent ID", "404 + error message", "Negative"],
      [7, "GET without authentication token", "401", "Negative"],
      [8, "GET with valid token but no permission for this resource", "403", "Negative"],
      [9, "GET with ID in wrong format (string instead of int)", "400", "Negative"],
      [10, "GET list when database has 0 records", "200 + empty array [] (not 404)", "Edge Case"],
      [11, "GET with ID = 0 or negative number", "400 or 404 per business rule", "Edge Case"],
      [12, "GET with unknown/unsupported query parameter", "200 (ignored) or 400 per API design", "Edge Case"],
      [13, "GET list with page number exceeding total pages", "200 + empty array []", "Edge Case"],
      [14, "GET resource owned by another user (IDOR check)", "403", "Security"],
      [15, "GET sensitive fields in response — verify masking (e.g. account no. last 4 only, no password hash)", "Sensitive fields masked or absent", "Security"],
    ],
  },
  POST: {
    note: "Not idempotent — each call creates a new resource",
    noteColor: "#b45309",
    noteBg: "#fffbeb",
    noteBorder: "#fde68a",
    rows: [
      [1, "POST with complete valid request body", "201 + newly created resource with generated ID", "Happy Path"],
      [2, "POST then GET the created resource (persistence check)", "200 + data matches what was POSTed", "Happy Path"],
      [3, "POST without authentication token", "401", "Negative"],
      [4, "POST with valid token but no create permission", "403", "Negative"],
      [5, "POST with missing required field", "400 + error specifying which field is missing", "Negative"],
      [6, "POST with wrong data type for a field (number instead of string)", "400", "Negative"],
      [7, "POST with empty string in required field", "400", "Negative"],
      [8, "POST with no request body", "400", "Negative"],
      [9, "POST duplicate resource (unique constraint violation)", "409 + error message", "Negative"],
      [10, "POST with value violating business rule (e.g. amount exceeds limit)", "422 + error message", "Negative"],
      [11, "POST with string exceeding max length", "400", "Edge Case"],
      [12, "POST with special characters in string fields", "201 or 400 per validation rule", "Edge Case"],
      [13, "POST with numeric field = 0 or negative", "201 or 400 per business rule", "Edge Case"],
      [14, "POST with extra unknown fields not in schema", "201 (fields ignored) or 400 per API design", "Edge Case"],
      [15, "POST with privileged fields in body (e.g. role, is_admin, balance)", "Fields ignored or 400 — must not be applied", "Security"],
      [16, "POST financial transaction with same idempotency key twice", "2nd request returns same result — no duplicate charge", "Security"],
    ],
  },
  PUT: {
    note: "Idempotent — updating with the same data N times must produce the same state",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1, "PUT existing resource with complete valid data", "200 + updated resource body", "Happy Path"],
      [2, "PUT same data twice (idempotency check)", "200 both times, same resulting state", "Happy Path"],
      [3, "PUT then GET to verify update persisted (persistence check)", "200 + data matches what was PUT", "Happy Path"],
      [4, "PUT without authentication token", "401", "Negative"],
      [5, "PUT with valid token but no update permission", "403", "Negative"],
      [6, "PUT with non-existent resource ID", "404", "Negative"],
      [7, "PUT with missing required field", "400 + error specifying which field is missing", "Negative"],
      [8, "PUT with wrong data type for a field", "400", "Negative"],
      [9, "PUT with ID in wrong format", "400", "Negative"],
      [10, "PUT with value violating business rule", "422 + error message", "Negative"],
      [11, "PUT with string exceeding max length", "400", "Edge Case"],
      [12, "PUT with same data as current state (no-op update)", "200 (no change, no error)", "Edge Case"],
      [13, "PUT with extra unknown fields not in schema", "200 (fields ignored) or 400 per API design", "Edge Case"],
      [14, "PUT resource owned by another user (IDOR check)", "403", "Security"],
      [15, "PUT with immutable/privileged fields (e.g. id, created_at, balance)", "Fields ignored or 400 — must not be overwritten", "Security"],
    ],
  },
  PATCH: {
    note: "Partial update — unspecified fields must remain unchanged",
    noteColor: "#b45309",
    noteBg: "#fffbeb",
    noteBorder: "#fde68a",
    rows: [
      [1, "PATCH single field with valid value", "200 + only that field updated", "Happy Path"],
      [2, "PATCH multiple fields with valid values", "200 + all patched fields updated", "Happy Path"],
      [3, "PATCH then GET to verify unpatched fields unchanged (persistence check)", "200 + non-patched fields retain original values", "Happy Path"],
      [4, "PATCH without authentication token", "401", "Negative"],
      [5, "PATCH with valid token but no update permission", "403", "Negative"],
      [6, "PATCH with non-existent resource ID", "404", "Negative"],
      [7, "PATCH with wrong data type for a field", "400", "Negative"],
      [8, "PATCH with invalid field value", "400", "Negative"],
      [9, "PATCH with ID in wrong format", "400", "Negative"],
      [10, "PATCH with value violating business rule (e.g. invalid status transition)", "422 + error message", "Negative"],
      [11, "PATCH with empty body {}", "200 (no-op) or 400 per API design", "Edge Case"],
      [12, "PATCH with null value on a field", "field cleared or 400 per nullable contract", "Edge Case"],
      [13, "PATCH on immutable field (e.g. id, created_at)", "400 or silently ignored per API design", "Edge Case"],
      [14, "PATCH with unknown field not in schema", "200 (ignored) or 400 per API design", "Edge Case"],
      [15, "PATCH resource owned by another user (IDOR check)", "403", "Security"],
      [16, "PATCH with privileged fields (e.g. role, is_admin)", "Fields ignored or 400 — must not be applied", "Security"],
    ],
  },
  DELETE: {
    note: "Idempotent by design — second DELETE on same ID must return 404, not 500",
    noteColor: "#0369a1",
    noteBg: "#f0f9ff",
    noteBorder: "#bae6fd",
    rows: [
      [1, "DELETE existing resource", "200 or 204", "Happy Path"],
      [2, "DELETE then GET to verify resource is gone (persistence check)", "404 after DELETE", "Happy Path"],
      [3, "DELETE without authentication token", "401", "Negative"],
      [4, "DELETE with valid token but no delete permission", "403", "Negative"],
      [5, "DELETE with non-existent resource ID", "404", "Negative"],
      [6, "DELETE already-deleted resource (second call)", "404 (not 500)", "Negative"],
      [7, "DELETE with ID in wrong format", "400", "Negative"],
      [8, "DELETE resource that has dependencies (linked data)", "409 or 422 per business rule", "Edge Case"],
      [9, "DELETE with ID = 0 or negative number", "400 or 404 per business rule", "Edge Case"],
      [10, "Soft delete (if applicable) — verify via GET", "Record exists but status/flag changed", "Edge Case"],
      [11, "DELETE resource owned by another user (IDOR check)", "403", "Security"],
    ],
  },
  "Cross-Method": {
    note: "Apply to all endpoints — verify at least once per API",
    noteColor: "#4f46e5",
    noteBg: "#eef2ff",
    noteBorder: "#c7d2fe",
    rows: [
      [1, "Send wrong HTTP method to endpoint (e.g. POST to GET-only endpoint)", "405 Method Not Allowed", "General"],
      [2, "Send request without Content-Type: application/json header", "415 Unsupported Media Type", "General"],
      [3, "Exceed rate limit (if applicable)", "429 + Retry-After header", "General"],
      [4, "Verify error response structure is consistent across all endpoints", "Same error schema everywhere", "General"],
      [5, "Verify success response structure is consistent across all endpoints", "Same success schema everywhere", "General"],
      [6, "Verify HTTP status codes are semantically correct (not 200 for everything)", "Status code matches operation result", "General"],
      [7, "Use expired token", "401", "Security"],
      [8, "Use malformed token (random string)", "401", "Security"],
      [9, "Use valid token of User A to access resource owned by User B", "403", "Security"],
      [10, "Use lower-privileged role to perform admin-only action", "403", "Security"],
      [11, "Use read-only token to perform write operation", "403", "Security"],
      [12, "Logout then use the same token", "401 — token must be invalidated", "Security"],
    ],
  },
};

const CATEGORY_COLOR: Record<Category, string> = {
  "Happy Path": "#22c55e",
  Negative: "#ef4444",
  "Edge Case": "#f59e0b",
  Security: "#8b5cf6",
  General: "#6366f1",
};

const CODES: Array<[string, string, string]> = [
  ["200", "OK", "Successful GET, PUT, PATCH"],
  ["201", "Created", "Successful POST that creates a resource"],
  ["204", "No Content", "Successful DELETE or operation with no response body"],
  ["400", "Bad Request", "Wrong format, missing/invalid fields"],
  ["401", "Unauthorized", "No token or invalid/expired token"],
  ["403", "Forbidden", "Valid token but no permission for this resource"],
  ["404", "Not Found", "Resource ID does not exist"],
  ["405", "Method Not Allowed", "Wrong HTTP method for this endpoint"],
  ["409", "Conflict", "Duplicate resource or state conflict"],
  ["422", "Unprocessable Entity", "Format valid but business rule violation"],
  ["429", "Too Many Requests", "Rate limit exceeded"],
  ["500", "Internal Server Error", "Server-side bug — should never occur in healthy API"],
];

export default function App() {
  const [tab, setTab] = useState<Method>("GET");
  const [filter, setFilter] = useState<Filter>("All");
  const [showCodes, setShowCodes] = useState(false);
  const [showPrinciple, setShowPrinciple] = useState(false);
  const [showAssert, setShowAssert] = useState(false);
  const [showUnitNote, setShowUnitNote] = useState(false);

  const d = DATA[tab];
  const allCats = [...new Set<Category>(d.rows.map(([, , , category]) => category))];
  const cats: Filter[] = ["All", ...allCats];
  const rows = filter === "All" ? d.rows : d.rows.filter(([, , , category]) => category === filter);

  const counts = allCats.reduce<Record<Category, number>>((acc, category) => {
    acc[category] = d.rows.filter(([, , , rowCategory]) => rowCategory === category).length;
    return acc;
  }, {} as Record<Category, number>);

  const s = {
    wrap: { fontFamily: "system-ui,sans-serif", maxWidth: 900, margin: "0 auto", padding: "24px 16px", color: "#1e293b" } as CSSProperties,
    h1: { fontSize: 22, fontWeight: 700, marginBottom: 4 } as CSSProperties,
    sub: { color: "#64748b", fontSize: 13, marginBottom: 20 } as CSSProperties,
    card: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, marginBottom: 12, overflow: "hidden" } as CSSProperties,
    cardHead: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", cursor: "pointer", userSelect: "none" } as CSSProperties,
    cardTitle: { fontWeight: 600, fontSize: 14 } as CSSProperties,
    cardBody: { padding: "0 14px 14px" } as CSSProperties,
    tabs: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 } as CSSProperties,
    tab: (active: boolean): CSSProperties => ({ padding: "6px 14px", borderRadius: 20, border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13, fontWeight: active ? 700 : 400, background: active ? "#1e293b" : "#fff", color: active ? "#fff" : "#475569" }),
    filterRow: { display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" } as CSSProperties,
    filterBtn: (active: boolean, category: Filter): CSSProperties => ({ padding: "4px 12px", borderRadius: 20, border: `1px solid ${CATEGORY_COLOR[category as Category] || "#e2e8f0"}`, cursor: "pointer", fontSize: 12, fontWeight: active ? 700 : 400, background: active ? (CATEGORY_COLOR[category as Category] || "#1e293b") : "#fff", color: active ? "#fff" : (CATEGORY_COLOR[category as Category] || "#475569") }),
    note: (bg: string, border: string, color: string): CSSProperties => ({ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12, color, marginBottom: 8 }),
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 } as CSSProperties,
    th: { background: "#f1f5f9", padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "#475569", borderBottom: "1px solid #e2e8f0" } as CSSProperties,
    td: { padding: "8px 10px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" } as CSSProperties,
    badge: (category: Category): CSSProperties => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: `${CATEGORY_COLOR[category]}22`, color: CATEGORY_COLOR[category] }),
    stat: { display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" } as CSSProperties,
    statBox: (category: Category): CSSProperties => ({ padding: "6px 12px", borderRadius: 8, background: `${CATEGORY_COLOR[category]}15`, border: `1px solid ${CATEGORY_COLOR[category]}44`, fontSize: 12, fontWeight: 600, color: CATEGORY_COLOR[category] }),
    code: { display: "inline-block", background: "#f1f5f9", borderRadius: 4, padding: "1px 6px", fontFamily: "monospace", fontSize: 12, color: "#0f172a" } as CSSProperties,
  };

  return (
    <div style={s.wrap}>
      <div style={s.h1}>REST API Functional + Security Testing Standard</div>
      <div style={s.sub}>Functional · Security (QA perspective) · v1.1</div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={() => setShowPrinciple((v) => !v)}>
          <span style={s.cardTitle}>📌 Core Principle</span>
          <span style={{ color: "#94a3b8" }}>{showPrinciple ? "▲" : "▼"}</span>
        </div>
        {showPrinciple && (
          <div style={s.cardBody}>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#334155" }}>
              REST APIs share the same rules regardless of business logic — HTTP methods behave consistently, status codes carry universal meaning, and auth/validation patterns are standard.<br /><br />
              <strong>What changes per API:</strong> endpoint paths, request body fields, business rules, response schema<br />
              <strong>What never changes:</strong> the scenarios in this checklist — these apply to every REST API<br /><br />
              <span style={{ color: "#64748b", fontSize: 12 }}>This standard covers ~90% of any REST API. The remaining 10% is business logic unique to each API.</span>
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={() => setShowUnitNote((v) => !v)}>
          <span style={s.cardTitle}>🔄 Relationship with Unit Testing</span>
          <span style={{ color: "#94a3b8" }}>{showUnitNote ? "▲" : "▼"}</span>
        </div>
        {showUnitNote && (
          <div style={s.cardBody}>
            <div style={{ fontSize: 13, lineHeight: 1.7, color: "#334155", marginBottom: 10 }}>
              Some scenarios (input validation — missing fields, wrong types, max length) overlap with Unit Tests. <strong>They are intentionally kept here.</strong>
            </div>
            <table style={s.table}>
              <thead><tr><th style={s.th}></th><th style={s.th}>Unit Test</th><th style={s.th}>API Test</th></tr></thead>
              <tbody>
                {[
                  ["What it tests", "Logic in isolation", "Behavior through real HTTP stack"],
                  ["Validates HTTP layer", "✗", "✓"],
                  ["Validates response structure/contract", "✗", "✓"],
                  ["Catches framework/wiring bugs", "✗", "✓"],
                ].map(([label, ut, at]) => (
                  <tr key={label}>
                    <td style={{ ...s.td, fontWeight: 500, color: "#475569" }}>{label}</td>
                    <td style={{ ...s.td, color: ut === "✓" ? "#22c55e" : ut === "✗" ? "#ef4444" : "#475569", fontWeight: ut === "✗" || ut === "✓" ? 700 : 400 }}>{ut}</td>
                    <td style={{ ...s.td, color: at === "✓" ? "#22c55e" : at === "✗" ? "#ef4444" : "#475569", fontWeight: at === "✗" || at === "✓" ? 700 : 400 }}>{at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ ...s.note("#fffbeb", "#fde68a", "#92400e"), marginTop: 10, marginBottom: 0 }}>
              A validation rule may pass Unit Test but still return 500 instead of 400 if the error is not wired correctly through the framework. API tests catch this gap.<br /><br />
              <strong>Focus of API test on overlapping cases:</strong> status code is correct (400, not 500) · response body follows agreed error structure · error message does not leak internals
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={() => setShowAssert((v) => !v)}>
          <span style={s.cardTitle}>✅ Assertion Checklist (Every Test Case)</span>
          <span style={{ color: "#94a3b8" }}>{showAssert ? "▲" : "▼"}</span>
        </div>
        {showAssert && (
          <div style={s.cardBody}>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "#334155" }}>
              <strong>Always assert:</strong>
              <ol style={{ margin: "6px 0 12px 18px", padding: 0 }}>
                <li><strong>Status Code</strong> — must match expected exactly</li>
                <li><strong>Response Body</strong> — key fields exist, correct data type, correct value</li>
                <li><strong>Response Header</strong> — <span style={s.code}>Content-Type: application/json</span> present</li>
              </ol>
              <strong>For error scenarios, additionally assert:</strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                <li>Error message is meaningful and describes the problem</li>
                <li>Error structure is consistent across all endpoints</li>
                <li>No sensitive data leaked (stack trace, DB error, internal path)</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      <div style={s.card}>
        <div style={s.cardHead} onClick={() => setShowCodes((v) => !v)}>
          <span style={s.cardTitle}>📊 HTTP Status Code Reference</span>
          <span style={{ color: "#94a3b8" }}>{showCodes ? "▲" : "▼"}</span>
        </div>
        {showCodes && (
          <div style={s.cardBody}>
            <div style={s.note("#fffbeb", "#fde68a", "#92400e")}>
              <strong>400 vs 422:</strong> Use 400 for malformed input (wrong type, missing field). Use 422 when input is structurally valid but violates business rules (e.g. transfer amount exceeds balance, invalid status transition).
            </div>
            <table style={s.table}>
              <thead><tr><th style={s.th}>Code</th><th style={s.th}>Meaning</th><th style={s.th}>When to Expect</th></tr></thead>
              <tbody>
                {CODES.map(([code, meaning, when]) => (
                  <tr key={code}>
                    <td style={s.td}><span style={{ ...s.code, color: +code >= 500 ? "#dc2626" : +code >= 400 ? "#d97706" : +code >= 300 ? "#2563eb" : "#16a34a" }}>{code}</span></td>
                    <td style={{ ...s.td, fontWeight: 500 }}>{meaning}</td>
                    <td style={{ ...s.td, color: "#64748b" }}>{when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: "#475569" }}>CHECKLIST BY METHOD</div>
      <div style={s.tabs}>
        {METHODS.map((method) => <button key={method} type="button" style={s.tab(tab === method)} onClick={() => { setTab(method); setFilter("All"); }}>{method}</button>)}
      </div>

      <div style={s.stat}>
        {Object.entries(counts).map(([category, count]) => (
          <div key={category} style={s.statBox(category as Category)}>{category}: {count}</div>
        ))}
        <div style={{ padding: "6px 12px", borderRadius: 8, background: "#f1f5f9", fontSize: 12, fontWeight: 600, color: "#475569" }}>Total: {d.rows.length}</div>
      </div>

      <div style={s.note(d.noteBg, d.noteBorder, d.noteColor)}>{d.note}</div>

      <div style={s.filterRow}>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>Filter:</span>
        {cats.map((category) => (
          <button key={category} type="button" style={s.filterBtn(filter === category, category as Filter)} onClick={() => setFilter(category as Filter)}>{category}</button>
        ))}
      </div>

      <table style={s.table}>
        <thead>
          <tr>
            <th style={{ ...s.th, width: 36 }}>#</th>
            <th style={s.th}>Scenario</th>
            <th style={s.th}>Expected Result</th>
            <th style={{ ...s.th, width: 100 }}>Category</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([n, scenario, expected, category]) => (
            <tr key={n} style={{ background: n % 2 === 0 ? "#fafafa" : "#fff" }}>
              <td style={{ ...s.td, color: "#94a3b8", fontSize: 12 }}>{n}</td>
              <td style={s.td}>{scenario}</td>
              <td style={{ ...s.td, color: "#475569" }}>{expected}</td>
              <td style={s.td}><span style={s.badge(category)}>{category}</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 24, padding: "12px 0", borderTop: "1px solid #e2e8f0", fontSize: 12, color: "#94a3b8", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <span>v1.1 · Functional + Security (QA Perspective)</span>
        <span>Pending: Performance · Contract Testing</span>
      </div>
    </div>
  );
}