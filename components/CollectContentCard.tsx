'use client';

import { useState } from 'react';
import { useSupabase } from '@/app/supabase-provider';
import {
    Button,
    Spinner,
    Input,
    Textarea,
    Tabs,
    Tab,
} from "@heroui/react";

export default function CollectContentCard() {
    const supabase = useSupabase();

    const [contentType, setContentType] = useState<string>('webpage');
    const [contentInput, setContentInput] = useState<string>('');
    const [submittingContent, setSubmittingContent] = useState(false);

    const handleSubmitContent = async () => {
        if (!contentInput.trim()) {
            alert('Content cannot be empty!');
            return;
        }

        setSubmittingContent(true);
        try {
            const { data, error } = await supabase
                .from('collected_content')
                .insert([
                    {
                        user_id: null, // MVP: user_id set to null
                        content_type: contentType,
                        original_content: contentInput.trim(),
                        ai_summary: null,
                        ai_keywords: null,
                        ai_category: null,
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Error inserting collected content:', error);
                alert(`Failed to save content: ${error.message}`);
                return;
            }

            console.log('Content saved to Supabase:', data);
            alert('Content saved successfully! AI processing will begin shortly.');
            setContentInput('');

            try {
                const processAiRes = await fetch('/api/knowledge-organization', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contentId: data.id }),
                });

                if (!processAiRes.ok) {
                    console.error('Failed to trigger AI processing API.');
                } else {
                    console.log('AI processing triggered successfully for content ID:', data.id);
                }
            } catch (triggerError) {
                console.error('Error triggering AI processing:', triggerError);
            }

        } catch (submitError) {
            console.error('Submission error:', submitError);
            alert('An unexpected error occurred during submission.');
        } finally {
            setSubmittingContent(false);
        }
    };

    return (
        <div className="p-8 bg-white rounded-lg shadow-xl">
            <div className="flex justify-center mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Collect Content</h2>
            </div>

            <Tabs
                aria-label="Content Type"
                selectedKey={contentType}
                onSelectionChange={(key) => {
                    setContentType(String(key));
                    setContentInput('');
                }}
                fullWidth
                color="primary"
                className="mb-6"
            >
                <Tab key="webpage" title="Webpage (URL)">
                    <div className="p-4 space-y-6">
                        <Input
                            type="url"
                            label="Webpage URL"
                            placeholder="e.g., https://example.com/article"
                            value={contentInput}
                            onValueChange={setContentInput}
                            fullWidth
                            variant="bordered"
                        />
                    </div>
                </Tab>
                <Tab key="text" title="Text (Snippet/Note)">
                    <div className="p-4 space-y-6">
                        <Textarea
                            label="Content Text"
                            placeholder="Type or paste your note or snippet here..."
                            value={contentInput}
                            onValueChange={setContentInput}
                            fullWidth
                            minRows={5}
                            variant="bordered"
                        />
                    </div>
                </Tab>
            </Tabs>

            <div className="flex justify-center mt-6">
                <Button
                    onClick={handleSubmitContent}
                    isDisabled={submittingContent}
                    color="secondary"
                    size="lg"
                    fullWidth
                >
                    {submittingContent ? <Spinner size="sm" color="white" /> : 'Save Content'}
                </Button>
            </div>
        </div>
    );
}