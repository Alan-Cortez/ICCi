// Data Cache Service - Caches API responses in localStorage for offline access

const DATA_CACHE_KEY = 'icci_data_cache';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// Get cached data
export const getCachedData = (key) => {
    try {
        const cache = localStorage.getItem(DATA_CACHE_KEY);
        if (!cache) return null;

        const data = JSON.parse(cache);
        const item = data[key];

        if (!item) return null;

        // Check if expired
        if (Date.now() - item.timestamp > CACHE_DURATION) {
            return null;
        }

        return item.data;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
};

// Set cached data
export const setCachedData = (key, data) => {
    try {
        const cache = localStorage.getItem(DATA_CACHE_KEY);
        const cacheData = cache ? JSON.parse(cache) : {};

        cacheData[key] = {
            data,
            timestamp: Date.now()
        };

        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error writing cache:', error);
    }
};

// Clear all cached data
export const clearDataCache = () => {
    try {
        localStorage.removeItem(DATA_CACHE_KEY);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

// Clear expired cache entries
export const cleanExpiredCache = () => {
    try {
        const cache = localStorage.getItem(DATA_CACHE_KEY);
        if (!cache) return;

        const data = JSON.parse(cache);
        const now = Date.now();
        const cleaned = {};

        Object.keys(data).forEach(key => {
            if (now - data[key].timestamp <= CACHE_DURATION) {
                cleaned[key] = data[key];
            }
        });

        localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(cleaned));
    } catch (error) {
        console.error('Error cleaning cache:', error);
    }
};
