const Logger = require("./Logger");
const ArduinoConnector = require("./ArduinoConnector");

if (process.env.LOGLEVEL) {
    Logger.setLogLevel(process.env.LOGLEVEL);
}

const arduinoConnector = new ArduinoConnector();

arduinoConnector.onData((data) => {
    Logger.info(`Data: ${JSON.stringify(data)}`)
})

arduinoConnector.initialize().then(() => {
    Logger.info("Initialized");
})