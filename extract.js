const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const consolidate = require('consolidate')
const Promise = require('promise')
const parseVue = require('vue-loader/lib/parser')
const Extractor = require('easygettext/dist/extract').Extractor
const ExtractorDefaultAttrs = require('easygettext/dist/constants').DEFAULT_ATTRIBUTES

const argv = require('yargs')
  .alias('output', 'o')
  .describe('output', 'The output file. It should be your template.pot')
  .alias('src', 's')
  .describe('src', 'The source folder for vue/html/js files')
  .array('attrs')
  .demand(['src', 'output'])
  .argv

const outputFile = argv.output
const srcFolder = argv.src
const extractAttrs = argv.attrs

// clean up
shell.rm('-f', outputFile)

let finalAttrs = extractAttrs
                ? extractAttrs.concat(ExtractorDefaultAttrs)
                : ExtractorDefaultAttrs

// support v-translate directive
if (finalAttrs.indexOf('v-translate') === -1) {
  finalAttrs.push('v-translate')
}

const extractor = new Extractor({
  lineNumbers: true,
  attributes: finalAttrs
})

const vueFiles = glob.sync(`${srcFolder}/**/*.vue`)

// extract from templates
let renderPromises = vueFiles.map((file) => {
  let content = fs.readFileSync(file, 'utf8')
  let filename = path.basename(file)
  let output = parseVue(content, filename, false)
  let templateLang = output.template.lang
  let renderFn = templateLang && consolidate[templateLang] && consolidate[templateLang].render
  let renderOpts = templateLang && require(`./extract-opts/${templateLang}`)

  // must be in html so that they can match when the app runs
  let renderPromise = renderFn
                      ? renderFn.call(consolidate, output.template.content, renderOpts)
                      : Promise.resolve(output.template.content)

  return renderPromise.then((html) => {
    return {file, html}
  }).catch((error) => {
    console.log(error)
  })
})

Promise.all(renderPromises).then((results) => {
  results.forEach((result) => {
    extractor.parse(result.file, result.html)
  })
}).then(() => {
  let outputFolder = path.dirname(outputFile)

  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder)
  }

  fs.writeFileSync(outputFile, extractor.toString())

  // note: vue files contain js code too
  const jsFiles = glob.sync(`${srcFolder}/**/*.js`).concat(vueFiles)

  // extract from js
  shell.exec(`xgettext --language=JavaScript --keyword=npgettext:1c,2,3 \
    --from-code=utf-8 --join-existing --no-wrap \
    --output ${outputFile} ${jsFiles.join(' ')}`)
})
