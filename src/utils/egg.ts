let innerRadius = 1
let moreOutterRadius = 100
let minRadius = 1
let maxRadius = 10
let mcolor = [
  '#409EFF',
  '#67C23A',
  '#E6A23C',
  '#F56C6C',
  '#909399',
]

/**
 * 随机生成一堆扩散的小球
 */
export function getEnoughBall(
  ctx: CanvasRenderingContext2D,
  mouseX: number,
  mouseY: number,
  num: number
) {
  var balls = []
  for (let i = 0; i < num; i++) {
    const radius = Math.random() * (maxRadius - minRadius) + minRadius
    var ball = new Ball(ctx, 0, 0, radius, mcolor[Math.random() * mcolor.length >> 0])
    ball.x = mouseX + Math.random() * innerRadius - Math.random() * innerRadius
    ball.y = mouseY + Math.random() * innerRadius - Math.random() * innerRadius
    var x = mouseX - ball.x
    var y = mouseY - ball.y
    var scale = Math.abs(x / y)
    ball.dx = (x < 0 ? 1 : -1) * moreOutterRadius / Math.sqrt(scale * scale + 1) * Math.random() * scale + mouseX
    ball.dy = (y < 0 ? 1 : -1) * moreOutterRadius / Math.sqrt(scale * scale + 1) * Math.random() + mouseY
    balls.push(ball)
  }
  return balls
}

class Ball {
  ctx: CanvasRenderingContext2D
  public x: number
  public y: number
  public vx: number
  public vy: number
  public sx: number
  public sy: number
  public dx: number = 0
  public dy: number = 0
  private radius: number
  private color: string

  constructor(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
    this.ctx = ctx
    this.x = x || 0
    this.y = y || 0
    this.vx = 0
    this.vy = 0
    this.sx = 1
    this.sy = 1
    this.radius = radius || 10
    this.color = color || 'black'
  }
  draw(type: 'fill' | 'stroke') {
    if (!['fill', 'stroke'].includes(type)) return
    const { ctx } = this
    ctx.save()
    ctx.translate(this.x, this.y)
    ctx.scale(this.sx, this.sy)
    ctx.fillStyle = this.color
    ctx.strokeStyle = this.color
    ctx.beginPath()
    ctx.arc(0, 0, this.radius, 0, 360 * Math.PI / 180)
    ctx.closePath()
    type === 'fill' ? ctx.fill() : ctx.stroke()
    ctx.restore()
  }
}
