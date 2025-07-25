import {NextResponse} from 'next/server';
import {createClient} from '@supabase/supabase-js';
import mqtt from 'mqtt';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const DIFY_API_BASE_URL = process.env.DIFY_API_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_API_KEY = process.env.DIFY_API_KEY!;


export async function POST(req: Request) {
    const {contentId} = await req.json();

    let aiSummary = 'No summary generated.';
    let aiKeywords: string[] = [];
    let aiCategory = 'other';

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

        try {
            const response = await fetch("https://api.dify.ai/v1/workflows/run", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer app-p0sB1kBBsRWXLM6GGgNxjrZl`
                },
                body: JSON.stringify({
                    workflow_id: "82a729fe-4256-4781-bf35-49b5b81bba38",
                    user: "0428bbb7-57cc-4f6e-95d7-c03222a529e7",
                    inputs: {
                        content_type: contentType,
                        original_content: originalContent
                    },
                    response_mode: "blocking"
                })
            });

            const data = await response.json();

            if (!response.ok) {
                console.log("Error fetching data content");
                return NextResponse.json({message: 'Failed to fetch data.'}, {status: 500});
            }

            console.log(data?.data?.outputs?.output);

            aiSummary = data?.data?.outputs?.output?.ai_summarize;
            aiKeywords = data?.data?.outputs?.output?.ai_keyword;
            aiCategory = data?.data?.outputs?.output?.ai_category;

        } catch (error) {
            console.error(error);
            return NextResponse.json({error: error}, {status: 500});
        }
    } catch (error) {
        console.error(error);
    }

    const { error: updateError } = await supabase
        .from('collected_content')
        .update({
            ai_summary: aiSummary,
            ai_keywords: aiKeywords,
            ai_category: aiCategory,
            updated_at: new Date().toISOString(),
        })
        .eq('id', contentId);

    if (updateError) {
        console.error('Error updating collected content with AI results:', updateError);
        return NextResponse.json({ message: 'Failed to update content with AI results' }, { status: 500 });
    }

    console.log(`Content ID ${contentId} successfully processed by AI and updated.`);

    return NextResponse.json({message: 'Content processed by AI successfully', contentId});

}