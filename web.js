const _ = require('lodash')
const Liquid = require('shopify-liquid')
const express = require('express')
const bodyParser = require("body-parser")
const uuidv4 = require('uuid/v4')

const app = express()
const engine = Liquid()
const port = process.env.PORT || 3000

app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json())

const GlobalSessionId = 'global'

function newSession() {
    return {scope: {}}
}

const Sessions = {[GlobalSessionId]: newSession()}

app.post('/session', function(req, res) {
    uuid = uuidv4()
    Sessions[uuid] = newSession()
    res.send({uuid})
})

app.post('/render', function(req, res) {
    if (!req.body.template) { return res.send(422, {error: "missing required parameter: template"}) }
    session = Sessions[req.params.session || GlobalSessionId]
    if (!session) { return res.send(422, {error: "no such session"}) }
    scope = _.assign({}, session.scope) // liquid adds variables to this
    engine.parseAndRender(req.body.template, scope)
        .then(function(data){
            res.send({data})
        })
        .catch(function(reason) {
            res.status(500).send({
                code: reason.code,
                line: reason.line,
                message:reason.message,
                name:reason.name,
            })
        })
})

app.post('/scope', function(req, res) {
    if (!req.body.scope) { return res.send(422, {error: "missing required parameter: scope"}) }
    session = Sessions[req.params.session || GlobalSessionId]
    if (!session) { return res.send(422, {error: "no such session"}) }
    if (req.body.merge) {
        _.assign(session.scope, req.body.scope)
    } else {
        session.scope = req.body.scope
    }
    res.send({scope: session.scope})
})

app.listen(port)

console.log('Started liquid-server at: http://localhost:' + port + '/')
