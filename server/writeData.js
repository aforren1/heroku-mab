const API_KEY = process.env.MAILGUN_API_KEY
const DOMAIN = process.env.MAILGUN_DOMAIN
//const GOOGLE_JSON = JSON.parse(process.env.GOOGLE_DRIVE_JSON)
const GOOGLE_JSON = JSON.parse('{}')
const FOLDER_ID = '1oRsAXm-gCwDWFefxOkTc8eOLpx8RzIZG'

const { google } = require('googleapis')
//const mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN })

function sendMailgun(data, id) {
  let buf = new Buffer.from(JSON.stringify(data), 'utf8')

  var attach = new mailgun.Attachment({
    data: buf,
    filename: `data_${id}.json`,
    contentType: 'application/json',
    knownLength: buf.length,
  })

  let email = {
    from: "Alex 'Mailgun' Forrence <mailgun@" + DOMAIN + '>',
    to: 'actlab@yale.edu',
    subject: `Fresh data from ${id}`,
    text: 'see attached',
    attachment: attach,
  }

  mailgun.messages().send(email, function (error, body) {
    if (error) {
      console.log(`Error sending Mailgun data for ${id}, err msg: ${error}`)
    }
  })
}

async function sendGoogleFile(data, id) {
  const client = await google.auth.getClient({
    credentials: GOOGLE_JSON,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  })
  // send to drive
  const drive = google.drive({ version: 'v3', auth: client })

  await drive.files.create({
    requestBody: {
      name: `data_${id}.json`,
      mimeType: 'application/json',
      parents: [FOLDER_ID],
    },
    media: {
      mimeType: 'application/json',
      body: JSON.stringify(data),
    },
  })
}

function writeData(data) {
  sendMailgun(data, data['id'])
  sendGoogleFile(data, data['id']).then(() => {
    console.log(`Successfully saved data for ${data['id']} to Google Drive.`)
  }).catch((e) => {
    console.log(`Error saving Google Drive data for ${data['id']}, err msg: ${e}`)
  })
}

module.exports = writeData
