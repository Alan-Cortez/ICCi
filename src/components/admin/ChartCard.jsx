import React from 'react';
import { Loader2 } from 'lucide-react';

export const ChartCard = ({
    title,
    description,
    children,
    loading = false,
    actions
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {title}
                        </h3>
                        {description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {description}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
};
