async page => {
  await page.goto('http://127.0.0.1:5181/?debug=1');
  await page.getByText('訓練カリキュラム', { exact: true }).waitFor();
  await page.getByText('LAUNCH SEQUENCE', { exact: true }).waitFor({ state: 'hidden' });
  await page.getByRole('button', { name: 'デバッグメニューを開く' }).click();
  const layouts = [];
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const buttons = await page.getByRole('dialog').getByRole('button', { name: /：/ }).evaluateAll(buttons => buttons.map(b => {
      const r = b.getBoundingClientRect();
      return { name: b.textContent, width: r.width, height: r.height, clientWidth: b.clientWidth, scrollWidth: b.scrollWidth, right: r.right };
    }));
    if (!buttons.every(b => b.scrollWidth <= b.clientWidth && b.height >= 44 && b.right <= width)) throw new Error(`Debug button overflow at ${width}`);
    layouts.push({ width, count: buttons.length, buttonHeight: Math.min(...buttons.map(b => b.height)), noOverflow: true });
    await page.screenshot({ path: `output/playwright/debug-menu-${width}.png` });
  }
  await page.screenshot({ path: 'output/playwright/debug-menu-mobile.png' });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'output/playwright/debug-menu-desktop.png' });
  await page.getByRole('button', { name: '修了証サンプル', exact: true }).click();
  await page.getByText('LAUNCH SEQUENCE', { exact: true }).waitFor({ state: 'hidden' });
  await page.waitForFunction(() => {
    const certificate = document.querySelector('.certificate');
    return certificate && Number(getComputedStyle(certificate).opacity) > .99;
  });
  await page.screenshot({ path: 'output/playwright/debug-certificate.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'output/playwright/debug-certificate-mobile.png' });
  await page.goto('http://127.0.0.1:5181/');
  await page.getByRole('button', { name: 'デバッグで全て見る', exact: true }).waitFor();
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('h1').parentElement).opacity) > .99);
  await page.screenshot({ path: 'output/playwright/debug-title-mobile.png' });
  await page.evaluate(report => { window.__debugLayoutQA = report; }, { layouts });
}
