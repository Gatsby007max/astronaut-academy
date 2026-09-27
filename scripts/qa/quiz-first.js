async page => {
 await page.evaluate(async()=>{ const {useGame}=await import('/src/game/store.ts'); useGame.getState().resetProgress(); useGame.getState().updateSettings({audio:false,quality:'high'}); window.__qa={errors:[],quiz:[],mini:[]}; });
 page.on('pageerror', async e=> { await page.evaluate(message=>window.__qa.errors.push(message),e.message).catch(()=>{}); });
 for(const id of ['orientation','iss','medicine']) {
  await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().go({name:'module',id,phase:'quiz'})},id);
  const questions=await page.evaluate(async id=>(await import(`/src/content/modules/${id}.ts`)).default.quiz,id);
  for (const q of questions) {
   await page.getByRole('heading',{name:q.prompt,exact:true}).waitFor();
   await page.getByRole('button').filter({has:page.getByText(q.choices[q.answer],{exact:true})}).click();
   await page.getByRole('button',{name:q===questions.at(-1)?'結果を見る':'次の問題',exact:true}).click();
  }
  await page.getByText('知識確認に合格しました。実技訓練に進みましょう。').waitFor();
  await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');window.__qa.quiz.push({id,best:useGame.getState().modules[id].quizBest})},id);
 }
}
