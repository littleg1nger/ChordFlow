import { test,expect } from '@playwright/test'
import { defaultData, practiceConfig } from '../src/storage/store'

test('旧标签页的设置操作不能覆盖另一页新存的练习和时长',async ({page,context}) => {
  await page.goto('/')
  const stale=await context.newPage()
  await stale.goto('/')
  await page.bringToFront()
  await page.getByRole('navigation').getByRole('button',{name:'和弦进行',exact:true}).click()
  await page.getByLabel('练习名称',{exact:true}).fill('多标签页保留验证')
  await page.getByRole('button',{name:'保存到我的练习',exact:true}).click()
  await page.getByRole('button',{name:'播放练习',exact:true}).click()
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(localStorage.getItem('chordflow:v1')!).stats.seconds)).toBeGreaterThan(1)
  await page.getByRole('button',{name:'停止',exact:true}).click()
  const before=await page.evaluate(()=>localStorage.getItem('chordflow:v1'))
  await stale.getByLabel('根音',{exact:true}).selectOption('D')
  await expect(stale.getByRole('alert')).toContainText('其他页面')
  await expect(stale.locator('.local-badge')).toContainText('仅内存保存')
  await stale.getByRole('button',{name:'收藏和弦',exact:true}).click()
  expect(await stale.evaluate(()=>localStorage.getItem('chordflow:v1'))).toBe(before)
  await stale.reload()
  await stale.getByRole('navigation').getByRole('button',{name:'我的练习',exact:true}).click()
  await expect(stale.getByRole('heading',{name:'多标签页保留验证',exact:true})).toBeVisible()
  expect(await stale.evaluate(()=>localStorage.getItem('chordflow:v1'))).toBe(before)
})

test('损坏数据在后续操作中保持原样，仅确认导入后恢复写入',async ({page}) => {
  await page.goto('/')
  const original=defaultData()
  original.stats={seconds:123,completions:2}
  original.exercises=[{id:'previous',name:'昨天的练习',config:practiceConfig(original.settings),createdAt:'2026-10-18T12:00:00.000Z'}]
  const broken=JSON.stringify({...original,settings:{...original.settings,bpm:999}})
  await page.evaluate(raw=>localStorage.setItem('chordflow:v1',raw),broken)
  await page.reload()
  await expect(page.getByRole('alert')).toContainText('本地数据未能恢复')
  await expect(page.locator('.local-badge')).toContainText('仅内存保存')
  await page.getByLabel('根音',{exact:true}).selectOption('D')
  await page.getByRole('button',{name:'收藏和弦',exact:true}).click()
  expect(await page.evaluate(() => localStorage.getItem('chordflow:v1'))).toBe(broken)
  await page.getByRole('navigation').getByRole('button',{name:'我的练习',exact:true}).click()
  await page.getByRole('button',{name:'检查本地存储',exact:true}).click()
  await expect(page.locator('.practice-view .inline-status')).toContainText('原始记录仍存在')
  expect(await page.evaluate(() => localStorage.getItem('chordflow:v1'))).toBe(broken)
  await page.getByLabel('选择 JSON 备份',{exact:true}).setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(original))})
  expect(await page.evaluate(() => localStorage.getItem('chordflow:v1'))).toBe(broken)
  await page.getByRole('button',{name:'替换本地数据',exact:true}).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.locator('.local-badge')).toContainText('自动保存')
  await expect(page.getByRole('heading',{name:'昨天的练习',exact:true})).toBeVisible()
  await page.reload()
  await page.getByLabel('根音',{exact:true}).selectOption('E')
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('chordflow:v1')!))
  expect(saved.stats).toEqual(original.stats)
  expect(saved.exercises).toEqual(original.exercises)
  expect(saved.settings.chord).toBe('E')
})

test('存储失败仍能练习并提示导出',async ({page}) => {
  await page.goto('/')
  await page.evaluate(() => {Storage.prototype.setItem=() => {throw new DOMException('Quota exceeded','QuotaExceededError')}})
  await page.getByRole('button',{name:'收藏和弦',exact:true}).click()
  await expect(page.getByRole('alert')).toContainText('本地保存失败')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('音频已开启')
  await page.getByRole('navigation').getByRole('button',{name:/我的练习/}).click()
  await expect(page.locator('.favorite-list')).toContainText('C')
  await expect(page.getByRole('button',{name:'导出 JSON 备份',exact:true})).toBeEnabled()
})

test('音频失败可重试、键盘焦点与320px布局',async ({page},testInfo) => {
  await page.setViewportSize({width:320,height:780})
  await page.addInitScript(() => {
    const resume=AudioContext.prototype.resume
    let first=true
    AudioContext.prototype.resume=function() {if(first){first=false;return Promise.reject(new Error('test blocked'))}return resume.call(this)}
    const Original=window.AudioContext
    window.AudioContext=class extends Original {
      constructor(options?: AudioContextOptions) {super(options);void this.suspend()}
    }
  })
  await page.goto('/')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('音频失败')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('音频已开启')
  const key=page.locator('[data-midi="60"]')
  await key.focus()
  await page.keyboard.press('Enter')
  await expect(key).toContainText('响')
  for(const name of ['伴奏音型','和弦进行','我的练习']) {
    await page.getByRole('navigation').getByRole('button',{name:new RegExp(name)}).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    expect(await page.locator('main').evaluate(el => el.scrollWidth<=el.clientWidth)).toBe(true)
  }
  await page.screenshot({path:testInfo.outputPath('mobile-practice.png'),fullPage:true})
})

test('后台暂停与减少动态效果',async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.goto('/')
  await page.getByRole('navigation').getByRole('button',{name:/伴奏音型/}).click()
  await page.getByRole('button',{name:'播放练习',exact:true}).click()
  await page.evaluate(() => {Object.defineProperty(document,'hidden',{configurable:true,get:() => true});document.dispatchEvent(new Event('visibilitychange'))})
  await expect(page.getByLabel('节拍播放头',{exact:true})).toHaveAttribute('data-status','paused')
  await expect(page.locator('.source-status')).toContainText('后台')
  expect(await page.getByRole('button',{name:'继续练习',exact:true}).evaluate(el => getComputedStyle(el).transitionDuration)).toBe('0s')
})
