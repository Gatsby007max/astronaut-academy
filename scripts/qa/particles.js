async page => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('http://127.0.0.1:5181/');
 const results=[];
 await page.evaluate(data=>localStorage.setItem('astronaut-academy-v1',JSON.stringify(data)), {"state": {"xp": 7101, "modules": {"orientation": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790350937347}, "iss": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790350938786}, "medicine": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 970, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790350939752}, "eva": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790350945778}, "robotics": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790350999695}, "t38": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790351001319}, "emergency": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790351002486}, "lunar": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790351006869}, "mcc": {"lessonsRead": [], "quizBest": 1, "quizAttempts": 1, "miniBest": 1000, "miniAttempts": 1, "completed": true, "perfect": true, "completedAt": 1790351008244}}, "review": [], "introSeen": true, "graduated": true, "settings": {"quality": "high", "audio": false, "volume": 0.7, "particleMotion": true}}, "version": 0});
 await page.reload();await page.getByRole('button',{name:'訓練を再開する',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 for(const id of ['iss','eva','robotics','medicine','t38','emergency','lunar','mcc','orientation']){
  const names={"orientation": "オリエンテーション", "iss": "ISSシステム", "eva": "船外活動・中性浮力", "robotics": "ロボティクス", "medicine": "宇宙医学・生理学", "t38": "T-38飛行とサバイバル", "emergency": "緊急事態対応", "lunar": "地質学とアルテミス", "mcc": "管制室総合演習"};
  await page.locator('ul').getByRole('button').filter({has:page.getByText(names[id],{exact:true})}).click();
  await page.waitForFunction(()=>document.querySelector('canvas')?.dataset.particleCount==='180000');
  await page.waitForTimeout(2000);
  await page.screenshot({path:`output/playwright/particles-${id}-flow.png`});
  results.push({id,...await page.evaluate(()=>Object.assign({},document.querySelector('canvas').dataset))});
  if(['iss','eva','robotics','orientation'].includes(id)){
   await page.getByRole('button',{name:/知識確認/}).click();
   await page.waitForFunction(()=>Number(document.querySelector('canvas')?.dataset.particleFocus)>.99);
   await page.screenshot({path:`output/playwright/particles-${id}-focus.png`});
  }
  await page.getByRole('button',{name:'ハブ',exact:true}).click();await page.getByText('訓練カリキュラム',{exact:true}).waitFor();
 }
 await page.evaluate(data=>window.__particlesQA=data,{results,errors});
}
