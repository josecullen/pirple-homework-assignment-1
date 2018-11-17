/*
* Primary file for the API
*/

// Dependencies
const http = require('http')
const https = require('https')
const url = require('url')
const StringDecoder = require('string_decoder').StringDecoder
const config = require('./config')
const fs = require('fs')

// The server should respond to all request with a string
const httpServer = http.createServer((req, res) => unifiedServer(req, res))

// Start the HTTP server
httpServer.listen(config.httpPort, function(){
    console.log(`The server is listening on port ${config.httpPort}`)
})


// Instantiate the HTTPS server
const httpsServerOptions = {
    'key' : fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
}

const httpsServer = https.createServer(httpsServerOptions, (req, res) => unifiedServer(req, res))

// Start the HTTPS server
httpsServer.listen(config.httpsPort, function(){
    console.log(`The server is listening on port ${config.httpsPort}`)
})


// All the server logic for both the http and https server
var unifiedServer = (req, res) => {

    // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true)

    // Get the path
    var path = parsedUrl.pathname
    var trimmedPath = path.replace(/^\/+|\/+$/g, '')

    // Get the query string as an object
    var queryStringObject = parsedUrl.query

    // Get the HTTP Method
    var method = req.method.toLowerCase()

    // Get the headers as an object
    var headers = req.headers

    // Get the payload, if any
    var decoder = new StringDecoder('utf-8')
    var buffer = ''

    req.on('data', (incomingData) => {
        let decodedData = decoder.write(incomingData)

        buffer += decodedData
    })

    req.on('end', () => {
        buffer += decoder.end()

        // Choose the handler this request should go to. 
        // If one is not found, use the notFound handler
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' 
            ? router[trimmedPath] 
            : handlers.notFound

        // Contruct the data object to send to the handler
        var userRequest = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : buffer
        }

        var persona = {
            'name' : 'barbi'
        }

        chosenHandler(userRequest, function(statusCode, payloadResponse) {
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            // Use the payload called back by the handler, or default to empty payload
            payloadResponse = typeof(payloadResponse) == 'object' ? payloadResponse : {}

            // Convert the payload to string
            let payloadString = JSON.stringify(payloadResponse)

            // Return the response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)

            console.log(`Returning this response: ${statusCode} ${payloadString}`)
        })

    })
    
}

// Define the handlers
const handlers = {}

// Hello handler
handlers.hello = function(data, callback){
    var userName = data.queryStringObject.user
    if (userName){
        console.log(userName)
        callback(200, {'greeting': "Thanks "+ userName +" for test my API!"})
    }else{
        callback(200, {'greeting': "I don't know you, please tell me your name as a query param, like: '?user=Barbie'"})
    }
}

// Not found handler
handlers.notFound = function(data, callback){
    callback(404)
}

// Define a request router
const router = {
    'hello': handlers.hello
}