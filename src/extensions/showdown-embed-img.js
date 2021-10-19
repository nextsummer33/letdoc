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
  const fs = require('fs')
  const path = require('path')
  const imgRegex = /<img.+src="([~\.]{1,}?[^\s\n]+\.\w+)".*\/?>/g

  // The following method will register the extension with showdown
  showdown.extension('showdown-embed-img', function () {
    'use strict'

    return {
      type: 'output', //or output
      filter: function (text, converter, options) {
        let inputDir = options.embedImg.srcDir

        if (inputDir) {
          const rawData = text
          let m = null
          while ((m = imgRegex.exec(rawData))) {
            if (m.index === imgRegex.lastIndex) {
              return
            }

            let dir = inputDir
            let temp = m[1]
            const rgx = RegExp('(.+)\\' + path.sep + '.+')
            if (temp.length > 1) {
              if (temp[0] === '.' && temp[1] === '.') {
                temp = temp.substring(2)
              } else if (temp[0] === '.') {
                temp = temp.substring(1)
              } else if (temp[0] !== '\\') {
                temp = '\\' + temp
              }
            }
            
            let imgData = fs.readFileSync(path.resolve(inputDir + temp)).toString('base64')
            imgData = 'data:image/' + path.extname(temp).substring(1) + ';base64,' + imgData
            text = text.replace(m[1], imgData)
          }
        }
        return text
      },
    }
  })
})
