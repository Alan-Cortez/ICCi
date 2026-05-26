import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DollarSign, TrendingUp, TrendingDown, Plus, Trash2, Download,
    Filter, X, ChevronLeft, ChevronRight, Loader2, Building2,
    Menu, LogOut, User, AlertTriangle, BarChart3, Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
    getAllTransactions, addTransaction, deleteTransaction,
    getCurrentBalance, getMonthlyBalance, getAllMinistriesBalances,
    CATEGORIAS_INGRESO, CATEGORIAS_SALIDA
} from '../services/fundService';
import { getAllMinistries } from '../services/ministryService';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const fmt = (n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n ?? 0);

const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const EMPTY_FORM = {
    tipo: 'ingreso',
    monto: '',
    concepto: '',
    categoria: '',
    fecha: new Date().toISOString().split('T')[0],
    ministryId: ''
};

export const Treasury = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();

    // ── Data ──────────────────────────────────────────────────────────────────
    const [globalBalance, setGlobalBalance]         = useState({ balance: 0, ingresos: 0, salidas: 0 });
    const [monthlyBalance, setMonthlyBalance]       = useState({ ingresos: 0, salidas: 0, balance: 0 });
    const [transactions, setTransactions]           = useState([]);
    const [ministries, setMinistries]               = useState([]);
    const [ministriesBalances, setMinistriesBalances] = useState([]);
    const [loading, setLoading]                     = useState(true);
    const [submitting, setSubmitting]               = useState(false);

    // ── UI ────────────────────────────────────────────────────────────────────
    const [showForm, setShowForm]         = useState(false);
    const [showFilters, setShowFilters]   = useState(false);
    const [activeTab, setActiveTab]       = useState('transactions'); // 'transactions' | 'ministries'
    const [sidebarOpen, setSidebarOpen]   = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [formData, setFormData]         = useState(EMPTY_FORM);
    const [currentDate, setCurrentDate]   = useState(new Date());

    // ── Filters ───────────────────────────────────────────────────────────────
    const [filterTipo, setFilterTipo]         = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterMinistry, setFilterMinistry] = useState('');
    const [filterDesde, setFilterDesde]       = useState('');
    const [filterHasta, setFilterHasta]       = useState('');
    const [searchTerm, setSearchTerm]         = useState('');

    // ── Load ──────────────────────────────────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const year  = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;

            const [gb, mb, txns, mins, minBal] = await Promise.all([
                getCurrentBalance(),
                getMonthlyBalance(year, month),
                getAllTransactions({ tipo: filterTipo || undefined, categoria: filterCategoria || undefined, ministryId: filterMinistry || undefined, desde: filterDesde || undefined, hasta: filterHasta || undefined }),
                getAllMinistries(),
                getAllMinistriesBalances()
            ]);

            setGlobalBalance(gb);
            setMonthlyBalance(mb);
            setTransactions(txns);
            setMinistries(mins);
            setMinistriesBalances(minBal);
        } catch (err) {
            toast.error('Error al cargar datos de tesorería');
        } finally {
            setLoading(false);
        }
    }, [currentDate, filterTipo, filterCategoria, filterMinistry, filterDesde, filterHasta]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.concepto.trim() || !formData.monto || !formData.categoria) {
            toast.warn('Completa todos los campos obligatorios');
            return;
        }
        try {
            setSubmitting(true);
            await addTransaction({
                tipo:         formData.tipo,
                monto:        parseFloat(formData.monto),
                concepto:     formData.concepto.trim(),
                categoria:    formData.categoria,
                fecha:        formData.fecha,
                ministryId:   formData.ministryId || null,
                registradoPor: currentUser?.nombre || 'Desconocido'
            });
            toast.success(`${formData.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'} registrado correctamente`);
            setFormData(EMPTY_FORM);
            setShowForm(false);
            loadData();
        } catch {
            toast.error('Error al registrar la transacción');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteTransaction(deleteTarget.id);
            toast.success('Transacción eliminada');
            setDeleteTarget(null);
            loadData();
        } catch {
            toast.error('Error al eliminar la transacción');
        }
    };

    const handleExport = () => {
        const data = filteredTxns.map(t => ({
            Fecha:         t.fecha,
            Tipo:          t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
            Categoría:     t.categoria || '—',
            Concepto:      t.concepto,
            Ministerio:    t.ministry_nombre || 'General',
            Monto:         parseFloat(t.monto),
            'Registrado Por': t.registrado_por || '—'
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tesorería');
        XLSX.writeFile(wb, `tesoreria_${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}.xlsx`);
        toast.success('Reporte exportado correctamente');
    };

    const resetFilters = () => {
        setFilterTipo('');
        setFilterCategoria('');
        setFilterMinistry('');
        setFilterDesde('');
        setFilterHasta('');
        setSearchTerm('');
    };

    const changeMonth = (dir) => {
        const d = new Date(currentDate);
        d.setMonth(d.getMonth() + dir);
        setCurrentDate(d);
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const filteredTxns = transactions.filter(t =>
        !searchTerm ||
        t.concepto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.ministry_nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const categorias = formData.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_SALIDA;
    const hasActiveFilters = filterTipo || filterCategoria || filterMinistry || filterDesde || filterHasta;

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

            {/* ── Sidebar ── */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                md:relative md:translate-x-0
            `}>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-amber-600">💰 Tesorería</h2>
                            <p className="text-xs text-gray-400 mt-0.5">ICCi</p>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <nav className="flex-1 space-y-1">
                        <button
                            onClick={() => setActiveTab('transactions')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium
                                ${activeTab === 'transactions' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <DollarSign className="w-4 h-4" /> Transacciones
                        </button>
                        <button
                            onClick={() => setActiveTab('ministries')}
                            className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors text-sm font-medium
                                ${activeTab === 'ministries' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                        >
                            <Building2 className="w-4 h-4" /> Por Ministerio
                        </button>
                    </nav>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center gap-3 p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors text-sm"
                        >
                            <ChevronLeft className="w-4 h-4" /> Volver al inicio
                        </button>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{currentUser?.nombre}</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">Tesorero</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" /> Cerrar sesión
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

                {/* Header */}
                <header className="bg-white dark:bg-gray-800 shadow-sm px-6 py-4 flex items-center justify-between gap-4 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500">
                            <Menu className="w-6 h-6" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                {activeTab === 'transactions' ? 'Transacciones' : 'Balance por Ministerio'}
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <button onClick={() => changeMonth(-1)} className="text-gray-400 hover:text-gray-600">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                                </span>
                                <button onClick={() => changeMonth(1)} className="text-gray-400 hover:text-gray-600">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                        >
                            <Download className="w-4 h-4" /> Exportar
                        </button>
                        <button
                            onClick={() => setShowForm(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors text-sm font-semibold shadow-sm shadow-amber-200"
                        >
                            <Plus className="w-4 h-4" /> Nueva transacción
                        </button>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

                    {/* ── Summary cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Balance global */}
                        <div className={`rounded-2xl p-5 text-white shadow-lg col-span-1 ${globalBalance.balance >= 0 ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-red-500 to-red-600'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium opacity-90">Balance General</span>
                                <DollarSign className="w-5 h-5 opacity-80" />
                            </div>
                            <p className="text-3xl font-bold">{fmt(globalBalance.balance)}</p>
                            <p className="text-xs opacity-75 mt-1">Total acumulado</p>
                        </div>

                        {/* Ingresos del mes */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Ingresos del mes</span>
                                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{fmt(monthlyBalance.ingresos)}</p>
                            <p className="text-xs text-gray-400 mt-1">{MONTH_NAMES[currentDate.getMonth()]}</p>
                        </div>

                        {/* Gastos del mes */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Gastos del mes</span>
                                <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                                    <TrendingDown className="w-4 h-4 text-red-500" />
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-red-500">{fmt(monthlyBalance.salidas)}</p>
                            <p className="text-xs text-gray-400 mt-1">{MONTH_NAMES[currentDate.getMonth()]}</p>
                        </div>
                    </div>

                    {/* ── Alerta balance bajo ── */}
                    {globalBalance.balance < 500 && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                ⚠️ El balance general está bajo ({fmt(globalBalance.balance)}). Se recomienda revisar los fondos.
                            </p>
                        </div>
                    )}

                    {/* ── TAB: Transactions ── */}
                    {activeTab === 'transactions' && (
                        <div className="space-y-4">
                            {/* Search + Filters bar */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="text"
                                        placeholder="Buscar por concepto, categoría o ministerio..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-300 dark:text-gray-100"
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(v => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${hasActiveFilters ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                >
                                    <Filter className="w-4 h-4" />
                                    Filtros {hasActiveFilters && `(${[filterTipo, filterCategoria, filterMinistry, filterDesde, filterHasta].filter(Boolean).length})`}
                                </button>
                                {hasActiveFilters && (
                                    <button onClick={resetFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:text-red-600 font-medium">
                                        <X className="w-4 h-4" /> Limpiar
                                    </button>
                                )}
                            </div>

                            {/* Filter panel */}
                            {showFilters && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tipo</label>
                                        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none">
                                            <option value="">Todos</option>
                                            <option value="ingreso">Ingresos</option>
                                            <option value="salida">Gastos</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Categoría</label>
                                        <select value={filterCategoria} onChange={e => setFilterCategoria(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none">
                                            <option value="">Todas</option>
                                            {[...CATEGORIAS_INGRESO, ...CATEGORIAS_SALIDA].filter((v, i, a) => a.indexOf(v) === i).map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Ministerio</label>
                                        <select value={filterMinistry} onChange={e => setFilterMinistry(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none">
                                            <option value="">Todos</option>
                                            {ministries.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Desde</label>
                                        <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Hasta</label>
                                        <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)}
                                            className="w-full px-3 py-1.5 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none" />
                                    </div>
                                </div>
                            )}

                            {/* Transactions table */}
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                {loading ? (
                                    <div className="flex justify-center items-center p-16">
                                        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                                    </div>
                                ) : filteredTxns.length === 0 ? (
                                    <div className="text-center py-16 text-gray-400 dark:text-gray-500">
                                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p className="font-medium">No hay transacciones</p>
                                        <p className="text-sm mt-1">Registra la primera con el botón "Nueva transacción"</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-5 py-3">Fecha</th>
                                                    <th className="px-5 py-3">Tipo</th>
                                                    <th className="px-5 py-3">Categoría</th>
                                                    <th className="px-5 py-3">Concepto</th>
                                                    <th className="px-5 py-3">Ministerio</th>
                                                    <th className="px-5 py-3">Registrado por</th>
                                                    <th className="px-5 py-3 text-right">Monto</th>
                                                    <th className="px-5 py-3" />
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {filteredTxns.map(t => (
                                                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                            {t.fecha}
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${t.tipo === 'ingreso' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                                {t.tipo === 'ingreso' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                {t.tipo === 'ingreso' ? 'Ingreso' : 'Gasto'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            {t.categoria
                                                                ? <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">{t.categoria}</span>
                                                                : <span className="text-gray-400">—</span>
                                                            }
                                                        </td>
                                                        <td className="px-5 py-3 font-medium text-gray-900 dark:text-gray-100 max-w-[200px] truncate">
                                                            {t.concepto}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400">
                                                            {t.ministry_nombre || <span className="italic text-gray-300">General</span>}
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                                            {t.registrado_por || '—'}
                                                        </td>
                                                        <td className={`px-5 py-3 text-right font-bold whitespace-nowrap ${t.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                                                            {t.tipo === 'ingreso' ? '+' : '-'}{fmt(t.monto)}
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <button
                                                                onClick={() => setDeleteTarget(t)}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                                title="Eliminar"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {/* Footer summary */}
                                        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-sm">
                                            <span className="text-gray-500">{filteredTxns.length} transaccione{filteredTxns.length !== 1 ? 's' : ''}</span>
                                            <div className="flex gap-6">
                                                <span className="text-green-600 font-semibold">
                                                    +{fmt(filteredTxns.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + parseFloat(t.monto), 0))}
                                                </span>
                                                <span className="text-red-500 font-semibold">
                                                    -{fmt(filteredTxns.filter(t => t.tipo === 'salida').reduce((s, t) => s + parseFloat(t.monto), 0))}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* ── TAB: Ministries ── */}
                    {activeTab === 'ministries' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {ministriesBalances.length === 0 ? (
                                    <div className="col-span-3 text-center py-16 text-gray-400">
                                        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                        <p>No hay ministerios registrados</p>
                                    </div>
                                ) : (
                                    ministriesBalances.map(m => (
                                        <div key={m.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{m.nombre}</h3>
                                                    <p className={`text-xs font-semibold mt-0.5 ${m.balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                        Balance: {fmt(m.balance)}
                                                    </p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${m.balance >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                    <BarChart3 className={`w-5 h-5 ${m.balance >= 0 ? 'text-green-600' : 'text-red-500'}`} />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Ingresos</p>
                                                    <p className="text-sm font-bold text-green-700 dark:text-green-300">{fmt(m.total_ingresos)}</p>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
                                                    <p className="text-xs text-red-500 dark:text-red-400 font-medium mb-1">Gastos</p>
                                                    <p className="text-sm font-bold text-red-600 dark:text-red-300">{fmt(m.total_salidas)}</p>
                                                </div>
                                            </div>
                                            {/* Balance bar */}
                                            <div className="mt-3">
                                                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    {(parseFloat(m.total_ingresos) + parseFloat(m.total_salidas)) > 0 && (
                                                        <div
                                                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                                            style={{ width: `${Math.min(100, (parseFloat(m.total_ingresos) / (parseFloat(m.total_ingresos) + parseFloat(m.total_salidas))) * 100)}%` }}
                                                        />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {(parseFloat(m.total_ingresos) + parseFloat(m.total_salidas)) === 0 ? 'Sin movimientos' : 'Ingresos vs Gastos'}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* ── Mobile overlay ── */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* ── Nueva Transacción Modal ── */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nueva Transacción</h3>
                            <button onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Tipo toggle */}
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                                {['ingreso', 'salida'].map(t => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData(f => ({ ...f, tipo: t, categoria: '' }))}
                                        className={`py-2 rounded-lg text-sm font-semibold transition-all ${formData.tipo === t
                                            ? t === 'ingreso' ? 'bg-green-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        {t === 'ingreso' ? '↑ Ingreso' : '↓ Gasto'}
                                    </button>
                                ))}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría *</label>
                                <select value={formData.categoria} onChange={e => setFormData(f => ({ ...f, categoria: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300" required>
                                    <option value="">Selecciona una categoría</option>
                                    {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Concepto *</label>
                                <input type="text" value={formData.concepto}
                                    onChange={e => setFormData(f => ({ ...f, concepto: e.target.value }))}
                                    placeholder="Descripción breve"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monto *</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
                                    <input type="number" min="0.01" step="0.01" value={formData.monto}
                                        onChange={e => setFormData(f => ({ ...f, monto: e.target.value }))}
                                        placeholder="0.00"
                                        className="w-full pl-7 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
                                    <input type="date" value={formData.fecha}
                                        onChange={e => setFormData(f => ({ ...f, fecha: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ministerio</label>
                                    <select value={formData.ministryId} onChange={e => setFormData(f => ({ ...f, ministryId: e.target.value }))}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-300">
                                        <option value="">General</option>
                                        {ministries.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={submitting}
                                    className={`flex-1 px-4 py-2 rounded-lg text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${formData.tipo === 'ingreso' ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    {submitting ? 'Guardando...' : `Registrar ${formData.tipo === 'ingreso' ? 'ingreso' : 'gasto'}`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                        <div className="text-5xl mb-4">🗑️</div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Eliminar transacción</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                            ¿Estás seguro de eliminar este registro?
                        </p>
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">{deleteTarget.concepto}</p>
                        <p className={`text-lg font-bold mb-6 ${deleteTarget.tipo === 'ingreso' ? 'text-green-600' : 'text-red-500'}`}>
                            {deleteTarget.tipo === 'ingreso' ? '+' : '-'}{fmt(deleteTarget.monto)}
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteTarget(null)}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-colors">
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
