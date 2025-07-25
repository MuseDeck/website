'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSupabase } from '../app/supabase-provider';
import {
    Button,
    Switch,
    Select,
    SelectItem,
    Spinner,
    Tabs,
    Tab,
    Selection,
} from "@heroui/react";

interface UserSettings {
    calendar_enabled: boolean;
    recipe_enabled: boolean;
    inspiration_enabled: boolean;
    daily_quote_enabled: boolean;
    tasks_enabled: boolean,
    device_location: string | null;
    id?: string;
}

export default function MuseDeckConfigCard() {
    const supabase = useSupabase();

    const [savedSettings, setSavedSettings] = useState<UserSettings>({
        calendar_enabled: true,
        recipe_enabled: true,
        inspiration_enabled: true,
        daily_quote_enabled: true,
        tasks_enabled: true,
        device_location: 'default_location',
    });
    const [currentUiSettings, setCurrentUiSettings] = useState<UserSettings>({
        calendar_enabled: true,
        recipe_enabled: true,
        inspiration_enabled: true,
        daily_quote_enabled: true,
        tasks_enabled: true,
        device_location: 'default_location',
    });

    const [loading, setLoading] = useState(true);
    const [currentSettingId, setCurrentSettingId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>("autoRecommendation");

    const deviceLocations = [
        { key: "study_room", value: "Study Room" },
        { key: "kitchen", value: "Kitchen" },
    ];

    const autoRecommendationLocations = useMemo(() => [
        { key: "study_room", value: "Study Room" },
        { key: "kitchen", value: "Kitchen" },
    ], []);


    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('display_settings')
                .select('*')
                .is('user_id', null)
                .limit(1)
                .single();

            if (error) {
                console.error('Error fetching settings:', error);
                if (error.code === 'PGRST116') {
                    console.log('No settings found, will create new ones upon save.');
                } else {
                    alert('Failed to fetch settings, please try again.');
                }
            } else if (data) {
                setSavedSettings(data);
                setCurrentUiSettings(data);
                setCurrentSettingId(data.id || null);

                if (data.device_location === 'study_room' &&
                    data.calendar_enabled && data.inspiration_enabled && data.daily_quote_enabled &&
                    !data.recipe_enabled) {
                    setSelectedTab("autoRecommendation");
                } else if (data.device_location === 'kitchen' &&
                    data.recipe_enabled && data.daily_quote_enabled &&
                    !data.calendar_enabled && !data.inspiration_enabled) {
                    setSelectedTab("autoRecommendation");
                } else {
                    setSelectedTab("customization");
                }
            }
            setLoading(false);
        };

        fetchSettings();
    }, [supabase]);

    const handleToggleCustom = (key: keyof UserSettings) => {
        setCurrentUiSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleLocationChangeCustom = (selection: Selection) => {
        let selectedValue: string | null = null;
        if (typeof selection === 'string') {
            selectedValue = selection;
        } else if (selection instanceof Set && selection.size > 0) {
            selectedValue = Array.from(selection)[0] as string;
        }
        setCurrentUiSettings(prev => ({ ...prev, device_location: selectedValue }));
    };

    const handleLocationChangeAuto = (selection: Selection) => {
        let selectedLocation: string | null = null;
        if (typeof selection === 'string') {
            selectedLocation = selection;
        } else if (selection instanceof Set && selection.size > 0) {
            selectedLocation = Array.from(selection)[0] as string;
        }

        if (!selectedLocation) return;

        let newSettings = { ...currentUiSettings, device_location: selectedLocation };

        if (selectedLocation === 'study_room') {
            newSettings = {
                ...newSettings,
                calendar_enabled: true,
                inspiration_enabled: true,
                daily_quote_enabled: true,
                recipe_enabled: false,
                tasks_enabled: true,
            };
        } else if (selectedLocation === 'kitchen') {
            newSettings = {
                ...newSettings,
                recipe_enabled: true,
                daily_quote_enabled: true,
                calendar_enabled: false,
                inspiration_enabled: false,
                tasks_enabled: false,
            };
        }
        setCurrentUiSettings(newSettings);
    };


    const handleSave = async () => {
        setLoading(true);
        let error = null;
        let data = null;

        let settingsToSave: UserSettings;
        if (selectedTab === "autoRecommendation") {
            const selectedLocation = currentUiSettings.device_location;
            if (selectedLocation === 'study_room') {
                settingsToSave = {
                    ...currentUiSettings,
                    calendar_enabled: true,
                    inspiration_enabled: true,
                    daily_quote_enabled: true,
                    recipe_enabled: false,
                    tasks_enabled: true,
                    device_location: 'study_room'
                };
            } else if (selectedLocation === 'kitchen') {
                settingsToSave = {
                    ...currentUiSettings,
                    recipe_enabled: true,
                    daily_quote_enabled: true,
                    calendar_enabled: false,
                    inspiration_enabled: false,
                    tasks_enabled: false,
                    device_location: 'kitchen'
                };
            } else {
                alert('Please select a valid location for auto recommendation.');
                setLoading(false);
                return;
            }
        } else {
            settingsToSave = currentUiSettings;
        }

        if (currentSettingId) {
            const result = await supabase
                .from('display_settings')
                .update(settingsToSave)
                .eq('id', currentSettingId)
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            const result = await supabase
                .from('display_settings')
                .insert([{ ...settingsToSave, user_id: null }])
                .select()
                .single();
            data = result.data;
            error = result.error;
            if (data) {
                setCurrentSettingId(data.id || null);
            }
        }

        if (error) {
            console.error('Error saving settings:', error);
            alert(`Config saving failed: ${error.message}`);
        } else {
            alert('Config saved successfully!');
            setSavedSettings(settingsToSave);

            try {
                const notifyRes = await fetch('/api/update-content', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(settingsToSave),
                });

                if (!notifyRes.ok) {
                    console.error('Failed to send config update notification via MQTT API');
                } else {
                    console.log('Config update notification sent successfully!');
                }
            } catch (notifyError) {
                console.error('Error sending config update notification:', notifyError);
            }
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center p-8 bg-white rounded-lg shadow-xl h-96">
                <Spinner label="Loading settings..." color="primary" labelColor="primary" />
            </div>
        );
    }

    return (
        <div className="p-8 bg-white rounded-lg shadow-xl">
            <div className="flex justify-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Muse Deck Configuration</h1>
            </div>

            <Tabs
                aria-label="Configuration Tabs"
                selectedKey={selectedTab}
                onSelectionChange={(key) => setSelectedTab(String(key))}
                fullWidth
                color="primary"
                className="mb-6"
            >
                <Tab key="autoRecommendation" title="Auto Recommendation">
                    <div className="p-4 space-y-6">
                        <Select
                            label="Device Location"
                            placeholder="Select a pre-defined location"
                            selectedKeys={currentUiSettings.device_location ? new Set([currentUiSettings.device_location]) : new Set()}
                            onSelectionChange={handleLocationChangeAuto}
                            className="max-w-full mb-4"
                            aria-label="Select device location for auto recommendation"
                            selectionMode="single"
                        >
                            {autoRecommendationLocations.map((location) => (
                                <SelectItem key={location.key}>
                                    {location.value}
                                </SelectItem>
                            ))}
                        </Select>

                        <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-700 font-semibold mb-2">Recommended Content:</p>
                            <Switch
                                isSelected={currentUiSettings.calendar_enabled}
                                isDisabled // 禁用开关
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Calendar
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.recipe_enabled}
                                isDisabled
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Recipe
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.inspiration_enabled}
                                isDisabled
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Inspiration
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.tasks_enabled}
                                isDisabled
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Tasks
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.daily_quote_enabled}
                                isDisabled
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Daily Quote
                            </Switch>
                            <p className="text-sm text-gray-500 mt-2">These settings are automatically applied based on your location choice.</p>
                        </div>
                    </div>
                </Tab>
                <Tab key="customization" title="Customization">
                    <div className="p-4 space-y-6">
                        <Select
                            label="Device Location"
                            placeholder="Select any location"
                            selectedKeys={currentUiSettings.device_location ? new Set([currentUiSettings.device_location]) : new Set()}
                            onSelectionChange={handleLocationChangeCustom}
                            className="max-w-full"
                            aria-label="Select device location"
                        >
                            {deviceLocations.map((location) => (
                                <SelectItem key={location.key}>
                                    {location.value}
                                </SelectItem>
                            ))}
                        </Select>
                        <Switch
                            isSelected={currentUiSettings.calendar_enabled}
                            onValueChange={() => handleToggleCustom('calendar_enabled')}
                            className="flex justify-between items-center"
                        >
                            Calendar
                        </Switch>
                        <Switch
                            isSelected={currentUiSettings.recipe_enabled}
                            onValueChange={() => handleToggleCustom('recipe_enabled')}
                            className="flex justify-between items-center"
                        >
                            Recipe
                        </Switch>
                        <Switch
                            isSelected={currentUiSettings.inspiration_enabled}
                            onValueChange={() => handleToggleCustom('inspiration_enabled')}
                            className="flex justify-between items-center"
                        >
                            Inspiration
                        </Switch>
                        <Switch
                            isSelected={currentUiSettings.tasks_enabled}
                            onValueChange={() => handleToggleCustom('tasks_enabled')}
                            className="flex justify-between items-center"
                        >
                            Tasks
                        </Switch>
                        <Switch
                            isSelected={currentUiSettings.daily_quote_enabled}
                            onValueChange={() => handleToggleCustom('daily_quote_enabled')}
                            className="flex justify-between items-center"
                        >
                            Daily Quote
                        </Switch>

                    </div>
                </Tab>
            </Tabs>

            <div className="flex justify-center mt-6">
                <Button
                    onClick={handleSave}
                    isDisabled={loading}
                    color="primary"
                    size="lg"
                    fullWidth
                >
                    {loading ? <Spinner size="sm" color="white" /> : 'Submit Configuration'}
                </Button>
            </div>
        </div>
    );
}