import { useState, useEffect, useRef, useCallback } from "react";
import { supabase, remoteLoad, remoteSave, getDeviceId, setDeviceId } from "./sync.js";
import { haptic, hapticCelebrate, playDing, playCelebration, playClick, playMealCelebration } from "./feedback.js";

const WK_KEY  = "ppl_v4";
const NUT_KEY = "ppl_nut_v1";

// ── Workout defaults from 4 May 2026 session ──────────────────────────────
const DEFAULT_SETS = {
  "Lat pul":             "120x7",
  "Lat kinitrino":       "30kg x 10",
  "Red row":             "10 lbs + 2.5kg x 6",
  "Barbell curl":        "Bar 5+5 x 7",
  "Preacher":            "15 kg x 8",
  "Dumbell chest press": "25x10",
  "Chest fly cable":     "35x10 40x5",
  "Fake pec deck":       "9x50",
  "Tricep one hand":     "5x10",
  "Tricep s toy":        "30x10 32.5x7",
  "Seated dip":          "40kgx9",
  "Shoulder winner":     "35x7",
  "Shoulder xeno":       "7.5x10",
};

const PROGRAM = [
  {
    key: "pull", label: "PULL", color: "#60a5fa",
    exercises: ["Lat pul", "Lat kinitrino", "Red row", "Barbell curl", "Preacher"],
  },
  {
    key: "push", label: "PUSH", color: "#f87171",
    exercises: [
      "Dumbell chest press", "Chest fly cable", "Fake pec deck",
      "Tricep one hand", "Tricep s toy", "Seated dip",
      "Shoulder winner", "Shoulder xeno",
    ],
  },
  { key: "legs", label: "LEGS", color: "#c084fc", exercises: [] },
  {
    key: "abs", label: "ABS", color: "#34d399",
    exercises: ["Crunches", "Leg Raises", "Plank"],
  },
];

// ── 30-Day Protein Plan (from 140g_Protein_30Day_Plan.xlsx) ───────────────
const PLAN_START = new Date("2026-05-06T00:00:00");

