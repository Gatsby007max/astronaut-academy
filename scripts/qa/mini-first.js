async page => {
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().go({name:'hub'});window.__qa.mini=[]});
 await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 const start=async id=>{ await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().openModule(id,'mini');},id);await page.getByRole('button',{name:'訓練開始',exact:true}).click(); };
 const result=async id=>{ await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');window.__qa.mini.push({id,score:useGame.getState().modules[id].miniBest,completed:useGame.getState().modules[id].completed})},id); };
 await start('orientation');
 await page.getByRole('button',{name:'マーカー A',exact:true}).waitFor();
 await page.screenshot({path:'output/playwright/orientation-scan.png'});
 for(let n=0;n<6;n++){
  const letter=await page.evaluate(async()=>{const {useOrbitScan,SCAN_TARGETS}=await import('/src/minigames/orbitScan.ts');const s=useOrbitScan.getState();if(s.status==='done')return null;const ids=SCAN_TARGETS.map(t=>t.id).filter(id=>s.visible[id]);return 'ABCDEFGHIJ'[ids.indexOf(s.order[s.index])]});
  if(!letter)break; await page.getByRole('button',{name:`マーカー ${letter}`,exact:true}).click();
 }
 await result('orientation');
 await start('iss');
 await page.screenshot({path:'output/playwright/iss-fixed.png'});
 const roles={'米国の主要な実験室':'デスティニー','米国宇宙服で船外へ出るためのエアロック':'クエスト','7枚の窓から外を観測する区画':'キューポラ','日本の実験棟':'きぼう','水再生などの生命維持装置を収めるノード3':'トランクウィリティー'};
 for(let i=0;i<5;i++) {const prompt=await page.locator('.training-panel p').first().textContent();await page.getByRole('button',{name:roles[prompt],exact:true}).click();await page.getByRole('button',{name:'次へ',exact:true}).click();}
 for(const answer of ['UPA：尿処理装置','WPA：水処理装置','船内の呼吸用大気へ','メタン']) {await page.getByRole('button',{name:answer,exact:true}).click();await page.getByRole('button',{name:answer==='メタン'?'評価を見る':'次へ',exact:true}).click();}
 await result('iss');
 await start('medicine');
 for(let i=0;i<6;i++)await page.getByRole('button',{name:'この計画で30日を進める',exact:true}).click();
 await page.getByRole('button',{name:'評価を見る',exact:true}).click();await result('medicine');
 await start('eva');
 const loadout=await page.evaluate(async()=>{const {useBuoyancy,trimFor,isTrimmed}=await import('/src/minigames/buoyancy.ts');const s=useBuoyancy.getState();let best=null,min=Infinity;for(let front=-12;front<=12;front++)for(let back=-12;back<=12;back++)for(let left=-12;left<=12;left++){const right=Math.round(s.initial.buoyancy*2-front-back-left);const v={front,back,left,right},moves=Object.values(v).reduce((a,b)=>a+Math.abs(b),0);if(moves<min&&isTrimmed(trimFor(s.initial,v))){best=v;min=moves}}return best});
 const labels={front:'胸部前面',back:'背面（PLSS）',left:'左脚',right:'右脚'};
 for(const [id,n]of Object.entries(loadout))for(let i=0;i<Math.abs(n);i++)await page.getByText(labels[id],{exact:true}).locator('..').getByRole('button',{name:n>0?'錘＋':'浮き＋',exact:true}).click();
 await page.getByRole('button',{name:'中性浮力を判定する',exact:true}).click();
 await page.getByText('減圧症を防ぐプレブリーズ手順の選択',{exact:true}).waitFor();
 const scenarios=await page.evaluate(async()=>(await import('/src/minigames/prebreathe.ts')).SCENARIOS);
 for(let i=0;i<4;i++) {const text=await page.locator('body').innerText();const s=scenarios.find(s=>text.includes(s.situation));if(!s)throw new Error('Scenario not found');await page.getByRole('button').filter({has:page.getByText(s.options.find(o=>o.id===s.answer).label,{exact:true})}).click();await page.getByRole('button',{name:i===3?'訓練を終了':'次のシナリオ',exact:true}).click();if(i<3)await page.waitForTimeout(650);}
 await result('eva');
}
