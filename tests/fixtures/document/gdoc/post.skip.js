const fs = require('fs-extra')
const path = require('path')

const {drive} = require('../../../../src/gapis')

/**
 * Use the Google Drive API to create a new document
 * by importing HTML. Note that it is not possible
 * to import Google JSON
 */
drive()
  .then(drive => {
    return drive.files.create({
      resource: {
        name: 'Test GDoc',
        mimeType: 'application/vnd.google-apps.document'
      }, 
      media: {
        mimeType: 'text/html',
        body: fs.createReadStream(path.join(__dirname, 'example.html'))
      }
    })
  })
  .then(result => {
    console.log(result)
  })
