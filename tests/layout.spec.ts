import { test, expect } from '@playwright/test'

for (const viewport of [{width:1366,height:768},{width:1920,height:1080}]) {
  test(`探索首屏完整显示琴键与唯一试听操作 ${viewport.width}×${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport)
    await page.goto('/')
    // Assert geometry rather than just Playwright visibility (which includes below-fold elements).
    for (const selector of ['.explorer-tools','.chord-overview','.inversion-bar','[data-testid="piano"]','.transport']) {
      const bounds=await page.locator(selector).boundingBox()
      expect(bounds).not.toBeNull()
      expect(bounds!.y).toBeGreaterThanOrEqual(0)
      expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(viewport.height)
    }
    await expect(page.getByRole('button',{name:'停止',exact:true})).toHaveCount(1)
    await expect(page.getByRole('button',{name:'同时弹',exact:true})).toHaveCount(1)
    await page.getByLabel('搜索和弦',{exact:true}).fill('F#maj7')
    await page.getByRole('button',{name:'查找和弦',exact:true}).click()
    await page.getByRole('button',{name:'第三转位',exact:true}).click()
    await expect(page.getByTestId('chord-symbol')).toHaveText('F#maj7/E#')
    const player=await page.locator('.transport').boundingBox()
    expect(player!.y+player!.height).toBeLessThanOrEqual(viewport.height)
    expect(await page.locator('main').evaluate(el=>el.scrollTop)).toBe(0)
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  })
}

test('手机操作顺序与自然滚动，试听状态和页面切换',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.goto('/')
  const selectors=['.explorer-tools','.chord-overview','.inversion-bar','[data-testid="piano"]','.transport','.playing-guide']
  const positions=await Promise.all(selectors.map(s=>page.locator(s).evaluate(el=>el.getBoundingClientRect().top+scrollY)))
  expect(positions).toEqual([...positions].sort((a,b)=>a-b))
  expect(await page.locator('.transport').evaluate(el=>getComputedStyle(el).position)).toBe('static')
  expect(await page.locator('main').evaluate(el=>getComputedStyle(el).overflowY)).toBe('visible')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.playback-context')).toContainText('C · 同时弹')
  await expect(page.locator('.playback-state')).toHaveText('正在发声')
  await page.getByRole('button',{name:'停止',exact:true}).click()
  await expect(page.locator('.playback-state')).toHaveText('已停止')
  await page.getByRole('navigation').getByRole('button',{name:'伴奏音型',exact:true}).click()
  await expect(page.locator('.playback-context')).toContainText('上下行分解')
  await page.getByRole('button',{name:'播放练习',exact:true}).click()
  await expect(page.locator('.playback-state')).toHaveText('正在播放')
  await page.getByRole('button',{name:'停止',exact:true}).click()
  await expect(page.locator('.playback-state')).toHaveText('已停止')
  for(const name of ['和弦进行','我的练习','和弦探索']) {
    await page.getByRole('navigation').getByRole('button',{name,exact:true}).click()
    await expect(page.getByRole('heading',{level:1,name,exact:true})).toBeVisible()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  }
})

test('长进行只在工作区滚动，底部不产生外层空白',async({page})=>{
  await page.setViewportSize({width:2048,height:1024})
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button',{name:'和弦进行',exact:true}).click()
  await page.getByLabel('进行加花',{exact:true}).selectOption('chord-turn')
  const main=page.locator('main')
  await main.evaluate(el=>{el.scrollTop=el.scrollHeight})
  // Hidden, absolutely positioned form labels must remain inside the workspace.
  // Otherwise they can extend the document past the clipped application shell.
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight))
  expect(await page.evaluate(()=>document.documentElement.scrollHeight)).toBe(1024)
  expect(await page.evaluate(()=>scrollY)).toBe(0)
  expect(await main.evaluate(el=>el.scrollTop)).toBeGreaterThan(0)
  const help=await page.locator('#help').boundingBox()
  expect(help!.y+help!.height).toBeLessThanOrEqual(1024)
  expect(1024-help!.y-help!.height).toBeLessThanOrEqual(32)
  await expect(page.getByLabel('练习名称',{exact:true})).toBeVisible()
  await expect(page.getByRole('button',{name:'保存到我的练习',exact:true})).toBeVisible()
})
