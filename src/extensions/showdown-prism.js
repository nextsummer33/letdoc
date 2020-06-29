/**
 * Showdown's Extension boilerplate
 *
 * A boilerplate from where you can easily build extensions
 * for showdown
 */
;(function (extension) {
  'use strict'

  // UML - Universal Module Loader
  // This enables the extension to be loaded in different environments
  if (typeof showdown !== 'undefined') {
    // global (browser or nodejs global)
    extension(showdown)
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['showdown'], extension)
  } else if (typeof exports === 'object') {
    // Node, CommonJS-like
    module.exports = extension(require('showdown'))
  } else {
    // showdown was not found so we throw
    throw Error('Could not find showdown library')
  }
})(function (showdown) {
  'use strict'

  //This is the extension code per se

  // Here you have a safe sandboxed environment where you can use "static code"
  // that is, code and data that is used accros instances of the extension itself
  // If you have regexes or some piece of calculation that is immutable
  // this is the best place to put them.
  const Prism = require('prismjs')
  const loadLanguages = require('prismjs/components/')
  const codeRegex = /<code\sclass="(.+)">([\w\W]+)<\/code>/g
  const unescapeStr = str => {
    str = str.replace(/&lt;/g, '<')
    str = str.replace(/&gt;/g, '>')
    str = str.replace(/&amp;/g, '&')
    return str
  }
  // The following method will register the extension with showdown
  showdown.extension('showdown-prism', function () {
    'use strict'

    return {
      type: 'output', //or output
      filter: function (text, converter, options) {
        if (options.prism) {
          loadLanguages(options.prism.languages || ['shell', 'python'])
        }
        let rawData = text
        let curIndex = 0
        let startIndex = -1
        let endIndex = -1
        let m
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
              let lang =
                m[1].indexOf('language-') > -1 ? m[1].split('-')[1] : ''
              if (lang && lang !== 'text') {
                const grammer = Prism.languages[lang]
                // const prismLang = Prism.languages.
                const highlightCodeBlock = Prism.highlight(unescapeStr(m[2]), grammer, lang)
                text = text.replace(m[2], highlightCodeBlock)
              }
            }
          } else {
            curIndex = -1
          }
        } while (curIndex != -1)

        return text
      },
    }
  })
})
