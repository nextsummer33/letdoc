#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const puppeteer = require('puppeteer')
const { mdToHtml } = require('./src/convert')
const commander = require('commander')

const argv = process.argv
let infile = ''
let outfile = ''
const argvlen = 3
let mermaidConfig = {
  theme: 'default',
}
const myCSS = ''

const error = (msg) => {
  console.log(chalk.red(`\n${msg}\n`))
  process.exit(1)
}

// normalize args
const width = 1280
const height = 800
const scale = 1
const backgroundColor = 'white'
const deviceScaleFactor = parseInt(scale || 1, 10)

const main = async () => {

  if (argv.length < argvlen) {
    error('Missing argument for input markdown file.')
  } else {
    infile = path.resolve(argv[argvlen - 1])
    outfile =
      argv.length > argvlen
        ? path.resolve(argv[argvlen])
        : /(?:.+\/)*\/?(.*)\..*/g.exec(infile)[1] + '.html'

    if (!fs.existsSync(infile)) {
      error('Markdown file is not found.')
    }
  }

  try {
    metadata = {
      title: 'My project',
      author: 'Your name',
      version: 'v1.0',
    }
    let mdContent = fs.readFileSync(infile).toString()

    // Replace the mardown mermaid code block with svg images
    const mermaidCtx = mdContent.match(/```mermaid\n*([^`]+)\n*```/g)

    if (mermaidCtx && mermaidCtx.length > 1) {
      const browser = await puppeteer.launch()
      const page = await browser.newPage()
      page.setViewport({ width, height, deviceScaleFactor })
      await page.goto(`file://${path.join(__dirname, 'index.html')}`)
      await page.evaluate(
        `document.body.style.background = '${backgroundColor}'`
      )

      for (let i = 0; i < mermaidCtx.length; i++) {
        const ctx = mermaidCtx[i].replace(/^```mermaid\n*([^`]+)\n*```/, '$1')
        await page.$eval(
          '#container',
          function (container, definition, mermaidConfig) {
            const mermaid = window.mermaid
            mermaid.initialize(mermaidConfig)
            container.innerHTML = mermaid.mermaidAPI.render(
              'diagram',
              definition
            )
          },
          ctx,
          mermaidConfig
        )
        // fixing the svg height problem when generate sequence diagram,
        // force the height of the diagram to the bounds of svg
        const svg = await page.$eval('#container', (container) => {
          const child = container.firstChild
          const height = child.getBoundingClientRect().height
          child.style.height = height + 60 + 'px'
          child.style.width = '100%'
          child.style.maxWidth = ''
          return container.innerHTML
        })

        mdContent = mdContent.replace(/```mermaid[^`]*```/, `<div>${svg}</div>`)
      }

      browser.close()
    }

    // Find all metadata comment in the header
    const matches = mdContent.match(/\[comment\]:\s*#\s*\((.*:.*)\)/g) || []
    // extract the document information from the markdown
    // [comment]: # (title : <Your Project Name>)
    // [comment]: # (author : <Your Name>)
    // [comment]: # (version : <Document Version>)
    if (matches.length) {
      const regx = /\[comment\]:\s*#\s*\(.*:(.*)\)/
      for (let i = 0; i < matches.length; i++) {
        const norm = matches[i].trim().toLowerCase()
        const metaname = ['title', 'author', 'version'].find((t) => {
          return norm.indexOf(t) > -1 ? t : ''
        })
        metaname && (metadata[metaname] = norm.replace(regx, '$1').trim())
      }
    }

    const htmlContent = await mdToHtml(
      mdContent,
      undefined,
      undefined,
      metadata
    )
    fs.writeFile(
      outfile,
      htmlContent,
      { encoding: 'utf8', flag: 'w' },
      (err) => {
        if (err) {
          error(error)
        } else {
          console.log(
            `\nConverted HTML file is generated at '${chalk.green(outfile)}'\n`
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