const PROTEIN_PLAN = [
  { day: 1,  date: "Wed May 06", total: 140, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["200g Greek Yogurt",20],["150g Cottage Cheese",16]] },
  { day: 2,  date: "Thu May 07", total: 139, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["4 Boiled Eggs",24],["200g Cottage Cheese",22],["1 String Cheese",7]] },
  { day: 3,  date: "Fri May 08", total: 141, meals: [["Protein Shake",24],["200g Canned Tuna",44],["4 Boiled Eggs",24],["200g Greek Yogurt",20],["200g Cottage Cheese",22],["1 String Cheese",7]] },
  { day: 4,  date: "Sat May 09", total: 140, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["200g Greek Yogurt",20],["150g Cottage Cheese",16]] },
  { day: 5,  date: "Sun May 10", total: 140, meals: [["Protein Shake",24],["150g Canned Salmon",32],["200g Baked Chicken Breast",62],["2 Boiled Eggs",12],["100g Greek Yogurt",10]] },
  { day: 6,  date: "Mon May 11", total: 144, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["200g Baked Chicken Breast",62],["2 Boiled Eggs",12]] },
  { day: 7,  date: "Tue May 12", total: 141, meals: [["Protein Shake",24],["200g Canned Tuna",44],["200g Baked Chicken Breast",62],["100g Cottage Cheese",11]] },
  { day: 8,  date: "Wed May 13", total: 141, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["4 Boiled Eggs",24],["200g Greek Yogurt",20],["100g Cottage Cheese",11]] },
  { day: 9,  date: "Thu May 14", total: 139, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["3 Boiled Eggs",18],["200g Cottage Cheese",22],["150g Greek Yogurt",15],["2 String Cheese",14]] },
  { day: 10, date: "Fri May 15", total: 142, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["200g Canned Tuna",44],["2 Boiled Eggs",12]] },
  { day: 11, date: "Sat May 16", total: 140, meals: [["Protein Shake",24],["120g Canned Sardines",25],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["100g Cottage Cheese",11]] },
  { day: 12, date: "Sun May 17", total: 142, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["200g Baked Chicken Breast",62],["100g Greek Yogurt",10]] },
  { day: 13, date: "Mon May 18", total: 141, meals: [["Protein Shake",24],["150g Canned Salmon",32],["150g Baked Chicken Breast",46],["3 Boiled Eggs",18],["100g Cottage Cheese",11],["100g Greek Yogurt",10]] },
  { day: 14, date: "Tue May 19", total: 140, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["200g Cottage Cheese",22],["2 String Cheese",14]] },
  { day: 15, date: "Wed May 20", total: 142, meals: [["Protein Shake",24],["200g Canned Tuna",44],["200g Baked Chicken Breast",62],["2 Boiled Eggs",12]] },
  { day: 16, date: "Thu May 21", total: 139, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["3 Boiled Eggs",18],["200g Greek Yogurt",20],["200g Cottage Cheese",22],["30g Beef Jerky",9]] },
  { day: 17, date: "Fri May 22", total: 141, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["200g Cottage Cheese",22],["3 Boiled Eggs",18],["150g Greek Yogurt",15]] },
  { day: 18, date: "Sat May 23", total: 139, meals: [["Protein Shake",24],["200g Cooked Shrimp",48],["3 Boiled Eggs",18],["200g Greek Yogurt",20],["200g Cottage Cheese",22],["1 String Cheese",7]] },
  { day: 19, date: "Sun May 24", total: 144, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["200g Ground Beef 90% Lean",46],["2 Boiled Eggs",12]] },
  { day: 20, date: "Mon May 25", total: 142, meals: [["Protein Shake",24],["200g Canned Tuna",44],["5 Boiled Eggs",30],["200g Cottage Cheese",22],["150g Greek Yogurt",15],["1 String Cheese",7]] },
  { day: 21, date: "Tue May 26", total: 141, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["4 Boiled Eggs",24],["200g Greek Yogurt",20],["100g Cottage Cheese",11]] },
  { day: 22, date: "Wed May 27", total: 143, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["200g Baked Chicken Breast",62],["100g Cottage Cheese",11]] },
  { day: 23, date: "Thu May 28", total: 149, meals: [["Protein Shake",24],["120g Canned Sardines",25],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["200g Greek Yogurt",20]] },
  { day: 24, date: "Fri May 29", total: 141, meals: [["Protein Shake",24],["150g Canned Salmon",32],["200g Baked Chicken Breast",62],["2 Boiled Eggs",12],["100g Cottage Cheese",11]] },
  { day: 25, date: "Sat May 30", total: 142, meals: [["Protein Shake",24],["200g Canned Tuna",44],["3 Boiled Eggs",18],["200g Cottage Cheese",22],["200g Greek Yogurt",20],["2 String Cheese",14]] },
  { day: 26, date: "Sun May 31", total: 139, meals: [["Protein Shake",24],["200g Ground Beef 90% Lean",46],["3 Boiled Eggs",18],["200g Greek Yogurt",20],["200g Cottage Cheese",22],["30g Beef Jerky",9]] },
  { day: 27, date: "Mon Jun 01", total: 141, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["200g Canned Tuna",44],["100g Cottage Cheese",11]] },
  { day: 28, date: "Tue Jun 02", total: 146, meals: [["Protein Shake",24],["200g Cooked Shrimp",48],["200g Baked Chicken Breast",62],["2 Boiled Eggs",12]] },
  { day: 29, date: "Wed Jun 03", total: 141, meals: [["Protein Shake",24],["200g Canned Tuna",44],["4 Boiled Eggs",24],["200g Greek Yogurt",20],["200g Cottage Cheese",22],["1 String Cheese",7]] },
  { day: 30, date: "Thu Jun 04", total: 146, meals: [["Protein Shake",24],["200g Baked Chicken Breast",62],["3 Boiled Eggs",18],["200g Cottage Cheese",22],["200g Greek Yogurt",20]] },
];

// ── Persistence ────────────────────────────────────────────────────────────
function loadWk() {
  try {
    const d = localStorage.getItem(WK_KEY);
    if (d) return JSON.parse(d);
  } catch {}
  return { ...DEFAULT_SETS };
}
function saveWk(d) { try { localStorage.setItem(WK_KEY, JSON.stringify(d)); } catch {} }

function loadNut() {
  try {
    const d = localStorage.getItem(NUT_KEY);
    if (d) return JSON.parse(d);
  } catch {}
  return {};
}
function saveNut(d) { try { localStorage.setItem(NUT_KEY, JSON.stringify(d)); } catch {} }

function todayDayNum() {
  const diff = Math.floor((Date.now() - PLAN_START.getTime()) / 86400000);
  return Math.max(1, Math.min(30, diff + 1));
}

