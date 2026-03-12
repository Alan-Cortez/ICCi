import React, { createContext, useContext, useState, useEffect } from 'react';
import { isOnline, syncPendingOperations, getSyncStatus } from '../services/syncService';
import { getPendingCount } from '../services/offlineStorage';

const NetworkContext = createContext(null);

export const useNetwork = () => {
    const context = useContext(NetworkContext);
    if (!context) {
        throw new Error('useNetwork must be used within NetworkProvider');
    }
    return context;
};

export const NetworkProvider = ({ children }) => {
    const [online, setOnline] = useState(navigator.onLine);
    const [syncing, setSyncing] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncResult, setLastSyncResult] = useState(null);

    // Update online status
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Online');
            setOnline(true);
        };

        const handleOffline = () => {
            console.log('📴 Offline');
            setOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Update pending count
    useEffect(() => {
        const updatePendingCount = () => {
            setPendingCount(getPendingCount());
        };

        // Initial count
        updatePendingCount();

        // Listen for changes
        window.addEventListener('pendingOperationsChanged', updatePendingCount);

        return () => {
            window.removeEventListener('pendingOperationsChanged', updatePendingCount);
        };
    }, []);

    // Listen for sync status changes
    useEffect(() => {
        const handleSyncStatus = (event) => {
            const { status, synced, failed } = event.detail;

            setSyncing(status === 'syncing');

            if (status === 'idle' && (synced !== undefined || failed !== undefined)) {
                setLastSyncResult({ synced, failed });

                // Clear result after 5 seconds
                setTimeout(() => {
                    setLastSyncResult(null);
                }, 5000);
            }
        };

        window.addEventListener('syncStatusChanged', handleSyncStatus);

        return () => {
            window.removeEventListener('syncStatusChanged', handleSyncStatus);
        };
    }, []);

    // Manual sync function
    const manualSync = async () => {
        if (!online) {
            alert('No hay conexión a internet');
            return;
        }

        if (syncing) {
            console.log('Sync already in progress');
            return;
        }

        const result = await syncPendingOperations();
        return result;
    };

    const value = {
        online,
        syncing,
        pendingCount,
        lastSyncResult,
        manualSync,
        isOnline: () => online
    };

    return (
        <NetworkContext.Provider value={value}>
            {children}
        </NetworkContext.Provider>
    );
};
