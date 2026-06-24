import { useState, useEffect, useCallback, useRef } from "react";

// ── PIXEL FONT via Google Fonts injected ──────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.href = "https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap";
FONT_LINK.rel = "stylesheet";
document.head.appendChild(FONT_LINK);

const PX = "'Press Start 2P', monospace";

const ROWS = 14;
const COLS = 20;

const T = { EMPTY:0, FLOODED:1, BLOCKED:2, GOAL:3, SHALLOW:4, FLOOD_SOURCE:5 };

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]];

// ── MAPS ──────────────────────────────────────────────────────────────────────
const MAPS = [
  {
    name:"SECTOR 01",
    sub:"DOWNTOWN",
    color:"#00ff88",
    floodInterval: 0,
    grid: [
      [0,0,2,1,1,1,0,0,2,0,1,1,0,0,0,2,0,1,0,0],
      [0,1,2,1,0,1,0,0,2,0,1,0,0,0,0,2,0,1,0,3],
      [0,1,0,0,0,0,0,1,0,0,0,0,1,1,0,0,0,0,0,0],
      [0,0,0,2,1,1,0,1,0,1,1,0,1,0,0,2,0,0,4,0],
      [2,2,1,2,1,0,0,0,0,1,0,0,0,0,0,2,0,0,4,0],
      [0,0,1,1,0,0,0,0,2,2,0,1,1,0,4,0,0,0,0,0],
      [0,0,0,0,1,1,1,0,2,2,0,1,0,0,4,0,1,1,0,0],
      [0,4,4,0,1,1,0,0,0,0,0,0,0,0,0,0,2,2,1,0],
      [0,1,4,0,0,0,2,1,1,1,0,0,0,1,0,0,0,0,1,0],
      [0,1,0,0,1,0,2,0,1,0,0,0,0,1,0,1,1,1,0,0],
      [1,1,0,0,1,0,0,0,0,0,1,1,0,0,0,1,0,0,2,0],
      [1,0,0,2,2,1,0,0,4,4,1,0,0,0,1,0,0,0,2,0],
      [0,0,1,1,0,1,1,0,0,4,0,0,1,0,2,0,1,1,1,0],
      [0,0,1,0,0,1,0,0,0,0,0,1,1,0,2,0,1,0,0,3],
    ],
    startPos:[6,0],
    floodSources:[],
  },
  {
    name:"SECTOR 02",
    sub:"RIVERSIDE",
    color:"#ffcc00",
    floodInterval: 8,
    grid: [
      [0,1,1,1,0,0,2,0,1,1,0,0,1,0,0,2,1,1,0,0],
      [0,2,0,1,0,0,2,0,1,0,0,0,1,4,0,2,1,0,0,3],
      [0,2,0,0,0,0,0,0,0,1,0,0,0,4,0,0,0,1,0,0],
      [0,0,0,0,2,1,1,0,0,1,1,0,0,2,0,0,0,1,0,0],
      [0,1,0,0,2,1,0,0,0,0,1,0,0,2,0,0,4,4,0,0],
      [5,1,0,0,0,0,0,0,2,2,0,0,0,0,0,0,4,0,1,0],
      [0,0,0,1,1,0,0,0,2,2,0,0,0,1,0,0,0,0,1,0],
      [0,0,0,2,1,0,0,0,0,0,0,0,2,0,1,0,0,0,0,0],
      [0,1,0,2,0,4,4,0,1,0,0,0,2,0,0,0,0,2,0,0],
      [0,1,0,0,0,4,0,0,1,0,2,1,0,0,0,0,0,2,0,0],
      [0,0,0,0,1,0,0,0,0,0,2,0,0,0,1,5,1,0,0,0],
      [2,2,0,0,1,0,0,1,0,0,0,0,0,0,1,0,0,0,0,0],
      [0,0,0,0,0,0,2,0,0,0,0,0,2,2,0,0,0,1,0,0],
      [0,0,1,0,0,0,2,0,0,0,1,0,0,0,0,0,0,1,0,3],
    ],
    startPos:[7,0],
    floodSources:[[5,0],[10,15]],
  },
  {
    name:"SECTOR 03",
    sub:"INDUSTRIAL",
    color:"#ff6600",
    floodInterval: 6,
    grid: [
      [0,0,2,2,1,1,0,0,0,1,0,2,0,1,0,1,0,0,0,3],
      [0,0,2,2,1,0,0,0,1,1,0,2,0,4,4,1,0,0,0,0],
      [0,0,0,0,0,2,0,0,1,0,0,0,0,0,4,0,0,1,0,0],
      [0,1,0,0,0,2,0,0,4,4,1,0,0,0,0,0,2,2,0,0],
      [0,2,1,0,0,0,0,0,4,0,1,0,0,1,0,0,2,2,0,0],
      [0,2,0,0,0,0,1,0,0,0,2,2,0,1,0,0,0,0,1,0],
      [5,1,0,1,0,0,0,0,0,0,2,2,0,0,0,1,0,0,1,0],
      [0,0,0,1,1,0,0,0,1,0,0,0,0,0,2,0,0,0,0,0],
      [0,1,0,0,2,2,0,0,1,0,0,0,0,0,2,0,0,0,4,0],
      [0,1,0,0,2,2,0,0,0,1,0,5,1,0,0,0,0,0,4,0],
      [0,0,0,0,0,0,0,1,0,1,1,0,0,0,0,0,1,0,0,0],
      [0,0,2,0,0,0,0,2,0,0,1,1,0,0,0,2,0,0,0,0],
      [0,0,2,0,0,0,0,2,0,4,4,1,0,0,0,2,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,3],
    ],
    startPos:[10,0],
    floodSources:[[6,0],[9,11]],
  },
  {
    name:"SECTOR 04",
    sub:"UPTOWN",
    color:"#ff44aa",
    floodInterval: 5,
    grid: [
      [3,1,1,1,0,2,1,1,1,0,1,1,0,1,0,2,1,1,0,0],
      [0,1,1,0,0,2,1,0,4,1,1,0,0,1,0,2,1,0,5,1],
      [0,0,2,2,1,0,0,1,4,0,0,1,2,1,0,0,0,1,0,0],
      [0,1,2,2,1,1,0,1,0,0,1,1,2,1,0,0,0,1,0,0],
      [0,1,0,0,1,1,0,1,1,1,1,0,0,0,4,4,0,1,1,0],
      [0,0,1,0,0,0,2,2,1,1,0,0,1,0,0,4,0,0,1,0],
      [0,5,1,0,1,0,2,2,1,0,1,0,1,0,1,0,0,0,1,0],
      [0,0,1,0,1,1,1,0,0,0,2,0,0,1,1,0,2,2,0,0],
      [0,0,1,1,1,0,0,0,1,0,2,0,4,4,1,1,0,2,0,0],
      [2,2,1,0,0,0,0,1,1,0,0,1,4,0,1,1,0,0,1,0],
      [0,0,1,1,0,2,0,1,0,1,1,1,0,0,0,0,1,1,0,0],
      [0,1,1,0,0,2,1,0,0,1,1,1,0,2,2,0,0,1,0,0],
      [0,1,0,0,0,0,1,1,0,1,0,0,0,2,2,0,1,0,4,0],
      [0,0,0,1,1,1,1,0,0,0,0,1,1,0,0,0,1,0,4,3],
    ],
    startPos:[7,0],
    floodSources:[[1,18],[6,1]],
  },
  {
    name:"SECTOR 05",
    sub:"FINAL ZONE",
    color:"#ff2222",
    floodInterval: 4,
    grid: [
      [0,0,2,1,1,0,0,0,0,1,0,0,2,1,0,0,0,0,0,3],
      [0,0,2,1,0,4,0,0,0,1,0,0,2,1,0,0,0,0,0,0],
      [5,1,0,0,0,4,0,0,0,2,2,0,0,0,0,0,4,4,0,0],
      [0,0,0,0,0,0,1,0,0,2,2,0,0,0,0,0,0,4,1,0],
      [0,0,2,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,1,0],
      [0,0,2,0,0,0,2,2,0,0,1,1,0,0,2,0,1,0,0,0],
      [0,0,0,0,0,0,2,2,0,0,4,4,0,0,2,0,1,0,0,3],
      [1,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,2,2,0,0],
      [1,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,2,2,0,0],
      [0,0,0,2,5,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,2,0,0,0,4,4,0,0,0,0],
      [2,2,0,0,0,0,0,0,0,0,2,0,0,0,0,4,0,0,0,0],
      [0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,2,0],
      [0,0,0,0,0,0,0,2,0,0,0,0,0,1,0,0,0,0,2,3],
    ],
    startPos:[6,0],
    floodSources:[[2,0],[9,4]],
  },
];

