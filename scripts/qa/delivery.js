async page => {
 await page.goto('http://127.0.0.1:5181/');await page.getByRole('button',{name:'訓練を再開する',exact:true}).waitFor();
 await page.evaluate(()=>{const data=JSON.parse(localStorage.getItem('astronaut-academy-v1'));data.state.settings.quality='high';localStorage.setItem('astronaut-academy-v1',JSON.stringify(data))});await page.reload();
 await page.setViewportSize({width:1440,height:1000});const before=await page.evaluate(()=>performance.getEntriesByType('resource').length);
 await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();await page.waitForTimeout(4000);
 const resources=await page.evaluate(n=>performance.getEntriesByType('resource').slice(n).filter(r=>r.name.startsWith(location.origin)).map(r=>({url:r.name,bytes:r.encodedBodySize})),before);
 const total=resources.reduce((a,b)=>a+b.bytes,0);if(total>6000000)throw new Error('First scene exceeds 6 MB: '+total);
 await page.evaluate(r=>{window.__delivery={hubFirstLoad:r}}, {bytes:total,resources});
 await page.screenshot({path:'output/playwright/hub-production.png'});
 await page.getByRole('button',{name:'修了証を開く',exact:true}).click();await page.waitForTimeout(5200);await page.screenshot({path:'output/playwright/graduation.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/graduation-mobile.png'});
 const overflow=await page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>getComputedStyle(e).overflowY==='auto'&&getComputedStyle(e).position==='fixed').map(e=>({scrollWidth:e.scrollWidth,clientWidth:e.clientWidth})));
 if(overflow.some(x=>x.scrollWidth>x.clientWidth+1))throw new Error('Certificate horizontal overflow');
 await page.evaluate(r=>{window.__delivery.graduation={reopened:true,containers:r}},overflow);
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({media:'print'});await page.screenshot({path:'output/playwright/certificate-print.png'});await page.emulateMedia({media:'screen'});
 await page.getByRole('button',{name:'出典とクレジット',exact:true}).click();await page.waitForTimeout(3000);await page.screenshot({path:'output/playwright/credits.png'});
 await page.evaluate(()=>{window.__delivery.credits={nasaLinks:document.querySelectorAll('a[href*="nasa.gov"]').length,body:document.body.innerText.slice(0,600)}});
}
