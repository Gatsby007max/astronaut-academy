async page => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const check = (condition, message) => { if (!condition) throw new Error(message); };
  const persisted = () => page.evaluate(() => localStorage.getItem('astronaut-academy-v1'));
  const baseline = await persisted();
  const menu = async () => {
    await page.getByRole('button', { name: 'デバッグメニューを開く' }).click();
    await page.getByRole('dialog', { name: 'デバッグ · 全コンテンツ' }).waitFor();
  };
  const layout = () => page.evaluate(() => ({
    width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
    headerRight: document.querySelector('header').getBoundingClientRect().right,
    particleMode: document.querySelector('canvas')?.dataset.particleMode,
    focus: document.querySelector('canvas')?.dataset.particleFocus,
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  await menu();
  const touchTargets = await page.getByRole('dialog').getByRole('button', { name: /：/ }).evaluateAll(buttons => buttons.map(b => {
    const r = b.getBoundingClientRect(); return { width: r.width, height: r.height, left: r.left, right: r.right };
  }));
  check(touchTargets.every(r => r.height >= 44 && r.left >= 0 && r.right <= 390), 'Mobile course controls must fit with 44px touch height');
  await page.screenshot({ path: 'output/playwright/debug-menu-mobile.png' });
  await page.getByRole('button', { name: 'ISSシステム：知識確認', exact: true }).click();
  await page.getByRole('combobox', { name: 'デバッグ：表示する問題' }).selectOption('15');
  await page.getByRole('button', { name: '正解と解説を表示', exact: true }).click();
  await page.getByText('ANSWER · 正解', { exact: true }).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Number(document.querySelector('canvas')?.dataset.particleFocus) > .99);
  await page.screenshot({ path: 'output/playwright/debug-quiz-mobile.png' });
  const quizLayout = await layout();
  check(quizLayout.width === quizLayout.scrollWidth && quizLayout.headerRight <= quizLayout.width, 'Mobile debug quiz must fit');
  await page.getByRole('button', { name: '結果を見る', exact: true }).click();
  await page.getByRole('button', { name: '実技訓練へ', exact: true }).scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: '実技訓練へ', exact: true }).click();
  await page.getByRole('button', { name: '訓練開始', exact: true }).waitFor();
  await menu();
  await page.getByRole('button', { name: '管制室総合演習：結果サンプル', exact: true }).click();
  await page.getByRole('button', { name: '修了証サンプル', exact: true }).click();
  await page.getByText('DEBUG PREVIEW · 修了証サンプル', { exact: false }).waitFor();
  await page.screenshot({ path: 'output/playwright/debug-certificate-mobile.png' });
  await page.getByRole('button', { name: 'ハブに戻る', exact: true }).click();
  await menu();
  await page.getByRole('button', { name: '導入ムービー', exact: true }).click();
  await page.getByRole('button', { name: 'SKIP ▸', exact: true }).click();
  await menu();
  await page.getByRole('button', { name: '出典とクレジット', exact: true }).click();
  await page.getByText('SOURCES & CREDITS', { exact: true }).waitFor();
  await menu();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: '設定', exact: true }).click();
  check(await page.getByRole('button', { name: '進捗をリセット', exact: true }).count() === 0, 'Debug must hide progress reset');
  await page.getByRole('button', { name: 'デバッグを終了', exact: true }).click();
  check(!page.url().includes('debug='), 'Exiting debug must remove query');
  check(await page.getByRole('button', { name: 'デバッグメニューを開く' }).count() === 0, 'Debug control hidden in normal mode');
  check(await page.locator('ul').getByRole('button').evaluateAll(buttons => buttons.filter(b => !b.disabled).length) === 1, 'Normal unlock gates restored');
  check(await persisted() === baseline, 'Mobile previews changed saved progress');
  await page.locator('ul').getByRole('button').filter({ has: page.getByText('オリエンテーション', { exact: true }) }).click();
  await page.getByRole('button', { name: '知識確認', exact: true }).click();
  check(await page.getByRole('combobox', { name: 'デバッグ：表示する問題' }).count() === 0, 'Debug question selector must be absent in normal mode');
  check(await page.getByRole('button', { name: '正解と解説を表示', exact: true }).count() === 0, 'Debug answer control must be absent in normal mode');
  check(await page.getByRole('button', { name: '次の問題', exact: true }).isDisabled(), 'Normal quiz still requires an answer');
  await page.goto('http://127.0.0.1:5181/');
  await page.getByRole('button', { name: 'デバッグで全て見る', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'output/playwright/debug-title-mobile.png' });
  await page.getByRole('button', { name: 'デバッグで全て見る', exact: true }).click();
  await page.getByText('全9コース開放中 · 成績は保存されません', { exact: true }).waitFor();
  await menu();
  await page.getByRole('button', { name: 'デバッグを終了して通常モードへ', exact: true }).click();
  check(await persisted() === baseline, 'Title entry or menu exit changed saved progress');
  await page.evaluate(report => { window.__debugMobileQA = report; }, { viewport: { width: 390, height: 844 }, quizLayout, touchTargets: touchTargets.length, minTouchHeight: Math.min(...touchTargets.map(r => r.height)), normalGatesRestored: true, normalQuizUnchanged: true, titleEntry: true, menuExit: true, settingsExit: true, progressPreserved: true, errors });
}
