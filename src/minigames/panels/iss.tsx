import { tr, trt } from '../../i18n/tr'
import { useEffect, useState } from 'react'
import { useGame } from '../../game/store'
import { HudButton, Label } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { MiniBriefing } from '../MiniShell'
import { usePractice } from '../practice'
import { shuffled } from '../scoring'
import type { MiniGameProps } from '../registry'
const parts=[{id:'destiny',name:tr("デスティニー"),role:tr("米国の主要な実験室")}, {id:'quest',name:tr("クエスト"),role:tr("米国宇宙服で船外へ出るためのエアロック")}, {id:'cupola',name:tr("キューポラ"),role:tr("7枚の窓から外を観測する区画")}, {id:'kibo',name:tr("きぼう"),role:tr("日本の実験棟")}, {id:'tranquility',name:tr("トランクウィリティー"),role:tr("水再生などの生命維持装置を収めるノード3")}]
const loops=[
 {prompt:tr("尿を蒸留し、水を取り出す装置は？"),choices:[tr("OGA：酸素生成装置"),tr("UPA：尿処理装置"),tr("CDRA：CO₂除去装置")],answer:1,explanation:tr("UPAの蒸留水は、そのまま飲料水になるのではなく、WPAでさらに処理されます。")},
 {prompt:tr("UPAからの回収水や湿度凝縮水を精製する装置は？"),choices:[tr("WPA：水処理装置"),tr("太陽電池翼"),tr("CMG：姿勢制御ジャイロ")],answer:0,explanation:tr("WPAは濾過や触媒処理などで水を精製し、水質を確認します。")},
 {prompt:tr("精製水を電気分解するOGA。その酸素はどこへ？"),choices:[tr("船内の呼吸用大気へ"),tr("燃焼させて全部廃棄する"),tr("尿処理の残留物へ")],answer:0,explanation:tr("水の電気分解で生じた酸素を呼吸に利用します。水・電力・大気の系統がここでつながります。")},
 {prompt:tr("CO₂と水素から水を回収するサバティエ反応のもう一つの生成物は？"),choices:[tr("窒素"),tr("メタン"),tr("アンモニア")],answer:1,explanation:tr("CO₂ + 4H₂ → CH₄ + 2H₂O。回収水は水処理系へ戻ります。実機では補給や排出もあり、完全な閉鎖循環ではありません。")},
]
export default function IssGame(p:MiniGameProps){
 const[phase,setPhase]=useState(0);const[index,setIndex]=useState(0);const[errors,setErrors]=useState(0);const[feedback,setFeedback]=useState('');const[picked,setPicked]=useState<number|null>(null);const[correct,setCorrect]=useState(0);const[order]=useState(()=>shuffled(parts))
 const selected=usePractice(s=>s.selected)
 usePanelShift(phase?'right':'none',.17,phase?462:undefined,.14)
 useEffect(()=>{usePractice.getState().set({active:phase===1?'identify':'',selected:''});useGame.getState().setFocus('overview');return()=>usePractice.getState().set({active:'',selected:''})},[phase])
 const target=order[index]
 useEffect(()=>{if(phase!==1||!selected)return;if(selected===target.id){setFeedback(trt`正解：${target.name}。${target.role}です。`);setPicked(1)}else{setErrors(n=>n+1);setFeedback(tr("位置と役割を確認して、別のマーカーを選んでください。"))}usePractice.getState().set({selected:''})},[selected,phase,target])
 if(!phase)return <MiniBriefing title={tr("ステーションを読み解く")} color={p.color} lines={[tr("3DのISSをドラッグして観察し、指示された区画のマーカーを選びます。"),tr("後半は水・酸素・CO₂の循環をつなぐ4問です。"),tr("区画を選ぶボタンも使えるので、タッチやキーボードでも操作できます。")]} onStart={()=>setPhase(1)} onExit={p.onExit}/>
 return <><div className="training-caption iss-training-caption">{tr("NASA ISS 3D MODEL / ドラッグで回転・スクロールで拡大")}</div><section className="training-panel glass rounded-xl"><Label>{phase===1?'MODULE IDENTIFICATION':'LIFE SUPPORT LOOP'} / {index+1} OF {phase===1?parts.length:loops.length}</Label><h2>{phase===1?tr("この役割を担う区画は？"):tr("生命維持の循環をつなぐ")}</h2><p>{phase===1?target.role:loops[index].prompt}</p>
 {phase===1?<div className="training-options grid-cols-2">{parts.map(c=><HudButton disabled={picked!==null} key={c.id} onClick={()=>usePractice.getState().set({selected:c.id})}>{c.name}</HudButton>)}</div>:<><div className="my-4 flex flex-wrap gap-2 text-xs text-hud">{[tr("尿 / 湿度凝縮水"),'UPA / WPA',tr("精製水"),'OGA',tr("呼吸用酸素"),tr("CO₂回収")].map((x,i)=><span key={x} className="rounded border border-hud/20 p-2">{i?'→ ':''}{x}</span>)}</div><div className="training-options">{loops[index].choices.map((c,i)=><HudButton key={c} disabled={picked!==null} onClick={()=>{setPicked(i);if(i===loops[index].answer)setCorrect(n=>n+1);setFeedback(loops[index].explanation)}}>{c}</HudButton>)}</div></>}
 <p role="status">{feedback}</p>{picked!==null&&<HudButton className="mt-4 w-full" variant="primary" onClick={()=>{if(phase===1&&index===order.length-1){setPhase(2);setIndex(0)}else if(phase===2&&index===loops.length-1){p.onFinish(Math.max(0,500-errors*60)+correct*125)}else setIndex(n=>n+1);setPicked(null);setFeedback('')}}>{phase===2&&index===loops.length-1?tr("評価を見る"):tr("次へ")}</HudButton>}
 <a className="mt-5 block text-xs text-hud underline" href="https://www.nasa.gov/wp-content/uploads/2020/10/g-281237_eclss_0.pdf" target="_blank" rel="noreferrer">{tr("NASA ECLSS ファクトシート ↗")}</a></section></>
}
