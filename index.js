#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const commander = require('commander')
const puppeteer = require('puppeteer')
const sharp = require('sharp')
const docxjs = require('html-docx-js')

const {
  mermaidPipeline,
  chartjsPipeline,
  svgoPipeline,
} = require('./src/pipelines')
const { mdToHtml } = require('./src/convert')
const pkg = require('./package.json')

commander
  .version(pkg.version)
  .option(
    '-t, --template [template]',
    'The template layout of gernerated HTML file, the file name of html template in templates folder. Optional. Default: default',
    /[\w-_]+/,
    'default'
  )
  .option(
    '-th, --template-theme [templateTheme]',
    'Theme of the flavor style, could be github, dark or neutral. Optional. Default: github',
    /^github|dark|neutral$/,
    'github'
  )
  .option(
    '-mt, --mermaid-theme [mermiadTheme]',
    'Theme of the chart, could be default, forest, dark or neutral. Optional. Default: default',
    /^default|forest|dark|neutral$/,
    'default'
  )
  .option(
    '-c, --configFile [configFile]',
    'JSON configuration file for mermaid. Optional'
  )
  .option('-C, --cssFile [cssFile]', 'CSS file for the page. Optional')
  .option(
    '-s, --scale [scale]',
    'Puppeteer scale factor, default 1. Optional',
    '1'
  )
  .option(
    '-e, --embedded [embed]',
    'Embedded all the assets into HTML output file',
    true
  )
  .option(
    '-f, --format [format]',
    'Format of output file, HTML, PNG and PDF are supported. Default: html',
    /^html|png|pdf|docx$/,
    'html'
  )
  .option(
    '-l, --logo [logo]',
    'Name or path of logo file, change the logo in the default template. Optional. E.g. logo.png',
    '',
  )
  .parse(process.argv)

const myCSS = 'body { font: 14px arial; }'
let input = ''
let output = ''

const error = (msg) => {
  console.log(chalk.red(`\n${msg}\n`))
  process.exit(1)
}

// normalize args

const main = async () => {
  const {
    template,
    templateTheme,
    mermaidTheme,
    configFile,
    scale,
    format,
    logo,
  } = commander
  const argv = commander.args

  if (argv.length < 1) {
    error('Missing argument for input markdown file.')
  } else {
    input = path.resolve(argv[0])
    if (!fs.existsSync(input)) {
      error('Markdown input file is not found.')
    }

    output =
      argv.length >= 2
        ? path.resolve(argv[1])
        : /(?:.+\/)*\/?(.*)\..*/g.exec(input)[1] + '.' + format
  }

  try {
    let mdContent = fs.readFileSync(input).toString()

    // Update the markdown content before convert into html
    // convert mermaid code into svg html element
    mdContent = await mermaidPipeline(mdContent, {
      width: 900,
      height: 900,
      deviceScaleFactor: parseInt(scale || 1, 10),
      css: myCSS,
      imageFormat: format === 'docx',
      config: configFile || {
        theme: mermaidTheme,
        noteFontFamily: 'arial',
        messageFontFamily: 'arial',
        fontFamily: 'arial',
        gantt: {
          fontFamily: 'arial',
        },
      },
    })
    mdContent = await chartjsPipeline(mdContent, {
      width: 900,
      height: 400,
    })

    mdContent = await svgoPipeline(mdContent)

    // Convert the markdown into html
    let outData = await mdToHtml(mdContent, {
      template,
      theme: templateTheme,
      logo
    })

    if (['png', 'pdf', 'docx'].indexOf(format) > -1) {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      page.setViewport({
        width: 1000,
        height: 1000,
        deviceScaleFactor: parseInt(scale, 10) || 1,
      })
      await page.setContent(outData, {
        waitUntil: 'domcontentloaded',
      })
      if (format === 'png') {
        outData = await page.screenshot({ fullPage: true, type: 'png' })
        // make a smaller png size using sharp
        outData = await sharp(outData)
          .png()
          .toBuffer()
      } else if (format === 'docx') {
        outData = docxjs.asBlob(outData)
      } else {
        outData = await page.pdf({
          format: 'A4',
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: '<div></div>',
          footerTemplate:
            '<div style="font-size: 8px; text-align: center; width: 100%;"><span>Page</span> - <span class="pageNumber"></span></div>',
          margin: { top: '50', left: '30', bottom: '70', right: '30' },
        })
      }
      // close it, no need to wait for it
      browser.close()
    }

    fs.writeFile(output, outData, { encoding: 'utf8', flag: 'w' }, (err) => {
      if (err) {
        error(error)
      } else {
        console.log(
          `\nConverted file is generated at '${chalk.green(output)}'\n`
        )
        process.exit(0)
      }
    })
  } catch (err) {
    error(err)
  }
}

main()
