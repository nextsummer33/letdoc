const puppeteer = require('puppeteer')
const path = require('path')

async function mermaidPipeline(
  mdContent,
  options = {
    config,
    css,
    width: 900,
    height: 900,
    deviceScaleFactor: 1,
  }
) {
  const { config, css, width, height, deviceScaleFactor } = options
  // Get all the mermaid code block in the markdown content
  const mermaidCtx = mdContent.match(/```mermaid\n*([^`]+)\n*```/g)

  if (mermaidCtx && mermaidCtx.length > 1) {
    // Running a puppeteer and headless chromiumn
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({ width, height, deviceScaleFactor })
    await page.goto(`file://${path.join(__dirname, 'index.html')}`)
    await page.evaluate(`document.body.style.background = 'transparent'`)

    for (let i = 0; i < mermaidCtx.length; i++) {
      // extract the context in the mermaid code block
      const ctx = mermaidCtx[i].replace(/```mermaid\n*([^`]+)\n*```/, '$1')
      await page.$eval(
        '#container',
        function (container, definition, config, css) {
          const mermaid = window.mermaid
          mermaid.initialize(config)

          if (css) {
            const head =
              window.document.head ||
              window.document.getElementsByTagName('head')[0]
            const style = document.createElement('style')
            style.type = 'text/css'
            if (style.styleSheet) {
              style.styleSheet.cssText = css
            } else {
              style.appendChild(document.createTextNode(css))
            }
            head.appendChild(style)
          }

          container.innerHTML = mermaid.mermaidAPI.render('mermaid', definition)
        },
        ctx,
        config,
        css
      )
      // Get the svg content out
      const svg = await page.$eval('#container', (container) => {
        return container.innerHTML
      })

      mdContent = mdContent.replace(
        /```mermaid[^`]*```/,
        `<div class="mermaid">${svg}</div>`
      )
    }
  }

  return mdContent
}

module.exports = mermaidPipeline
