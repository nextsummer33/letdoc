const puppeteer = require('puppeteer')
const path = require('path')
const htmlMinifier = require('html-minifier').minify

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

  if (mermaidCtx && mermaidCtx.length) {
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
        function (container, definition, config, css, index) {
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

          container.innerHTML = mermaid.mermaidAPI.render(`mermaid-${index}`, definition)
        },
        ctx,
        config,
        css,
        i + 1
      )
      // Get the svg content out
      let svg = await page.$eval('#container', (container) => {
        return container.innerHTML
      })


      svg = htmlMinifier(svg, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        removeComments: true,
        minifyCSS: true,
        minifyJS: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortAttributes: true,
        sortClassName: true
      })

      svg = svg.replace(/(<svg[^>]+)width="[\d%px]+"(.+)/g, `$1width="${width}"$2`)
      // Used to fixed the issue of svgo found the following pattern is invalid
      svg = svg.replace(/font-family:(&quot|&apos)/g, '')

      // checking the existent of viewbox attribute
      if (svg.indexOf("viewBox") === -1) {
        const matches = /<svg.+height="(\d+)".+/.exec(svg) || []
        let height = matches.length > 1 ? matches[1] : 0;
        svg = svg.replace(/<svg(.+)/, `<svg viewBox="0 0 900 ${height}" $1`)
      }

      mdContent = mdContent.replace(
        /```mermaid[^`]*```/,
        `<div class="mermaid-container">${svg}</div>`
      )
    }
  }

  return mdContent
}

module.exports = mermaidPipeline
