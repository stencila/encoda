/**
 * Script to testing getting and putting documents to/from Google Drive, Docs and Sheets.
 *
 * See the Google Docs API quickstart for getting API credentials set up:
 * https://developers.google.com/docs/api/quickstart/nodejs
 *
 * Usage examples:
 *
 * node gapis.js docs create mydoc.md
 * node gapis.js docs get 1gmzJsAMijXCwZRUchOBsrQ-_6AAPfRaI3rdfwryXxLA mydoc.md
 * node gapis.js docs get 1gmzJsAMijXCwZRUchOBsrQ-_6AAPfRaI3rdfwryXxLA mydoc.json raw
 *
 * Because this uses functions in `dist/index.js` ensure you run `make build` after
 * any changes to the code base.
 */

/* eslint-disable */

const fs = require('fs-extra')
const path = require('path')
const readline = require('readline')
const { google } = require('googleapis')
const { Readable } = require('stream')
const { load, dump, read, write } = require('../../dist')

// If modifying these scopes, delete .gapi-token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
]

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(__dirname, '.gapi-token.json')

/**
 * Create an OAuth2 client for use with the APIs
 */
async function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, '.gapi-credentials.json'),
      (err, content) => {
        if (err) return console.log('Error loading client secret file:', err)

        // Authorize a client with credentials, then call the Google Docs API.
        credentials = JSON.parse(content)

        const {
          client_secret,
          client_id,
          redirect_uris
        } = credentials.installed
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
      }
    )
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
 * Create a new GDoc from a local file
 *
 * @param {string} filePath Path of the file to create the doc from
 */
async function docsCreate(filePath) {
  const node = await read(filePath)
  const html = await dump(node, 'html')
  const stream = new Readable()
  stream.push(html)
  stream.push(null)
  const result = await (await drive()).files.create({
    resource: {
      name: node.title || 'Untitled',
      mimeType: 'application/vnd.google-apps.document'
    },
    media: {
      mimeType: 'text/html',
      body: stream
    }
  })
  const gdoc = result.data
  return `GDoc created from ${filePath} at https://docs.google.com/document/d/${gdoc.id}`
}

/**
 * Get a GDoc and save it to file
 *
 * @param {string} documentId The document to get
 * @param {string} filePath The file path to write the document
 * @param {boolean} raw Just write the raw GDoc JSON?
 */
async function docsGet(documentId, filePath, raw) {
  const result = await (await docs()).documents.get({ documentId })
  const gdoc = result.data
  if (raw) {
    fs.writeJSONSync(filePath, gdoc, { spaces: 2 })
  } else {
    const node = await load(JSON.stringify(gdoc), 'gdoc')
    await write(node, filePath)
  }
  return `GDoc saved from https://docs.google.com/document/d/${documentId} to ${filePath}`
}

const commands = {
  docs: {
    create: docsCreate,
    get: docsGet
  }
}

const argv = process.argv.slice(2)
commands[argv[0]][argv[1]](...argv.slice(2)).then(console.log)
