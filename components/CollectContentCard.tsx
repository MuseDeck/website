'use client';

import { useState } from 'react';
import { useSupabase } from '@/app/supabase-provider';
import {
    Button,
    Spinner,
    Input,
    RadioGroup,
    Radio,
    Textarea
} from "@heroui/react";

export default function CollectContentCard() {
    const supabase = useSupabase();

    const [contentType, setContentType] = useState<'webpage' | 'text'>('webpage');
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
                // TODO: Trigger Dify AI processing
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
            <div className="space-y-6 mb-8">
                <RadioGroup
                    label="Content Type"
                    orientation="horizontal"
                    value={contentType}
                    onValueChange={(value) => setContentType(value as 'webpage' | 'text')}
                >
                    <Radio value="webpage">Webpage (URL)</Radio>
                    <Radio value="text">Text (Snippet/Note)</Radio>
                </RadioGroup>

                {contentType === 'webpage' ? (
                    <Input
                        type="url"
                        label="Webpage URL"
                        placeholder="e.g., https://example.com/article"
                        value={contentInput}
                        onValueChange={setContentInput}
                        fullWidth
                    />
                ) : (
                    <Textarea
                        label="Content Text"
                        placeholder="Type or paste your note or snippet here..."
                        value={contentInput}
                        onValueChange={setContentInput}
                        fullWidth
                        minRows={5}
                    />
                )}
            </div>
            <div className="flex justify-center">
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