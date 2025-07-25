import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL!;
let mqttClient: mqtt.MqttClient | null = null;

function getMqttClient(): mqtt.MqttClient {
    if (!mqttClient || mqttClient.disconnected) {
        mqttClient = mqtt.connect(MQTT_BROKER_URL, {
            clientId: `nextjs_ai_processor_${Math.random().toString(16).substring(2, 8)}`,
            reconnectPeriod: 1000,
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });
        mqttClient.on('connect', () => console.log('MQTT AI processor client connected!'));
        mqttClient.on('error', (err) => {
            console.error('MQTT AI processor client error:', err);
            if (mqttClient) {
                mqttClient.end();
                mqttClient = null;
            }
        });
    }
    return mqttClient;
}

export async function GET(req: Request) {
    const randomNumber = Math.floor(Math.random() * 3) + 1;
    console.log(`Generated random number: ${randomNumber}`);

    if (randomNumber === 2) {
        const client = getMqttClient();

        try {
            if (!client.connected) {
                console.log('MQTT client not connected, waiting for connection...');
                await new Promise<void>((resolve, reject) => {
                    client.once('connect', (packet) => resolve());
                    client.once('error', reject);
                    const timeout = setTimeout(() => reject(new Error('MQTT connection timeout')), 5000);
                    client.once('connect', () => clearTimeout(timeout));
                });
                console.log('MQTT client connected after waiting.');
            }

            const topic = 'sui-lan/inspiration/new';
            const messagePayload = {
                status: 'Random inspiration update triggered!',
                timestamp: new Date().toISOString(),
                randomNumber: randomNumber,
            };

            await new Promise<void>((resolve, reject) => {
                client.publish(topic, JSON.stringify(messagePayload), { qos: 0, retain: false }, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });

            console.log(`MQTT random inspiration nudge published to topic "${topic}":`, messagePayload);
            return NextResponse.json({
                message: 'Random inspiration nudge sent via MQTT',
                randomNumber: randomNumber
            }, { status: 200 });

        } catch (error) {
            console.error('API Error during MQTT random nudge publish:', error);
            if (client) {
                client.end();
                mqttClient = null;
            }
            return NextResponse.json({
                message: 'Internal Server Error during MQTT operation',
                error: (error as Error).message
            }, { status: 500 });
        }
    } else {
        return NextResponse.json({
            message: 'No inspiration update triggered this time (random number was not 2)',
            randomNumber: randomNumber
        }, { status: 200 });
    }
}