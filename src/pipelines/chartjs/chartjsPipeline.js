const puppeteer = require('puppeteer')
const path = require('path')

async function chartjsPipeline(
  mdContent,
  options = {
    config,
    width: 900,
    height: 400,
    deviceScaleFactor: 1
  }
) {
  const { config, width, height, deviceScaleFactor } = options
  // Get all the context code block for chartjs in the markdown content
  const context = mdContent.match(/```js\schartjs\n*([^`]+)\n*```/g)

  if (context && context.length) {
    // Running a puppeteer and headless chromimun
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({ width, height, deviceScaleFactor })
    await page.goto(`file://${path.join(__dirname, 'index.html')}`)
    await page.evaluate(`document.body.style.background = 'transparent'`)
    await page.$eval('canvas', (canvas, width, height) => {
      canvas.width = width;
      canvas.height = height;
    }, width, height)

    for (let i = 0; i < context.length; i++) {
      // extract the context in the chartjs code block
      const code = context[i].replace(/```js\schartjs\n*([^`]+)\n*```/, '$1')
      // evaluate the code in the page
      page.evaluate(code)
      const imgData = await page.$eval('canvas', (canvas, shrink) => {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            let data = canvas.toDataURL()
            if (data) {
              resolve(data)
            } else {
              reject('Empty canvas context after running the chartjs')
            }
          }, 500);
        })
      })

      mdContent = mdContent.replace(
        /```js\schartjs[^`]*```/,
        `<div class="chartjs"><img src="${imgData}" /></div>`
      )
    }

    browser.close()
  }

  return mdContent
}

module.exports = chartjsPipeline
