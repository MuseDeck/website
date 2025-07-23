'use client';

import { useState } from 'react';
import { useSupabase } from '../app/supabase-provider';
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
                        user_id: null,
                        content_type: contentType,
                        original_content: contentInput.trim(),
                        // ai_summary, ai_keywords, ai_category 为空，待 Dify AI 处理
                    }
                ])
                .select()
                .single();

            if (error) {
                console.error('Error inserting collected content:', error);
                alert(`Failed to save content: ${error.message}`);
            } else {
                console.log('Content saved:', data);
                alert('Content saved successfully! AI processing will begin soon.');
                setContentInput('');
                // TODO: Trigger Dify AI processing here
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