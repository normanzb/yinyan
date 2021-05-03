module.exports = [{
  from: {
    host: 'music.norm.im',
    pathname: /(.*)/,
  },
  to: {
    pathname: '$1',
    protocol: 'https:',
    host: 'music.norm.im',
    port: 443
  }
}, {
  from: {
    host: 'music.norm.im',
    pathname: /^\/(?!socket\.io|cover\/)/,
  },
  to: {
    pathname: '/',
    protocol: 'http:',
    host: 'localhost',
    port: 1234
  }
}];