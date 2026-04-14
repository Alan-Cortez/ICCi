import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Trash2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { getCurrentBalance, addTransaction, getAllTransactions, deleteTransaction } from '../../services/fundService';
import { getToday } from '../../utils/dateHelpers';
import { useAuth } from '../../context/AuthContext';
import { createPendingAction } from '../../services/pendingActionsService';
import { toast } from 'react-toastify';

export const Funds = ({ ministryId }) => {
    const { currentUser, isYouthLiderazgo, isYouthNoAsistencia, isAdmin, isLeader } = useAuth();
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipo, setTipo] = useState('ingreso');
    const [monto, setMonto] = useState('');
    const [concepto, setConcepto] = useState('');
    const [fecha, setFecha] = useState(getToday());

    useEffect(() => {
        if (ministryId) {
            loadData();
        }
    }, [ministryId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [balanceData, transData] = await Promise.all([
                getCurrentBalance(ministryId),
                getAllTransactions(ministryId)
            ]);
            setBalance(balanceData);
            setTransactions(transData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const isYouthRole = () => isYouthLiderazgo() || isYouthNoAsistencia();
    const canDoDirectly = () => isAdmin() || isLeader();

    const handleAddTransaction = async () => {
        if (!monto || !concepto.trim()) {
            toast.warning('El monto y concepto son requeridos');
            return;
        }

        try {
            if (isYouthRole() && !canDoDirectly()) {
                await createPendingAction(
                    'add_transaction',
                    { tipo, monto: parseFloat(monto), concepto, fecha, ministryId },
                    currentUser,
                    ministryId
                );
                toast.info('✋ Transacción enviada a revisión por el encargado.');
            } else {
                await addTransaction(tipo, parseFloat(monto), concepto, fecha, ministryId);
                toast.success('Transacción registrada exitosamente');
                loadData();
            }
            setMonto('');
            setConcepto('');
            setFecha(getToday());
            setShowForm(false);
        } catch (error) {
            console.error('Error al agregar transacción:', error);
            toast.error('Error al procesar solicitud');
        }
    };

    const handleDelete = async (trans) => {
        if (confirm(`¿Estás seguro de eliminar la transacción "${trans.concepto}"?`)) {
            try {
                if (isYouthRole() && !canDoDirectly()) {
                    await createPendingAction(
                        'delete_transaction',
                        { id: trans.id, concepto: trans.concepto, monto: trans.monto },
                        currentUser,
                        ministryId
                    );
                    toast.info('✋ Solicitud de eliminación enviada al encargado.');
                } else {
                    await deleteTransaction(trans.id);
                    loadData();
                    toast.success('Transacción eliminada');
                }
            } catch (error) {
                console.error('Error al eliminar transacción:', error);
                toast.error('Error al procesar eliminación');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Balance Card */}
            <div className={`rounded-2xl p-6 text-white shadow-lg ${balance?.alerta ? 'bg-red-600' : 'bg-blue-600'}`}>
                <div className="text-blue-100 mb-1 text-sm font-medium">Balance Actual</div>
                <div className="text-4xl font-bold mb-4">${balance?.balance.toFixed(2)}</div>

                {balance?.alerta && (
                    <div className="bg-white/20 rounded-lg p-3 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-300" />
                        <span className="text-sm font-semibold">ALERTA: El fondo está por debajo de los $1,000</span>
                    </div>
                )}

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
                    <div>
                        <div className="text-xs text-blue-100 mb-1">Fondo Base</div>
                        <div className="font-semibold">${balance?.fondoBase}</div>
                    </div>
                    <div>
                        <div className="text-xs text-blue-100 mb-1">Ingresos</div>
                        <div className="font-semibold text-green-300">+${balance?.ingresos.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-xs text-blue-100 mb-1">Salidas</div>
                        <div className="font-semibold text-red-300">-${balance?.salidas.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Nueva Transacción</h2>

                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <button
                                onClick={() => setTipo('ingreso')}
                                className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 font-medium transition-colors ${tipo === 'ingreso'
                                    ? 'bg-green-50 border-green-500 text-green-700'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <TrendingUp className="w-5 h-5" /> Ingreso
                            </button>
                            <button
                                onClick={() => setTipo('salida')}
                                className={`flex-1 py-3 rounded-lg border-2 flex items-center justify-center gap-2 font-medium transition-colors ${tipo === 'salida'
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <TrendingDown className="w-5 h-5" /> Salida
                            </button>
                        </div>

                        <input
                            type="number"
                            placeholder="Monto *"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <input
                            type="text"
                            placeholder="Concepto *"
                            value={concepto}
                            onChange={(e) => setConcepto(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    setShowForm(false);
                                    setMonto('');
                                    setConcepto('');
                                    setFecha(getToday());
                                }}
                                className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddTransaction}
                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                            >
                                Registrar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Historial */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">Historial de Transacciones</h2>
                <div className="space-y-3">
                    {transactions.map(trans => (
                        <div key={trans.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${trans.tipo === 'ingreso' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                    }`}>
                                    {trans.tipo === 'ingreso' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <div>
                                    <div className="font-semibold text-gray-900">{trans.concepto}</div>
                                    <div className="text-xs text-gray-500">{trans.fecha}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`font-bold ${trans.tipo === 'ingreso' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {trans.tipo === 'ingreso' ? '+' : '-'}${parseFloat(trans.monto).toFixed(2)}
                                </div>
                                <button
                                    onClick={() => handleDelete(trans)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}

                    {transactions.length === 0 && !showForm && (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No hay transacciones registradas
                        </div>
                    )}
                </div>
            </div>

            {/* FAB */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-105 active:scale-95 z-50"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}
        </div>
    );
};
