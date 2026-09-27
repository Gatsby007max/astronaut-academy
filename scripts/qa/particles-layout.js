async page => {
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.setViewportSize({width:390,height:844});
  await page.reload();
  await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();
  await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
  await page.locator('ul').getByRole('button').filter({has:page.getByText('ISSシステム',{exact:true})}).click();
  await page.getByRole('button',{name:/知識確認/}).click();
  await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.particleFocus)>.99);
  await page.waitForTimeout(2000);
  await page.screenshot({path:'output/playwright/particles-iss-mobile.png'});
  const mobile=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,...document.querySelector('canvas').dataset}));
  if(mobile.width!==mobile.scrollWidth)throw new Error('Mobile overflow');
  await page.getByRole('button',{name:/ザーリャ（Zarya）/}).click();
  await page.getByText('CORRECT',{exact:true}).waitFor();
  await page.getByRole('button',{name:'次の問題',exact:true}).click();
  await page.getByText('Q2/16・正解 1',{exact:true}).waitFor();
  await page.getByRole('button',{name:/実技訓練/}).click();
  await page.getByRole('button',{name:'訓練開始',exact:true}).click();
  await page.waitForTimeout(2000);
  await page.screenshot({path:'output/playwright/particles-iss-mobile-markers.png'});
  const roles={'米国の主要な実験室':'デスティニー','米国宇宙服で船外へ出るためのエアロック':'クエスト','7枚の窓から外を観測する区画':'キューポラ','日本の実験棟':'きぼう','水再生などの生命維持装置を収めるノード3':'トランクウィリティー'};
  for(let i=0;i<5;i++){
    const prompt=await page.locator('.training-panel p').first().textContent();
    await page.getByRole('button',{name:new RegExp('^区画 '+roles[prompt])}).click();
    await page.getByRole('status').filter({hasText:'正解：'}).waitFor();
    await page.getByRole('button',{name:'次へ',exact:true}).click();
  }
  await page.getByRole('button',{name:/ブリーフィング/}).click();
  await page.setViewportSize({width:1440,height:1000});
  await page.waitForTimeout(2200);
  await page.screenshot({path:'output/playwright/particles-iss-flow-final.png'});
  await page.getByRole('button',{name:/知識確認/}).click();
  await page.waitForTimeout(2200);
  await page.screenshot({path:'output/playwright/particles-iss-focus-final.png'});
  await page.evaluate(report=>window.__particlesLayout=report,{mobile,mobileQuizAnswer:true,mobileMarkers:5,errors});
}
