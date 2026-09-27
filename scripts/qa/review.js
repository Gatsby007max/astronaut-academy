async page => {
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().openModule('orientation','mini')});
 await page.getByRole('button',{name:'訓練開始',exact:true}).click();
 await page.getByRole('button',{name:'マーカー A',exact:true}).waitFor();
 await page.waitForTimeout(1000);await page.screenshot({path:'output/playwright/orientation-mobile.png'});
 for(let n=0;n<6;n++){
  const letter=await page.evaluate(async()=>{const {useOrbitScan,SCAN_TARGETS}=await import('/src/minigames/orbitScan.ts');const s=useOrbitScan.getState();if(s.status==='done')return null;const ids=SCAN_TARGETS.map(t=>t.id).filter(id=>s.visible[id]);return 'ABCDEFGHIJ'[ids.indexOf(s.order[s.index])]});
  if(!letter)break;await page.getByRole('button',{name:`マーカー ${letter}`,exact:true}).click();
 }
 await page.getByText('TRAINING DEBRIEF',{exact:true}).waitFor();
 await page.evaluate(()=>{window.__qa.mobile.scenes=9;window.__qa.mobile.orientationPlayable=true});
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().openModule('orientation','quiz')});
 const questions=await page.evaluate(async()=>(await import('/src/content/modules/orientation.ts')).default.quiz);
 for(const [i,q]of questions.entries()){
  await page.getByRole('heading',{name:q.prompt,exact:true}).waitFor();
  await page.getByRole('button').filter({has:page.getByText(q.choices[i===0?(q.answer+1)%4:q.answer],{exact:true})}).click();
  await page.getByRole('button',{name:i===questions.length-1?'結果を見る':'次の問題',exact:true}).click();
 }
 await page.getByText('知識確認に合格しました。実技訓練に進みましょう。').waitFor();
 await page.getByRole('button',{name:/^復習/}).click();
 await page.getByRole('heading',{name:questions[0].prompt,exact:true}).waitFor();
 await page.getByRole('button').filter({has:page.getByText(questions[0].choices[questions[0].answer],{exact:true})}).click();
 await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/review-mobile.png'});
 if(!await page.locator('a[href*="nasa.gov"]').count())throw new Error('Review source missing');
 await page.getByRole('button',{name:'結果を見る',exact:true}).click();
 await page.getByText('REVIEW COMPLETE',{exact:true}).waitFor();
 const review=await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');const s=useGame.getState();if(s.review.length)throw new Error('Review did not clear');s.finishIntro();return {registeredWrong:true,cleared:true,sourceLink:true}});
 await page.evaluate(r=>{window.__qa.review=r},review);
 const before=await page.evaluate(()=>localStorage.getItem('astronaut-academy-v1'));
 const qa=await page.evaluate(()=>window.__qa);
 await page.reload();await page.getByRole('button',{name:'訓練を再開する',exact:true}).waitFor();
 const after=await page.evaluate(()=>localStorage.getItem('astronaut-academy-v1'));
 if(before!==after)throw new Error('Persistence changed on reload');
 await page.evaluate(q=>{window.__qa=q;window.__qa.persistence={reloadIdentical:true}},qa);
 await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();
 await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 await page.waitForTimeout(3000);await page.screenshot({path:'output/playwright/hub-mobile.png'});
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().graduate()});
 await page.getByText('CERTIFICATE OF COMPLETION',{exact:true}).waitFor();
 await page.waitForTimeout(4000);await page.screenshot({path:'output/playwright/graduation-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(500);await page.screenshot({path:'output/playwright/graduation.png'});
}
