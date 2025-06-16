module.exports = {
  pages: {
    index: {
      entry: 'src/pages/home/main.js',
      template: 'public/index.html',
      filename: 'index.html',
      title: 'Home Page',
      chunks: ['chunk-vendors', 'chunk-common', 'index']
    },
    login: {
      entry: 'src/pages/login/main.js',
      template: 'public/login.html',
      filename: 'login.html',
      title: 'Login Page',
      chunks: ['chunk-vendors', 'chunk-common', 'login']
    },
    event: {
      entry: 'src/pages/eventpage/main.js',
      template: 'public/event.html',
      filename: 'event.html',
      title: 'Event Page',
      chunks: ['chunk-vendors', 'chunk-common', 'event']
    },
    leaderboard: {
      entry: 'src/pages/leaderboard/main.js',
      template: 'public/leaderboard.html',
      filename: 'leaderboard.html',
      title: 'Leaderboard Page',
      chunks: ['chunk-vendors', 'chunk-common', 'leaderboard']
    }
  }
};
