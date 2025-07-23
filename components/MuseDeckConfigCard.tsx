// components/MuseDeckConfigCard.tsx
'use client';

import { useState, useEffect, useMemo } from 'react'; // 导入 useMemo
import { useSupabase } from '../app/supabase-provider'; // 根据实际路径调整
import {
    Button,
    Switch,
    Select,
    SelectItem,
    Spinner,
    Tabs, // 导入 Tabs
    Tab, // 导入 Tab
} from "@heroui/react";

interface UserSettings {
    calendar_enabled: boolean;
    recipe_enabled: boolean;
    inspiration_enabled: boolean;
    daily_quote_enabled: boolean;
    device_location: string | null;
    id?: string;
}

export default function MuseDeckConfigCard() {
    const supabase = useSupabase();

    // 用于存储用户实际保存的设置
    const [savedSettings, setSavedSettings] = useState<UserSettings>({
        calendar_enabled: true,
        recipe_enabled: true,
        inspiration_enabled: true,
        daily_quote_enabled: true,
        device_location: 'default_location',
    });
    // 用于UI显示和交互的临时设置状态
    const [currentUiSettings, setCurrentUiSettings] = useState<UserSettings>({
        calendar_enabled: true,
        recipe_enabled: true,
        inspiration_enabled: true,
        daily_quote_enabled: true,
        device_location: 'default_location',
    });

    const [loading, setLoading] = useState(true);
    const [currentSettingId, setCurrentSettingId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<string>("autoRecommendation"); // 新增：控制当前选中的 Tab

    const deviceLocations = [
        { key: "default_location", value: "Default" },
        { key: "living_room", value: "Living Room" },
        { key: "study_room", value: "Study Room" },
        { key: "kitchen", value: "Kitchen" },
        { key: "office", value: "Office" },
        { key: "bedroom", value: "Bedroom" },
    ];

    // 仅用于自动推荐模式的受限位置选项
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
                setCurrentUiSettings(data); // 初始化UI设置
                setCurrentSettingId(data.id || null);

                // 根据加载的设置，尝试判断应该显示哪个Tab
                // 这是一个简化的判断，如果设置与某个自动推荐场景完全匹配，则切换到该Tab
                if (data.device_location === 'study_room' &&
                    data.calendar_enabled && data.inspiration_enabled && data.daily_quote_enabled &&
                    !data.recipe_enabled) { // 假设study room模式下recipe是关闭的
                    setSelectedTab("autoRecommendation");
                } else if (data.device_location === 'kitchen' &&
                    data.recipe_enabled && data.daily_quote_enabled &&
                    !data.calendar_enabled && !data.inspiration_enabled) { // 假设kitchen模式下其他是关闭的
                    setSelectedTab("autoRecommendation");
                } else {
                    setSelectedTab("customization"); // 否则默认进入自定义模式
                }
            }
            setLoading(false);
        };

        fetchSettings();
    }, [supabase]);

    // 处理自定义模式下的开关切换
    const handleToggleCustom = (key: keyof UserSettings) => {
        setCurrentUiSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // 处理自定义模式下的位置选择
    const handleLocationChangeCustom = (keys: Set<React.Key>) => {
        const selectedKey = Array.from(keys)[0];
        setCurrentUiSettings(prev => ({ ...prev, device_location: String(selectedKey) }));
    };

    // 处理自动推荐模式下的位置选择
    const handleLocationChangeAuto = (keys: Set<React.Key>) => {
        const selectedLocation = String(Array.from(keys)[0]);
        let newSettings = { ...savedSettings, device_location: selectedLocation };

        // 根据选择的位置，更新对应的启用状态
        if (selectedLocation === 'study_room') {
            newSettings = {
                ...newSettings,
                calendar_enabled: true,
                inspiration_enabled: true,
                daily_quote_enabled: true,
                recipe_enabled: false, // 明确关闭
            };
        } else if (selectedLocation === 'kitchen') {
            newSettings = {
                ...newSettings,
                recipe_enabled: true,
                daily_quote_enabled: true,
                calendar_enabled: false, // 明确关闭
                inspiration_enabled: false, // 明确关闭
            };
        }
        // 更新 UI 状态以反映自动推荐的改变
        setCurrentUiSettings(newSettings);
    };


    const handleSave = async () => {
        setLoading(true);
        let error = null;
        let data = null;

        // 根据当前选中的 Tab 决定要保存的实际设置
        let settingsToSave: UserSettings;
        if (selectedTab === "autoRecommendation") {
            // 在自动推荐模式下，始终保存基于当前选择的 location 自动生成的设置
            const selectedLocation = currentUiSettings.device_location;
            if (selectedLocation === 'study_room') {
                settingsToSave = {
                    ...currentUiSettings, // 继承 id 等
                    calendar_enabled: true,
                    inspiration_enabled: true,
                    daily_quote_enabled: true,
                    recipe_enabled: false,
                    device_location: 'study_room'
                };
            } else if (selectedLocation === 'kitchen') {
                settingsToSave = {
                    ...currentUiSettings, // 继承 id 等
                    recipe_enabled: true,
                    daily_quote_enabled: true,
                    calendar_enabled: false,
                    inspiration_enabled: false,
                    device_location: 'kitchen'
                };
            } else {
                // 如果在自动模式下选择了非预设的location（理论上不会发生，但以防万一）
                alert('Please select a valid location for auto recommendation.');
                setLoading(false);
                return;
            }
        } else {
            // 自定义模式，直接保存 UI 上的设置
            settingsToSave = currentUiSettings;
        }

        if (currentSettingId) {
            const result = await supabase
                .from('display_settings')
                .update(settingsToSave) // 使用要保存的设置
                .eq('id', currentSettingId)
                .select()
                .single();
            data = result.data;
            error = result.error;
        } else {
            const result = await supabase
                .from('display_settings')
                .insert([{ ...settingsToSave, user_id: null }]) // user_id is null for hackathon MVP
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
            setSavedSettings(settingsToSave); // 更新保存的设置
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
                fullWidth // 让 Tab 宽度占满
                color="primary" // Tab 选中颜色
                className="mb-6"
            >
                <Tab key="autoRecommendation" title="Auto Recommendation">
                    <div className="p-4 space-y-6">
                        <Select
                            label="Device Location"
                            placeholder="Select a pre-defined location"
                            selectedKeys={currentUiSettings.device_location ? new Set([currentUiSettings.device_location]) : new Set()}
                            onSelectionChange={handleLocationChangeAuto} // 针对自动推荐模式的修改
                            className="max-w-full mb-4"
                            aria-label="Select device location for auto recommendation"
                        >
                            {autoRecommendationLocations.map((location) => (
                                <SelectItem key={location.key} value={location.key}>
                                    {location.value}
                                </SelectItem>
                            ))}
                        </Select>

                        {/* 根据选择的位置显示推荐内容状态 (不可修改) */}
                        <div className="space-y-4 p-4 border border-dashed border-gray-300 rounded-md">
                            <p className="text-gray-700 font-semibold mb-2">Recommended Content:</p>
                            <Switch
                                isSelected={currentUiSettings.calendar_enabled}
                                isDisabled // 禁用开关
                                className="flex justify-between items-center"
                                color="success" // 绿色表示开启
                            >
                                Calendar
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.recipe_enabled}
                                isDisabled // 禁用开关
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Recipe
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.inspiration_enabled}
                                isDisabled // 禁用开关
                                className="flex justify-between items-center"
                                color="success"
                            >
                                Inspiration
                            </Switch>
                            <Switch
                                isSelected={currentUiSettings.daily_quote_enabled}
                                isDisabled // 禁用开关
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
                            onSelectionChange={handleLocationChangeCustom} // 针对自定义模式
                            className="max-w-full"
                            aria-label="Select device location"
                        >
                            {deviceLocations.map((location) => (
                                <SelectItem key={location.key} value={location.key}>
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