async page => {
 await page.goto('http://127.0.0.1:5181/');await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();await page.getByRole('button',{name:'修了証を開く',exact:true}).click();await page.waitForTimeout(5200);
 await page.emulateMedia({media:'print'});await page.screenshot({path:'output/playwright/certificate-print.png'});await page.emulateMedia({media:'screen'});
 await page.getByRole('button',{name:'ハブに戻る',exact:true}).click();await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('button',{name:'進捗をリセット',exact:true}).click();await page.getByRole('button',{name:'本当にリセットする',exact:true}).click();
 await page.getByRole('button',{name:'訓練を開始する',exact:true}).waitFor();await page.waitForTimeout(1600);await page.screenshot({path:'output/playwright/title-after.png'});
 await page.getByRole('button',{name:'訓練を開始する',exact:true}).click();await page.getByRole('button',{name:'SKIP ▸',exact:true}).waitFor();await page.waitForTimeout(2500);await page.screenshot({path:'output/playwright/intro.png'});await page.getByRole('button',{name:'SKIP ▸',exact:true}).click();
 await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 const statuses=await page.locator('ul button').evaluateAll(buttons=>buttons.map(b=>({disabled:b.disabled,text:b.innerText.split('\n').slice(0,2).join(' ')})));
 if(statuses.length!==9||statuses.filter(s=>!s.disabled).length!==1)throw new Error('Fresh unlocks incorrect');
 await page.locator('ul').getByRole('button').filter({has:page.getByText('オリエンテーション',{exact:true})}).click();await page.getByRole('button',{name:'用語集',exact:true}).waitFor();await page.waitForTimeout(1500);await page.screenshot({path:'output/playwright/first-lesson.png'});
 await page.evaluate(s=>{window.__onboarding={resetConfirm:true,introSkip:true,initialUnlocks:s,lessonOpened:true}},statuses);
}
