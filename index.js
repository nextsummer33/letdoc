const fs = require('fs')
const path = require('path')
const { mdToHtml } = require('./src/convert')

let infile = ''
let outfile = ''
const argv = process.argv

if (argv.length < 3) {
  console.log('Missing argument for input markdown file.')
  return
} else if (argv.length < 4) {
  console.log('Missing argument for output file.')
  return
} else {
  infile = path.resolve(argv[2])
  outfile = path.resolve(argv[3])

  if (!infile) {
    console.log('Markdown file is not found')
    return
  }
}

const capitialize = (txt) => {
  return txt
    .split(' ')
    .map((s) => s[0].toUpperCase() + s.substring(1, s.length))
    .join(' ')
}


try {
  metadata = {
    title: 'My project',
    author: 'Your name',
    version: 'v1.0',
  }
  const mdContent = fs.readFileSync(infile).toString()
  const matches = mdContent.match(/\[comment\]:\s*#\s*\((.*:.*)\)/g)
  // extract the document information from the markdown
  // [comment]: # (title : <Your Project Name>)
  // [comment]: # (author : <Your Name>)
  // [comment]: # (version : <Document Version>)
  if (matches.length > 0) {
    const regx = /\[comment\]:\s*#\s*\(.*:(.*)\)/
    for (let i = 0; i < matches.length; i++) {
      const pattern = matches[i]
      const norm = pattern.trim().toLowerCase()
      if (norm.indexOf('title') > -1) {
        // Capitialize each word for the title
        metadata.title = capitialize(norm.replace(regx, '$1').trim())
      } else if (norm.indexOf('author') > -1) {
        metadata.author = capitialize(norm.replace(regx, '$1').trim())
      } else if (norm.indexOf('version') > -1) {
        metadata.version = norm.replace(regx, '$1').trim()
      }
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
