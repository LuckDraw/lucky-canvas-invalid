import Dep from './dep'

/**
 * 处理响应式
 * @param { Object | Array } data
 */
export const observe = (data: any) => {
  if (typeof data !== 'object') return
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

/**
 * 重写 setter / getter
 * @param {*} data 
 * @param {*} key 
 * @param {*} val 
 */
export const defineReactive = (data: any, key: string | number, val: any) => {
  const dep = new Dep()
  let childOb = observe(val)
  Object.defineProperty(data, key, {
    get: () => {
      if (Dep.target) {
        dep.addSub(Dep.target)
      }
      return val
    },
    set: (newVal) => {
      if (newVal === val) return
      val = newVal
      childOb = observe(newVal)
      dep.notify()
    }
  })
}
