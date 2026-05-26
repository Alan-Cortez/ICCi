import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Loader2, FileText, Download, FileSpreadsheet, TrendingUp, Users, DollarSign,
    PieChart, BarChart2, Calendar, AlertCircle
} from 'lucide-react';
import {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport,
    generateAnnualReport,
    generateFinancialReport,
    generateAttendanceTrends
} from '../../services/reportService';
import { getToday, getDateRange, formatDate, getMonthName } from '../../utils/dateHelpers';
import { exportGroupReportToPDF } from '../../utils/pdfExport';
import { exportGroupReportToExcel } from '../../utils/excelExport';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell
} from 'recharts';

const PERIOD_OPTIONS = [
    { id: 'daily', label: 'Día' },
    { id: 'weekly', label: 'Semana' },
    { id: 'monthly', label: 'Mes' },
    { id: 'annual', label: 'Año' },
];

const PIE_COLORS = ['#22c55e', '#ef4444', '#eab308'];

const SECTION_TABS = [
    { id: 'overview', label: 'Resumen', icon: PieChart },
    { id: 'attendance', label: 'Asistencia', icon: BarChart2 },
    { id: 'finance', label: 'Finanzas', icon: DollarSign, needsMinistry: true },
    { id: 'youth', label: 'Por joven', icon: Users },
];

