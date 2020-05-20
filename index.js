#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const { mdToHtml } = require('./src/convert')
const argv = process.argv
let infile = ''
let outfile = ''

const argvlen = 3
if (argv.length < argvlen) {
  console.log('Missing argument for input markdown file.')
  return
} else {
  infile = path.resolve(argv[argvlen - 1])
  outfile =
    argv.length > argvlen
      ? path.resolve(argv[argvlen])
      : /(?:.+\/)*\/?(.*)\..*/g.exec(infile)[1] + '.html'

  if (!infile) {
    console.log('Markdown file is not found')
    return
  }
}

try {
  metadata = {
    title: 'My project',
    author: 'Your name',
    version: 'v1.0',
  }
  const mdContent = fs.readFileSync(infile).toString()
  const matches = mdContent.match(/\[comment\]:\s*#\s*\((.*:.*)\)/g) || []
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
          console.log(err)
        } else {
          console.log('Converted HTML file is generated at ' + outfile)
        }
      }
    )
  })
} catch (err) {
  console.log(err)
  return
}
