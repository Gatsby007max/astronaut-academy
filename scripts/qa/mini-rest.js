async page => {
 const start=async id=>{ await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().openModule(id,'mini')},id);await page.getByRole('button',{name:'訓練開始',exact:true}).click(); };
 const result=async id=>{await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');window.__qa.mini.push({id,score:useGame.getState().modules[id].miniBest,completed:useGame.getState().modules[id].completed})},id)};
 const decide=async(events,dispatch=false)=>{ for(let i=0;i<events.length;i++){const title=await page.locator('.training-panel h2').textContent();const e=events.find(e=>e.title===title);if(!e)throw new Error('Unknown decision '+title);if(dispatch)await page.getByRole('button').filter({has:page.getByText(e.console,{exact:true})}).click();await page.getByRole('button',{name:e.choices[e.correct],exact:true}).click();await page.getByRole('button',{name:i===events.length-1?'評価を見る':'次の事象へ',exact:true}).click(); }};
 await start('robotics');
 const target=await page.evaluate(async()=>{const {useRobotics}=await import('/src/minigames/robotics.ts');return useRobotics.getState().target});
 for (const [label,value] of [['X 先端目標',target[0]],['Y 先端目標',target[1]],['Z 先端目標',target[2]],['先端の回転',0]]) await page.getByRole('slider',{name:label,exact:true}).evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},value);
 let ready=false;for(let i=0;i<40;i++){ready=await page.evaluate(async()=>{const {useRobotics,captureReady,magnitude}=await import('/src/minigames/robotics.ts');const s=useRobotics.getState();return captureReady(s.error,s.speed,s.roll,s.stable,magnitude(s.hand))});if(ready)break;await page.waitForTimeout(200)}
 if(!ready)throw new Error('Arm did not reach stable capture envelope');
 await page.getByRole('button',{name:'把持 CAPTURE',exact:true}).click();await page.getByRole('button',{name:'地上へ引き継いで評価を見る',exact:true}).click();await result('robotics');
 const data=await page.evaluate(async()=>{const {FLIGHT_CHECKS,FLIGHT_DECISIONS,EMERGENCY_DECISIONS,MCC_EVENTS}=await import('/src/minigames/data/decisions.ts');return {FLIGHT_CHECKS,FLIGHT_DECISIONS,EMERGENCY_DECISIONS,MCC_EVENTS}});
 await start('t38');for(const c of data.FLIGHT_CHECKS)await page.getByRole('button',{name:c.label,exact:true}).click();await page.getByRole('button',{name:'飛行・サバイバル演習へ',exact:true}).click();await decide(data.FLIGHT_DECISIONS);await result('t38');
 await start('emergency');await decide(data.EMERGENCY_DECISIONS);await result('emergency');
 await start('lunar');
 for(const [i,label]of ['地点Aを観察','地点Cを観察'].entries()){await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'この試料を採取',exact:true}).click();await page.getByRole('button',{name:i===0?'次の科学目標へ':'オリオンの観測窓へ',exact:true}).click();}
 await page.waitForTimeout(2600);await page.getByRole('button',{name:'地形を撮影する',exact:true}).click();await page.getByRole('img',{name:'撮影した月面の観測フレーム',exact:true}).waitFor();await page.screenshot({path:'output/playwright/lunar-photo.png'});
 await page.getByRole('button',{name:'低い太陽で影が長い。水氷の有無には別の測定が必要',exact:true}).click();await page.getByRole('button',{name:'観測を終了して評価を見る',exact:true}).click();await result('lunar');
 await start('mcc');await decide(data.MCC_EVENTS,true);await result('mcc');
 await page.getByRole('button',{name:'修了証を受け取る',exact:true}).click();await page.getByText('CERTIFICATE OF COMPLETION',{exact:true}).waitFor();await page.waitForTimeout(5200);await page.screenshot({path:'output/playwright/graduation.png'});
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');window.__qa.graduation={graduated:useGame.getState().graduated,xp:useGame.getState().xp,storage:JSON.parse(localStorage.getItem('astronaut-academy-v1'))}});
}
