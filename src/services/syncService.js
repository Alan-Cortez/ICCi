import { getPendingOperations, clearOperation, getUnsyncedOperations } from './offlineStorage';
import { createMember, updateMember } from './memberService';
import { markAttendance } from './attendanceService';
import { markCompliance } from './complianceService';
import { createEvent } from './eventService';
import { addTransaction } from './fundService';

// Sync Service - Handles synchronization of offline operations

let isSyncing = false;

// Check if online
export const isOnline = () => {
    return navigator.onLine;
};

// Sync all pending operations
export const syncPendingOperations = async () => {
    if (isSyncing) {
        console.log('⏳ Sync already in progress...');
        return { success: false, message: 'Sync in progress' };
    }

    if (!isOnline()) {
        console.log('📡 No internet connection');
        return { success: false, message: 'No internet connection' };
    }

    try {
        isSyncing = true;

        // Dispatch sync start event
        window.dispatchEvent(new CustomEvent('syncStatusChanged', {
            detail: { status: 'syncing' }
        }));

        const operations = getUnsyncedOperations();

        if (operations.length === 0) {
            console.log('✅ No operations to sync');
            isSyncing = false;
            window.dispatchEvent(new CustomEvent('syncStatusChanged', {
                detail: { status: 'idle' }
            }));
            return { success: true, synced: 0 };
        }

        console.log(`🔄 Syncing ${operations.length} operations...`);

        let successCount = 0;
        let failedCount = 0;
        const errors = [];

        for (const operation of operations) {
            try {
                await executeOperation(operation);
                clearOperation(operation.id);
                successCount++;
                console.log(`✅ Synced: ${operation.type}`);
            } catch (error) {
                failedCount++;
                errors.push({ operation, error: error.message });
                console.error(`❌ Failed to sync ${operation.type}:`, error);
            }
        }

        isSyncing = false;

        // Dispatch sync complete event
        window.dispatchEvent(new CustomEvent('syncStatusChanged', {
            detail: {
                status: 'idle',
                synced: successCount,
                failed: failedCount
            }
        }));

        console.log(`✅ Sync complete: ${successCount} synced, ${failedCount} failed`);

        return {
            success: true,
            synced: successCount,
            failed: failedCount,
            errors
        };

    } catch (error) {
        isSyncing = false;
        console.error('❌ Sync error:', error);

        window.dispatchEvent(new CustomEvent('syncStatusChanged', {
            detail: { status: 'error', error: error.message }
        }));

        return { success: false, message: error.message };
    }
};

// Execute a single operation
const executeOperation = async (operation) => {
    const { type, data } = operation;

    switch (type) {
        case 'CREATE_MEMBER':
            return await createMember(data);

        case 'UPDATE_MEMBER':
            return await updateMember(data.id, data);

        case 'MARK_ATTENDANCE':
            return await markAttendance(
                data.youthId,
                data.fecha,
                data.presente,
                data.justificado,
                data.razonFalta
            );

        case 'MARK_COMPLIANCE':
            return await markCompliance(
                data.youthId,
                data.fecha,
                data.tieneBiblia,
                data.tieneApuntes
            );

        case 'CREATE_EVENT':
            return await createEvent(data);

        case 'ADD_TRANSACTION':
            return await addTransaction(data);

        default:
            throw new Error(`Unknown operation type: ${type}`);
    }
};

// Auto-sync when coming online
let autoSyncEnabled = true;

export const enableAutoSync = () => {
    autoSyncEnabled = true;
};

export const disableAutoSync = () => {
    autoSyncEnabled = false;
};

// Listen for online event
window.addEventListener('online', () => {
    console.log('📡 Connection restored');

    if (autoSyncEnabled) {
        setTimeout(() => {
            syncPendingOperations();
        }, 1000); // Wait 1 second before syncing
    }
});

// Listen for offline event
window.addEventListener('offline', () => {
    console.log('📡 Connection lost');
});

// Get sync status
export const getSyncStatus = () => {
    return {
        online: isOnline(),
        syncing: isSyncing,
        pendingCount: getPendingOperations().length
    };
};
