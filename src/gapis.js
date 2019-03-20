/**
 * A module for creating authorized interfaces to Google APIs
 * 
 * Based on Google's sample code
 */

const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents'
];

// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

/**
 * Create an OAuth2 client with the given credentials
 * 
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
async function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      
      // Authorize a client with credentials, then call the Google Docs API.
      credentials = JSON.parse(content)

      const {client_secret, client_id, redirect_uris} = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(
          client_id, client_secret, redirect_uris[0]);
    
      // Check if we have previously stored a token.
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, resolve);
        oAuth2Client.setCredentials(JSON.parse(token));
        resolve(oAuth2Client);
      });
    });
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

async function docs (documentId) {
  const auth = await authorize()
  return google.docs({version: 'v1', auth})
}


async function drive (doc) {
  const auth = await authorize()
  return google.drive({version: 'v3', auth})
}

module.exports = {docs, drive}
