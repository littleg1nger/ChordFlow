import { test, expect } from '@playwright/test'

test('和弦查询、转位、音频解锁和局部键盘滚动', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.addInitScript(() => {
    const compressor=AudioContext.prototype.createDynamicsCompressor
    AudioContext.prototype.createDynamicsCompressor=function() {
      const node=compressor.call(this)
      const analyser=this.createAnalyser()
      analyser.fftSize=256
      node.connect(analyser)
      ;(window as unknown as { analyser: AnalyserNode }).analyser=analyser
      return node
    }
    const original = AudioContext.prototype.createOscillator
    ;(window as unknown as { scheduled: number[] }).scheduled = []
    AudioContext.prototype.createOscillator = function (...args) {
      const osc = original.apply(this, args)
      const start = osc.start.bind(osc)
      osc.start = (when?: number) => {
        ;(window as unknown as { scheduled: number[] }).scheduled.push(osc.frequency.value)
        start(when)
      }
      return osc
    }
  })
  await page.goto('/')
  await expect(page.getByTestId('chord-symbol')).toHaveText('C')
  await page.getByRole('button', { name: '同时弹', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('音频已开启')
  await expect.poll(() => page.evaluate(() => (window as unknown as { scheduled: number[] }).scheduled.length)).toBeGreaterThan(0)
  await expect.poll(() => page.evaluate(() => {
    const analyser=(window as unknown as { analyser: AnalyserNode }).analyser
    const samples=new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(samples)
    return Math.max(...samples.map(Math.abs))
  })).toBeGreaterThan(0.001)
  await page.getByRole('button', { name: '第一转位', exact: true }).click()
  await expect(page.getByTestId('chord-symbol')).toHaveText('C/E')
  await expect(page.locator('.hand-voicing')).toContainText('E4 · G4 · C5')
  for (const symbol of ['Am', 'G7', 'CM7', 'Cm7', 'C#', 'Cdim7']) {
    await page.getByLabel('搜索和弦', { exact: true }).fill(symbol)
    await page.getByRole('button', { name: '查找和弦', exact: true }).click()
    await expect(page.getByTestId('chord-symbol')).toHaveText(symbol === 'CM7' ? 'Cmaj7' : symbol)
  }
  await expect(page.locator('.tones')).toContainText('Bbb')
  await page.getByLabel('搜索和弦', { exact: true }).fill('C/F#')
  await page.getByRole('button', { name: '查找和弦', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('非和弦内音')
  await page.getByRole('button', { name: '停止', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(errors).toEqual([])
  await page.screenshot({ path: testInfo.outputPath('explorer.png'), fullPage: true })
})
