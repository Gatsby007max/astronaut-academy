import { tr, trt } from '../../i18n/tr'
import { useEffect, useState } from 'react'
import { useGame } from '../../game/store'
import { HudButton, Label, Meter } from '../../ui/kit'
import { usePanelShift } from '../../ui/usePanelShift'
import { MiniBriefing } from '../MiniShell'
import { captureReady, magnitude, useRobotics, type V3 } from '../robotics'
import type { MiniGameProps } from '../registry'
export default function RoboticsGame(p:MiniGameProps){
 const[start,setStart]=useState(false);const[message,setMessage]=useState('');const s=useRobotics();usePanelShift(start?'right':'none')
 useEffect(()=>{useGame.getState().setFocus('arm');return()=>useRobotics.getState().set({running:false})},[])
 const ready=captureReady(s.error,s.speed,s.roll,s.stable,magnitude(s.hand))
 if(!start)return <MiniBriefing title={tr("補給船キャプチャー")} color={p.color} lines={[tr("先端のX・Y・Zと回転を調整し、黄色のグラプルに近づけます。"),tr("3つの補助カメラで奥行きを確認。位置誤差・移動速度・角度を許容内に保ちます。"),tr("1.2秒安定したら把持します。これは多関節アームを簡略化した操作練習です。")]} controls={[tr("スライダー・矢印キー：先端目標と回転を調整"),tr("HOLD：現在位置で止める")]} onStart={()=>{s.reset();setStart(true)}} onExit={p.onExit}/>
 return <><div className="training-caption">{tr("ROBOTICS / 7リンクの概念模型・距離と許容値はゲーム設定")}</div><div className="robot-camera-labels"><span>CAM 01 / OVERVIEW</span><span>CAM 02 / SIDE</span><span>CAM 03 / END EFFECTOR</span></div><section className="training-panel glass rounded-xl"><Label>ROBOTIC WORKSTATION</Label><h2>{s.captured?tr("把持を確認しました"):tr("先端をグラプルに合わせる")}</h2><div className="grid grid-cols-2 gap-3 text-xs my-4">{[[tr("位置誤差"),`${s.error.toFixed(2)} / 0.14`],[tr("先端速度"),`${s.speed.toFixed(2)} / 0.18`],[tr("回転誤差"),`${Math.abs(s.roll).toFixed(0)}° / 6°`],[tr("安定時間"),`${s.stable.toFixed(1)} / 1.2s`]].map(([l,v])=><div key={l}><Label>{l}</Label><b className="training-stat text-hud">{v}</b></div>)}</div>
 {(['X','Y','Z'] as const).map((axis,i)=><label key={axis} className="block my-4 text-sm">{axis} {tr("先端目標")}<span className="float-right training-stat">{s.command[i].toFixed(2)} <small className="text-amber">{tr("目標")}{s.target[i].toFixed(2)}</small></span><input disabled={s.captured} aria-label={trt`${axis} 先端目標`} type="range" min={i===1?.3:-3} max={i===1?4.5:5} step=".01" value={s.command[i]} onChange={e=>{const command=[...s.command] as V3;command[i]=+e.target.value;s.set({command})}} className="w-full accent-amber-300"/></label>)}
 <label className="block text-sm">{tr("先端の回転")}<b className="float-right training-stat">{s.roll}°</b><input disabled={s.captured} aria-label={tr("先端の回転")} type="range" min="-90" max="90" step="1" value={s.roll} onChange={e=>s.set({roll:+e.target.value})} className="w-full accent-amber-300"/></label><Meter value={s.stable/1.2} color={ready?'#52f2a4':'#ffb547'} className="mt-4"/>
 {s.captured?<HudButton variant="primary" className="w-full mt-5" onClick={()=>p.onFinish(Math.max(600,1000-s.misses*70))}>{tr("地上へ引き継いで評価を見る")}</HudButton>:<div className="flex gap-2 mt-5"><HudButton onClick={()=>s.set({command:[...s.hand]})}>HOLD</HudButton><HudButton variant={ready?'primary':'ghost'} className="flex-1" onClick={()=>{if(ready){s.set({captured:true,running:false});setMessage(tr("位置・速度・姿勢が許容内。キャプチャー完了。"))}else{s.set({misses:s.misses+1});setMessage(tr("把持条件を満たしていません。誤差と安定時間を確認してください。"))}}}>{tr("把持 CAPTURE")}</HudButton></div>}
 <p role="status" className="mt-3">{message||tr("小さく調整し、止まって確認しましょう。")}</p><a className="text-xs text-hud underline" href="https://www.nasa.gov/blogs/stationreport/2018/09/27/iss-daily-summary-report-9-27-2018/" target="_blank" rel="noreferrer">{tr("NASA：補給船キャプチャーの記録 ↗")}</a></section></>
}
