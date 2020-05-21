const fs = require('fs')
const showdown = require('showdown')
const htmlMinifier = require('html-minifier').minify
const pretty = require('pretty')
const { capitializeWords } = require('./helper')
const default_template = 'asqi-glp.html'
const default_theme = 'github-theme.css'

async function mdToHtml(
  mdContent,
  template = default_template,
  theme = default_theme,
  metadata = {
    title: 'Project title',
    author: 'Your name',
    version: 'v1.0',
  }
) {
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
  // pretty the html since markdown is not with same indent depth as that of template
  // templateData = pretty(templateData)

  const htmlContent = htmlMinifier(templateData, {
    html5: true,
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    collapseBooleanAttributes: true,
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
