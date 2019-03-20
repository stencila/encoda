const fs = require('fs-extra')
const path = require('path')
const beautify = require('js-beautify').html

const {docs, drive} = require('../../../../src/gapis')

/**
 * Use the Google Docs API to get the JSON for a document
 */
docs()
  .then(docs => {
    return docs.documents.get({ 
      documentId: '1uVHq_qVJH0HK49MrzXy7Sv5wjVbb-pUh8Qvp-GTsdwg'
    })
  })
  .then(result => {
    const gdoc = result.data
    fs.writeJSONSync(path.join(__dirname, 'example-get.skip.gdoc'), gdoc, { spaces: 2 })
  })

/**
 * Use the Google Drive API to export a document as HTML
 */
drive()
  .then(drive => {
    return drive.files.export({
      fileId: '1uVHq_qVJH0HK49MrzXy7Sv5wjVbb-pUh8Qvp-GTsdwg',
      mimeType: 'text/html'
    })
  })
  .then(result => {
    const html = beautify(result.data)
    fs.writeFileSync(path.join(__dirname, 'example-exported.skip.html'), html)
  })
