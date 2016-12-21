const shell = require('shelljs')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const po2json = require('easygettext/dist/compile').po2json

const argv = require('yargs')
  .alias('output', 'o')
  .describe('output', 'The output folder for translation JSON file(s)')

  .alias('filename', 'f')
  .describe('filename', 'The file name for translation JSON file(s)')
  .default('filename', 'translation.json')

  .alias('src', 's')
  .describe('src', 'The source folder for PO files')

  .alias('multiple', 'm')
  .describe('multiple', 'Should it generate a single JSON file containing all translations, or multiple JSON files each for a translation')
  .default('multiple', false)

  .demand(['src', 'output'])
  .argv

const outputFolder = argv.output
const filename = argv.filename
const srcFolder = argv.src
const isMultiple = argv.multiple

let translationData = {}

const poFiles = glob.sync(`${srcFolder}/**/*.po`)

poFiles.forEach((poFile) => {
  let poContents = fs.readFileSync(poFile, {
    encoding: 'utf-8'
  }).toString()
  let data = po2json(poContents)
  let lang = data.headers.Language

  if (!translationData[lang]) {
    translationData[lang] = data.messages
  } else {
    Object.assign(translationData[lang], data.messages)
  }
})

if (isMultiple) {
  Object.keys(translationData).forEach((lang) => {
    let outputFile = path.join(outputFolder, lang, filename)
    // because vue-gettext requires this kind of structure
    // {"cn_zh": {"I am awesome": "我很棒"}}
    let singleTranslationData = {}
    singleTranslationData[lang] = translationData[lang]

    let translationString = JSON.stringify(singleTranslationData)

    createTranslationFile(outputFile, translationString)
  })
} else {
  let translationString = JSON.stringify(translationData)
  let outputFile = path.join(outputFolder, filename)

  createTranslationFile(outputFile, translationString)
}

function createTranslationFile (file, data) {
  let folder = path.dirname(file)

  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder)
  }

  fs.writeFileSync(file, data)
}
