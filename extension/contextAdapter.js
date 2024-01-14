class ContextAdapter {
  constructor(ctx, k, left, top) {
    this.ctx = ctx
    this.k = k
    this.left = left
    this.top = top
  }

  x(x) {
    return this.scale(this.left + x)
  }

  x_line(x) {
    return this.x(x) + 0.5
  }

  y(y) {
    return this.scale(this.top + y)
  }

  y_line(y) {
    return this.y(y) + 0.5
  }

  scale(value) {
    return Math.floor(value * this.k)
  }

  // draw methods

  strokeRect(x, y, width, height) {
    this.ctx.strokeRect(this.x_line(x), this.y_line(y), this.scale(width), this.scale(height))
  }

  fillRect(x, y, width, height) {
    this.ctx.fillRect(this.x_line(x), this.y_line(y), this.scale(width), this.scale(height))
  }

  arc(x, y, radius, startAngle, endAngle) {
    this.ctx.arc(this.x(x), this.y(y), this.scale(radius), startAngle, endAngle)
  }

  moveTo(x, y) {
    this.ctx.moveTo(this.x_line(x), this.y_line(y))
  }

  lineTo(x, y) {
    this.ctx.lineTo(this.x_line(x), this.y_line(y))
  }

  fillText(text, x, y) {
    this.ctx.fillText(text, this.x(x), this.y(y))
  }
}