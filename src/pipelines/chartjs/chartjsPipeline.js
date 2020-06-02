const puppeteer = require('puppeteer')
const path = require('path')
const sharp = require('sharp');
const fs = require('fs')


function setup() {
  const tmpPath = path.join(process.cwd(), 'build', 'tmp')
  if (fs.existsSync(tmpPath)) {
    fs.rmdirSync(tmpPath)
  }

  fs.mkdirSync(tmpPath);
}

function teardown() {
  const tmpPath = path.join(process.cwd(), 'build', 'tmp')
  if (fs.existsSync(tmpPath)) {
    fs.rmdirSync(tmpPath)
  }
}

function getOptionsBlock(code) {
  let regex = /options:[\s\n]*{/
  let m = regex.exec(code)
  let str = ""
  let startIndex = m && m.index || -1
  let i = startIndex

  if (i > -1) {
    depth = 1
    while (!!depth && ++i < code.length) {
      if (code[i] === '{') {
        depth++
      } else if (code[i] === '}') {
        depth--
      }
    }

    str = code.substring(startIndex, i)
  }

  temp = jsSrcToJson(str)
  temp = `{${temp}}`.replace(/,[\s\n]*(\]|})/g, '$1')

  return {
    found: temp != '{}',
    startIndex,
    endIndex: i,
    obj: temp != '{}' ? JSON.parse(temp) : {}
  }
}

function jsonToJsSrc(str) {
  const regex = /"(\w+)"\s*:.+/g
  let temp = str
  while ((m = regex.exec(str)) != null) {
    if (m.index == regex.lastIndex) {
      return
    }

    temp = temp.replace(`"${m[1]}"`, m[1])
  }
  return temp
}

function jsSrcToJson(str) {
  const regex = /(\w+)\s*:[^\n]+/g
  str = str.replace(/{/g, '{\n')
  let temp = str

  while ((m = regex.exec(str)) != null) {
    if (m.index == regex.lastIndex) {
      return
    }
    temp = temp.replace(m[1], `"${m[1]}"`)
  }
  return temp
}

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
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
    }, width, height)

    for (let i = 0; i < context.length; i++) {
      // extract the context in the chartjs code block
      let code = context[i].replace(/```js\schartjs\n*([^`]+)\n*```/, '$1')
      const block = getOptionsBlock(code)
      if (block.found) {
        block.obj.options = Object.assign(block.obj.options, {
          animation: { duration: 0 },
          hover: { animationDuration: 0 },
          responsiveAnimationDuration: 0
        })
        const mergedObjStr = jsonToJsSrc(JSON.stringify(block.obj.options, undefined, 2))
        code = code.substring(0, block.startIndex) + "options :" + mergedObjStr + code.substring(block.endIndex - 1, code.length)
      } else {
        code = code.replace(/(,?\n*}[\n|\s]*\))/, `
          ,options: {
            animation: { duration: 0 },
            hover: { animationDuration: 0 },
            responsiveAnimationDuration: 0
          }$1
        `)
      }
      // Evaluate the chartjs initialization code on the page
      page.evaluate('var ctx = document.querySelector("canvas").getContext("2d");\n' + code)
      // wait for the chart appears
      await page.waitFor(100)
      let imgData = await page.$eval('canvas', (canvas) => canvas.toDataURL());

      if (imgData) {
        const base64Img = imgData.replace(/data:image\/\w+;base64,/, '')
        const inbuffer = Buffer.from(base64Img, 'base64')
        const outbuffer = await sharp(inbuffer)
          // .resize(320, 240)
          .png({
            compressionLevel: 9
          })
          .toBuffer();

        imgData = 'data:image/png;base64,' + outbuffer.toString('base64')
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
