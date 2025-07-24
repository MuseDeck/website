import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import mqtt from 'mqtt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY!;

const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL!;
let mqttClient: mqtt.MqttClient | null = null;

function getMqttClient(): mqtt.MqttClient {
    if (!mqttClient || mqttClient.disconnected) {
        mqttClient = mqtt.connect(MQTT_BROKER_URL, {
            clientId: `nextjs_ai_processor_${Math.random().toString(16).substring(2, 8)}`,
            reconnectPeriod: 1000,
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


export async function POST(req: Request) {
    const {contentId} = await req.json();

    if (!contentId) {
        return NextResponse.json({message: 'Missing contentId'}, {status: 400});
    }

    try {
        const {data: collectedContent, error: fetchError} = await supabase
            .from('collected_content')
            .select('*')
            .eq('id', contentId)
            .single();

        if (fetchError || !collectedContent) {
            console.error('Error fetching collected content:', fetchError?.message || 'Content not found');
            return NextResponse.json({message: 'Content not found or failed to fetch'}, {status: 404});
        }

        const originalContent = collectedContent.original_content;
        const contentType = collectedContent.content_type;
        const currentUserId = collectedContent.user_id;

        console.log(originalContent);
        console.log(contentType);
        // console.log(currentUserId);

        let aiSummary = 'No summary generated.';
        let aiKeywords: string[] = [];
        let aiCategory = 'other';

        try {
            const response = await fetch("https://api.dify.ai/v1/workflows/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer app-p0sB1kBBsRWXLM6GGgNxjrZl`
                },
                body: JSON.stringify({
                    workflow_id: "82a729fe-4256-4781-bf35-49b5b81bba38",
                    inputs: {
                        contentType,
                        originalContent
                    },
                    response_mode: "blocking"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.log("Error fetching data content");
                return NextResponse.json({message: 'Failed to fetch data.'}, {status: 500});
            }

            const parsedDifyOutput = JSON.parse(data);
            console.log(parsedDifyOutput);

            // return NextResponse.json({ message: 'Successfully retrieved data.', data: data }, {status: 200});

        } catch (error) {
            console.error(error);
            return NextResponse.json({error: error}, {status: 500});
        }
    } catch (error) {
        console.error(error);
    }

    //
    // try {
    //     const parsedDifyOutput = JSON.parse(difyResult.answer || '{}');
    //     aiSummary = parsedDifyOutput.summary || aiSummary;
    //     aiKeywords = Array.isArray(parsedDifyOutput.keywords) ? parsedDifyOutput.keywords : [];
    //     aiCategory = parsedDifyOutput.category || aiCategory;
    // } catch (parseError) {
    //     console.warn('Could not parse Dify output as JSON. Using raw answer.', parseError);
    //     aiSummary = difyResult.answer || aiSummary;
    // }
    //
    // const { error: updateError } = await supabase
    //     .from('collected_content')
    //     .update({
    //         ai_summary: aiSummary,
    //         ai_keywords: aiKeywords,
    //         ai_category: aiCategory,
    //         updated_at: new Date().toISOString(),
    //     })
    //     .eq('id', contentId);
    //
    // if (updateError) {
    //     console.error('Error updating collected content with AI results:', updateError);
    //     return NextResponse.json({ message: 'Failed to update content with AI results' }, { status: 500 });
    // }
    //
    // console.log(`Content ID ${contentId} successfully processed by AI and updated.`);

    // const client = getMqttClient();
    // if (!client.connected) {
    //     console.log('MQTT client not connected, waiting for connection...');
    //     await new Promise<void>((resolve, reject) => {
    //         client.once('connect', (packet) => resolve());
    //         client.once('error', reject);
    //         const timeout = setTimeout(() => reject(new Error('MQTT connection timeout')), 5000);
    //         client.once('connect', () => clearTimeout(timeout));
    //     });
    //     console.log('MQTT client connected after waiting.');
    // }

    // const topic = 'sui-lan/inspiration/new';
    // const messagePayload = {
    //     status: 'New inspiration available',
    //     content_id: contentId,
    //     category: aiCategory,
    //     timestamp: new Date().toISOString(),
    // };
    //
    // await new Promise<void>((resolve, reject) => {
    //     client.publish(topic, JSON.stringify(messagePayload), {qos: 0, retain: false}, (err) => {
    //         if (err) reject(err);
    //         else resolve();
    //     });
    // });

    // console.log(`MQTT message published to topic "${topic}" for new inspiration: ${contentId}`);

    return NextResponse.json({message: 'Content processed by AI and published successfully', contentId});

}