const puppeteer = require('puppeteer')
const sharp = require('sharp')
const path = require('path')
async function chartjsPipeline(
  mdContent,
  options = {
    width: 900,
    height: 400,
    deviceScaleFactor: 2,
  }
) {
  const { width, height, deviceScaleFactor } = options
  // Get all the context code block for chartjs in the markdown content
  const context = mdContent.match(/```js\schartjs\n*([^`]+)\n*```/g)

  if (context && context.length) {
    // Running a puppeteer and headless chromimun
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({ width, height, deviceScaleFactor })
    await page.goto(`file://${path.join(__dirname, 'index.html')}`)
    await page.$eval(
      'canvas',
      (canvas, width, height) => {
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      },
      width,
      height
    )

    for (let i = 0; i < context.length; i++) {
      // extract the context in the chartjs code block
      let code = context[i].replace(/```js\schartjs\n*([^`]+)\n*```/, '$1')
      // Evaluate the chartjs initialization code on the page
      page.evaluate(
        `
          document.body.style.background = "transparent";
          var ctx = document.querySelector("canvas").getContext("2d");
          ${code}
        `
      )
      let imgData = await page.$eval('canvas', (canvas) => canvas.toDataURL())

      if (imgData) {
        const base64Img = imgData.replace(/data:image\/\w+;base64,/, '')
        const inbuffer = Buffer.from(base64Img, 'base64')
        const outbuffer = await sharp(inbuffer)
          .webp()
          .toBuffer()

        imgData = 'data:image/webp;base64,' + outbuffer.toString('base64')
      }

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
