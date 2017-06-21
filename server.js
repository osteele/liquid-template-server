const _ = require('lodash')
const fs = require('fs')
const path = require('path')
const Liquid = require('shopify-liquid')
const jayson = require('jayson')
const uuid = require('uuid/v4')

const RPC_VERSION = "0.0.1"

const port = process.env.PORT || 4545

// TODO make this configurable
const strict = false

const engine = Liquid({
    strict_filters: strict,
    strict_variables: strict,
    extname: '',
    root: []
})

// for debugging
const GlobalSessionId = 'global'

// TODO create an engine to hold the current configuration
function newSession() {
    return {
        scope: {}
    }
}

engine.registerTag('link', {
    parse: function (tagToken, remainTokens) {
        this.filename = tagToken.args;
    },
    render: function (scope, hash) {
        // TODO use scope.opts instead; but this requires a new
        // engine for each context
        const filename = this.filename
        const file_urls = scope.scopes[0]._file_urls
        const url = file_urls[filename]
        if (!url) throw new Liquid.Types.AssertionError("no file: " + filename)
        return Promise.resolve(url)
    }
})

engine.registerTag('include', {
    parse: function (tagToken, remainTokens) {
        this.basename = tagToken.args;
    },
    render: function (ctx, other, opts) {
        const basename = this.basename
        const filename = _(ctx.scopes[0]._includeDirs)
            .map(function (dir) {
                return path.join(dir, basename)
            })
            .flatMap(function (filename) {
                return [filename, filename + ".html", filename + ".htm"]
            })
            .find(function (file) {
                return fs.existsSync(file)
            })
        if (!filename) throw new Liquid.Types.AssertionError("no file: " + basename)
        // return engine.renderFile(filename, ctx, opts)
        return engine.parseAndRender(fs.readFileSync(filename, 'utf8'), ctx)
    }
})

const Sessions = {
    [GlobalSessionId]: newSession()
}

// TODO retrieve the session id from the HTTP header
var server = jayson.server({
    session: function (args, callback) {
        const sessionId = uuid()
        const rpcVersion = RPC_VERSION
        Sessions[sessionId] = newSession()
        callback(null, {
            sessionId,
            rpcVersion
        })
    },
    render: function (args, callback) {
        const session = Sessions[GlobalSessionId]
        const scope = _.assign({}, session.scope || {}, args[1] || {}) // the liquid engine modifies the scope argument
        // TODO figure out a better way to route these to the tags
        scope._file_urls = session.file_urls
        scope._includeDirs = session.includeDirs
        engine.parseAndRender(args[0], scope)
            .then(function (text) {
                callback(null, {
                    text
                })
            })
            .catch(function (error) {
                console.error(error)
                callback({
                    code: error.code || -32000,
                    message: error.name,
                    data: {
                        filename: error.file,
                        lineNumber: error.line,
                        message: error.message,
                        stack: error.stack
                    }
                })
            })
    },
    fileUrls: function (args, callback) {
        const session = Sessions[GlobalSessionId]
        session.file_urls = args[0]
        callback(null, {})
    },
    includeDirs: function (args, callback) {
        const session = Sessions[GlobalSessionId]
        session.includeDirs = args[0]
        callback(null, {})
    },
    defaultVariables: function (args, callback) {
        const session = Sessions[GlobalSessionId]
        const options = args[1] || {}
        if (options.merge) {
            _.assign(session.scope, args[0])
        } else {
            session.scope = args[0]
        }
        callback(null, {})
    }
})

server.http().listen(port, () =>
    console.log('Server listening on http://localhost:' + port))