// ── Shared CSS ─────────────────────────────────────────────────────────────
const BASE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body {
    background: oklch(7% 0.01 265);
    color: oklch(90% 0.006 265);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
    overscroll-behavior: none;
  }
  ::-webkit-scrollbar { display: none; }
  input {
    background: transparent; border: none; outline: none;
    font-family: 'JetBrains Mono', monospace;
    color: oklch(88% 0.006 265); width: 100%;
  }
  input::placeholder { color: oklch(24% 0.006 265); }
  button { cursor: pointer; border: none; outline: none; background: none; font-family: 'Syne', sans-serif; }
  .mono { font-family: 'JetBrains Mono', monospace; }

  /* ── Animations ── */
  @keyframes slideIn { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: translateX(0); } }
  @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rowPop  { 0% { transform: scale(1); } 35% { transform: scale(1.03); } 100% { transform: scale(1); } }
  @keyframes flashFade  { 0% { opacity: 0.45; } 100% { opacity: 0; } }
  @keyframes celebBurst { 0% { opacity: 0.6; transform: scale(0.94); } 40% { opacity: 0.8; transform: scale(1.04); } 100% { opacity: 0; transform: scale(1); } }
  @keyframes ring { 0% { transform: translate(-50%,-50%) scale(0.15); opacity: 0.9; } 100% { transform: translate(-50%,-50%) scale(3); opacity: 0; } }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.25; } }

  .slide  { animation: slideIn .24s cubic-bezier(0.22,1,0.36,1) both; }
  .fadeup { animation: fadeUp  .26s cubic-bezier(0.22,1,0.36,1) both; }
  .ex-row-pop  { animation: rowPop 0.3s cubic-bezier(0.22,1,0.36,1); }
  .ex-row-done { opacity: 0.38; }

  /* ── Day tabs ── */
  .day-tab {
    padding: 8px 18px; border-radius: 20px; font-size: 11px; font-weight: 800;
    letter-spacing: 2px; flex-shrink: 0;
    transition: background .2s, color .2s, box-shadow .2s;
  }

  /* ── Exercise rows ── */
  .ex-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 15px 0; border-bottom: 1px solid oklch(14% 0.008 265);
    transition: opacity .2s;
  }
  .ex-row:last-child { border-bottom: none; }

  /* ── Bottom nav ── */
  .bottom-nav {
    position: fixed; bottom: 0; left: 0; right: 0;
    display: flex; justify-content: center;
    background: oklch(9.5% 0.01 265);
    border-top: 1px solid oklch(15% 0.008 265);
    z-index: 50;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  .nav-btn {
    flex: 1; max-width: 200px; padding: 13px 0 11px;
    display: flex; flex-direction: column; align-items: center; gap: 5px;
    font-size: 9px; font-weight: 800; letter-spacing: 2px;
    color: oklch(32% 0.006 265);
    transition: color .2s;
    position: relative;
  }
  .nav-btn::before {
    content: ''; position: absolute; top: 0; left: 50%;
    transform: translateX(-50%);
    width: 0; height: 2px; border-radius: 0 0 2px 2px;
    background: oklch(70% 0.01 265);
    transition: width .2s cubic-bezier(0.22,1,0.36,1);
  }
  .nav-btn.active { color: oklch(90% 0.006 265); }
  .nav-btn.active::before { width: 28px; }
  .nav-icon { line-height: 1; display: flex; align-items: center; }

  /* ── Meal rows ── */
  .meal-row {
    display: flex; align-items: center; gap: 14px;
    padding: 14px 0; border-bottom: 1px solid oklch(14% 0.008 265);
    transition: opacity .15s;
  }
  .meal-row:last-child { border-bottom: none; }

  /* ── Checkboxes ── */
  .check-box {
    width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
    border: 1.5px solid oklch(26% 0.008 265);
    display: flex; align-items: center; justify-content: center;
    transition: all .18s cubic-bezier(0.22,1,0.36,1);
  }
  .check-box.checked {
    background: oklch(68% 0.19 145);
    border-color: oklch(68% 0.19 145);
    box-shadow: 0 0 10px oklch(68% 0.19 145 / 0.35);
  }

  /* ── Sync dot ── */
  .sync-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    transition: background .4s;
  }
  .sync-dot.synced  { background: oklch(68% 0.19 145); box-shadow: 0 0 5px oklch(68% 0.19 145 / 0.5); }
  .sync-dot.syncing { background: oklch(74% 0.15 55); animation: pulse 1.2s ease-in-out infinite; }
  .sync-dot.offline { background: oklch(28% 0.006 265); }
  .sync-dot.error   { background: oklch(64% 0.2 25); }

  /* ── Progress bars ── */
  .prog-bar-track {
    height: 5px; border-radius: 3px;
    background: oklch(15% 0.008 265); overflow: visible;
    position: relative;
  }
  .prog-bar-fill {
    height: 100%; border-radius: 3px;
    transition: width .35s cubic-bezier(0.22,1,0.36,1);
  }

  /* ── Day dots (nutrition grid) ── */
  .day-dot {
    width: 32px; height: 32px; border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; font-family: 'JetBrains Mono', monospace;
    transition: all .18s;
  }

  /* ── Flash overlays ── */
  .screen-flash {
    position: fixed; inset: 0; pointer-events: none; z-index: 998;
    animation: flashFade 0.5s ease-out forwards;
  }
  .screen-celebrate {
    position: fixed; inset: 0; pointer-events: none; z-index: 998;
    animation: celebBurst 0.65s ease-out forwards;
  }
  .ring {
    position: fixed; left: 50%; top: 45%; width: 120px; height: 120px;
    border-radius: 50%; pointer-events: none; z-index: 999;
    border: 2.5px solid currentColor;
    animation: ring 0.65s ease-out forwards;
  }
