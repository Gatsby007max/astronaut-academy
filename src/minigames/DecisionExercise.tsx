import { tr } from '../i18n/tr'
import { useEffect, useRef, useState } from 'react'
import { audio } from '../engine/audio'
import { useGame } from '../game/store'
import { HudButton, Label, Meter } from '../ui/kit'
import { usePanelShift } from '../ui/usePanelShift'
import { usePractice } from './practice'
import { decisionScore, percentageScore, shuffled, type Decision } from './scoring'
import { CONSOLES } from './data/decisions'

export function DecisionExercise({ events, onDone, dispatch = false, timed = true }: {events: Decision[]; onDone: (score: number) => void; dispatch?: boolean; timed?: boolean}) {
 const [order] = useState(() => shuffled(events))
 const [index,setIndex] = useState(0); const [picked,setPicked] = useState<number | null>(null)
 const [routed,setRouted] = useState(false); const [routingErrors,setRoutingErrors] = useState(0)
 const [remaining,setRemaining] = useState(60); const [earned,setEarned] = useState(0)
 const [running,setRunning] = useState(timed); const duration = 60
 const e = order[index]; const [options,setOptions] = useState(() => shuffled(e.choices.map((label,index)=>({label,index}))))
 const stamped = useRef(false)
 usePanelShift('right')
 useEffect(()=>{ useGame.getState().setFocus(e.focus); usePractice.getState().set({event:e.id, selected:''}); return ()=>usePractice.getState().set({event:''}) },[e])
 useEffect(()=>{ if(!running || picked !== null) return; let last = performance.now(); const timer=setInterval(()=>{const now=performance.now(); if(!document.hidden) setRemaining(t=>Math.max(0,t-(now-last)/1000)); last=now},200);return ()=>clearInterval(timer)},[running,picked])
 const answer=(choice:number)=>{if(stamped.current) return;stamped.current=true;setPicked(choice); const good=choice===e.correct; audio.sfx(good?'correct':'wrong');setEarned(n=>n+Math.max(0,decisionScore(good,remaining,duration)-routingErrors*10))}
 useEffect(()=>{ if(running && remaining<=0 && picked===null) answer(-1) },[remaining,running,picked])
 const next=()=>{ if(index===order.length-1){onDone(percentageScore(earned,order.length*100));return}const n=index+1;setIndex(n);setOptions(shuffled(order[n].choices.map((label,index)=>({label,index}))));setPicked(null);setRouted(false);setRoutingErrors(0);setRemaining(duration);stamped.current=false }
 return <>
 <div className="training-caption">{tr("SIMULATION / 公開資料から構成した学習シナリオ")}</div>
 <section className="glass hud-corner training-panel rounded-xl">
  <div className="flex items-center justify-between"><Label>{dispatch?'FLIGHT CONTROL':'DECISION TRAINING'} / {index+1} OF {order.length}</Label><span className={remaining<15?'text-alert training-stat':'text-hud training-stat'}>{running?`${Math.ceil(remaining)}s`:tr("自分のペース")}</span></div>
  <Meter value={remaining/duration} color={remaining<15?'#ff4d5e':'#7fe3ff'} className="mt-3"/>
  <h2>{e.title}</h2><p>{e.situation}</p>
  {dispatch&&!routed&&picked===null ? <><Label className="mt-4">{tr("担当卓を選ぶ")}</Label><div className="training-options grid-cols-2">{CONSOLES.map(([id,label])=><HudButton key={id} onClick={()=>{usePractice.getState().set({selected:id});if(id===e.console){setRouted(true);audio.sfx('correct')}else{setRoutingErrors(n=>n+1);audio.sfx('wrong')}}}><span><b className="block text-hud">{id}</b><small>{label}</small></span></HudButton>)}</div>{routingErrors>0&&<p role="status">{tr("担当範囲を再確認してください（振り分けミス")}{routingErrors}）。</p>}</> : <div className="training-options">{options.map(({label,index})=><HudButton key={label} disabled={picked!==null} variant={picked!==null&&index===e.correct?'primary':'ghost'} onClick={()=>answer(index)}>{label}</HudButton>)}</div>}
  {picked!==null&&<div role="status" className="rounded-lg border border-white/20 p-4"><Label className={picked===e.correct?'text-ok':'text-amber'}>{picked===e.correct?tr("確認できました"):picked===-1?tr("時間終了"):tr("振り返り")}</Label><p>{e.explanation}</p><a className="text-xs text-hud underline" href={e.source} target="_blank" rel="noreferrer">{tr("NASAの出典を読む ↗")}</a><HudButton className="mt-4 w-full" variant="primary" onClick={next}>{index===order.length-1?tr("評価を見る"):tr("次の事象へ")}</HudButton></div>}
  {picked===null&&<HudButton className="mt-4 text-xs" variant="subtle" onClick={()=>setRunning(v=>!v)}>{running?tr("時間制限を一時停止"):tr("時間制限を再開")}</HudButton>}
 </section></>
}
