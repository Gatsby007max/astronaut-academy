async page => {
 await page.setViewportSize({width:390,height:844});
 for(const id of ['iss','medicine','eva','robotics','t38','emergency','lunar','mcc']){
  await page.evaluate(async id=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().updateSettings({quality:'low'});useGame.getState().openModule(id,'mini')},id);
  await page.getByRole('button',{name:'訓練開始',exact:true}).click();
  await page.waitForTimeout(1000);
  await page.screenshot({path:`output/playwright/${id}-mobile.png`});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  if(overflow)throw new Error('Horizontal overflow '+id);
 }
 await page.getByRole('button',{name:'設定',exact:true}).click();await page.getByRole('dialog',{name:'設定',exact:true}).waitFor();await page.keyboard.press('Escape');
 if(await page.getByRole('dialog').count())throw new Error('Escape did not close settings');
 await page.evaluate(async()=>{const {useGame}=await import('/src/game/store.ts');useGame.getState().go({name:'title'})});
 await page.screenshot({path:'output/playwright/title-mobile.png'});
 await page.evaluate(()=>{window.__qa.mobile={width:innerWidth,height:innerHeight,scenes:8,overflow:false,settingsEscape:true}});
}
