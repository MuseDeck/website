
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET() {
    try {
        const { data: settings, error: settingsError } = await supabase
            .from('display_settings')
            .select('*')
            .is('user_id', null)
            .limit(1)
            .single();

        if (settingsError && settingsError.code !== 'PGRST116') {
            console.error('Error fetching display settings:', settingsError);
            return NextResponse.json({ message: 'Failed to fetch display settings' }, { status: 500 });
        }

        const responseContent: { [key: string]: any } = {};

        if (settings?.calendar_enabled) {
            responseContent.calendar = {
                title: 'Today\'s Schedule',
                events: [
                    { time: '10:00 AM', description: 'Team Stand-up' },
                    { time: '02:00 PM', description: 'Client Call' },
                ],
            };
        }

        if (settings?.recipe_enabled) {
            responseContent.recipe = {
                title: 'Today\'s Recommended Recipe',
                name: 'Stir-fried Tomatoes with Eggs',
                ingredients: ['Tomatoes', 'Eggs', 'Scallions', 'Salt'],
                instructions: '1. Scramble eggs 2. Stir-fry tomatoes 3. Combine',
            };
        }

        if (settings?.inspiration_enabled) {
            responseContent.inspiration = {
                title: 'Inspiration Card',
                content: '“Creativity is just connecting things.” - Steve Jobs',
                source: 'AI-generated/Clipping',
            };
        }

        if (settings?.daily_quote_enabled) {
            try {
                const hitokotoRes = await fetch('https://v1.hitokoto.cn/');
                if (!hitokotoRes.ok) {
                    throw new Error(`Hitokoto API responded with status ${hitokotoRes.status}`);
                }
                const hitokotoData = await hitokotoRes.json();

                responseContent.daily_quote = {
                    quote: hitokotoData.hitokoto || 'Life is what happens when you’re busy making other plans.',
                    author: hitokotoData.from_who || 'Unknown',
                    source: hitokotoData.from || 'Hitokoto API',
                };
            } catch (hitokotoError) {
                console.error('Error fetching Hitokoto:', hitokotoError);
                responseContent.daily_quote = {
                    quote: 'The best way to predict the future is to create it.',
                    author: 'Unknown',
                    source: 'Fallback',
                };
            }
        }

        return NextResponse.json(responseContent, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}