function attendanceColor(pct) {
    if (pct >= 80) return 'bg-green-500';
    if (pct >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
}

export const Reports = ({ ministryId }) => {
    const today = new Date();
    const [reportType, setReportType] = useState('monthly');
    const [activeSection, setActiveSection] = useState('overview');
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedDay, setSelectedDay] = useState(getToday());
    const [reportData, setReportData] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [youthSort, setYouthSort] = useState('attendance-desc');

    const periodRange = useMemo(() => {
        switch (reportType) {
            case 'daily':
                return { start: selectedDay, end: selectedDay };
            case 'weekly':
                return getDateRange('weekly');
            case 'monthly':
                return getDateRange('monthly', selectedYear, selectedMonth);
            case 'annual':
                return getDateRange('annual', selectedYear);
            default:
                return { start: getToday(), end: getToday() };
        }
    }, [reportType, selectedYear, selectedMonth, selectedDay]);

    const periodLabel = useMemo(() => {
        switch (reportType) {
            case 'daily':
                return formatDate(selectedDay);
            case 'weekly':
                return `${formatDate(periodRange.start)} – ${formatDate(periodRange.end)}`;
            case 'monthly':
                return `${getMonthName(selectedMonth)} ${selectedYear}`;
            case 'annual':
                return `Año ${selectedYear}`;
            default:
                return '';
        }
    }, [reportType, periodRange, selectedDay, selectedMonth, selectedYear]);

    const visibleTabs = SECTION_TABS.filter(
        (t) => !t.needsMinistry || ministryId
    );

    const loadReport = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { start, end } = periodRange;

            let data;
            switch (reportType) {
                case 'daily':
                    data = await generateDailyReport(selectedDay);
                    break;
                case 'weekly':
                    data = await generateWeeklyReport();
                    break;
                case 'monthly':
                    data = await generateMonthlyReport(selectedMonth, selectedYear);
                    break;
                case 'annual':
                    data = await generateAnnualReport(selectedYear);
                    break;
                default:
                    data = null;
            }
            setReportData(data);

            if (ministryId) {
                try {
                    const finData = await generateFinancialReport(ministryId, start, end);
                    setFinancialData(finData);
                } catch {
                    setFinancialData(null);
                }
            } else {
                setFinancialData(null);
            }

            const trends = await generateAttendanceTrends(start, end);
            setTrendData(trends);
        } catch (err) {
            console.error('Error al generar reporte:', err);
            setError('No se pudo cargar el reporte. Verifica tu conexión e intenta de nuevo.');
            setReportData(null);
        } finally {
            setLoading(false);
        }
    }, [reportType, selectedYear, selectedMonth, selectedDay, periodRange, ministryId]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const sortedYouth = useMemo(() => {
        const list = [...(reportData?.youthReports || [])];
        switch (youthSort) {
            case 'name-asc':
                return list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
            case 'attendance-asc':
                return list.sort((a, b) => (a.attendancePercentage || 0) - (b.attendancePercentage || 0));
            case 'attendance-desc':
            default:
                return list.sort((a, b) => (b.attendancePercentage || 0) - (a.attendancePercentage || 0));
        }
    }, [reportData?.youthReports, youthSort]);

    const pieData = useMemo(() => {
        const s = reportData?.overallStats?.attendance;
        if (!s) return [];
        return [
            { name: 'Presentes', value: s.present },
            { name: 'Ausentes', value: s.absent },
            { name: 'Justificados', value: s.justified },
        ].filter((d) => d.value > 0);
    }, [reportData]);

    const handleExportPDF = () => {
        if (!reportData) return;
        const startDate = reportData.startDate || periodRange.start;
        const endDate = reportData.endDate || periodRange.end;
        exportGroupReportToPDF(reportData.youthReports, startDate, endDate, `Reporte ${periodLabel}`);
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        const startDate = reportData.startDate || periodRange.start;
        const endDate = reportData.endDate || periodRange.end;
        exportGroupReportToExcel(
            reportData.youthReports,
            reportData.attendanceRecords || [],
            startDate,
            endDate
        );
    };

    const KpiCard = ({ icon: Icon, iconBg, iconColor, value, label, hint }) => (
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-2">
                <div className={`p-2 ${iconBg} ${iconColor} rounded-lg`}>
                    <Icon className="w-5 h-5" />
                </div>
                {hint && (
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full">
                        {hint}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</div>
        </div>
    );

    const OverviewSection = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon={Users}
                    iconBg="bg-blue-50 dark:bg-blue-900/30"
                    iconColor="text-blue-600 dark:text-blue-400"
                    value={`${reportData?.overallStats?.attendance?.presentPercentage ?? 0}%`}
                    label="Asistencia global"
                    hint={`${reportData?.overallStats?.totalMeetings ?? 0} reuniones`}
                />
                <KpiCard
                    icon={FileText}
                    iconBg="bg-purple-50 dark:bg-purple-900/30"
                    iconColor="text-purple-600 dark:text-purple-400"
                    value={`${reportData?.overallStats?.compliance?.bothPercentage ?? 0}%`}
                    label="Biblia + apuntes"
                />
                <KpiCard
                    icon={TrendingUp}
                    iconBg="bg-green-50 dark:bg-green-900/30"
                    iconColor="text-green-600 dark:text-green-400"
                    value={financialData != null ? `$${financialData.netBalance ?? 0}` : '—'}
                    label="Balance del período"
                />
                <KpiCard
                    icon={Users}
                    iconBg="bg-orange-50 dark:bg-orange-900/30"
                    iconColor="text-orange-600 dark:text-orange-400"
                    value={reportData?.youthReports?.length ?? 0}
                    label="Jóvenes activos"
                />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-200">
                <strong>¿Cómo leer estos números?</strong> La asistencia de cada joven se calcula sobre las reuniones
                registradas en este período (las canceladas no cuentan). Usa la pestaña <em>Por joven</em> para el detalle
                y exportar PDF/Excel.
            </div>

            {trendData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-80">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tendencia del período</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">% de asistencia por reunión (o por mes en reportes anuales)</p>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                            <Tooltip formatter={(v, name) => [name === 'asistencia' ? `${v}%` : v, name === 'asistencia' ? 'Asistencia' : 'Presentes']} />
                            <Line type="monotone" dataKey="asistencia" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Asistencia %" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );

    const AttendanceSection = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[320px]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Registros de asistencia</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Cantidad de registros en el período</p>
                {pieData.length === 0 ? (
                    <p className="text-gray-500 text-center py-16">Sin registros de asistencia en este período</p>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <RePieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                                {pieData.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </RePieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm min-h-[320px]">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Materiales (promedio)</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">% de registros con biblia, apuntes o ambos</p>
                <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                        data={[
                            { name: 'Biblia', value: reportData?.overallStats?.compliance?.biblePercentage || 0 },
                            { name: 'Apuntes', value: reportData?.overallStats?.compliance?.notesPercentage || 0 },
                            { name: 'Ambos', value: reportData?.overallStats?.compliance?.bothPercentage || 0 },
                        ]}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={48} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const FinanceSection = () => {
        if (!ministryId) {
            return (
                <p className="text-gray-500 text-center py-12">No se encontró el ministerio de jóvenes para finanzas.</p>
            );
        }
        if (!financialData) {
            return (
                <p className="text-gray-500 text-center py-12">Sin movimientos financieros en este período.</p>
            );
        }
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm h-80">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ingresos vs egresos</h3>
                    <ResponsiveContainer width="100%" height="90%">
                        <BarChart
                            data={[
                                { name: 'Ingresos', value: financialData.totalIncome || 0 },
                                { name: 'Egresos', value: financialData.totalExpense || 0 },
                            ]}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(v) => `$${v}`} />
                            <Tooltip formatter={(v) => `$${v}`} />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={56}>
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Resumen</h3>
                    <div className="flex justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300">Transacciones</span>
                        <span className="font-bold">{financialData.stats?.transactionCount ?? 0}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300">Ingresos</span>
                        <span className="font-bold text-green-600">${financialData.totalIncome ?? 0}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300">Egresos</span>
                        <span className="font-bold text-red-600">${financialData.totalExpense ?? 0}</span>
                    </div>
                    <div className="flex justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                        <span className="text-gray-600 dark:text-gray-300">Balance neto</span>
                        <span className={`font-bold ${financialData.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${financialData.netBalance ?? 0}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    const YouthSection = () => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Detalle por joven</h3>
                    <p className="text-xs text-gray-500">{sortedYouth.length} jóvenes en el período</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={youthSort}
                        onChange={(e) => setYouthSort(e.target.value)}
                        className="text-sm border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                    >
                        <option value="attendance-desc">Mayor asistencia</option>
                        <option value="attendance-asc">Menor asistencia</option>
                        <option value="name-asc">Nombre A–Z</option>
                    </select>
                    <button
                        type="button"
                        onClick={handleExportPDF}
                        disabled={!reportData?.youthReports?.length}
                        className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 disabled:opacity-40"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={!reportData?.youthReports?.length}
                        className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 disabled:opacity-40"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                </div>
            </div>

            {sortedYouth.length === 0 ? (
                <p className="text-center text-gray-500 py-16">No hay jóvenes activos o sin datos en este período.</p>
            ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedYouth.map((youth) => (
                        <div key={youth.youth_id} className="p-4 sm:p-5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <div className="flex flex-col md:flex-row md:items-center gap-4">
                                <div className="md:w-1/3 min-w-0">
                                    <p className="font-semibold text-gray-900 dark:text-white truncate">{youth.nombre}</p>
                                    <p className="text-sm text-gray-500">{youth.telefono || 'Sin teléfono'}</p>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">
                                            Asistencia {youth.attendancePercentage ?? 0}%
                                        </span>
                                        <span className="text-gray-500">
                                            {youth.attendedDays ?? 0} / {youth.totalDays ?? 0} reuniones
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${attendanceColor(youth.attendancePercentage ?? 0)}`}
                                            style={{ width: `${Math.min(100, youth.attendancePercentage ?? 0)}%` }}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                        <span>Biblia: <strong className="text-blue-600">{youth.biblePercentage ?? 0}%</strong></span>
                                        <span>Apuntes: <strong className="text-indigo-600">{youth.notesPercentage ?? 0}%</strong></span>
                                        {youth.punctualityPercentage != null && (
                                            <span>Puntualidad: <strong>{youth.punctualityPercentage}%</strong></span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-5">
            {/* Encabezado y filtros */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 md:p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Reportes
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1">
                            <Calendar className="w-4 h-4" />
                            {periodLabel}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={loadReport}
                        disabled={loading}
                        className="text-sm text-blue-600 font-medium hover:underline disabled:opacity-50 self-start"
                    >
                        Actualizar
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {PERIOD_OPTIONS.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setReportType(opt.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                reportType === opt.id
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-3 items-end">
                    {reportType === 'daily' && (
                        <label className="flex flex-col gap-1 text-xs text-gray-500">
                            Fecha
                            <input
                                type="date"
                                value={selectedDay}
                                onChange={(e) => setSelectedDay(e.target.value)}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            />
                        </label>
                    )}
                    {reportType === 'monthly' && (
                        <label className="flex flex-col gap-1 text-xs text-gray-500">
                            Mes
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                                    <option key={m} value={m}>{getMonthName(m)}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    {(reportType === 'monthly' || reportType === 'annual') && (
                        <label className="flex flex-col gap-1 text-xs text-gray-500">
                            Año
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white"
                            >
                                {Array.from({ length: 5 }, (_, i) => today.getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </label>
                    )}
                    {reportType === 'weekly' && (
                        <p className="text-xs text-gray-500 pb-2">
                            Semana actual (lunes a domingo)
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    <p className="text-sm text-gray-500">Generando reporte…</p>
                </div>
            ) : !reportData ? (
                <div className="text-center py-20 text-gray-500">No hay datos para mostrar.</div>
            ) : (
                <>
                    <div className="flex overflow-x-auto gap-1 border-b border-gray-200 dark:border-gray-700 scrollbar-hide">
                        {visibleTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveSection(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                                        activeSection === tab.id
                                            ? 'border-blue-600 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="min-h-[280px]">
                        {activeSection === 'overview' && <OverviewSection />}
                        {activeSection === 'attendance' && <AttendanceSection />}
                        {activeSection === 'finance' && <FinanceSection />}
                        {activeSection === 'youth' && <YouthSection />}
                    </div>
                </>
            )}
        </div>
    );
};
