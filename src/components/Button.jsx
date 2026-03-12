import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
    title,
    onClick,
    variant = 'primary',
    disabled = false,
    loading = false,
    className = ''
}) => {
    const baseStyles = "px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-all duration-200";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
        secondary: "bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50"
    };
    const disabledStyles = "opacity-50 cursor-not-allowed";

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${disabled || loading ? disabledStyles : ''} ${className}`}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                title
            )}
        </button>
    );
};