// ── A* ────────────────────────────────────────────────────────────────────────
const WCOST = { [T.EMPTY]:1, [T.SHALLOW]:3, [T.GOAL]:1 };

function astar(grid, sr, sc) {
  const walkable = (r,c) => {
    const t = grid[r][c];
    return t!==T.FLOODED && t!==T.BLOCKED && t!==T.FLOOD_SOURCE;
  };
  const h = (r,c) => {
    let best=Infinity;
    for(let rr=0;rr<ROWS;rr++) for(let cc=0;cc<COLS;cc++)
      if(grid[rr][cc]===T.GOAL) best=Math.min(best,Math.abs(rr-r)+Math.abs(cc-c));
    return best;
  };
  const dist=Array.from({length:ROWS},()=>Array(COLS).fill(Infinity));
  const par=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  dist[sr][sc]=0;
  const pq=[[h(sr,sc),0,sr,sc]];
  const vis=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  let gr=-1,gc=-1;
  while(pq.length){
    pq.sort((a,b)=>a[0]-b[0]);
    const[,g,r,c]=pq.shift();
    if(vis[r][c]) continue; vis[r][c]=true;
    if(grid[r][c]===T.GOAL){gr=r;gc=c;break;}
    for(const[dr,dc] of DIRS){
      const nr=r+dr,nc=c+dc;
      if(nr<0||nr>=ROWS||nc<0||nc>=COLS||vis[nr][nc]||!walkable(nr,nc)) continue;
      const w=WCOST[grid[nr][nc]]??1;
      const ng=g+w;
      if(ng<dist[nr][nc]){dist[nr][nc]=ng;par[nr][nc]=[r,c];pq.push([ng+h(nr,nc),ng,nr,nc]);}
    }
  }
  if(gr===-1) return [];
  const path=[];let cur=[gr,gc];
  while(cur){path.unshift(cur);const[cr,cc]=cur;cur=par[cr][cc];}
  return path;
}

