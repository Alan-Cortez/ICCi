// Offline Storage Service - Manages pending operations in localStorage

const STORAGE_KEY = 'icci_pending_operations';

// Generate unique ID
const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Get all pending operations
export const getPendingOperations = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Error reading pending operations:', error);
        return [];
    }
};

// Add operation to queue
export const queueOperation = (operation) => {
    try {
        const operations = getPendingOperations();
        const newOperation = {
            id: generateId(),
            ...operation,
            timestamp: new Date().toISOString(),
            synced: false
        };

        operations.push(newOperation);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(operations));

        console.log('📝 Operation queued:', newOperation);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('pendingOperationsChanged', {
            detail: { count: operations.length }
        }));

        return newOperation;
    } catch (error) {
        console.error('Error queuing operation:', error);
        throw error;
    }
};

// Remove operation from queue
export const clearOperation = (operationId) => {
    try {
        const operations = getPendingOperations();
        const filtered = operations.filter(op => op.id !== operationId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        console.log('✅ Operation cleared:', operationId);

        // Dispatch event for UI updates
        window.dispatchEvent(new CustomEvent('pendingOperationsChanged', {
            detail: { count: filtered.length }
        }));

        return filtered;
    } catch (error) {
        console.error('Error clearing operation:', error);
        throw error;
    }
};

// Clear all operations
export const clearAllOperations = () => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));

        window.dispatchEvent(new CustomEvent('pendingOperationsChanged', {
            detail: { count: 0 }
        }));

        console.log('🗑️ All operations cleared');
    } catch (error) {
        console.error('Error clearing all operations:', error);
        throw error;
    }
};

// Get pending operations count
export const getPendingCount = () => {
    return getPendingOperations().length;
};

// Mark operation as synced
export const markOperationSynced = (operationId) => {
    try {
        const operations = getPendingOperations();
        const updated = operations.map(op =>
            op.id === operationId ? { ...op, synced: true } : op
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

        console.log('✓ Operation marked as synced:', operationId);
        return updated;
    } catch (error) {
        console.error('Error marking operation as synced:', error);
        throw error;
    }
};

// Get unsynced operations
export const getUnsyncedOperations = () => {
    return getPendingOperations().filter(op => !op.synced);
};
