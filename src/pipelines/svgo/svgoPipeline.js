const svgo = require('svgo/lib/svgo')
const configs = require('./configs')

function decodeStr(str) {
  str = str.replace(/&apos;/g, "'")
  str = str.replace(/&quot;/g, '"')
  str = str.replace(/&gt;/g, '>')
  return str
}

async function svgoPipeline(mdContent) {
  const regex = /<svg.*>.+<\/svg>/g
  let m;
  let temp = mdContent
  while ((m = regex.exec(mdContent)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
        regex.lastIndex++;
    }

    // The result can be accessed through the `m`-variable.
    for (let i= 0; i < m.length; i++) {
      let matchedSvg = m[i];
    // Used to fixed the issue of svgo found the following pattern is invalid
      let svg = matchedSvg.replace(/&quot;/g, "'")
      // solving the issue of following link, since <br/> is valid tag instead of <br>
      // https://github.com/mermaid-js/mermaid/issues/614
      svg = svg.replace(/<br>/g, '<br\/>')
      const optsvg = svgo.optimize(svg, configs)
      // fixed the <br /> convert into <br></br>
      // other the browser will treat it as <br><br> double link breaks
      const finalStr = decodeStr(optsvg.data.replace(/<br><\/br>/g, "<br>"))
      temp = temp.replace(matchedSvg, finalStr)
    }
  }

  return temp
}

module.exports = svgoPipeline
