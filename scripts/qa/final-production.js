async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5181/');await page.getByRole('button',{name:'訓練を再開する',exact:true}).waitFor();
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('astronaut-academy-v1'));data.state.settings.quality='high';localStorage.setItem('astronaut-academy-v1',JSON.stringify(data))});
 await page.reload();await page.getByRole('button',{name:'訓練を再開する',exact:true}).waitFor();
 const before=await page.evaluate(()=>performance.getEntriesByType('resource').length);
 await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();await page.waitForTimeout(5000);
 const resources=await page.evaluate(n=>performance.getEntriesByType('resource').slice(n).filter(r=>r.name.startsWith(location.origin)).map(r=>({url:r.name,bytes:r.encodedBodySize})),before);
 await page.evaluate(r=>{window.__final={hubFirstLoad:{bytes:r.reduce((a,b)=>a+b.bytes,0),resources:r},frames:[]}},resources);
 await page.mouse.move(1430,950);await page.screenshot({path:'output/playwright/hub-production.png'});
 const measure=async(scene,tier)=>{
  const r=await page.evaluate(()=>new Promise(resolve=>{let last=performance.now(),start=last;const times=[];function step(now){times.push(now-last);last=now;if(now-start<2000)requestAnimationFrame(step);else{times.shift();const sorted=[...times].sort((a,b)=>a-b);resolve({fps:1000/(times.reduce((a,b)=>a+b,0)/times.length),p95ms:sorted[Math.floor(sorted.length*.95)],frames:times.length})}}requestAnimationFrame(step)}));
  await page.evaluate(r=>window.__final.frames.push(r),{scene,tier,...r});
 };
 const setQuality=async label=>{await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name:label,exact:true}).click();await page.getByRole('button',{name:'閉じる',exact:true}).click();await page.waitForTimeout(1500)};
 for(const[tier,label]of [['low','低'],['medium','中'],['high','高'],['ultra','最高']]){await setQuality(label);await measure('hub',tier)}
 await page.locator('ul').getByRole('button').filter({has:page.getByText('船外活動・中性浮力',{exact:true})}).click();
 await page.getByRole('button',{name:'用語集',exact:true}).click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
 await page.getByRole('button',{name:/DEEP DIVE/}).click();await page.waitForTimeout(800);await page.screenshot({path:'output/playwright/lesson-deep-dive.png'});
 await page.getByRole('button',{name:/実技訓練/}).click();await page.getByRole('button',{name:'訓練開始',exact:true}).click();await page.waitForTimeout(3000);
 await page.screenshot({path:'output/playwright/production-eva.png'});await measure('eva','ultra');
 await setQuality('高');await measure('eva','high');
 await page.setViewportSize({width:390,height:844});await setQuality('低');await measure('eva-mobile-viewport','low');
 await page.screenshot({path:'output/playwright/eva-mobile.png'});
 const bounds=await page.evaluate(()=>{const header=document.querySelector('header'),containers=[...header.children];return {logoRight:containers[0].getBoundingClientRect().right,controlsLeft:containers[1].getBoundingClientRect().left,scrollWidth:document.documentElement.scrollWidth,width:innerWidth}});
 if(bounds.logoRight>bounds.controlsLeft)throw new Error('Header overlap');await page.evaluate(r=>window.__final.mobileHeader=r,bounds);
 await page.getByRole('button',{name:'ハブ',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();await page.screenshot({path:'output/playwright/hub-mobile.png'});
 await page.evaluate(errors=>window.__final.errors=errors,errors);
}
