const Logger = require("./Logger");
const ArduinoConnector = require("./ArduinoConnector");
const MqttClient = require("./MqttClient");

if (process.env.LOGLEVEL) {
    Logger.setLogLevel(process.env.LOGLEVEL);
}

const arduinoConnector = new ArduinoConnector();
const mqttClient = new MqttClient(arduinoConnector);

arduinoConnector.initialize().then(() => {
    mqttClient.initialize();
}).catch(err => {
    Logger.error("Error while initializing poller", err);
    process.exit(1);
});

