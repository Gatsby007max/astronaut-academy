import { tr } from '../../i18n/tr'
import { useEffect, useState } from 'react'
import { useGame } from '../../game/store'
import { HudButton, Label } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { MiniBriefing } from '../MiniShell'
import { DecisionExercise } from '../DecisionExercise'
import { FLIGHT_CHECKS, FLIGHT_DECISIONS } from '../data/decisions'
import { shuffled } from '../scoring'
import type { MiniGameProps } from '../registry'
export default function FlightGame(p:MiniGameProps){
 const [phase,setPhase]=useState(0);const[order]=useState(()=>shuffled(FLIGHT_CHECKS));const[done,setDone]=useState<string[]>([]);const[mistakes,setMistakes]=useState(0);const[feedback,setFeedback]=useState('')
 usePanelShift(phase===1?'right':'none');useEffect(()=>{useGame.getState().setFocus('jet')},[])
 if(phase===0)return <MiniBriefing title={tr("フライトから生還まで")} color={p.color} lines={[tr("まず、飛行前の準備を4つの段階に整理します。"),tr("続いて飛行前の異常、作業負荷、着水・救助の4場面で判断します。"),tr("チェック項目は学習用の要約です。機体固有の実運用手順ではありません。")]} onStart={()=>setPhase(1)} onExit={p.onExit}/>
 if(phase===2)return <DecisionExercise events={FLIGHT_DECISIONS} onDone={score=>p.onFinish(Math.round(Math.max(0,400-mistakes*60)+score*.6))}/>
 return <section className="training-panel glass rounded-xl"><Label>PRE-FLIGHT / {done.length} OF 4</Label><h2>{tr("出発前の準備を組み立てる")}</h2><p>{tr("「目的と役割の共有 → 装備 → 機能確認 → 出発判断」の流れを完成させます。")}</p><div className="training-options">{order.map(c=><HudButton disabled={done.includes(c.id)} key={c.id} onClick={()=>{if(c.id===FLIGHT_CHECKS[done.length].id){setDone([...done,c.id]);setFeedback(c.detail)}else{setMistakes(m=>m+1);setFeedback(tr("この項目の前に必要な確認を考えてください。"))}}}>{done.includes(c.id)?'✓ ':''}{c.label}</HudButton>)}</div><p role="status">{feedback}</p>{done.length===4&&<HudButton variant="primary" onClick={()=>setPhase(2)}>{tr("飛行・サバイバル演習へ")}</HudButton>}</section>
}
