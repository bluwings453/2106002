import inter600 from '@fontsource/inter/files/inter-latin-600-normal.woff2?url'
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2?url'
import inter800 from '@fontsource/inter/files/inter-latin-800-normal.woff2?url'
import inter400 from '@fontsource/inter/files/inter-latin-400-normal.woff2?url'

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob()
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(blob)
  })
}

let fontCss: Promise<string> | null = null
function getFontCss() {
  fontCss ??= Promise.all(
    [
      [400, inter400],
      [600, inter600],
      [700, inter700],
      [800, inter800],
    ].map(async ([w, u]) => `@font-face{font-family:Inter;font-weight:${w};src:url(${await toDataUrl(u as string)}) format('woff2');}`),
  ).then((r) => r.join(''))
  return fontCss
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

/** Export the live map SVG as a poster-style PNG. */
export async function exportMapPng(svg: SVGSVGElement, stateName: string, subtitle: string) {
  const vb = svg.viewBox.baseVal
  const pad = 48
  const head = 150
  const foot = 70
  const W = vb.width + pad * 2
  const H = vb.height + head + foot
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.querySelectorAll('[data-noexport]').forEach((n) => n.remove())
  clone.querySelector('[data-zoom]')?.removeAttribute('transform')
  const inner = clone.querySelector('[data-zoom]')?.innerHTML ?? clone.innerHTML
  const css = await getFontCss()
  const title = `The Most Famous Person Born in Every District of ${stateName}`
  const titleFs = Math.min(40, (W - pad * 2) / (title.length * 0.56))
  const poster = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<style>${css} text{font-family:Inter,sans-serif}</style>
<rect width="100%" height="100%" fill="#0b0b0b"/>
<text x="${W / 2}" y="${pad + titleFs}" text-anchor="middle" font-size="${titleFs}" font-weight="800" fill="#ffffff">${esc(title)}</text>
<text x="${W / 2}" y="${pad + titleFs + 34}" text-anchor="middle" font-size="16" font-weight="400" fill="#9a9a9a">${esc(subtitle)}</text>
<g transform="translate(${pad},${head})">${inner}</g>
<text x="${pad}" y="${H - 28}" font-size="13" font-weight="600" fill="#6b6b6b">BORN HERE</text>
<text x="${W - pad}" y="${H - 28}" text-anchor="end" font-size="12" font-weight="400" fill="#6b6b6b">Placed by birthplace · ? = no clear pick · boundaries approximate</text>
</svg>`
  const url = URL.createObjectURL(new Blob([poster], { type: 'image/svg+xml;charset=utf-8' }))
  try {
    const img = new Image()
    img.decoding = 'async'
    await new Promise<void>((res, rej) => {
      img.onload = () => res()
      img.onerror = () => rej(new Error('Could not render map image'))
      img.src = url
    })
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = W * scale
    canvas.height = H * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    ctx.drawImage(img, 0, 0, W, H)
    const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('PNG failed'))), 'image/png'))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `born-here-${stateName.toLowerCase().replace(/\s+/g, '-')}.png`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
  } finally {
    URL.revokeObjectURL(url)
  }
}
