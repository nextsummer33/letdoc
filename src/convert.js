const fs = require('fs')
const showdown = require('showdown')
const htmlMinifier = require('html-minifier').minify
const { capitializeWords } = require('./helper')

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
      const norm = matches[i].trim().toLowerCase()
      const metaname = ['title', 'author', 'version'].find((t) => {
        return norm.indexOf(t) > -1 ? t : ''
      })
      metaname && (metadata[metaname] = norm.replace(regx, '$1').trim())
    }
  }

  return metadata;
}

async function mdToHtml(
  mdContent,
  options = {
    template: 'asqi-glp.html',
    theme: 'github-theme.css'
  }
) {
  const { template, theme } = options;
  const themePath = `${__dirname}/themes/${theme}`
  let themeData = ''
  const templatePath = `${__dirname}/templates/${template}`
  let templateData = ''
  // initialize a mardown converter
  const converter = new showdown.Converter({
    ghCompatibleHeaderId: true,
    simpleLineBreaks: true,
    ghMentions: true,
    tables: true,
  })
  converter.setFlavor('github')

  try {
    // Checking the content is exist on the theme file and load content into variable
    themeData = fs.readFileSync(themePath).toString()
    if (!themeData) {
      throw `No content found on the theme file at path "${themePath}"`
    }
    // Checking the content is exist on the template file and load content into variable
    templateData = fs.readFileSync(templatePath).toString()
    if (!templateData) {
      throw `No content found on the template file at path "${templatePath}"`
    }
  } catch (error) {
    console.log(error)
    return ''
  }

  const metadata = getMetadata(mdContent);
  // substitute the template variable with actual content
  templateData = templateData.replace(/{{doc_title}}/g, capitializeWords(metadata.title))
  templateData = templateData.replace(/{{doc_version}}/g, metadata.version)
  templateData = templateData.replace(/{{doc_author}}/g, capitializeWords(metadata.author))
  templateData = templateData.replace(
    /{{doc_date}}/g,
    new Date().toLocaleDateString()
  )
  templateData = templateData.replace(/{{doc_style}}/g, themeData)
  templateData = templateData.replace(
    /{{doc_content}}/g,
    converter.makeHtml(mdContent)
  )

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
    sortClassName: true
  })
  return htmlContent
}

module.exports = {
  mdToHtml,
}
