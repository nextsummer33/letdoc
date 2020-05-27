const SVGO = require('svgo/lib/svgo')
const configs = require('./configs')

async function svgoPipeline(mdContent) {
  const svgo = new SVGO(configs)
  const regex = /<svg[^>]*>.*?<\/svg>/g
  let m;
  while ((m = regex.exec(mdContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    for (let i= 0; i < m.length; i++) {
      const match = m[i];
      const optsvg = await svgo.optimize(match, {})
      mdContent = mdContent.replace(match, optsvg.data)
    }
  }
  return mdContent
}

module.exports = svgoPipeline
