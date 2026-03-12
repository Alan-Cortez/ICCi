import React, { useState, useEffect } from 'react';
import { BookOpen, Share2, RefreshCw } from 'lucide-react';
import { getDailyVerse } from '../services/verseService';

export const DailyVerse = () => {
    const [verse, setVerse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVerse();
    }, []);

    const loadVerse = async () => {
        try {
            setLoading(true);
            const dailyVerse = await getDailyVerse();
            setVerse(dailyVerse);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShare = () => {
        if (verse) {
            const text = `"${verse.text}" - ${verse.reference} (${verse.version})`;
            if (navigator.share) {
                navigator.share({ text });
            } else {
                navigator.clipboard.writeText(text);
                alert('Versículo copiado al portapapeles');
            }
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 h-48" />
        );
    }

    if (!verse) return null;

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-2xl p-6 shadow-lg border border-blue-100 dark:border-blue-800/50">
            <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-blue-600 dark:bg-blue-500 rounded-lg shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                        Versículo del Día
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">
                        {verse.reference}
                    </p>
                </div>
                {verse.category && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 text-xs font-semibold rounded-full">
                        {verse.category}
                    </span>
                )}
            </div>

            <p className="text-gray-800 dark:text-gray-200 italic leading-relaxed mb-4 text-sm">
                "{verse.text}"
            </p>

            <div className="flex justify-between items-center">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {verse.version}
                </span>
                <button
                    onClick={handleShare}
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
                    title="Compartir versículo"
                >
                    <Share2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>
            </div>
        </div>
    );
};
