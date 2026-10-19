import { useCallback, useRef, useState } from 'react'
import { defaultData, loadData, saveData, STORAGE_KEY, type UserData } from './store'

export function useUserData() {
  const [initial] = useState(() => {
    try { return loadData(window.localStorage) }
    catch { return {data:defaultData(),raw:null,warning:'浏览器阻止了本地存储，将在内存中练习，请在离开前导出备份。'} }
  })
  const [data,setData] = useState(initial.data)
  const [warning,setWarning] = useState(initial.warning)
  const latest = useRef(data)
  const preserveOriginal = useRef(Boolean(initial.warning))
  const expectedRaw = useRef(initial.raw)
  const update = useCallback((change: (previous: UserData) => UserData, replaceOriginal = false) => {
    const next = change(latest.current)
    latest.current=next
    setData(next)
    if(preserveOriginal.current && !replaceOriginal) return
    try {
      const storage=window.localStorage
      if(!replaceOriginal && storage.getItem(STORAGE_KEY)!==expectedRaw.current) {
        preserveOriginal.current=true
        setWarning('检测到其他页面已修改或清理本地记录，已阻止本页覆盖。当前操作仅保留在内存中；请先导出当前练习，再刷新以读取最新记录。')
        return
      }
      expectedRaw.current=saveData(storage,next)
      preserveOriginal.current=false
      setWarning('')
    }
    catch { setWarning('本地保存失败，当前练习仍保留在内存中。请到“我的练习”导出备份，并检查浏览器存储空间或权限。') }
  },[])
  return {data,update,warning}
}
