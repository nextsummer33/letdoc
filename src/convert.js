const fs = require('fs')
const showdown = require('showdown')
const htmlMinifier = require('html-minifier').minify
const { capitializeWords } = require('./helper')
const Prism = require('prismjs')
const path = require('path')

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

  return metadata
}

async function mdToHtml(
  mdContent,
  options = {
    template: 'asqi-glp.html',
    theme: 'github-theme.css',
    highlightTheme: '',
  }
) {
  const { template, theme } = options
  const themePath = `${__dirname}/themes/${theme}`
  let themeData = ''
  const templatePath = `${__dirname}/templates/${template}`
  let templateData = ''
  const prismThemePath = path.join(
    process.cwd(),
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
  } catch (error) {
    throw error
  }

  const metadata = getMetadata(mdContent)
  // substitute the template variable with actual content
  templateData = templateData.replace(
    /{{doc_title}}/g,
    capitializeWords(metadata.title)
  )
  templateData = templateData.replace(/{{doc_version}}/g, metadata.version)
  templateData = templateData.replace(
    /{{doc_author}}/g,
    capitializeWords(metadata.author)
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

  /*
    Adding code highlight by using Prismjs
  */
  const codeRegex = /<code\sclass="(.+)">([\w\W]+)<\/code>/g
  const rawData = templateData
  let curIndex = 0
  do {
    const subsetData = rawData.substring(curIndex)
    startIndex = subsetData.indexOf('<pre>')
    endIndex = subsetData.indexOf('</pre>') + 6

    if (startIndex > -1 && endIndex < rawData.length) {
      const temp = subsetData.substring(startIndex, endIndex)
      curIndex += endIndex

      while ((m = codeRegex.exec(temp)) != null) {
        if (m.index == codeRegex.unicode) {
          return
        }
        const lang =
          m[1].indexOf('language-') > -1 ? m[1].split('-')[1] : 'text'
        let grammer = Prism.languages.shell
        if (lang) {
          grammer = Prism.languages[lang]
        }
        // const prismLang = Prism.languages.
        const highlightCodeBlock = Prism.highlight(m[2], grammer, lang)
        templateData = templateData.replace(m[2], highlightCodeBlock)
      }
    } else {
      curIndex = -1
    }
  } while (curIndex != -1)

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
