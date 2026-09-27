async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 await page.waitForFunction(()=>{const c=document.querySelector('canvas');return Number(c?.dataset.particleCount)+Number(c?.dataset.stationPoints??0)===180000});
 const report={frames:[],interactions:[],errors:[]};
 const hub=async()=>{await page.getByRole('button',{name:'ハブ',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor()};
 const course=async title=>{await page.locator('ul').getByRole('button').filter({has:page.getByText(title,{exact:true})}).click();await page.waitForTimeout(500)};
 const mini=async title=>{await course(title);await page.getByRole('button',{name:/実技訓練/}).click();await page.getByRole('button',{name:'訓練開始',exact:true}).click();await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.particleFocus)>.99)};
 const measure=async(scene,tier)=>{
  const timing=await page.evaluate(()=>new Promise(resolve=>{let start=performance.now(),last=start;const frames=[];function tick(t){frames.push(t-last);last=t;if(t-start<1600)requestAnimationFrame(tick);else{frames.shift();const sorted=[...frames].sort((a,b)=>a-b);resolve({fps:1000/(frames.reduce((a,b)=>a+b,0)/frames.length),p95ms:sorted[Math.floor(sorted.length*.95)],...document.querySelector('canvas').dataset})}}requestAnimationFrame(tick)}));
  report.frames.push({scene,tier,...timing});
 };
 const quality=async name=>{await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name,exact:true}).click();await page.getByRole('button',{name:'閉じる',exact:true}).click()};
 await page.getByText('LAUNCH SEQUENCE',{exact:true}).waitFor({state:'hidden'});await page.waitForTimeout(1800);await page.screenshot({path:'output/playwright/particles-hub-final.png'});await measure('hub','high');
 await course('オリエンテーション');await page.getByRole('button',{name:'3',exact:true}).click();await page.waitForTimeout(2200);await page.screenshot({path:'output/playwright/particles-earth-final.png'});await hub();
 await mini('ISSシステム');
 await page.getByText('NASAモデルについて · 旧構成',{exact:true}).click();await page.getByText(/NASA VTADの公開3Dモデルを点群化/).waitFor();await page.getByText('NASAモデルについて · 旧構成',{exact:true}).click();
 const roles={'米国の主要な実験室':'デスティニー','米国宇宙服で船外へ出るためのエアロック':'クエスト','7枚の窓から外を観測する区画':'キューポラ','日本の実験棟':'きぼう','水再生などの生命維持装置を収めるノード3':'トランクウィリティー'};
 for(let i=0;i<5;i++){
  const prompt=await page.locator('.training-panel p').first().textContent();await page.getByRole('button',{name:new RegExp('^区画 '+roles[prompt])}).click();await page.getByRole('status').filter({hasText:'正解：'}).waitFor();await page.getByRole('button',{name:'次へ',exact:true}).click();
 }
 for(const answer of ['UPA：尿処理装置','WPA：水処理装置','船内の呼吸用大気へ','メタン']){await page.getByRole('button',{name:answer,exact:true}).click();await page.getByRole('button',{name:answer==='メタン'?'評価を見る':'次へ',exact:true}).click()}
 await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();report.interactions.push('ISS: five spatial markers and four loop questions passed');await hub();
 await mini('ロボティクス');
 for(let attempt=0;attempt<16;attempt++){
  for(const axis of ['X','Y','Z']){const control=page.getByRole('slider',{name:axis+' 先端目標',exact:true});const label=await control.locator('..').locator('small').textContent();const value=Number(label.replace('目標','').trim());await control.evaluate((input,value)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,String(value));input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))},value)}
  await page.getByRole('slider',{name:'先端の回転',exact:true}).evaluate(input=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'0');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}))});
  await page.waitForTimeout(450);
  const stats=await page.locator('.training-panel .grid b').allTextContents();if(parseFloat(stats[0])<.12&&parseFloat(stats[3])>=1.2)break;
  if(attempt===15)throw new Error('UI capture envelope did not stabilize: '+stats.join('|'));
 }
 await page.getByRole('button',{name:'把持 CAPTURE',exact:true}).click();await page.getByRole('button',{name:'地上へ引き継いで評価を見る',exact:true}).waitFor();await page.screenshot({path:'output/playwright/particles-robotics-cameras.png'});await measure('robotics-three-camera-exam','high');await page.getByRole('button',{name:'地上へ引き継いで評価を見る',exact:true}).click();await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();report.interactions.push('Robotics: moving arm, three point-cloud camera feeds, capture passed');await hub();
 await mini('地質学とアルテミス');
 for(const[i,label]of ['地点A','地点C'].entries()){await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('checkbox').check();await page.getByRole('button',{name:'この試料を採取',exact:true}).click();await page.getByRole('button',{name:i===0?'次の科学目標へ':'オリオンの観測窓へ',exact:true}).click()}
 await page.waitForTimeout(2500);await page.getByRole('button',{name:'地形を撮影する',exact:true}).click();const photo=page.getByRole('img',{name:'撮影した月面の観測フレーム',exact:true});await photo.waitFor();
 report.photo=await photo.evaluate(img=>({width:img.naturalWidth,height:img.naturalHeight,bytes:img.src.length}));await page.screenshot({path:'output/playwright/particles-lunar-photo.png'});
 await page.getByRole('button',{name:'低い太陽で影が長い。水氷の有無には別の測定が必要',exact:true}).click();await page.getByRole('button',{name:'観測を終了して評価を見る',exact:true}).click();await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();report.interactions.push('Lunar: point-cloud targets and captured terrain image passed');await hub();
 await mini('船外活動・中性浮力');await measure('eva-exam','high');await page.screenshot({path:'output/playwright/particles-eva-exam.png'});
 await quality('低');await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleCount==='70000');await page.setViewportSize({width:390,height:844});await page.waitForTimeout(1200);await measure('eva-mobile-viewport-exam','low');await page.screenshot({path:'output/playwright/particles-eva-mobile.png'});
 report.mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,mode:document.querySelector('canvas').dataset.particleMode}));
 await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name:'静止',exact:true}).click();await page.getByRole('button',{name:'閉じる',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleMotion==='0');
 await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name:'流動',exact:true}).click();await page.getByRole('button',{name:'閉じる',exact:true}).click();await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleMotion==='1');
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleMotion==='0');await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleMotion==='1');report.interactions.push('Motion pause/resume and OS reduced-motion passed');
 await hub();await course('ISSシステム');await page.getByRole('button',{name:/知識確認/}).click();await page.waitForTimeout(1500);await page.screenshot({path:'output/playwright/particles-iss-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await quality('高');await hub();report.errors=errors;await page.evaluate(r=>window.__particlesInteraction=r,report);
}
