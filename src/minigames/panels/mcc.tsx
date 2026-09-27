import { tr } from '../../i18n/tr'
import { useState } from 'react'
import { DecisionExercise } from '../DecisionExercise'
import { MiniBriefing } from '../MiniShell'
import { MCC_EVENTS } from '../data/decisions'
import type { MiniGameProps } from '../registry'
export default function MccGame(p: MiniGameProps){const[start,setStart]=useState(false);return start?<DecisionExercise events={MCC_EVENTS} dispatch onDone={p.onFinish}/>:<MiniBriefing title={tr("Houston、あなたがFlightです")} color={p.color} lines={[tr("8種類の事象がランダムな順で発生します。"),tr("最初に担当卓へ解析を依頼し、次にクルーへ伝える方針を選びます。"),tr("専門卓の役割、乗員の状態、電力と時間の制約をまとめて判断します。")]} onStart={()=>setStart(true)} onExit={p.onExit}/>}