// ── FLOOD SPREAD ──────────────────────────────────────────────────────────────
function spreadFlood(grid) {
  const ng = grid.map(r=>[...r]);
  const newFloods = [];
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    if(grid[r][c]===T.FLOODED||grid[r][c]===T.FLOOD_SOURCE) {
      for(const[dr,dc] of DIRS){
        const nr=r+dr,nc=c+dc;
        if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
        const t=grid[nr][nc];
        if(t===T.EMPTY||t===T.SHALLOW) {
          // only spread to adjacent empty/shallow with some probability to keep it organic
          newFloods.push([nr,nc]);
        }
      }
    }
  }
  // spread 2-4 random cells per tick
  const shuffled = newFloods.sort(()=>Math.random()-0.5).slice(0,3);
  shuffled.forEach(([r,c])=>{ ng[r][c]=T.FLOODED; });
  return ng;
}

// ── SCORING ───────────────────────────────────────────────────────────────────
function calcScore(moves, optLen, shallow, hints, floodHits) {
  const base = Math.max(0, 1000 - (moves - optLen)*15);
  const pen = shallow*25 + hints*30 + floodHits*50;
  const bonus = moves <= optLen+2 ? 300 : 0;
  return Math.max(0, Math.round(base - pen + bonus));
}
const GRADE = s =>
  s>=900?{g:"S",c:"#ffd700"}:s>=700?{g:"A",c:"#00ff88"}:
  s>=500?{g:"B",c:"#00ccff"}:s>=300?{g:"C",c:"#ff9900"}:{g:"F",c:"#ff3333"};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export default function FloodEscape() {
  const [mapIdx, setMapIdx] = useState(0);
  const [grid, setGrid] = useState(null);
  const [player, setPlayer] = useState([0,0]);
  const [hint, setHint] = useState([]);
  const [showHint, setShowHint] = useState(false);
  const [hintTimer, setHintTimer] = useState(null);
  const [moves, setMoves] = useState(0);
  const [shallow, setShallow] = useState(0);
  const [hints, setHints] = useState(0);
  const [floodHits, setFloodHits] = useState(0);
  const [optLen, setOptLen] = useState(0);
  const [gameState, setGameState] = useState("playing");
  const [score, setScore] = useState(0);
  const [trail, setTrail] = useState([]);
  const [shake, setShake] = useState(false);
  const [flashPos, setFlashPos] = useState(null);
  const [floodWarn, setFloodWarn] = useState(false);
  const [moveCount, setMoveCount] = useState(0); // for flood timing
  const [scanline, setScanline] = useState(0);
  const containerRef = useRef(null);

  // scanline animation
  useEffect(()=>{
    const id=setInterval(()=>setScanline(s=>(s+1)%ROWS),80);
    return()=>clearInterval(id);
  },[]);

  const initMap = useCallback((idx)=>{
    const map = MAPS[idx];
    const g = map.grid.map(r=>[...r]);
    setGrid(g);
    setPlayer(map.startPos);
    setHint([]); setShowHint(false);
    setMoves(0); setShallow(0); setHints(0); setFloodHits(0); setMoveCount(0);
    setGameState("playing"); setScore(0); setTrail([]);
    setFloodWarn(false);
    const path = astar(g, map.startPos[0], map.startPos[1]);
    setOptLen(Math.max(1,path.length-1));
    containerRef.current?.focus();
  },[]);

  useEffect(()=>{ initMap(mapIdx); },[mapIdx]);

  const doMove = useCallback((dr,dc)=>{
    if(gameState!=="playing"||!grid) return;
    const [r,c]=player;
    const nr=r+dr, nc=c+dc;
    if(nr<0||nr>=ROWS||nc<0||nc>=COLS) return;
    const cell=grid[nr][nc];

    if(cell===T.BLOCKED){ setFlashPos([nr,nc]); setTimeout(()=>setFlashPos(null),200); return; }
    if(cell===T.FLOODED||cell===T.FLOOD_SOURCE){
      setShake(true); setTimeout(()=>setShake(false),400);
      setFlashPos([nr,nc]); setTimeout(()=>setFlashPos(null),200);
      setFloodHits(f=>f+1);
      return;
    }

    const newTrail=[...trail.slice(-18),[r,c]];
    setTrail(newTrail);
    setPlayer([nr,nc]);
    const newMoves=moves+1;
    setMoves(newMoves);
    if(cell===T.SHALLOW) setShallow(s=>s+1);

    // flood spread
    const map=MAPS[mapIdx];
    const newMC=moveCount+1;
    setMoveCount(newMC);
    let newGrid=grid;
    if(map.floodInterval>0 && newMC%map.floodInterval===0){
      newGrid=spreadFlood(grid);
      setGrid(newGrid);
      setFloodWarn(true); setTimeout(()=>setFloodWarn(false),600);
      // check if player is now on flooded cell
      if(newGrid[nr][nc]===T.FLOODED){
        setShake(true); setTimeout(()=>setShake(false),400);
        setFloodHits(f=>f+1);
      }
    } else { setGrid(newGrid); }

    if(cell===T.GOAL){
      const s=calcScore(newMoves,optLen,shallow+(cell===T.SHALLOW?1:0),hints,floodHits);
      setScore(s);
      setGameState("won");
    }
  },[gameState,grid,player,moves,shallow,hints,floodHits,optLen,trail,moveCount,mapIdx]);

  const getHint=useCallback(()=>{
    if(gameState!=="playing"||!grid) return;
    if(hintTimer) clearTimeout(hintTimer);
    const path=astar(grid,player[0],player[1]);
    setHint(path); setShowHint(true);
    setHints(h=>h+1);
    const t=setTimeout(()=>setShowHint(false),3500);
    setHintTimer(t);
  },[gameState,grid,player,hintTimer]);

  const handleKey=useCallback((e)=>{
    if(!["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const m={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    doMove(...m[e.key]);
  },[doMove]);

  const hintSet = new Set(hint.map(([r,c])=>`${r},${c}`));
  const trailSet = new Map(trail.map(([r,c],i)=>[`${r},${c}`,i]));
  const map = MAPS[mapIdx];

  const cellColor=(t,r,c,isPlayer)=>{
    if(isPlayer) return null;
    const key=`${r},${c}`;
    const isFlash=flashPos&&flashPos[0]===r&&flashPos[1]===c;
    if(isFlash) return "#ff3333";
    if(hintSet.has(key)&&showHint&&!isPlayer) return "#334433";
    const ti=trailSet.get(key);
    if(ti!==undefined){ const a=Math.floor((ti/trail.length)*60+10); return `rgba(0,255,136,${a/255})`; }
    switch(t){
      case T.FLOODED:      return "#001833";
      case T.FLOOD_SOURCE: return "#002244";
      case T.SHALLOW:      return "#003366";
      case T.BLOCKED:      return "#111111";
      case T.GOAL:         return "#1a0a00";
      default:             return "#0a1a0a";
    }
  };

  const cellBorderColor=(t,r,c)=>{
    const key=`${r},${c}`;
    if(hintSet.has(key)&&showHint) return "#00ff8866";
    switch(t){
      case T.FLOODED:      return "#0044aa";
      case T.FLOOD_SOURCE: return "#0055cc";
      case T.SHALLOW:      return "#0066aa";
      case T.BLOCKED:      return "#222";
      case T.GOAL:         return "#ff660055";
      default:             return "#1a3a1a";
    }
  };

  const cellGlow=(t,r,c)=>{
    if(t===T.FLOODED||t===T.FLOOD_SOURCE) return "0 0 6px #0055ff44";
    const key=`${r},${c}`;
    if(hintSet.has(key)&&showHint) return "0 0 8px #00ff8888";
    if(t===T.GOAL) return "0 0 8px #ff660066";
    return "none";
  };

  if(!grid) return null;

  const grade=gameState==="won"?GRADE(score):null;

  return (
    <div ref={containerRef} tabIndex={0} onKeyDown={handleKey}
      style={{
        minHeight:"100vh",
        background:"#000000",
        fontFamily:PX,
        color:"#00ff88",
        display:"flex",flexDirection:"column",alignItems:"center",
        padding:"16px 8px",
        outline:"none",
        userSelect:"none",
        backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,0,0.015) 2px,rgba(0,255,0,0.015) 4px)",
        position:"relative",
        overflow:"hidden",
      }}>

      {/* CRT scanline overlay */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",zIndex:50,
        background:`linear-gradient(transparent ${scanline*(100/ROWS)}%, rgba(0,255,0,0.04) ${scanline*(100/ROWS)}%, rgba(0,255,0,0.04) ${(scanline+1)*(100/ROWS)}%, transparent ${(scanline+1)*(100/ROWS)}%)`,
      }}/>

      {/* CRT vignette */}
      <div style={{
        position:"fixed",inset:0,pointerEvents:"none",zIndex:49,
        background:"radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.7) 100%)",
      }}/>

      {/* Flood warning flash */}
      {floodWarn && (
        <div style={{
          position:"fixed",inset:0,pointerEvents:"none",zIndex:60,
          background:"rgba(0,80,255,0.12)",
          animation:"none",
        }}/>
      )}

      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-4px)}40%{transform:translateX(4px)}60%{transform:translateX(-3px)}80%{transform:translateX(3px)}}
        @keyframes pop{from{transform:scale(0.3);opacity:0}to{transform:scale(1);opacity:1}}
        @keyframes floodpulse{0%,100%{opacity:0.7}50%{opacity:1}}
        @keyframes warnflash{0%,100%{background:rgba(0,80,255,0)}50%{background:rgba(0,80,255,0.15)}}
        .flood-cell{animation:floodpulse 1.5s ease-in-out infinite;}
        .blink{animation:blink 1s step-end infinite;}
        .hint-dot{animation:blink 0.6s step-end infinite;}
      `}</style>

      {/* HEADER */}
      <div style={{width:"100%",maxWidth:860,marginBottom:12,
        border:"2px solid #00ff88",padding:"8px 12px",
        background:"#000",
        boxShadow:"0 0 20px #00ff8833, inset 0 0 20px #00ff8808",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexWrap:"wrap",gap:8,
      }}>
        <div>
          <div style={{fontSize:10,color:"#00ff88",letterSpacing:2,textShadow:"0 0 10px #00ff88"}}>
            ★ FLOOD ESCAPE ★
          </div>
          <div style={{fontSize:6,color:"#006633",marginTop:4,letterSpacing:1}}>
            UTILITY-BASED AI AGENT v2.0
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {MAPS.map((m,i)=>(
            <button key={i} onClick={()=>setMapIdx(i)} style={{
              fontFamily:PX,fontSize:5,padding:"5px 8px",
              background:mapIdx===i?`${m.color}22`:"#000",
              border:`1px solid ${mapIdx===i?m.color:"#003300"}`,
              color:mapIdx===i?m.color:"#003300",
              cursor:"pointer",letterSpacing:1,
              boxShadow:mapIdx===i?`0 0 8px ${m.color}66`:"none",
            }}>{m.name}</button>
          ))}
          <button onClick={()=>initMap(mapIdx)} style={{
            fontFamily:PX,fontSize:5,padding:"5px 8px",
            background:"#000",border:"1px solid #ff3333",
            color:"#ff3333",cursor:"pointer",letterSpacing:1,
          }}>RST</button>
        </div>
      </div>

      <div style={{width:"100%",maxWidth:860,display:"flex",gap:10,alignItems:"flex-start"}}>

        {/* LEFT PANEL */}
        <div style={{width:130,flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
          <PixelBox title="STAGE" color={map.color}>
            <div style={{fontSize:7,color:map.color,textShadow:`0 0 8px ${map.color}`}}>{map.name}</div>
            <div style={{fontSize:5,color:"#336633",marginTop:3}}>{map.sub}</div>
            {map.floodInterval>0&&<div style={{fontSize:5,color:"#ff4400",marginTop:4}} className="blink">⚠ FLOOD ACTIVE</div>}
          </PixelBox>
          <PixelBox title="MOVES" color="#00ccff">
            <div style={{fontSize:16,color:"#00ccff",textShadow:"0 0 10px #00ccff"}}>{moves}</div>
          </PixelBox>
          <PixelBox title="OPTIMAL" color="#ffcc00">
            <div style={{fontSize:16,color:"#ffcc00",textShadow:"0 0 10px #ffcc00"}}>{optLen}</div>
          </PixelBox>
          <PixelBox title="HINTS" color="#ff6600">
            <div style={{fontSize:16,color:"#ff6600"}}>{hints}</div>
            <div style={{fontSize:5,color:"#663300"}}>-{hints*30} PTS</div>
          </PixelBox>
          <PixelBox title="FLOOD DMG" color="#ff3333">
            <div style={{fontSize:16,color:"#ff3333"}}>{floodHits}</div>
            <div style={{fontSize:5,color:"#660000"}}>-{floodHits*50} PTS</div>
          </PixelBox>
          <PixelBox title="LEGEND" color="#336633">
            {[
              {c:"#0a1a0a",b:"#1a3a1a",l:"ROAD"},
              {c:"#003366",b:"#0066aa",l:"SHALLOW"},
              {c:"#001833",b:"#0044aa",l:"FLOOD"},
              {c:"#111",b:"#222",l:"WALL"},
              {c:"#1a0a00",b:"#ff6600",l:"EXIT"},
            ].map(({c,b,l})=>(
              <div key={l} style={{display:"flex",alignItems:"center",gap:5,marginBottom:4}}>
                <div style={{width:10,height:10,background:c,border:`1px solid ${b}`,flexShrink:0}}/>
                <span style={{fontSize:5,color:"#336633"}}>{l}</span>
              </div>
            ))}
          </PixelBox>
        </div>

        {/* GRID */}
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
          {/* Map title bar */}
          <div style={{
            width:"100%",
            background:"#000",border:`1px solid ${map.color}`,
            padding:"4px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",
            boxShadow:`0 0 12px ${map.color}33`,
          }}>
            <span style={{fontSize:6,color:map.color,letterSpacing:2}}>{map.name} :: {map.sub}</span>
            {map.floodInterval>0&&<span style={{fontSize:5,color:"#ff4400"}} className="blink">
              FLOOD IN {map.floodInterval-(moveCount%map.floodInterval)} MOVES
            </span>}
          </div>

          <div style={{
            display:"grid",
            gridTemplateColumns:`repeat(${COLS},1fr)`,
            gap:1,
            background:"#000",
            border:`2px solid ${shake?"#ff3333":floodWarn?"#0055ff":map.color}`,
            padding:2,
            boxShadow:`0 0 30px ${shake?"#ff333366":floodWarn?"#0055ff44":`${map.color}22`}`,
            transition:"border-color 0.1s,box-shadow 0.1s",
            animation:shake?"shake 0.4s ease":"none",
            width:"100%",
          }}>
            {grid.map((row,r)=>row.map((cell,c)=>{
              const isPlayer=player[0]===r&&player[1]===c;
              const key=`${r},${c}`;
              const isHint=hintSet.has(key)&&showHint&&!isPlayer;
              const hintIdx=hint.findIndex(([hr,hc])=>hr===r&&hc===c);
              const isFlooded=cell===T.FLOODED||cell===T.FLOOD_SOURCE;
              return (
                <div key={key} style={{
                  width:"100%",paddingBottom:"100%",position:"relative",
                  background:cellColor(cell,r,c,isPlayer),
                  border:`1px solid ${cellBorderColor(cell,r,c)}`,
                  boxShadow:isPlayer?"0 0 12px #00ff88":cellGlow(cell,r,c),
                  transition:"background 0.3s",
                }} className={isFlooded&&!isPlayer?"flood-cell":""}>
                  <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {isPlayer&&<span style={{fontSize:11,lineHeight:1,filter:"drop-shadow(0 0 6px #00ff88)"}}>■</span>}
                    {!isPlayer&&cell===T.GOAL&&<span style={{fontSize:9,lineHeight:1}} className="blink">★</span>}
                    {!isPlayer&&isHint&&hintIdx>0&&hintIdx<hint.length-1&&(
                      <div style={{width:3,height:3,background:"#00ff88",opacity:0.8}} className="hint-dot"/>
                    )}
                    {!isPlayer&&isFlooded&&(
                      <div style={{width:"60%",height:"60%",background:"#0044ff",opacity:0.3,borderRadius:1}}/>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>

          {/* D-pad */}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,marginTop:4}}>
            <DPadBtn label="▲" onClick={()=>doMove(-1,0)} color={map.color}/>
            <div style={{display:"flex",gap:3}}>
              <DPadBtn label="◄" onClick={()=>doMove(0,-1)} color={map.color}/>
              <DPadBtn label="▼" onClick={()=>doMove(1,0)} color={map.color}/>
              <DPadBtn label="►" onClick={()=>doMove(0,1)} color={map.color}/>
            </div>
          </div>

          {/* Hint button */}
          <button onClick={getHint} style={{
            fontFamily:PX,fontSize:6,padding:"7px 16px",
            background:showHint?"#001a00":"#000",
            border:`1px solid ${showHint?"#00ff88":"#336633"}`,
            color:showHint?"#00ff88":"#336633",
            cursor:"pointer",letterSpacing:2,
            boxShadow:showHint?"0 0 12px #00ff8866":"none",
            transition:"all 0.2s",
          }}>
            {showHint?"[ AI HINT ACTIVE ]":"[ AI HINT -30PTS ]"}
          </button>
          <div style={{fontSize:5,color:"#336633",letterSpacing:1}}>
            KEYBOARD: ARROW KEYS | HINT: H KEY
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{width:130,flexShrink:0,display:"flex",flexDirection:"column",gap:8}}>
          <PixelBox title="SCORING" color="#ffcc00">
            <div style={{fontSize:5,color:"#665500",lineHeight:2.2}}>
              BASE: <span style={{color:"#ffcc00"}}>1000</span><br/>
              +MOVE: <span style={{color:"#ff6600"}}>-15</span><br/>
              SHALLOW: <span style={{color:"#ff9900"}}>-25</span><br/>
              FLOOD: <span style={{color:"#ff3333"}}>-50</span><br/>
              HINT: <span style={{color:"#ff6600"}}>-30</span><br/>
              OPT!: <span style={{color:"#00ff88"}}>+300</span>
            </div>
          </PixelBox>
          <PixelBox title="GRADES" color="#ffcc00">
            {[["S","#ffd700","900+"],[" A","#00ff88","700+"],[" B","#00ccff","500+"],[" C","#ff9900","300+"],["F","#ff3333","0+"]].map(([g,c,r])=>(
              <div key={g} style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{fontSize:7,color:c,textShadow:`0 0 6px ${c}`}}>{g}</span>
                <span style={{fontSize:5,color:"#336633"}}>{r}</span>
              </div>
            ))}
          </PixelBox>
          <PixelBox title="UTILITY FN" color="#aa44ff">
            <div style={{fontSize:5,color:"#442266",lineHeight:2,fontStyle:"italic"}}>
              U =<br/>
              1000<br/>
              -(m-opt)*15<br/>
              -shw*25<br/>
              -fld*50<br/>
              -hnt*30<br/>
              +opt_bonus
            </div>
          </PixelBox>
          <PixelBox title="FLOOD INFO" color="#0066ff">
            <div style={{fontSize:5,color:"#003366",lineHeight:2}}>
              {map.floodInterval>0?(
                <>
                  SPREADS EVERY<br/>
                  <span style={{color:"#0066ff"}}>{map.floodInterval} MOVES</span><br/>
                  AVOID BLUE<br/>
                  CELLS!<br/>
                  <span style={{color:"#ff3300"}} className="blink">STAY MOVING!</span>
                </>
              ):(
                <>
                  STATIC MAP<br/>
                  <span style={{color:"#00ff88"}}>NO SPREAD</span><br/>
                  GOOD FOR<br/>LEARNING!
                </>
              )}
            </div>
          </PixelBox>
        </div>
      </div>

      {/* WIN SCREEN */}
      {gameState==="won"&&grade&&(
        <div style={{
          position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",
          display:"flex",alignItems:"center",justifyContent:"center",
          zIndex:200,
        }}>
          <div style={{
            background:"#000",
            border:`3px solid ${grade.c}`,
            padding:"32px 48px",textAlign:"center",
            boxShadow:`0 0 60px ${grade.c}66, 0 0 120px ${grade.c}22`,
            animation:"pop 0.5s cubic-bezier(0.175,0.885,0.32,1.275)",
          }}>
            <div style={{fontSize:8,color:"#336633",letterSpacing:4,marginBottom:16}}>MISSION COMPLETE</div>
            <div style={{
              fontSize:72,color:grade.c,lineHeight:1,
              textShadow:`0 0 30px ${grade.c}, 0 0 60px ${grade.c}`,
              marginBottom:8,
            }}>{grade.g}</div>
            <div style={{fontSize:24,color:"#fff",marginBottom:4,textShadow:"0 0 10px #fff"}}>{score}</div>
            <div style={{fontSize:6,color:"#336633",marginBottom:20}}>POINTS</div>
            <div style={{display:"flex",gap:20,justifyContent:"center",marginBottom:24}}>
              {[["MOVES",moves,"#00ccff"],["OPTIMAL",optLen,"#ffcc00"],["SHALLOW",shallow,"#ff9900"],["FLOOD",floodHits,"#ff3333"],["HINTS",hints,"#ff6600"]].map(([l,v,c])=>(
                <div key={l} style={{textAlign:"center"}}>
                  <div style={{fontSize:5,color:"#336633",marginBottom:4}}>{l}</div>
                  <div style={{fontSize:12,color:c,textShadow:`0 0 8px ${c}`}}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"center"}}>
              <PixelBtn label="RETRY" color="#00ff88" onClick={()=>initMap(mapIdx)}/>
              {mapIdx<MAPS.length-1&&<PixelBtn label="NEXT ►" color="#00ccff" onClick={()=>setMapIdx(i=>i+1)}/>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PixelBox({title,color,children}){
  return (
    <div style={{background:"#000",border:`1px solid ${color}33`,padding:"8px 10px",
      boxShadow:`0 0 8px ${color}11`}}>
      <div style={{fontSize:5,color:`${color}88`,letterSpacing:2,marginBottom:8,
        borderBottom:`1px solid ${color}22`,paddingBottom:4}}>{title}</div>
      {children}
    </div>
  );
}

function DPadBtn({label,onClick,color}){
  return (
    <button onPointerDown={onClick} style={{
      width:36,height:36,fontFamily:PX,fontSize:10,
      background:"#000",border:`1px solid ${color}55`,
      color:color,cursor:"pointer",
      boxShadow:`0 0 6px ${color}33`,
      display:"flex",alignItems:"center",justifyContent:"center",
      WebkitTapHighlightColor:"transparent",
    }}
    onPointerEnter={e=>e.currentTarget.style.background=`${color}22`}
    onPointerLeave={e=>e.currentTarget.style.background="#000"}
    >{label}</button>
  );
}

function PixelBtn({label,color,onClick}){
  return (
    <button onClick={onClick} style={{
      fontFamily:PX,fontSize:6,padding:"8px 16px",
      background:`${color}22`,border:`2px solid ${color}`,
      color,cursor:"pointer",letterSpacing:2,
      boxShadow:`0 0 12px ${color}66`,
      textShadow:`0 0 8px ${color}`,
    }}>{label}</button>
  );
}

// heuristic function is the manhattan dist- used inside the A* algo - to estimate the distace bew any cell to the goal
// h(r,c) = |r- goal(r)|+ |c-goal(c)|

// ai components=> 1. path finder- A* N FINDS THE shortest weighted path to the exit
                // 2. hint sys- A