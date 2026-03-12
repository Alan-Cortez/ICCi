import React from 'react';
import { useNetwork } from '../context/NetworkContext';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const OfflineIndicator = () => {
    const { online, syncing, pendingCount, lastSyncResult, manualSync } = useNetwork();

    // Don't show anything if online and no pending operations
    if (online && pendingCount === 0 && !syncing && !lastSyncResult) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 items-end">
            {/* Offline Badge */}
            {!online && (
                <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                    <WifiOff className="w-5 h-5" />
                    <span className="font-medium">Sin conexión</span>
                </div>
            )}

            {/* Syncing Badge */}
            {syncing && (
                <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">Sincronizando...</span>
                </div>
            )}

            {/* Sync Result */}
            {lastSyncResult && (
                <div className={`${lastSyncResult.failed > 0 ? 'bg-yellow-500' : 'bg-green-500'} text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top`}>
                    {lastSyncResult.failed > 0 ? (
                        <XCircle className="w-5 h-5" />
                    ) : (
                        <CheckCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">
                        {lastSyncResult.synced} sincronizados
                        {lastSyncResult.failed > 0 && `, ${lastSyncResult.failed} fallidos`}
                    </span>
                </div>
            )}

            {/* Pending Operations */}
            {pendingCount > 0 && !syncing && (
                <div className="bg-white border-2 border-orange-500 text-gray-900 px-4 py-2 rounded-lg shadow-lg flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">
                            {pendingCount} operación{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {online && (
                        <button
                            onClick={manualSync}
                            className="ml-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Sincronizar ahora"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}

            {/* Online Badge (only when coming back online with pending ops) */}
            {online && pendingCount > 0 && !syncing && !lastSyncResult && (
                <div className="bg-green-500 text-white px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 text-sm">
                    <Wifi className="w-4 h-4" />
                    <span>Conectado</span>
                </div>
            )}
        </div>
    );
};
