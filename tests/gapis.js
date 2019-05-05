/**
 * Script to testing getting and putting documents to/from Google Drive, Docs and Sheets.
 *
 * Usage examples:
 *
 *  node test/gapis.js docs get 1gmzJsAMijXCwZRUchOBsrQ-_6AAPfRaI3rdfwryXxLA
 */

const fs = require('fs-extra')
const readline = require('readline')
const { google } = require('googleapis')

// If modifying these scopes, delete .gapi-token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
]

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = '.gapi-token.json'

/**
 * Create an OAuth2 client for use with the APIs
 */
async function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile('.gapi-credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err)

      // Authorize a client with credentials, then call the Google Docs API.
      credentials = JSON.parse(content)

      const { client_secret, client_id, redirect_uris } = credentials.installed
      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      )

      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
          const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES
          })
          console.log('Authorize this app by visiting this url:', authUrl)
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          })
          rl.question('Enter the code from that page here: ', code => {
            rl.close()
            oAuth2Client.getToken(code, (err, token) => {
              if (err)
                return console.error('Error retrieving access token', err)
              oAuth2Client.setCredentials(token)
              // Store the token to disk for later program executions
              fs.writeFile(TOKEN_PATH, JSON.stringify(token), err => {
                if (err) console.error(err)
                console.log('Token stored to', TOKEN_PATH)
              })
              resolve(oAuth2Client)
            })
          })
        } else {
          oAuth2Client.setCredentials(JSON.parse(token))
          resolve(oAuth2Client)
        }
      })
    })
  })
}

/**
 * Create a Google Docs API instance
 */
async function docs() {
  const auth = await authorize()
  return google.docs({ version: 'v1', auth })
}

/**
 * Create a Google Drive API instance
 */
async function drive() {
  const auth = await authorize()
  return google.drive({ version: 'v3', auth })
}

/**
 * Use the Google Drive API to create a new document
 * by importing a file.
 *
 * @param {string} filePath Path of the file to upload
 * @param {string} mimeType MIME type for the file content
 * @param {string} name Name fot the new file
 */
async function driveImportDoc(
  filePath,
  mimeType = 'text/html',
  name = 'Unnamed'
) {
  return drive().files.create({
    resource: {
      name,
      mimeType: 'application/vnd.google-apps.document'
    },
    media: {
      mimeType,
      body: fs.createReadStream(filePath)
    }
  })
}

/**
 * Use the Google Docs API to get the JSON for a document
 *
 * @param {string} documentId The document to get
 * @param {string} filePath The file path to write the JSON
 */
async function docsDocGet(documentId, filePath) {
  const result = await (await docs()).documents.get({ documentId })
  const gdoc = result.data
  if (filePath) {
    fs.writeJSONSync(filePath, gdoc, { spaces: 2 })
    return filePath
  } else {
    return gdoc
  }
}

const commands = {
  drive: {
    'import-doc': driveImportDoc
  },
  docs: {
    get: docsDocGet
  }
}

const argv = process.argv.slice(2)
commands[argv[0]][argv[1]](...argv.slice(2))
