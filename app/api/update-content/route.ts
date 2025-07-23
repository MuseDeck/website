
import { NextResponse } from 'next/server';
import mqtt from 'mqtt';

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL!;

let mqttClient: mqtt.MqttClient | null = null;

function getMqttClient(): mqtt.MqttClient {
    if (!mqttClient || mqttClient.disconnected) {
        console.log('Establishing new MQTT client connection for config updates...');
        mqttClient = mqtt.connect(MQTT_BROKER_URL, {
            clientId: `nextjs_config_notifier_${Math.random().toString(16).substring(2, 8)}`,
            reconnectPeriod: 1000,
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD,
        });

        mqttClient.on('connect', () => {
            console.log('MQTT config notifier client connected!');
        });

        mqttClient.on('error', (err) => {
            console.error('MQTT config notifier client error:', err);
            if (mqttClient) {
                mqttClient.end();
                mqttClient = null;
            }
        });

        mqttClient.on('reconnect', () => {
            console.log('MQTT config notifier client reconnecting...');
        });
    }
    return mqttClient;
}

export async function POST(req: Request) {
    const updatedSettings = await req.json();
    console.log('Received config update from frontend:', updatedSettings);

    const client = getMqttClient();

    try {
        if (!client.connected) {
            console.log('MQTT config client not connected, waiting for connection...');
            await new Promise<void>((resolve, reject) => {
                client.once('connect', (packet) => resolve());
                client.once('error', reject);
                const timeout = setTimeout(() => reject(new Error('MQTT connection timeout')), 5000);
                client.once('connect', () => clearTimeout(timeout));
            });
            console.log('MQTT config client connected after waiting.');
        }

        const topic = 'sui-lan/config/update';

        const messagePayload = {
            status: 'Settings updated',
            timestamp: new Date().toISOString(),
            device_location: updatedSettings.device_location || 'unknown',
        };

        await new Promise<void>((resolve, reject) => {
            client.publish(topic, JSON.stringify(messagePayload), { qos: 0, retain: false }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        console.log(`Config update notification published to topic "${topic}":`, messagePayload);
        return NextResponse.json({ message: 'Config update notification sent successfully via MQTT' }, { status: 200 });

    } catch (error) {
        console.error('API Error during MQTT config update publish:', error);
        if (client) {
            client.end();
            mqttClient = null;
        }
        return NextResponse.json({ message: 'Internal Server Error during MQTT config operation', error: (error as Error).message }, { status: 500 });
    }
}