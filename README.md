# Liquid Template Server

The Liquid Template Server is designed to render Liquid templates in conjunction with [gojekyll](https://github.com/osteele/gojekyll).

This makes up for limitations in the pure Go Liquid engines as of 2017-06.

## Usage

```bash
yarn start
```

Now you can use `gojekyll`'s `--use-liquid-server` option, for increased compatibility over the embedded pure Go Liquid implementation.

The server must be running on the same machine as the client, so that it the `include` tag can find files.

## Status

[x] Render template
[ ] Jekyll Liquid filters
[ ] Jekyll Liquid tags
  [x] include
  [x] link
  [ ] remaining tags
[ ] Performance
  [x] Cache template variables across renders
  [ ] Cache compiled templates
[ ] Server infrastructure
  [x] JSON-RPC HTTP service
  [ ] JSON-RPC socket service
  [ ] Logging

## Protocol

`examples.http` demonstrates the protocol.
Huachao Mao's [Visual Studio Rest Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) can execute the examples in this file.

This is very very subject to change.

## Credits

* Jun Yang's [shopify-liquid](https://github.com/harttle/shopify-liquid) for Liquid template rendering
* Tedde Lundgren's [jayson](https://github.com/tedeh/jayson) JSON-RPC server library.

## License

MIT
