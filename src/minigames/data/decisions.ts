import { tr } from '../../i18n/tr'
import type { Decision } from '../scoring'
const training = 'https://www.nasa.gov/centers-and-facilities/johnson/astronaut-candidates-get-to-work-at-johnson-space-center/'
const emergency = 'https://www.nasa.gov/blogs/spacestation/2019/01/15/station-trio-practices-emergency-before-radiation-physics-research/'
const mcc = 'https://www.nasa.gov/johnson/jsc-mission-control-center/'
const flight = 'https://www.nasa.gov/podcasts/houston-we-have-a-podcast/airspace/'
export const FLIGHT_CHECKS = [
 {id:'brief',label:tr("任務・気象・役割を共有"),detail:tr("目的地と飛行条件、乗員の役割、中止の判断をそろえる。")},
 {id:'inspect',label:tr("機体と個人装備を確認"),detail:tr("外観、装備、救命具を点検し、不明点を地上担当者と解決する。")},
 {id:'comms',label:tr("通信・計器・手順を照合"),detail:tr("指示を復唱し、チェックリストの状態を互いに確認する。")},
 {id:'go',label:tr("未解決項目を確認して GO / NO-GO"),detail:tr("未解決の異常があれば出発を保留する。")},
]
export const FLIGHT_DECISIONS: Decision[] = [
 {id:'fault',focus:'cockpit',title:tr("出発前の不一致"),situation:tr("地上チェックで計器の指示が想定と違います。離陸予定時刻が近づいています。"),choices:[tr("時刻を守って出発する"),tr("出発を保留し、整備・教官と確認する"),tr("記録せず次の項目へ進む")],correct:1,explanation:tr("時間の圧力を理由に未解決の異常を持ち越さず、チームで確認する判断を学ぶ場面です。"),source:flight},
 {id:'crew',focus:'cockpit',title:tr("タスクの集中"),situation:tr("操縦、航法、無線の要求が重なりました。二人のクルーはどう協力しますか。"),choices:[tr("互いの役割を確認し、短く復唱する"),tr("二人が同時に同じ無線へ話す"),tr("全員が一つの画面だけを見る")],correct:0,explanation:tr("T-38訓練では高い作業負荷の下で状況認識とクルーの協調を鍛えます。役割と情報の共有を優先します。"),source:flight},
 {id:'raft',focus:'raft',title:tr("着水訓練：集合"),situation:tr("訓練用カプセルから退出し、救命いかだへ集合する演習です。"),choices:[tr("各自で別方向へ泳ぐ"),tr("装備回収を優先して離れる"),tr("教官の指示に従い、互いの位置と人数を確認する")],correct:2,explanation:tr("水上サバイバルは個人技に加えてチームで生存する訓練です。ここでは所在確認と連携を評価します。"),source:training},
 {id:'signal',focus:'ocean',title:tr("救助を待つ"),situation:tr("いかだで救助を待つ訓練です。海上では体力と通信機器の電力が限られています。"),choices:[tr("救助用装備で所在を知らせ、体力・保温・人数を管理する"),tr("確認なしに陸へ泳ぎ出す"),tr("通信機器を捨てて荷物を減らす")],correct:0,explanation:tr("訓練の狙いは救命装備の扱いとチームの協調です。実際の脱出・救助手順は機体と状況に応じた手順書で決まります。"),source:training},
]
export const EMERGENCY_DECISIONS: Decision[] = [
 {id:'fire-detect',focus:'alarmPanel',title:tr("火災警報：状況把握"),situation:tr("実験ラックで煙検知の警報。近くの乗員から刺激を感じるとの報告。"),choices:[tr("原因が確定するまで通常作業を続ける"),tr("警報の区画・乗員の所在を確認し、手順に沿って通報・防護する"),tr("煙のにおいを近づいて調べる")],correct:1,explanation:tr("火災は有毒な燃焼生成物を伴います。警報の確認、乗員の保護、クルーと地上の連携が対応の土台です。"),source:emergency},
 {id:'fire-clear',focus:'extinguisher',title:tr("火災対応後：復帰判断"),situation:tr("訓練上の消火が完了。目で見える煙は減りました。"),choices:[tr("呼吸保護を外し実験を再開する"),tr("全ハッチをすぐに開く"),tr("大気測定と地上の確認を待ち、再発・残留物を監視する")],correct:2,explanation:tr("見える炎が消えても燃焼生成物や再発の可能性は残ります。火災防護には事後の環境監視も含まれます。"),source:'https://www.nasa.gov/wp-content/uploads/2023/12/ochmo-tb-008-fire-protection.pdf'},
 {id:'pressure',focus:'hatch',title:tr("急減圧：圧力低下"),situation:tr("船内圧力が低下し続けています。複数の区画に乗員が分かれています。"),choices:[tr("所在確認と規定の隔離・退避手順を優先し地上と連携する"),tr("原因が分かるまで一人で奥の区画へ入る"),tr("すべてのハッチを開放する")],correct:0,explanation:tr("急減圧演習では漏えい箇所の切り分けと乗員の退避判断を練習します。ここでは具体的なハッチ操作ではなく、保護・隔離・連携の原則を扱います。"),source:emergency},
 {id:'ammonia',focus:'mask',title:tr("有毒大気：冷却系の疑い"),situation:tr("冷却系の異常と船内汚染の疑いが報告されました。"),choices:[tr("自分の嗅覚だけで安全と判断する"),tr("規定の保護と安全区画への退避を実施し、指示と計測で確認する"),tr("外部の冷媒は船内に入らないと決めつける")],correct:1,explanation:tr("アンモニア漏えいもISSの代表的な緊急訓練項目です。汚染の疑いがある間は、計測と確立された手順で判断します。"),source:emergency},
 {id:'handover',focus:'cabin',title:tr("管制への状況報告"),situation:tr("あなたはクルーの状況をHoustonへ報告します。"),choices:[tr("思いついた原因を断定する"),tr("心配だという気持ちだけを伝える"),tr("警報種別、区画、乗員の状態、実施済みの対応を短く報告する")],correct:2,explanation:tr("観測した事実と実施した行動を分けて報告すると、地上は次の判断に必要な情報を得られます。"),source:mcc},
 {id:'return',focus:'hatch',title:tr("再入室の判断"),situation:tr("警報音が止まりましたが、安全確認はまだ終わっていません。"),choices:[tr("手順に定められた安全確認と復帰許可を待つ"),tr("警報音がないので戻る"),tr("一人を先に入れて試す")],correct:0,explanation:tr("警報の停止だけで環境の安全は確定しません。訓練では、復帰条件まで確認するところを一連の対応として学びます。"),source:emergency},
]
export const CONSOLES = [
 ['ETHOS',tr("生命維持・船内環境")],['SPARTAN',tr("電力・外部熱制御")],['ADCO',tr("姿勢制御")],['CRONUS',tr("通信・データ")],['FAO',tr("計画・スケジュール")],['ROBO',tr("ロボティクス")],['SURGEON',tr("クルーの健康")],['CAPCOM',tr("クルーへの音声通信")],
] as const
export const MCC_EVENTS: Decision[] = [
 {id:'co2',focus:'consoles',console:'ETHOS',title:tr("二酸化炭素濃度の上昇"),situation:tr("船内環境テレメトリに上昇傾向。クルーから頭痛の報告。どの卓へ解析を依頼しますか。"),choices:[tr("計測・乗員症状を確認し、環境制御と医官の判断を統合する"),tr("酸素を増やせばCO₂も必ず下がると判断する"),tr("すべての換気を止める")],correct:0,explanation:tr("ETHOSが生命維持・船内環境を監視し、健康面はSURGEONと連携します。酸素供給とCO₂除去は別の機能です。"),source:mcc},
 {id:'power',focus:'consoles',console:'SPARTAN',title:tr("日陰での電力不足"),situation:tr("地球の影に入り、バッテリーの余裕が減少。実験負荷が大きくなっています。"),choices:[tr("全実験を同時に開始する"),tr("負荷と蓄電状態を確認し、優先度に従って計画を調整する"),tr("クルーの睡眠だけを短縮する")],correct:1,explanation:tr("SPARTANはISSの電力と外部熱制御を担当します。FAOなどと連携し、利用できる電力に作業を合わせます。"),source:mcc},
 {id:'attitude',focus:'screen',console:'ADCO',title:tr("姿勢のずれ"),situation:tr("観測時の姿勢が計画値から外れ始めました。"),choices:[tr("窓から見える景色だけで正常と判断する"),tr("ロボットアームを反動で動かす"),tr("姿勢と制御系を評価し、関連する作業の継続可否をFlightに報告する")],correct:2,explanation:tr("ADCOは姿勢の決定と制御を担当します。姿勢変更は電力、熱、通信などにも関係するため統合判断が必要です。"),source:mcc},
 {id:'link',focus:'capcom',console:'CRONUS',title:tr("通信リンクの異常"),situation:tr("音声と一部のデータが途切れました。"),choices:[tr("途絶中に複雑な新規作業を増やす"),tr("通信・データ経路を切り分け、既定の途絶時運用を確認する"),tr("音量だけを最大にする")],correct:1,explanation:tr("CRONUSは通信とデータ系を担当します。クルーへの音声連絡窓口はCAPCOMです。"),source:mcc},
 {id:'schedule',focus:'flight',console:'FAO',title:tr("EVA準備と運動の競合"),situation:tr("保守作業が長引き、EVA準備、運動、休息の予定が重なりました。"),choices:[tr("制約と優先度を確認し、Flightと各担当で計画を組み直す"),tr("睡眠と運動をすべて削る"),tr("予備時間を無制限に追加する")],correct:0,explanation:tr("FAOは飛行活動の計画を扱います。作業時間、休息、装備などの制約を一緒に調整します。"),source:'https://www.nasa.gov/podcasts/houston-we-have-a-podcast/mission-control-schedule-and-inventory/'},
 {id:'arm',focus:'consoles',console:'ROBO',title:tr("把持位置の不一致"),situation:tr("接近する補給船の目標とアーム先端の表示が一致しません。"),choices:[tr("速度を上げて近づく"),tr("一つのカメラ映像だけで捕獲する"),tr("把持を保留し、複数の視点とアーム状態を再確認する")],correct:2,explanation:tr("ROBOがアーム運用を支援します。位置関係が不明な状態での動作を続けず、状況認識を回復してから判断します。"),source:mcc},
 {id:'health',focus:'consoles',console:'SURGEON',title:tr("運動後の体調変化"),situation:tr("クルーから運動後に強い違和感の報告。"),choices:[tr("予定を守るため報告を取り消す"),tr("症状と計測値を医官に伝え、評価と活動調整を依頼する"),tr("ゲームの健康指数だけで診断する")],correct:1,explanation:tr("SURGEONはクルーの健康を担当します。本アプリの指数は学習用で、実際の診断には使えません。"),source:'https://www.nasa.gov/humans-in-space/the-human-body-in-space/'},
 {id:'voice',focus:'capcom',console:'CAPCOM',title:tr("Flightの決定をクルーへ"),situation:tr("複数の担当卓の評価を踏まえ、Flightが作業の一時停止を決定しました。"),choices:[tr("CAPCOMから簡潔に伝え、クルーの復唱を確認する"),tr("全卓が同時に指示する"),tr("理由と行動を混ぜた長い独白を送る")],correct:0,explanation:tr("Flightが全体判断をまとめ、CAPCOMがクルーとの音声通信を担います。共通の理解を確認するまでが通信です。"),source:mcc},
]
