import { useState, useEffect } from "react";
const STORAGE_KEY = "ppl_v3";
const PROGRAM = [
  {
    key: "pull",
    label: "PULL",
    color: "#60a5fa",
    dim: "#1e3a5f",
    exercises: [
      "Barbell Curl",
      "Hammer Curl",
      "Preacher Curl",
      "Lat Pulldown",
      "Red Row",
    ],
  },
  {
    key: "push",
    label: "PUSH",
    color: "#f87171",
    dim: "#5f1e1e",
    exercises: [
      "Tricep Pushdown",
      "Overhead Extension",
      "Dumbbell Press",
      "Incline Press",
      "Pec Deck",
      "Cable Shoulder Raise",
    ],
  },
  {
    key: "legs",
    label: "LEGS",
    color: "#c084fc",
    dim: "#3b1e5f",
    exercises: ["— TBA —"],
  },
  {
    key: "abs",
    label: "ABS",
    color: "#34d399",
    dim: "#1a4a35",
    exercises: ["Crunches", "Leg Raises", "Plank"],
  },
];
function load() {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : {};
  } catch { return {}; }
}
function save(d) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); } catch {}
}
export default function PPL() {
  const [prs, setPrs]       = useState(load);
  const [mode, setMode]     = useState("display"); // "display" | "config"
  const [editing, setEditing] = useState({}); // { exName: {weight, reps} }
  const [activeDay, setActiveDay] = useState("pull");
  useEffect(() => { save(prs); }, [prs]);
  // Enter config: populate editing state from prs
  const openConfig = () => {
    const init = {};
    PROGRAM.forEach(day => {
      day.exercises.filter(e => !e.startsWith("—")).forEach(ex => {
        init[ex] = { weight: prs[ex]?.weight ?? "", reps: prs[ex]?.reps ?? "" };
      });
    });
    setEditing(init);
    setMode("config");
  };
  const saveConfig = () => {
    const next = { ...prs };
    Object.entries(editing).forEach(([ex, val]) => {
      const w = parseFloat(val.weight), r = parseInt(val.reps);
      if (w && r) next[ex] = { weight: w, reps: r };
      else delete next[ex];
    });
    setPrs(next);
    setMode("display");
  };
  const updateEdit = (ex, field, val) => {
    setEditing(e => ({ ...e, [ex]: { ...e[ex], [field]: val } }));
  };
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    html, body { background: #080809; color: #e8e8f0; font-family: 'Syne', sans-serif; min-height: 100vh; overscroll-behavior: none; }
    ::-webkit-scrollbar { display: none; }
    input { background: transparent; border: none; outline: none; font-family: 'JetBrains Mono', monospace; color: #e8e8f0; width: 100%; }
    input::placeholder { color: #2a2a30; }
    button { cursor: pointer; border: none; outline: none; background: none; font-family: 'Syne', sans-serif; }
    .mono { font-family: 'JetBrains Mono', monospace; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
    .fade { animation: fadeIn .3s ease both; }
    .slide { animation: slideIn .25s ease both; }
    .day-tab {
      padding: 7px 16px; border-radius: 6px; font-size: 12px; font-weight: 700;
      letter-spacing: 1.5px; transition: all .2s;
    }
    .ex-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 13px 0;
      border-bottom: 1px solid #111115;
    }
    .ex-row:last-child { border-bottom: none; }
  `;
  const currentDay = PROGRAM.find(d => d.key === activeDay);
  // ── DISPLAY MODE ──────────────────────────────────────────────────────
  if (mode === "display") {
    return (
      <>
        <style>{css}</style>
        <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 0 40px" }}>
          {/* Top bar */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "24px 22px 20px",
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#333", letterSpacing: 2, fontWeight: 600 }}>
                {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()}
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>
                Push Pull Legs
              </div>
            </div>
            <button onClick={openConfig} style={{
              padding: "8px 14px", borderRadius: 8,
              background: "#111115", color: "#444",
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              border: "1px solid #1a1a20",
            }}>
              CONFIG
            </button>
          </div>
          {/* Day tabs */}
          <div style={{ display: "flex", gap: 6, padding: "0 22px 20px", overflowX: "auto" }}>
            {PROGRAM.map(day => (
              <button
                key={day.key}
                className="day-tab"
                onClick={() => setActiveDay(day.key)}
                style={{
                  background: activeDay === day.key ? day.color : "#0e0e12",
                  color: activeDay === day.key ? "#080809" : "#333",
                  border: activeDay === day.key ? "none" : "1px solid #1a1a20",
                  flexShrink: 0,
                }}
              >
                {day.label}
              </button>
            ))}
          </div>
          {/* Exercise list */}
          <div className="slide" key={activeDay} style={{
            margin: "0 22px",
            background: "#0c0c10",
            borderRadius: 16,
            padding: "4px 20px",
            border: "1px solid #111115",
          }}>
            {currentDay.exercises.filter(e => !e.startsWith("—")).length === 0 ? (
              <div style={{ padding: "30px 0", textAlign: "center", color: "#222", fontSize: 13 }}>
                To be announced
              </div>
            ) : (
              currentDay.exercises.filter(e => !e.startsWith("—")).map((ex, i) => {
                const pr = prs[ex];
                return (
                  <div key={ex} className="ex-row" style={{ animationDelay: `${i * 40}ms` }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#c8c8d8" }}>{ex}</div>
                    <div style={{ textAlign: "right" }}>
                      {pr ? (
                        <>
                          <div className="mono" style={{
                            fontSize: 18, fontWeight: 500,
                            color: currentDay.color,
                            letterSpacing: -0.5,
                          }}>
                            {pr.weight}<span style={{ fontSize: 11, color: "#444", marginLeft: 2 }}>lbs</span>
                          </div>
                          <div className="mono" style={{ fontSize: 10, color: "#333", marginTop: 1 }}>
                            × {pr.reps} reps
                          </div>
                        </>
                      ) : (
                        <div className="mono" style={{ fontSize: 13, color: "#222" }}>—</div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            {currentDay.key === "legs" && (
              <div style={{ padding: "20px 0", textAlign: "center", color: "#252530", fontSize: 13, fontWeight: 600, letterSpacing: 1 }}>
                TBA
              </div>
            )}
          </div>
          {/* Accent line under active day */}
          <div style={{
            height: 2, margin: "16px 22px 0",
            background: `linear-gradient(90deg, ${currentDay.color}44, transparent)`,
            borderRadius: 2,
          }} />
        </div>
      </>
    );
  }
  // ── CONFIG MODE ───────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: "0 0 60px" }}>
        {/* Config header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "24px 22px 20px",
          position: "sticky", top: 0, background: "#080809", zIndex: 10,
          borderBottom: "1px solid #111115",
        }}>
          <div>
            <div style={{ fontSize: 11, color: "#333", letterSpacing: 2, fontWeight: 600 }}>EDIT MODE</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, marginTop: 2 }}>Your PRs</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setMode("display")} style={{
              padding: "8px 14px", borderRadius: 8,
              background: "#111115", color: "#444",
              fontSize: 12, fontWeight: 700, letterSpacing: 1,
              border: "1px solid #1a1a20",
            }}>
              CANCEL
            </button>
            <button onClick={saveConfig} style={{
              padding: "8px 16px", borderRadius: 8,
              background: "#e8e8f0", color: "#080809",
              fontSize: 12, fontWeight: 800, letterSpacing: 1,
            }}>
              SAVE
            </button>
          </div>
        </div>
        <div style={{ padding: "10px 22px 0" }}>
          <div style={{ fontSize: 12, color: "#333", marginBottom: 20, lineHeight: 1.6 }}>
            Enter your current PR for each exercise.<br />Leave blank to show —
          </div>
          {PROGRAM.map(day => {
            const exs = day.exercises.filter(e => !e.startsWith("—"));
            if (exs.length === 0) return null;
            return (
              <div key={day.key} style={{ marginBottom: 28 }}>
                {/* Day label */}
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 2,
                  color: day.color, marginBottom: 10,
                }}>
                  {day.label}
                </div>
                <div style={{ background: "#0c0c10", borderRadius: 14, padding: "0 18px", border: "1px solid #111115" }}>
                  {exs.map((ex, i) => {
                    const val = editing[ex] || { weight: "", reps: "" };
                    return (
                      <div key={ex} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 0",
                        borderBottom: i < exs.length - 1 ? "1px solid #111115" : "none",
                        gap: 12,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#888", flex: 1 }}>{ex}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                          <div style={{
                            background: "#131318", borderRadius: 8, padding: "8px 12px",
                            border: "1px solid #1a1a22", width: 72, textAlign: "center",
                          }}>
                            <input
                              type="number" inputMode="decimal" placeholder="lbs"
                              value={val.weight}
                              onChange={e => updateEdit(ex, "weight", e.target.value)}
                              style={{ fontSize: 15, fontWeight: 500, textAlign: "center" }}
                            />
                          </div>
                          <div style={{ color: "#222", fontSize: 12 }}>×</div>
                          <div style={{
                            background: "#131318", borderRadius: 8, padding: "8px 10px",
                            border: "1px solid #1a1a22", width: 58, textAlign: "center",
                          }}>
                            <input
                              type="number" inputMode="numeric" placeholder="reps"
                              value={val.reps}
                              onChange={e => updateEdit(ex, "reps", e.target.value)}
                              style={{ fontSize: 15, fontWeight: 500, textAlign: "center" }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}