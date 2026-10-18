import {test,expect} from '@playwright/test'

test('采样不可用时明确降级，重试后加载本地钢琴并复用缓冲',async({page})=>{
  let blocked=true
  let requests=0
  await page.route('**/audio/salamander/*.mp3',route=>{requests++;return blocked?route.abort('failed'):route.continue()})
  await page.goto('/')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('合成音')
  await expect(page.getByRole('button',{name:'重试采样',exact:true})).toBeVisible()
  blocked=false
  await page.getByRole('button',{name:'重试采样',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('采样钢琴')
  const loaded=requests
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await page.getByRole('button',{name:'逐音上行 ↗',exact:true}).click()
  expect(requests).toBe(loaded)
})

test('采样加载期间切页会取消待播，加载后不会残留声音',async({page})=>{
  let release=()=>{}
  const gate=new Promise<void>(resolve=>{release=resolve})
  await page.route('**/audio/salamander/*.mp3',async route=>{await gate;await route.continue()})
  await page.addInitScript(()=>{
    const create=AudioContext.prototype.createBufferSource
    ;(window as unknown as {starts:number}).starts=0
    AudioContext.prototype.createBufferSource=function(){
      const node=create.call(this);const start=node.start.bind(node)
      node.start=(when?:number)=>{(window as unknown as {starts:number}).starts++;start(when)}
      return node
    }
  })
  await page.goto('/')
  await page.getByRole('button',{name:'同时弹',exact:true}).click()
  await expect(page.locator('.source-status')).toContainText('加载钢琴采样')
  await page.getByRole('navigation').getByRole('button',{name:/伴奏音型/}).click()
  release()
  await expect(page.locator('.source-status strong')).toContainText('采样钢琴')
  expect(await page.evaluate(()=>(window as unknown as {starts:number}).starts)).toBe(0)
  await page.getByRole('button',{name:'播放练习',exact:true}).click()
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {starts:number}).starts)).toBeGreaterThan(0)
})
