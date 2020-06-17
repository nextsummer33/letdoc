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
  const imgRegex = /<img.+src="[~\.]?([^\s\n\.]+\.\w+)".*\/?>/g

  // The following method will register the extension with showdown
  showdown.extension('showdown-embed-img', function () {
    'use strict'

    return {
      type: 'output', //or output
      filter: function (text, converter, options) {
        const inputDir = options.embedImg.srcDir

        if (inputDir) {
          const rawData = text
          let m = null
          while ((m = imgRegex.exec(rawData))) {
            if (m.index === imgRegex.lastIndex) {
              return
            }

            let imgData = fs.readFileSync(path.resolve(inputDir, m[1])).toString('base64')
            imgData = 'data:image/' + path.extname(m[1]).substring(1) + ';base64,' + imgData
            text = text.replace(m[1], imgData)
          }
        }
        return text
      },
    }
  })
})
