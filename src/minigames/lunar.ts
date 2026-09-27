import { tr } from '../i18n/tr'
export const SAMPLE_SITES = [
 {id:'a',label:tr("地点A"),position:[-5,0,4] as [number,number,number],color:'#d0c9ba',observation:tr("明るい粗粒の岩石。白い鉱物粒が多い。"),context:tr("高地の地殻物質を調べる候補。見た目だけで組成を確定はできない。"),kind:'highland'},
 {id:'b',label:tr("地点B"),position:[1,0,-1] as [number,number,number],color:'#65605a',observation:tr("暗い細粒の岩石。小さな空隙が点在。"),context:tr("玄武岩質の火山岩を調べる候補。南極への移動・混合も考慮する。"),kind:'basalt'},
 {id:'c',label:tr("地点C"),position:[5,0,5] as [number,number,number],color:'#a19786',observation:tr("明暗の角ばった破片が、細粒の基質の中に混在。"),context:tr("衝突で砕かれた物質の混合を調べる候補。"),kind:'breccia'},
 {id:'d',label:tr("地点D"),position:[-1,0,8] as [number,number,number],color:'#888073',observation:tr("粒径の異なる細かい土が、表面を覆っている。"),context:tr("微隕石衝突などで生成・混合したレゴリスを調べる候補。"),kind:'regolith'},
]
export const SAMPLE_TASKS=[{title:tr("古い月地殻を調べる"),goal:tr("斜長岩質の高地物質の候補を選びます。明るさに加え、粒や組織を観察してください。"),kind:'highland'}, {title:tr("衝突による混合を調べる"),goal:tr("異なる岩石の破片が混ざった角礫岩の候補を選びます。"),kind:'breccia'}]
export function sampleScore(kind:string,wanted:string,documented:boolean){return (kind===wanted?250:0)+(documented?100:0)}
