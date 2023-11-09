const getConfigFromFile = require('./config');
const Engine = require('./engine');

const parsedConfig = getConfigFromFile();

new Engine().run(parsedConfig).then(
  () => { },
  error => {
    console.error('ERROR', error);
    process.exitCode = 1;
  },
);
