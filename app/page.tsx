'use client';

import MuseDeckConfigCard from '@/components/MuseDeckConfigCard';
import CollectContentCard from '@/components/CollectContentCard';
import { Spinner } from '@heroui/react';
import { useState, useEffect } from 'react';

export default function HomePage() {
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPageLoading(false);
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    if (pageLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <Spinner label="Initializing components..." color="primary" labelColor="primary" />
            </div>
        );
    }

    return (
        <div className="flex justify-center py-12 px-4 md:px-6 lg:px-8 bg-gray-50 min-h-screen">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-screen-xl">
                <div>
                    <MuseDeckConfigCard />
                </div>
                <div>
                    <CollectContentCard />
                </div>
            </div>
        </div>
    );
}