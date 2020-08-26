// https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io
// (more recent than socket.io's tutorial)
'use strict'
const path = require('path')
const dotenv = require('dotenv')
const express = require('express')
const socketIO = require('socket.io')
// access via process.env.* (both for local and Heroku env vars)
dotenv.config()
const PORT = process.env.PORT || 3000

// const server = express()
//   .use((req, res) => res.sendFile(INDEX, { root: __dirname }))
//   .listen(PORT, () => console.log(`Listening on ${PORT}`))

const app = express()
app.set('appPath', 'dist')
app.use(express.static(__dirname + '/dist'))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})
const server = app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
})

var foobar = {}
const io = socketIO(server)
io.on('connection', (socket) => {
  // socket.id is unique ID for *session* (not necessarily for the participant ID)
  // If we lose the session due to server disconnecting, how can we
  console.log(`Client ${socket.id} connected`)
  // socket.handshake has a lot of useful things: https://socket.io/docs/server-api/#socket-handshake
  socket.on('disconnect', (reason) => console.log(`Client ${socket.id} disconnected because of ${reason}`))

  socket.on('id_setup', (conf) => {
    // TODO: this would wipe out previous partially written data!
    // TODO: also, if they already have data, start from that point (update points,
    // add note)
    foobar[conf.id] = {
      config: conf,
      trialData: [],
    } // init trial array
  })

  socket.on('trial_choice', (id, data) => {
    console.log(`id ${id}: ${data}`)
    foobar[id].trialData.push(data)
    console.log(`foobar: ${JSON.stringify(foobar)}`)
    //
    socket.
  })
  // dump logs every trial
  socket.on('log_dump', (id, logs) => {})
})
