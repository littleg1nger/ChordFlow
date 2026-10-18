import { test,expect } from '@playwright/test'

test('存储失败仍能练习并提示导出，损坏数据不自动覆盖',async ({page}) => {
  await page.addInitScript(() => {localStorage.setItem('chordflow:v1','{broken')})
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('本地数据未能恢复')
  expect(await page.evaluate(() => localStorage.getItem('chordflow:v1'))).toBe('{broken')
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
