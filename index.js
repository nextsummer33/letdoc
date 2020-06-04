#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const commander = require('commander')
const { mermaidPipeline, chartjsPipeline, svgoPipeline } = require('./src/pipelines')
const { mdToHtml } = require('./src/convert')
const pkg = require('./package.json')

commander
  .version(pkg.version)
  .option(
    '-t, --template [template]',
    'The template layout of gernerated HTML file, could be asqi-glp, mocert-glp. Optional. Default: asqi-glp',
    /^asqi-glp|mocert-glp|none$/,
    'asqi-glp'
  )
  .option(
    '-t, --template-theme [templateTheme]',
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
    '-e, --embedded [embbed]',
    'Embedded all the assets into HTML output file',
    true
  )
  .parse(process.argv)

let { template, templateTheme, mermaidTheme, configFile, scale } = commander

const argv = process.argv
const argvlen = 3
const myCSS = 'body { font: 14px arial; }'
let input = ''
let output = ''

const error = (msg) => {
  console.log(chalk.red(`\n${msg}\n`))
  process.exit(1)
}

// normalize args

const main = async () => {
  if (argv.length < argvlen) {
    error('Missing argument for input markdown file.')
  } else {
    input = path.resolve(argv[argvlen - 1])
    if (!fs.existsSync(input)) {
      error('Markdown input file is not found.')
    }
    output =
      argv.length > argvlen
        ? path.resolve(argv[argvlen])
        : /(?:.+\/)*\/?(.*)\..*/g.exec(input)[1] + '.html'
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
      config: configFile || {
        theme: mermaidTheme,
        noteFontFamily: 'arial',
        messageFontFamily: 'arial',
        fontFamily: 'arial',
        gantt: {
          fontFamily:'arial',
        }
      }
    })
    mdContent = await chartjsPipeline(mdContent, {
      width: 900,
      height: 400
    })

    mdContent = await svgoPipeline(mdContent)

    // Convert the markdown into html
    const htmlContent = await mdToHtml(mdContent, {
      template,
      theme: templateTheme + '-theme',
    })

    fs.writeFile(
      output,
      htmlContent,
      { encoding: 'utf8', flag: 'w' },
      (err) => {
        if (err) {
          error(error)
        } else {
          console.log(
            `\nConverted HTML file is generated at '${chalk.green(output)}'\n`
          )
          process.exit(0)
        }
      }
    )
  } catch (err) {
    error(err)
  }
}

main()
