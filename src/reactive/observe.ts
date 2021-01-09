import Dep from './dep'

export default class Observer {
  /**
   * 响应式构造器
   * @param {*} data 
   */
  constructor (data: any) {
    this.observe(data)
  }
  /**
   * 处理响应式
   * @param { Object | Array } data
   */
  observe (data: any) {
    if (typeof data !== 'object') return
    Object.keys(data).forEach(key => {
      this.defineReactive(data, key, data[key])
    })
  }
  /**
   * 重写 setter / getter
   * @param {*} data 
   * @param {*} key 
   * @param {*} val 
   */
  defineReactive (data: any, key: string | number, val: any) {
    const dep = new Dep()
    let childOb = this.observe(val)
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
        childOb = this.observe(newVal)
        dep.notify()
      }
    })
  }
}
