import { isExpectType } from '../utils'
import Dep from './dep'

let uid = 0

function parsePath (path: string) {
  path += '.'
  let segments: string[] = [], segment = ''
  for (let i = 0; i < path.length; i++) {
    let curr = path[i]
    if (/\[|\./.test(curr)) {
      segments.push(segment)
      segment = ''
    } else if (/\W/.test(curr)) {
      continue
    } else {
      segment += curr
    }
  }
  return function (data: object | any[]) {
    return segments.reduce((data, key) => {
      return data[key]
    }, data)
  }
}

function traverse (value: any) {
  // const seenObjects = new Set()
  const dfs = (data: any) => {
    if (!isExpectType(data, 'array', 'object')) return
    Object.keys(data).forEach(key => {
      const value = data[key]
      dfs(value)
    })
  }
  dfs(value)
  // seenObjects.clear()
}

export interface WatchOptType {
  handler?: () => Function
  immediate?: boolean
  deep?: boolean
}

export default class Watcher {
  id: number
  vm: any // 先暂时any
  expr
  cb: Function
  deep: boolean
  getter: Function
  value: any
  /**
   * 观察者构造器
   * @param {*} vm 
   * @param {*} expr 
   * @param {*} cb 
   */
  constructor (vm: any, expr: string | Function, cb: Function, options: WatchOptType = {}) {
    this.id = uid++
    this.vm = vm
    this.expr = expr
    this.deep = !!options.deep
    if (typeof expr === 'function') {
      this.getter = expr
    } else {
      this.getter = parsePath(expr)
    }
    this.cb = cb
    this.value = this.get()
  }
  /**
   * 根据表达式获取新值
   */
  get () {
    Dep.target = this
    const value = this.getter.call(this.vm, this.vm)
    // 处理深度监听
    if (this.deep) {
      traverse(value)
    }
    Dep.target = null
    return value
  }
  /**
   * 触发 watcher 更新
   */
  update () {
    // get获取新值
    const newVal = this.get()
    // 读取之前存储的旧值
    const oldVal = this.value
    this.value = newVal
    this.cb.call(this.vm, newVal, oldVal)
  }
}