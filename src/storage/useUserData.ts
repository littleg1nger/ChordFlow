import { useCallback, useRef, useState } from 'react'
import { defaultData, loadData, saveData, type UserData } from './store'

export function useUserData() {
  const [initial] = useState(() => {
    try { return loadData(window.localStorage) }
    catch { return {data:defaultData(),warning:'浏览器阻止了本地存储，将在内存中练习，请在离开前导出备份。'} }
  })
  const [data,setData] = useState(initial.data)
  const [warning,setWarning] = useState(initial.warning)
  const latest = useRef(data)
  const update = useCallback((change: (previous: UserData) => UserData) => {
    const next = change(latest.current)
    latest.current=next
    setData(next)
    try { saveData(window.localStorage,next) }
    catch { setWarning('本地保存失败，当前练习仍保留在内存中。请到“我的练习”导出备份，并检查浏览器存储空间或权限。') }
  },[])
  return {data,update,warning}
}
