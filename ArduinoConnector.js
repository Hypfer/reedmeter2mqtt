const EventEmitter = require("events").EventEmitter;
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline')
const Logger = require("./Logger");

class ArduinoConnector {
    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    async initialize() {
        if (!process.env.SERIALPORT) {
            Logger.error("SERIALPORT is not set.");

            process.exit(1);
        }

        this.port = new SerialPort({
                path: process.env.SERIALPORT,
                baudRate: 9600,
            },
            (err) => {
                if (err) {
                    Logger.error(`Error while opening '${process.env.SERIALPORT}': `, err.message);

                    process.exit(1);
                }
            }
        );

        this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }))

        this.parser.on('data',  (data) => {
            Logger.trace(`Message from Arduino: ${data}`);
            
            if (data.startsWith("impulseCount: ")) {
                const impulseCount = parseInt(data.split(" ")[1]);
                
                Logger.debug(`Impulse Count: ${impulseCount}`);
                
                this.emitCount(impulseCount);
            }
        });
    }

    emitCount(count) {
        this.eventEmitter.emit(ArduinoConnector.EVENTS.Count, count);
    }

    onCount(listener) {
        this.eventEmitter.on(ArduinoConnector.EVENTS.Count, listener);
    }
}

ArduinoConnector.EVENTS = {
    Count: "Count"
}

module.exports = ArduinoConnector;
