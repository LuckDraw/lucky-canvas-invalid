class Observer {
  private value: any
  constructor (value) {
    this.value = value
    this.walk(this.value)
  }
  walk (value) {
    Object.keys(value).forEach((key) => {
      defineReactive(value, key, value[key])
    })
  }
}

function defineReactive (obj, key, val) {
  observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get () {
      return val
    },
    set (newVal) {
      val = newVal
      observe(val)
    }
  })
}

export default function observe (value) {
  if (typeof value === 'object' && value !== null) {
    value = new Observer(value)
  }
}
