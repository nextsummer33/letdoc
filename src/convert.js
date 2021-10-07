const fs = require('fs')
const path = require('path')
const showdown = require('showdown')
const htmlMinifier = require('html-minifier').minify
const { capitializeWords } = require('./helper')

require('./extensions/showdown-prism')
require('./extensions/showdown-embed-img')

function getMetadata(mdContent) {
  let metadata = {
    title: 'Project title',
    author: 'Your name',
    version: 'v1.0',
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
      const norm = matches[i].trim()
      const metaname = ['title', 'author', 'version', 'client', 'company', 'reference'].find(
        (t) => {
          return norm.indexOf(t) > -1 ? t : ''
        }
      )
      metaname && (metadata[metaname] = norm.replace(regx, '$1').trim())
    }
  }

  return metadata
}

function mdToHtml(
  mdContent,
  options = {
    template: 'default',
    theme: 'github',
    highlightTheme: '',
    logo: '',
    inputDir: __dirname,
  }
) {
  const { template, theme, logo, inputDir } = options
  const themePath = path.join(__dirname, '..', 'themes', theme + '.css')
  let themeData = ''
  const templatePath = path.join(
    __dirname,
    '..',
    'templates',
    template + '.html'
  )
  let templateData = ''
  const prismThemePath = path.join(
    __dirname,
    '..',
    'node_modules',
    'prismjs',
    'themes',
    'prism' +
      (options.highlightTheme ? '-' + options.highlightTheme : '') +
      '.css'
  )
  let prismThemeData = ''
  // initialize a mardown converter
  const converter = new showdown.Converter({
    ghCompatibleHeaderId: true,
    simpleLineBreaks: true,
    ghMentions: true,
    tables: true,
    extensions: ['showdown-prism', 'showdown-embed-img'],
    embedImg: {
      srcDir: inputDir
    },
    prism: {
      languages: ['shell', 'python', 'powershell', 'sql']
    }
  })
  converter.setFlavor('github')

  try {
    // Checking the content is exist on the theme file and load content into variable
    themeData = fs.readFileSync(themePath).toString()

    if (!themeData) {
      throw `No content found on the theme file at path "${themePath}"`
    }

    templateData = fs.readFileSync(templatePath).toString()

    if (!templateData) {
      throw `No content found on the template file at path "${templatePath}"`
    }

    prismThemeData = fs.readFileSync(prismThemePath).toString()

    if (!prismThemeData) {
      throw `No content found on the template file at path "${prismThemePath}"`
    }

    if (logo) {
      const ext = path.extname(logo).substring(1)
      const logoStr = fs.readFileSync(logo).toString('base64')
      templateData = templateData.replace(
        /<img(.+)src="([^\s\n]*)"(.+)\/>/g,
        `<img$1src="data:image/${ext};base64,${logoStr}"$3/>`
      )
    }
  } catch (error) {
    throw error
  }

  const metadata = getMetadata(mdContent)
  // substitute the template variable with actual content
  templateData = templateData.replace(
    /{{doc_title}}/g,
    metadata.title
  )
  templateData = templateData.replace(
    /{{doc_version}}/g,
    metadata.version || 'v1.0'
  )
  templateData = templateData.replace(
    /{{doc_author}}/g,
    metadata.author || 'Your Name'
  )
  if (metadata.reference) {
    templateData = templateData.replace(
      /{{doc_ref}}/g,
      metadata.reference.toUpperCase()
    )
  } else {
    templateData = templateData.replace(
      'Reference:&nbsp;<strong>{{doc_ref}}</strong> <br />',
      ''
    )
  }

  templateData = templateData.replace(
    /{{doc_company}}/g,
    metadata.company || 'Example Company'
  )
  templateData = templateData.replace(
    /{{doc_client}}/g,
    metadata.client || 'My Client'
  )
  templateData = templateData.replace(
    /{{doc_date}}/g,
    new Date().toLocaleDateString()
  )
  templateData = templateData.replace(
    /{{doc_style}}/g,
    themeData + prismThemeData
  )
  templateData = templateData.replace(
    /{{doc_content}}/g,
    converter.makeHtml(mdContent)
  )

  // Minify the html content

  const htmlContent = htmlMinifier(templateData, {
    html5: true,
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    removeComments: true,
    minifyCSS: true,
    minifyJS: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortAttributes: true,
    sortClassName: true,
  })

  return htmlContent
}

module.exports = {
  mdToHtml,
}
