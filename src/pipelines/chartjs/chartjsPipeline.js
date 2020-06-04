const puppeteer = require('puppeteer')
const sharp = require('sharp')
const path = require('path')
async function chartjsPipeline(
  mdContent,
  options = {
    width: 900,
    height: 400
  }
) {
  const { width, height } = options
  // Get all the context code block for chartjs in the markdown content
  const context = mdContent.match(/```js\s+chartjs\n*([^`]+)\n*```/g)

  if (context && context.length) {
    // Running a puppeteer and headless chromimun
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    page.setViewport({ width, height, deviceScaleFactor: 1 })
    await page.goto(`file://${path.join(__dirname, 'index.html')}`)

    for (let i = 0; i < context.length; i++) {
      // extract the context in the chartjs code block
      let code = context[i].replace(/```js\schartjs\n*([^`]+)\n*```/, '$1')
      // Evaluate the chartjs initialization code on the page
      await page.evaluate(
        `
          document.body.style.background = "transparent";
          var ctx = C2S(${width}, ${height});
          ${code};
          var el = document.getElementById('container');
          el.innerHTML = ctx.getSerializedSvg(true);
        `
      )
      // Get the svg content of the container
      let svg = await page.$eval('#container', (el) => el.innerHTML)
      // checking the existent of viewbox attribute
      // force to use viewBox instead of attribute of width and height
      // allow to resize based on the windows size.
      if (svg.indexOf('viewBox') === -1) {
        svg = svg.replace(
          /<svg([^>]+)(.+)/,
          `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">$2`
        )
      }

      mdContent = mdContent.replace(
        /```js\schartjs[^`]*```/,
        `<div class="chartjs">${svg}</div>`
      )
    }

    browser.close()
  }

  return mdContent
}

module.exports = chartjsPipeline
