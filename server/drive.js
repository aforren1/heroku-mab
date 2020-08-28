const { google } = require('googleapis')

const GOOGLE_JSON = JSON.parse(process.env.GOOGLE_DRIVE_JSON)
const SUCCESS_URL = process.env.SUCCESS_URL
const FOLDER_ID = '1oRsAXm-gCwDWFefxOkTc8eOLpx8RzIZG'

async function sendFile(buf2, id) {
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
      body: buf2,
    },
  })
}

function sendGoogleDrive(data) {
  sendFile(JSON.stringify(data), data['config']['id'])
}