`;

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [view,       setView]      = useState("workout");
  const [sets,       setSets]      = useState(loadWk);
  const [mode,       setMode]      = useState("display");
  const [editing,    setEditing]   = useState({});
  const [activeDay,  setActiveDay] = useState("pull");
  const [nutDay,     setNutDay]    = useState(todayDayNum);
  const [nutChecks,  setNutChecks] = useState(loadNut);
  const [syncStatus, setSyncStatus] = useState(supabase ? "syncing" : "offline");
  const [showDevice, setShowDevice] = useState(false);
  const [deviceInput, setDeviceInput] = useState("");
  const [doneExs,    setDoneExs]    = useState(() => new Set());
  const [flash,      setFlash]      = useState(null); // { type: "row"|"celebrate", color }
  const [popEx,      setPopEx]      = useState(null); // exercise name being popped
  const debounceRef  = useRef(null);
  const flashTimeout = useRef(null);

  // ── Remote load on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    remoteLoad().then(remote => {
      if (remote) {
        if (remote.workout)   { setSets(remote.workout);      saveWk(remote.workout); }
        if (remote.nutrition) { setNutChecks(remote.nutrition); saveNut(remote.nutrition); }
        setSyncStatus("synced");
      } else {
        setSyncStatus("synced"); // no remote record yet, that's fine
      }
    });
  }, []);

  // ── Debounced remote save whenever data changes ────────────────────────
  const scheduleSave = useCallback((wk, nut) => {
    if (!supabase) return;
    setSyncStatus("syncing");
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const ok = await remoteSave(wk, nut);
      setSyncStatus(ok ? "synced" : "error");
    }, 1500);
  }, []);

  useEffect(() => { saveWk(sets);       scheduleSave(sets, nutChecks); }, [sets]);
  useEffect(() => { saveNut(nutChecks); scheduleSave(sets, nutChecks); }, [nutChecks]);

  // ── Flash helper ───────────────────────────────────────────────────────
  const fireFlash = (type, color) => {
    clearTimeout(flashTimeout.current);
    setFlash({ type, color });
    flashTimeout.current = setTimeout(() => setFlash(null), 700);
  };

  // ── Exercise done toggle ───────────────────────────────────────────────
  const toggleExDone = (ex, dayColor) => {
    const wasAlreadyDone = doneExs.has(ex);
    setDoneExs(prev => {
      const next = new Set(prev);
      wasAlreadyDone ? next.delete(ex) : next.add(ex);
      return next;
    });

    if (!wasAlreadyDone) {
      // Mark done — fire all three
      haptic([45]);
      playDing();
      setPopEx(ex);
      setTimeout(() => setPopEx(null), 320);
      fireFlash("row", dayColor);

      // Check if all exercises in this day are now done
      const allExs = currentDay.exercises;
      const newDone = new Set(doneExs);
      newDone.add(ex);
      if (allExs.every(e => newDone.has(e))) {
        setTimeout(() => {
          hapticCelebrate();
          playCelebration();
          fireFlash("celebrate", dayColor);
        }, 350);
      }
    }
  };

  // ── Workout handlers ───────────────────────────────────────────────────
  const openConfig = () => {
    const init = {};
    PROGRAM.forEach(day =>
      day.exercises.forEach(ex => {
        init[ex] = sets[ex] ?? "";
      })
    );
    setEditing(init);
    setMode("config");
  };

  const saveConfig = () => {
    const next = { ...sets };
    Object.entries(editing).forEach(([ex, val]) => {
      const v = val.trim();
      if (v) next[ex] = v;
      else   delete next[ex];
    });
    setSets(next);
    setMode("display");
  };

  // ── Nutrition handlers ─────────────────────────────────────────────────
  const toggleMeal = (dayNum, mealIdx) => {
    let becomingChecked = false;
    let allDone = false;

    setNutChecks(prev => {
      const key  = String(dayNum);
      const plan = PROTEIN_PLAN[dayNum - 1];
      const cur  = prev[key] ?? new Array(plan.meals.length).fill(false);
      const next = [...cur];
      next[mealIdx] = !next[mealIdx];
      becomingChecked = next[mealIdx];
      allDone = next.every(Boolean);
      return { ...prev, [key]: next };
    });

    if (becomingChecked) {
      haptic([40]);
      playClick();
      fireFlash("row", "#34d399");
      if (allDone) {
        setTimeout(() => {
          hapticCelebrate();
          playMealCelebration();
          fireFlash("celebrate", "#34d399");
        }, 300);
      }
    }
  };

  const dayComplete = (dayNum) => {
    const plan   = PROTEIN_PLAN[dayNum - 1];
    const checks = nutChecks[String(dayNum)] ?? [];
    return checks.length === plan.meals.length && checks.every(Boolean);
  };

  const completedDays = PROTEIN_PLAN.filter(p => dayComplete(p.day)).length;

  // ── Current workout day ────────────────────────────────────────────────
  const currentDay = PROGRAM.find(d => d.key === activeDay);

  // ── Nutrition current day data ─────────────────────────────────────────
  const nutData    = PROTEIN_PLAN[nutDay - 1];
  const nutKey     = String(nutDay);
  const checks     = nutChecks[nutKey] ?? new Array(nutData.meals.length).fill(false);
  const checkedPro = nutData.meals.reduce((s, [, p], i) => s + (checks[i] ? p : 0), 0);
  const proFrac    = Math.min(1, checkedPro / nutData.total);
  const today      = todayDayNum();

  return (
    <>
      <style>{BASE_CSS}</style>

      {/* ── Flash overlays ───────────────────────────────────────────── */}
      {flash?.type === "row" && (
        <div key={Date.now() + "f"} className="screen-flash" style={{ background: flash.color }} />
      )}
      {flash?.type === "celebrate" && (
        <>
          <div key={Date.now() + "c"} className="screen-celebrate" style={{ background: flash.color }} />
          <div key={Date.now() + "r"} className="ring" style={{ color: flash.color }} />
        </>
      )}

      {/* ── WORKOUT view ─────────────────────────────────────────────── */}
      {view === "workout" && mode === "display" && (() => {
        const doneCount = currentDay.exercises.filter(e => doneExs.has(e)).length;
        const total     = currentDay.exercises.length;
        return (
          <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 88px" }}>
            {/* Header */}
            <div style={{ padding: "30px 24px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ fontSize: 10, color: "oklch(36% 0.008 265)", letterSpacing: 2.5, fontWeight: 700 }}>
                    {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()}
                  </div>
                  <div className={`sync-dot ${syncStatus}`} title={syncStatus} />
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>
                  Push Pull Legs
                </div>
              </div>
              <button onClick={openConfig} style={{
                marginTop: 4,
                padding: "8px 16px", borderRadius: 20,
                background: "oklch(13% 0.01 265)", color: "oklch(44% 0.008 265)",
                fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                border: "1px solid oklch(18% 0.01 265)",
              }}>
                EDIT
              </button>
            </div>

            {/* Day tabs */}
            <div style={{ display: "flex", gap: 7, padding: "0 24px 22px", overflowX: "auto" }}>
              {PROGRAM.map(day => (
                <button
                  key={day.key}
                  className="day-tab"
                  onClick={() => { setActiveDay(day.key); setDoneExs(new Set()); }}
                  style={{
                    background: activeDay === day.key ? day.color : "oklch(12% 0.01 265)",
                    color:      activeDay === day.key ? "oklch(7% 0.005 265)" : "oklch(34% 0.008 265)",
                    border:     activeDay === day.key ? "none" : "1px solid oklch(17% 0.01 265)",
                    boxShadow:  activeDay === day.key ? `0 0 16px ${day.color}45` : "none",
                  }}
                >
                  {day.label}
                </button>
              ))}
            </div>

            {/* Progress strip */}
            {total > 0 && (
              <div style={{ padding: "0 24px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ flex: 1, height: 3, borderRadius: 2, background: "oklch(14% 0.008 265)", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2,
                    width: `${(doneCount / total) * 100}%`,
                    background: currentDay.color,
                    boxShadow: doneCount > 0 ? `0 0 8px ${currentDay.color}70` : "none",
                    transition: "width .4s cubic-bezier(0.22,1,0.36,1), box-shadow .3s",
                  }} />
                </div>
                <div className="mono" style={{ fontSize: 11, color: doneCount === total && total > 0 ? currentDay.color : "oklch(36% 0.008 265)", fontWeight: 500, letterSpacing: 0.5, flexShrink: 0 }}>
                  {doneCount}/{total}
                </div>
              </div>
            )}

            {/* Exercise list */}
            <div className="slide" key={activeDay} style={{
              margin: "0 24px",
              background: "oklch(10.5% 0.01 265)",
              borderRadius: 18, padding: "2px 20px",
              border: `1px solid ${doneCount > 0 ? `${currentDay.color}22` : "oklch(15% 0.01 265)"}`,
              boxShadow: doneCount > 0 ? `0 0 24px ${currentDay.color}0d` : "none",
              transition: "border-color .4s, box-shadow .4s",
            }}>
              {total === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", color: "oklch(24% 0.008 265)", fontSize: 13, letterSpacing: 1 }}>
                  TBA
                </div>
              ) : (
                currentDay.exercises.map((ex, i) => {
                  const val     = sets[ex];
                  const done    = doneExs.has(ex);
                  const popping = popEx === ex;
                  return (
                    <div
                      key={ex}
                      className={`ex-row${done ? " ex-row-done" : ""}${popping ? " ex-row-pop" : ""}`}
                      style={{ animationDelay: `${i * 30}ms`, cursor: "pointer", userSelect: "none" }}
                      onClick={() => toggleExDone(ex, currentDay.color)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `1.5px solid ${done ? currentDay.color : "oklch(24% 0.008 265)"}`,
                          background: done ? currentDay.color : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all .18s cubic-bezier(0.22,1,0.36,1)",
                          boxShadow: done ? `0 0 8px ${currentDay.color}55` : "none",
                        }}>
                          {done && (
                            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                              <path d="M1 3.5L3.8 6.5L9 1" stroke="oklch(7% 0.005 265)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: done ? "oklch(36% 0.008 265)" : "oklch(84% 0.007 265)", textDecoration: done ? "line-through" : "none", transition: "color .18s" }}>
                          {ex}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 14 }}>
                        {val ? (
                          <div className="mono" style={{
                            fontSize: 13, fontWeight: 500,
                            color: done ? "oklch(32% 0.008 265)" : currentDay.color,
                            letterSpacing: -0.2, whiteSpace: "nowrap",
                            transition: "color .18s",
                            textShadow: done ? "none" : `0 0 12px ${currentDay.color}60`,
                          }}>
                            {val}
                          </div>
                        ) : (
                          <div className="mono" style={{ fontSize: 13, color: "oklch(24% 0.008 265)" }}>—</div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* ── WORKOUT config mode ───────────────────────────────────────── */}
      {view === "workout" && mode === "config" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 88px" }}>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "30px 24px 20px",
            position: "sticky", top: 0,
            background: "oklch(7% 0.01 265)", zIndex: 10,
            borderBottom: "1px solid oklch(14% 0.01 265)",
          }}>
            <div>
              <div style={{ fontSize: 10, color: "oklch(36% 0.008 265)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 5 }}>EDIT MODE</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.6 }}>Your Sets</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setMode("display")} style={{
                padding: "9px 16px", borderRadius: 20,
                background: "oklch(13% 0.01 265)", color: "oklch(44% 0.008 265)",
                fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
                border: "1px solid oklch(18% 0.01 265)",
              }}>
                CANCEL
              </button>
              <button onClick={saveConfig} style={{
                padding: "9px 18px", borderRadius: 20,
                background: "oklch(88% 0.006 265)", color: "oklch(7% 0.01 265)",
                fontSize: 11, fontWeight: 800, letterSpacing: 1.5,
              }}>
                SAVE
              </button>
            </div>
          </div>

          <div style={{ padding: "20px 24px 0" }}>
            <div style={{ fontSize: 12, color: "oklch(36% 0.008 265)", marginBottom: 22, lineHeight: 1.7 }}>
              Type weight and reps exactly how you write it. Leave blank to show —
            </div>
            {PROGRAM.map(day => {
              if (day.exercises.length === 0) return null;
              return (
                <div key={day.key} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2.5, color: day.color, marginBottom: 12, textShadow: `0 0 10px ${day.color}50` }}>
                    {day.label}
                  </div>
                  <div style={{ background: "oklch(10.5% 0.01 265)", borderRadius: 16, padding: "0 18px", border: "1px solid oklch(15% 0.01 265)" }}>
                    {day.exercises.map((ex, i) => (
                      <div key={ex} style={{
                        display: "flex", alignItems: "center",
                        padding: "14px 0",
                        borderBottom: i < day.exercises.length - 1 ? "1px solid oklch(14% 0.01 265)" : "none",
                        gap: 14,
                      }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "oklch(52% 0.008 265)", flexShrink: 0, width: "40%" }}>
                          {ex}
                        </div>
                        <div style={{
                          flex: 1, background: "oklch(13% 0.01 265)", borderRadius: 10,
                          padding: "10px 14px", border: "1px solid oklch(19% 0.01 265)",
                        }}>
                          <input
                            type="text" inputMode="text" placeholder="e.g. 120x7"
                            value={editing[ex] ?? ""}
                            onChange={e => setEditing(prev => ({ ...prev, [ex]: e.target.value }))}
                            style={{ fontSize: 14, fontWeight: 500 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── NUTRITION view ───────────────────────────────────────────── */}
      {view === "nutrition" && (
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 88px" }}>
          {/* Header */}
          <div style={{ padding: "30px 24px 18px" }}>
            <div style={{ fontSize: 10, color: "oklch(36% 0.008 265)", letterSpacing: 2.5, fontWeight: 700, marginBottom: 6 }}>
              30-DAY CHALLENGE
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
              <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>
                140g Protein
              </div>
              <div style={{ textAlign: "right", paddingBottom: 2 }}>
                <div className="mono" style={{ fontSize: 18, fontWeight: 500, color: completedDays > 0 ? "oklch(68% 0.19 145)" : "oklch(44% 0.008 265)", lineHeight: 1 }}>
                  {completedDays}
                </div>
                <div style={{ fontSize: 10, color: "oklch(36% 0.008 265)", letterSpacing: 1, fontWeight: 700 }}>/ 30 DAYS</div>
              </div>
            </div>
            <div className="prog-bar-track">
              <div className="prog-bar-fill" style={{
                width: `${(completedDays / 30) * 100}%`,
                background: "oklch(68% 0.19 145)",
                boxShadow: completedDays > 0 ? "0 0 8px oklch(68% 0.19 145 / 0.5)" : "none",
              }} />
            </div>
          </div>

          {/* 30-day dot grid */}
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {PROTEIN_PLAN.map(p => {
                const done    = dayComplete(p.day);
                const isToday = p.day === today;
                const isCur   = p.day === nutDay;
                return (
                  <button
                    key={p.day}
                    onClick={() => setNutDay(p.day)}
                    className="day-dot"
                    style={{
                      background: done ? "oklch(68% 0.19 145)" : isCur ? "oklch(17% 0.012 265)" : "oklch(12% 0.01 265)",
                      color:      done ? "oklch(7% 0.005 265)"  : isToday ? "oklch(76% 0.15 55)" : isCur ? "oklch(72% 0.008 265)" : "oklch(34% 0.008 265)",
                      outline:    isToday ? "1.5px solid oklch(66% 0.15 55)" : isCur && !done ? "1.5px solid oklch(30% 0.01 265)" : "none",
                      outlineOffset: "2px",
                      boxShadow:  done ? "0 0 8px oklch(68% 0.19 145 / 0.4)" : "none",
                    }}
                  >
                    {p.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day card */}
          <div className="fadeup" key={nutDay} style={{ margin: "0 24px" }}>
            {/* Day navigator */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <button
                onClick={() => setNutDay(d => Math.max(1, d - 1))}
                disabled={nutDay === 1}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: "oklch(12% 0.01 265)",
                  color: nutDay === 1 ? "oklch(24% 0.008 265)" : "oklch(62% 0.008 265)",
                  fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid oklch(17% 0.01 265)",
                }}
              >
                ‹
              </button>
              <div style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, color: nutDay === today ? "oklch(74% 0.15 55)" : "oklch(60% 0.008 265)", letterSpacing: 0.5 }}>
                    DAY {nutDay}
                  </div>
                  {nutDay === today && (
                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1.5, color: "oklch(74% 0.15 55)", background: "oklch(74% 0.15 55 / 0.12)", padding: "2px 7px", borderRadius: 10 }}>
                      TODAY
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 12, color: "oklch(42% 0.008 265)", marginTop: 3 }}>{nutData.date}</div>
              </div>
              <button
                onClick={() => setNutDay(d => Math.min(30, d + 1))}
                disabled={nutDay === 30}
                style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: "oklch(12% 0.01 265)",
                  color: nutDay === 30 ? "oklch(24% 0.008 265)" : "oklch(62% 0.008 265)",
                  fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid oklch(17% 0.01 265)",
                }}
              >
                ›
              </button>
            </div>

            {/* Protein progress card */}
            <div style={{
              background: "oklch(10.5% 0.01 265)", borderRadius: 18,
              padding: "16px 22px 18px",
              border: `1px solid ${checkedPro > 0 ? "oklch(68% 0.19 145 / 0.2)" : "oklch(15% 0.01 265)"}`,
              marginBottom: 10,
              boxShadow: checkedPro > 0 ? "0 0 20px oklch(68% 0.19 145 / 0.08)" : "none",
              transition: "border-color .4s, box-shadow .4s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontSize: 10, color: "oklch(38% 0.008 265)", fontWeight: 700, letterSpacing: 2 }}>
                  PROTEIN TODAY
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span className="mono" style={{
                    fontSize: 24, fontWeight: 500, lineHeight: 1,
                    color: checkedPro >= nutData.total ? "oklch(68% 0.19 145)" : "oklch(88% 0.006 265)",
                    textShadow: checkedPro >= nutData.total ? "0 0 16px oklch(68% 0.19 145 / 0.5)" : "none",
                    transition: "color .3s, text-shadow .3s",
                  }}>
                    {checkedPro}
                  </span>
                  <span className="mono" style={{ fontSize: 13, color: "oklch(38% 0.008 265)" }}>
                    / {nutData.total}g
                  </span>
                </div>
              </div>
              <div className="prog-bar-track">
                <div className="prog-bar-fill" style={{
                  width: `${proFrac * 100}%`,
                  background: checkedPro >= nutData.total ? "oklch(68% 0.19 145)" : "oklch(64% 0.17 55)",
                  boxShadow: checkedPro > 0 ? `0 0 10px ${checkedPro >= nutData.total ? "oklch(68% 0.19 145 / 0.6)" : "oklch(64% 0.17 55 / 0.5)"}` : "none",
                }} />
              </div>
            </div>

            {/* Meal list */}
            <div style={{
              background: "oklch(10.5% 0.01 265)", borderRadius: 18,
              padding: "2px 20px",
              border: "1px solid oklch(15% 0.01 265)",
            }}>
              {nutData.meals.map(([name, protein], i) => {
                const checked = checks[i] ?? false;
                return (
                  <div
                    key={i}
                    className="meal-row"
                    onClick={() => toggleMeal(nutDay, i)}
                    style={{ cursor: "pointer", userSelect: "none", opacity: checked ? 0.45 : 1, transition: "opacity .2s" }}
                  >
                    <div className={`check-box${checked ? " checked" : ""}`}>
                      {checked && (
                        <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                          <path d="M1 4L4.5 7.5L11 1" stroke="oklch(7% 0.005 265)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "oklch(82% 0.007 265)", textDecoration: checked ? "line-through" : "none" }}>
                      {name}
                    </div>
                    <div className="mono" style={{ fontSize: 13, fontWeight: 500, color: checked ? "oklch(68% 0.19 145)" : "oklch(48% 0.008 265)", flexShrink: 0, transition: "color .18s" }}>
                      {protein}g
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tagline */}
            <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "oklch(26% 0.008 265)", letterSpacing: 2, fontWeight: 700 }}>
              BUILD MUSCLE. BUILD DISCIPLINE.
            </div>
          </div>

          {/* Sync panel */}
          <div style={{ margin: "20px 24px 0", padding: "14px 18px", borderRadius: 16, background: "oklch(10.5% 0.01 265)", border: "1px solid oklch(15% 0.01 265)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <div className={`sync-dot ${syncStatus}`} />
                <span style={{ fontSize: 12, color: "oklch(44% 0.008 265)", fontWeight: 600 }}>
                  {syncStatus === "synced"  && "Saved to cloud"}
                  {syncStatus === "syncing" && "Saving..."}
                  {syncStatus === "offline" && "Local only — add Supabase keys to sync"}
                  {syncStatus === "error"   && "Sync failed — check connection"}
                </span>
              </div>
              {supabase && (
                <button
                  onClick={() => { setShowDevice(d => !d); setDeviceInput(getDeviceId()); }}
                  style={{ fontSize: 10, color: "oklch(40% 0.008 265)", fontWeight: 800, letterSpacing: 1.5 }}
                >
                  DEVICE ID
                </button>
              )}
            </div>
            {showDevice && supabase && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "oklch(36% 0.008 265)", marginBottom: 10, lineHeight: 1.7 }}>
                  Copy this ID to use your data on another device, or paste a saved ID to restore.
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: "oklch(13% 0.01 265)", borderRadius: 10, padding: "10px 14px", border: "1px solid oklch(19% 0.01 265)" }}>
                    <input value={deviceInput} onChange={e => setDeviceInput(e.target.value)}
                      style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.4 }} spellCheck={false} />
                  </div>
                  <button onClick={() => navigator.clipboard?.writeText(getDeviceId())}
                    style={{ padding: "10px 13px", borderRadius: 10, background: "oklch(14% 0.01 265)", border: "1px solid oklch(19% 0.01 265)", fontSize: 11, color: "oklch(52% 0.008 265)", fontWeight: 700 }}>
                    COPY
                  </button>
                  <button onClick={async () => {
                    if (deviceInput.trim().length < 10) return;
                    setDeviceId(deviceInput); setSyncStatus("syncing");
                    const remote = await remoteLoad();
                    if (remote) {
                      if (remote.workout)   { setSets(remote.workout);        saveWk(remote.workout); }
                      if (remote.nutrition) { setNutChecks(remote.nutrition); saveNut(remote.nutrition); }
                    }
                    setSyncStatus("synced"); setShowDevice(false);
                  }} style={{ padding: "10px 13px", borderRadius: 10, background: "oklch(88% 0.006 265)", color: "oklch(7% 0.01 265)", fontSize: 11, fontWeight: 800 }}>
                    USE
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Bottom nav ───────────────────────────────────────────────── */}
      <nav className="bottom-nav">
        <button
          className={`nav-btn${view === "workout" ? " active" : ""}`}
          onClick={() => { setView("workout"); setMode("display"); }}
        >
          <span className="nav-icon">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 4v16M18 4v16M6 12h12M2 7h4M18 7h4M2 17h4M18 17h4"/>
            </svg>
          </span>
          WORKOUT
        </button>
        <button
          className={`nav-btn${view === "nutrition" ? " active" : ""}`}
          onClick={() => setView("nutrition")}
        >
          <span className="nav-icon">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"/>
            </svg>
          </span>
          NUTRITION
        </button>
      </nav>
    </>
  );
}
