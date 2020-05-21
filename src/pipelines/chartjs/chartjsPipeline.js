const puppeteer = require('puppeteer')
const path = require('path')

async function chartjsPipeline(
  mdContent,
  options = {
    config,
    width: 900,
    height: 400,
    deviceScaleFactor: 1,
  }
) {
  const { config, width, height, deviceScaleFactor } = options
  // Get all the context code block for chartjs in the markdown content
  const context = mdContent.match(/```chartjs\n*([^`]+)\n*```/g)

  if (context && context.length) {
    // Running a puppeteer and headless chromiumn
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({ width, height, deviceScaleFactor })
    await page.goto(`file://${path.join(__dirname, 'index.html')}`)
    await page.evaluate(`document.body.style.background = 'transparent'`)

    for (let i = 0; i < context.length; i++) {
      // extract the context in the mermaid code block
      const code = context[i].replace(/```chartjs\n*([^`]+)\n*```/, '$1')
      const chartjsData = JSON.parse(code.replace(/'/g, '"'))

      const imgData = await page.$eval('canvas', (canvas, data) => {
        var ctx = canvas.getContext('2d')
        var chart = new Chart(ctx, data)
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            resolve(chart.toBase64Image())
          }, 1000);
        })
      }, chartjsData)

      mdContent = mdContent.replace(
        /```chartjs[^`]*```/,
        `<div class="chartjs"><img src="${imgData}" /></div>`
      )
    }

    browser.close()
  }

  return mdContent
}

module.exports = chartjsPipeline
