async page => {
 const fixture=await page.evaluate(()=>localStorage.getItem('astronaut-academy-v1'));
 await page.addInitScript(data=>{
  if(location.port==='5181'&&!sessionStorage.getItem('qa-seeded')){localStorage.setItem('astronaut-academy-v1',data);sessionStorage.setItem('qa-seeded','1')}
  window.__drawCalls=0;
  for(const type of [WebGLRenderingContext,WebGL2RenderingContext])for(const method of ['drawElements','drawArrays']){
   const original=type.prototype[method];type.prototype[method]=function(...args){window.__drawCalls++;return original.apply(this,args)};
  }
 },fixture);
 await page.goto('http://127.0.0.1:5181/');
 const productionErrors=[];page.on('pageerror',e=>productionErrors.push(e.message));
 await page.getByRole('button',{name:'訓練を再開する',exact:true}).waitFor();
 await page.waitForTimeout(1500);
 await page.evaluate(()=>{window.__production={title:{canvasCount:document.querySelectorAll('canvas').length,resources:performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.encodedBodySize}))},frames:[],scenes:[]}});
 await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();
 await page.getByText('訓練カリキュラム',{exact:true}).waitFor();await page.waitForTimeout(4000);
 for(const [tier,label]of [['low','低'],['medium','中'],['high','高'],['ultra','最高']]){
  await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:'閉じる',exact:true}).click();await page.mouse.move(1400,950);await page.waitForTimeout(3000);
  const result=await page.evaluate(()=>new Promise(resolve=>{const times=[];let last=performance.now();const start=last,draws=window.__drawCalls;function step(now){times.push(now-last);last=now;if(now-start<3000)requestAnimationFrame(step);else{times.shift();const sorted=[...times].sort((a,b)=>a-b);resolve({fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95ms:sorted[Math.floor(sorted.length*.95)],frames:times.length,drawCalls:window.__drawCalls-draws,dpr:devicePixelRatio})}}requestAnimationFrame(step)}));
  await page.evaluate(r=>window.__production.frames.push(r),{tier,scene:'hub',...result});
 }
 await page.screenshot({path:'output/playwright/hub-production.png'});
 const courses=['オリエンテーション','ISSシステム','宇宙医学・生理学','船外活動・中性浮力','ロボティクス','T-38飛行とサバイバル','緊急事態対応','地質学とアルテミス','管制室総合演習'];
 for(const title of courses){
  const before=await page.evaluate(()=>performance.getEntriesByType('resource').length);
  await page.locator('ul').getByRole('button').filter({has:page.getByText(title,{exact:true})}).click();
  await page.getByRole('button',{name:/実技訓練/}).click();await page.getByRole('button',{name:'訓練開始',exact:true}).click();await page.waitForTimeout(2500);
  const extra=await page.evaluate(before=>performance.getEntriesByType('resource').slice(before).filter(r=>r.name.startsWith(location.origin)).map(r=>({url:r.name,bytes:r.encodedBodySize})),before);
  await page.evaluate(r=>window.__production.scenes.push(r),{title,extraBytes:extra.reduce((a,b)=>a+b.bytes,0),resources:extra});
  if(['船外活動・中性浮力','T-38飛行とサバイバル'].includes(title))await page.screenshot({path:`output/playwright/production-${title.startsWith('T-38')?'t38':'eva'}.png`});
  await page.getByRole('button',{name:'ハブ',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 }
 await page.locator('ul').getByRole('button').filter({has:page.getByText('オリエンテーション',{exact:true})}).click();await page.getByRole('button',{name:/知識確認/}).click();await page.waitForTimeout(4000);
 const before=await page.evaluate(()=>window.__drawCalls);await page.waitForTimeout(1500);const after=await page.evaluate(()=>window.__drawCalls);
 await page.evaluate(r=>{window.__production.staticQuiz=r}, {drawCalls:after-before,durationMs:1500});
 await page.evaluate(errors=>window.__production.errors=errors,productionErrors);
}
