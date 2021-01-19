module.exports = [{
  from: {
    host: 'music.norm.im',
    pathname: /^\/socket\.io\/.*/,
  },
  to: {
    pathname: '/socket.io/',
    protocol: 'https:',
    host: 'music.norm.im',
    port: 443
  }
}, {
  from: {
    host: 'music.norm.im',
    pathname: /^\/(?!socket\.io\/)/,
  },
  to: {
    pathname: '/',
    protocol: 'http:',
    host: 'localhost',
    port: 1234
  }
}];