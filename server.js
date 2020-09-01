// https://devcenter.heroku.com/articles/node-websockets#option-2-socket-io
// (more recent than socket.io's tutorial)
'use strict'
const path = require('path')
const dotenv = require('dotenv')
const express = require('express')
const socketIO = require('socket.io')
const seedrandom = require('seedrandom')
const bandit = require('./server/bandit')
const writeData = require('./server/writeData')

const num_trials = 5
// access via process.env.* (both for local and Heroku env vars)
dotenv.config()
const PORT = process.env.PORT || 3000

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
  socket.on('disconnect', (reason) => console.log(`Client ${socket.id} disconnected because of ${reason}.`))

  socket.on('id_setup', (conf) => {
    // If they already have data, start from that point
    // otherwise,
    let rng = seedrandom(conf.id)
    let probs = bandit(num_trials) // TODO: number of trials needs to be more easily configurable?
    let rewards = []
    for (let i = 0; i < probs.length; i++) {
      // map using keynames, rather than side (which restricts future
      // disambiguation of spatial effect)
      rewards.push({ A: rng() < probs[i], L: rng() < 1 - probs[i] })
    }
    console.log(`setting up id ${conf.id}`)
    // if they've been here before, nuke the previous data
    // but keep track of # of returns, and carry logs over
    let returning = 0
    let logs = []
    if (conf.id in foobar) {
      let prev_times = foobar[conf.id].returning + 1
      console.log(`id ${conf.id} is a returning customer. Time # ${prev_times}`)
      returning = prev_times
      logs = foobar[conf.id].logs
    }

    foobar[conf.id] = {
      id: conf.id, // redundant, but it's nice to have separated out
      socketID: socket.id, // for checking later?
      config: conf,
      trialData: [],
      logs: logs,
      numTrials: num_trials,
      probs: probs,
      rewards: rewards,
      trialCount: 0,
      totalReward: 0,
      instructCount: 0,
      instructCorrect: 0,
      done: false,
      startDate: new Date(),
      endDate: null,
      bonusValues: [
        Math.floor(0.8 * num_trials) * 100,
        Math.floor(0.7 * num_trials) * 100,
        Math.floor(0.6 * num_trials) * 100,
      ],
      returning: returning,
    }
  })

  socket.on('instruct_choice', (id, correct) => {
    // if we overshoot number of instruction screens, don't keep
    // incrementing; else someone could keep sending {correct: true}
    // packets
    let fid = foobar[id]
    try {
      if (fid.instructCount > 3) {
        return
      }
    } catch (err) {
      console.log(`instruction_choice: id ${id} doesn't exist. Err: ${err}`)
    }

    // for instructions, we just get correct/not
    fid.totalReward += correct ? 100 : 0
    fid.instructCorrect += correct ? 1 : 0
    fid.instructCount++
  })

  socket.on('gimme_bonuses', (id) => {
    let fid = foobar[id]
    try {
      socket.emit('the_bonuses_are', fid.bonusValues)
    } catch (err) {
      console.log(`gimme_bonuses: id ${id} doesn't have bonuses because err: ${err}`)
    }
  })

  socket.on('trial_choice', (id, data) => {
    // console.log(`id ${id}: ${JSON.stringify(data)}`)
    let fid = foobar[id]
    try {
      data.probs = [fid.probs[fid.trialCount], 1 - fid.probs[fid.trialCount]]
      data.rewards = fid.rewards[fid.trialCount]
      // if the chest had data, add 100; otherwise, none
      data.reward = fid.rewards[fid.trialCount][data.value] ? 100 : 0
    } catch (err) {
      console.log(`trial_choice: id ${id} doesn't exist. Err: ${err}`)
      return
    }
    fid.totalReward += data.reward
    fid.trialData.push(data)
    let resp = {
      done: false,
      reward: data.reward,
      totalReward: fid.totalReward,
    }
    if (fid.trialData.length >= fid.probs.length) {
      // all done
      resp.done = true
      fid.done = true
      fid.endDate = new Date()
      console.log(`final logging for ID ${id}`)
      try {
        writeData(fid)
      } catch (err) {
        console.log(`Data sending error: ${err}`)
      }
    } else {
      fid.trialCount++ // increment trial counter
    }
    //console.log(`resp to ${id}: ${JSON.stringify(resp)}`)
    socket.emit('trial_feedback', resp)
    //
  })
  // dump logs every trial, and at the end
  socket.on('log_dump', (id, logs) => {
    try {
      foobar[id].logs = foobar[id].logs.concat(logs)
    } catch (err) {
      console.log(`log_dump: id ${id} doesn't exist. Err: ${err}`)
    }
  })

  socket.on('ending', (id) => {
    let fid = foobar[id]
    try {
      // if done, sub in
      let resp = { successURL: 'https://www.google.com', finalScore: fid.totalReward }
      if (fid.done) {
        resp.successURL = process.env.SUCCESS_URL
      }
      socket.emit('the_goods', resp)
      // TODO: protect this from deleting other people's data?
      delete foobar[id]
      socket.disconnect(0)
    } catch (err) {
      console.log(`ending: issue with ${id}. Err: ${err}`)
    }
  })
})

// data validation:
// ideally, instructCorrect > 0
// end-to-end experiment time within some threshold
// not just one selection (though that's *technically* valid?)
// not just alternating (l/r/l/r/l...) (also technically fine, but not really)
// min period between trials ~2s? or whatever the lower bound via animations
// console remained closed
