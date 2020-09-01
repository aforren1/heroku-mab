const API_KEY = process.env.MAILGUN_API_KEY
const DOMAIN = process.env.MAILGUN_DOMAIN
const GOOGLE_JSON = JSON.parse(process.env.GOOGLE_DRIVE_JSON)
const FOLDER_ID = '1oRsAXm-gCwDWFefxOkTc8eOLpx8RzIZG'

const { google } = require('googleapis')
const mailgun = require('mailgun-js')({ apiKey: API_KEY, domain: DOMAIN })

function sendMailgun(data, id) {
  let buf = new Buffer.from(JSON.stringify(data), 'utf8')

  var attach = new mailgun.Attachment({
    data: buf,
    filename: `data_${id}.json`,
    contentType: 'application/json',
    knownLength: buf.length,
  })

  let email_content = `
  Here's the scoop:

  ID: ${data.id}
  start date: ${data.startDate}
  end date: ${data.endDate}
  latest config: ${JSON.stringify(data.config, null, 2)}
  number of configs: ${data.config.length}
  number of instructions: 3 (this is fixed)
  correct responses in instruct: ${data.instructCorrect}
  number of trials: ${data.numTrials}
  reward achieved: ${data.totalReward}
  bonus values (+$2, $1, $0.5): ${data.bonusValues}
  done flag set: ${data.done}
  number of returns: ${data.returning}

  Search the logs for warnings!
  ------------------
  logs: ${JSON.stringify(data.logs, null, 2)}
  `

  let email = {
    from: 'The Mailgun Machine <mailgun@' + DOMAIN + '>',
    to: 'actlab@yale.edu',
    subject: `[2-armed-bandit] Hot off the presses! Data from ${id}`,
    text: email_content,
    attachment: attach,
  }

  mailgun.messages().send(email, function (error, body) {
    if (error) {
      console.log(`Error sending Mailgun data for ${id}, err msg: ${error}`)
    } else {
      console.log(`Successfully sent data for ${data['id']} via Mailgun.`)
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
  sendGoogleFile(data, data['id'])
    .then(() => {
      console.log(`Successfully saved data for ${data['id']} to Google Drive.`)
    })
    .catch((e) => {
      console.log(`Error saving Google Drive data for ${data['id']}, err msg: ${e}`)
    })
}

module.exports = writeData
