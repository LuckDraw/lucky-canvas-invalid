/**
 * 重写数组的原型方法
 */
const oldArrayProto = Array.prototype
const newArrayProto = Object.create(oldArrayProto)
const methods = ['push', 'pop', 'shift', 'unshift', 'sort', 'splice', 'reverse']
methods.forEach(name => {
  newArrayProto[name] = function () {
    oldArrayProto[name].call(this, ...Array.from(arguments))
  }
})

export { newArrayProto }
