const Logger = require("./Logger");
const mqtt = require("mqtt");


class MqttClient {
    /**
     *
     * @param {import("./ArduinoConnector")} connector
     */
    constructor(connector) {
        this.connector = connector;

        this.identifier = process.env.IDENTIFIER || "Main";
        this.type = process.env.TYPE || "Gas";

        this.autoconfTimestamp = {};

        this.connector.onCount((count) => {
            this.handleCount(count);
        });
    }

    initialize() {
        const options = {
            clientId: `reedmeter2mqtt_${this.identifier}_${Math.random().toString(16).slice(2, 9)}`,  // 23 characters allowed
        };

        if (process.env.MQTT_USERNAME) {
            options.username = process.env.MQTT_USERNAME;

            if (process.env.MQTT_PASSWORD) {
                options.password = process.env.MQTT_PASSWORD;
            }
        } else if (process.env.MQTT_PASSWORD) {
            // MQTT_PASSWORD is set but MQTT_USERNAME is not
            Logger.error("MQTT_PASSWORD is set but MQTT_USERNAME is not. MQTT_USERNAME must be set if MQTT_PASSWORD is set.");
            process.exit(1);
        }

        this.client = mqtt.connect(process.env.MQTT_BROKER_URL, options);

        this.client.on("connect", () => {
            Logger.info("Connected to MQTT broker");
        });

        this.client.on("error", (e) => {
            if (e && e.message === "Not supported") {
                Logger.info("Connected to non-standard-compliant MQTT Broker.");
            } else {
                Logger.error("MQTT error:", e.toString());
            }
        });

        this.client.on("reconnect", () => {
            Logger.info("Attempting to reconnect to MQTT broker");
        });
    }

    handleCount(count) {
        this.ensureAutoconf(this.identifier);

        this.client.publish(
            `${MqttClient.TOPIC_PREFIX}/${this.identifier}/reading` ,
            `${parseFloat((count * MqttClient.METER_TYPE_SPECIFICS[this.type].multiplier).toFixed(2))}`
        );
    }

    ensureAutoconf(identifier) {
        // (Re-)publish every 4 hours
        if (Date.now() - (this.autoconfTimestamp ?? 0) <= 4 * 60 * 60 * 1000) {
            return;
        }
        const baseTopic = `${MqttClient.TOPIC_PREFIX}/${identifier}`;
        const discoveryTopic = "homeassistant/sensor/reedmeter2mqtt";
        const device = {
            "manufacturer": "Generic",
            "model": `${this.type} Meter`,
            "name": `${this.type} Meter ${identifier}`,
            "identifiers":[
                `reedmeter2mqtt_${identifier}`
            ]
        };

        this.client.publish(
            `${discoveryTopic}/reading/config`,
            JSON.stringify({
                "state_topic": `${baseTopic}/reading`,
                "name": "Meter Reading",
                "unit_of_measurement": MqttClient.METER_TYPE_SPECIFICS[this.type].unit_of_measurement,
                "device_class": MqttClient.METER_TYPE_SPECIFICS[this.type].device_class,
                "state_class": "total_increasing",
                "object_id": `reedmeter2mqtt_${identifier}_reading`,
                "unique_id": `reedmeter2mqtt_${identifier}_reading`,
                "enabled_by_default": true,
                "device": device
            }),
            {retain: true}
        );


        this.autoconfTimestamp = Date.now();
    }
}

MqttClient.METER_TYPES = {
    GAS: "Gas"
}

MqttClient.METER_TYPE_SPECIFICS = {
    [MqttClient.METER_TYPES.GAS]: {
        unit_of_measurement: "m³",
        device_class: "gas",
        multiplier: 0.01
    }
}

MqttClient.TOPIC_PREFIX = "reedmeter2mqtt";

module.exports = MqttClient;
