#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const puppeteer = require('puppeteer');
const { mdToHtml } = require('./src/convert')
const commander = require('commander');

const argv = process.argv
let infile = ''
let outfile = ''
const argvlen = 3
let mermaidConfig = {
  theme: 'default'
};
const myCSS = ''

const error = (msg) => {
  console.log(chalk.red(`\n${msg}\n`))
  process.exit(1)
}

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

// normalize args
const width = 1280
const height = 800
const scale = 1
const backgroundColor = 'white'
const deviceScaleFactor = parseInt(scale || 1, 10)

function _asyncToGenerator(fn) {
  return function () {
    var gen = fn.apply(this, arguments)
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg)
          var value = info.value
        } catch (error) {
          reject(error)
          return
        }
        if (info.done) {
          resolve(value)
        } else {
          return Promise.resolve(value).then(
            function (value) {
              step('next', value)
            },
            function (err) {
              step('throw', err)
            }
          )
        }
      }
      return step('next')
    })
  }
}

_asyncToGenerator(function* () {
  try {
    metadata = {
      title: 'My project',
      author: 'Your name',
      version: 'v1.0',
    }
    let mdContent = fs.readFileSync(infile).toString()
    // Find all metadata comment in the header
    const matches = mdContent.match(/\[comment\]:\s*#\s*\((.*:.*)\)/g) || []

    // Replace the mardown mermaid code block with svg images
    const mermaidCtx = mdContent.match(/```mermaid\n*([^`]+)\n*```/g)
    if (mermaidCtx && mermaidCtx.length > 1) {
      const browser = yield puppeteer.launch()
      const page = yield browser.newPage()
      page.setViewport({ width, height, deviceScaleFactor })
      yield page.goto(`file://${path.join(__dirname, 'index.html')}`)
      yield page.evaluate(`document.body.style.background = '${backgroundColor}'`)

      for (let i = 0; i < mermaidCtx.length; i++) {
        const ctx = mermaidCtx[i].replace(/^```mermaid\n*([^`]+)\n*```/, '$1')
        yield page.$eval(
          '#container',
          function (container, definition, mermaidConfig, myCSS) {
            window.mermaid.initialize(mermaidConfig)
            container.innerHTML = window.mermaid.mermaidAPI.render('graphDiv', definition)
          },
          ctx,
          mermaidConfig,
          myCSS
        )

        const svg = yield page.$eval('#container', function (container) {
          const react = container.firstChild.getBoundingClientRect();
          const clip = { x: Math.floor(react.left), y: Math.floor(react.top), width: Math.ceil(react.width), height: Math.ceil(react.height) };
          container.firstChild.style.height = ( clip.height + 60 ) + 'px';
          container.firstChild.style.width = '100%';
          container.firstChild.style.maxWidth = '';
          return container.innerHTML;
        })

        mdContent = mdContent.replace(/```mermaid[^`]*```/, svg)
      }

      browser.close()
    }

    // extract the document information from the markdown
    // [comment]: # (title : <Your Project Name>)
    // [comment]: # (author : <Your Name>)
    // [comment]: # (version : <Document Version>)
    if (matches.length > 0) {
      const regx = /\[comment\]:\s*#\s*\(.*:(.*)\)/
      for (let i = 0; i < matches.length; i++) {
        const pattern = matches[i]
        const norm = pattern.trim().toLowerCase()
        const metaname =
          norm.indexOf('title') > -1
            ? 'title'
            : norm.indexOf('author') > -1
            ? 'author'
            : norm.indexOf('version')
            ? 'version'
            : ''
        metaname && (metadata[metaname] = norm.replace(regx, '$1').trim())
      }
    }

    mdToHtml(mdContent, undefined, undefined, metadata).then((htmlContent) => {
      fs.writeFile(
        outfile,
        htmlContent,
        { encoding: 'utf8', flag: 'w' },
        (err) => {
          if (err) {
            error(error)
          } else {
            console.log(
              `\nConverted HTML file is generated at '${chalk.green(
                outfile
              )}'\n`
            )
          }
        }
      )
    })
  } catch (err) {
    error(err)
  }
})()
