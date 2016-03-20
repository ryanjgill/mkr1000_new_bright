'use strict'

// node express
let express = require('express')
let path = require('path')
let favicon = require('serve-favicon')
let logger = require('morgan')
let cookieParser = require('cookie-parser')
let bodyParser = require('body-parser')

let app = express()

// defining pin variables
var forwardPin, reversePin, leftPin, rightPin


// MKR1000 stuffs
let httpServer = require('http').Server(app)
let io = require('socket.io')(httpServer)
let net = require('net')
let five = require('johnny-five')
let firmata = require('firmata')

httpServer.listen(3000)

// set options to match Firmata config for wifi
// using MKR1000 with WiFi101
const options = {
  host: '192.168.1.9',
  port: 3030
}

// connection starts here
let mkr1000Connection = net.connect(options, function() { //'connect' listener
  console.log('connected to server!')

  var socketClient = this

  // use the socketClient instead of a serial port for transport
  var boardIo = new firmata.Board(socketClient)

  boardIo.once('ready', function(){
    console.log('boardIo ready')

    boardIo.isReady = true

    var board = new five.Board({io: boardIo, repl: true})

    board.on('ready', function() {
      // full Johnny-Five support here
      console.log('five ready')

      // setup steering pins
      leftPin = new five.Led(0)
      rightPin = new five.Led(1)
      forwardPin = new five.Led(6)
      reversePin = new five.Led(7)

      io.on('connection', function (socket) {
        console.log(socket.id)

        // emit usersCount on new connection
        emitUsersCount(io)

        // emit usersCount when connection is closed
        socket.on('disconnect', function () {
          emitUsersCount(io)
        })

        socket.on('command:forward:on', function (data) {
          forwardPin.on()
          console.log('command received! --> FORWARD ON')
        })

        // Steering Commands
        socket.on('command:forward:off', function (data) {
          forwardPin.off()
          console.log('command received! --> FORWARD OFF')
        })

        socket.on('command:reverse:on', function (data) {
          reversePin.on()
          console.log('command received! --> REVERSE ON')
        })

        socket.on('command:reverse:off', function (data) {
          reversePin.off()
          console.log('command received! --> REVERSE OFF')
        })

        socket.on('command:left:on', function (data) {
          leftPin.on()
          console.log('command received! --> LEFT ON')
        })

        socket.on('command:left:off', function (data) {
          leftPin.off()
          console.log('command received! --> LEFT OFF')
        })

        socket.on('command:right:on', function (data) {
          rightPin.on()
          console.log('command received! --> RIGHT ON')
        })

        socket.on('command:right:off', function (data) {
          rightPin.off()
          console.log('command received! --> RIGHT OFF')
        })
      })

    })
  })

})

mkr1000Connection.on('connection', function () {
  console.log('Connected to the MKR1000!');
})

mkr1000Connection.on('error', function (err) {
  console.log('Unable to establish connection to the MKR1000!');
  console.log(err);
})




// emit usersCount to all sockets
function emitUsersCount(io) {
  io.sockets.emit('usersCount', {
    totalUsers: io.engine.clientsCount
  })
}

// emit signal received to all sockets
function emitSignalReceived(io, message) {
  io.sockets.emit('signal:received', {
    date: new Date().getTime(),
    value: message || 'Signal received.'
  })
}


// pulse led
function pulseLed(led, duration, cb) {
  led.blink()
  setTimeout(function () {
    led.stop().off()
    cb()
  }, duration)
}

// setting app stuff
app.locals.title = 'MKR1000 New Bright'

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}))
app.use(express.static(path.join(__dirname, 'public')))

// get random int in range of min and max --> was used to mock out data
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Routes
app.get('/', function(req, res, next) {
  res.render('index')
})

