import { tr } from '../../i18n/tr'
import { useState } from 'react'
import { DecisionExercise } from '../DecisionExercise'
import { MiniBriefing } from '../MiniShell'
import { EMERGENCY_DECISIONS } from '../data/decisions'
import type { MiniGameProps } from '../registry'
export default function EmergencyGame(p: MiniGameProps){const[start,setStart]=useState(false);return start?<DecisionExercise events={EMERGENCY_DECISIONS} onDone={p.onFinish}/>:<MiniBriefing title={tr("船内の緊急事態")} color={p.color} lines={[tr("火災、減圧、有毒大気の6場面で行動の原則を選びます。"),tr("1場面60秒。正確さを優先し、必要なら時間制限を一時停止できます。"),tr("公開資料をもとにした学習用の判断演習です。実機の操作手順を再現するものではありません。")]} onStart={()=>setStart(true)} onExit={p.onExit}/>}
