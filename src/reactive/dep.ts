import Watcher from './watcher'

export default class Dep {
  static target: Watcher | null
  subs: Array<Watcher>

  /**
   * 订阅中心构造器
   */
  constructor () {
    this.subs = []
  }

  /**
   * 收集依赖
   * @param {*} sub 
   */
  addSub (sub: Watcher) {
    if (!this.subs.includes(sub)) {
      this.subs.push(sub)
    }
  }

  /**
   * 派发更新
   */
  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }
}
