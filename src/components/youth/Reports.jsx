import React, { useState, useEffect } from 'react';
import { Loader2, FileText, Download, FileSpreadsheet, TrendingUp, Users, DollarSign, PieChart, BarChart2 } from 'lucide-react';
import {
    generateDailyReport,
    generateWeeklyReport,
    generateMonthlyReport,
    generateAnnualReport,
    generateFinancialReport,
    generateAttendanceTrends
} from '../../services/reportService';
import { getToday, getDateRange } from '../../utils/dateHelpers';
import { exportGroupReportToPDF } from '../../utils/pdfExport';
import { exportGroupReportToExcel } from '../../utils/excelExport';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const Reports = ({ ministryId }) => { // Accept ministryId prop
    const [reportType, setReportType] = useState('weekly'); // Default to weekly for better charts
    const [activeTab, setActiveTab] = useState('general');
    const [reportData, setReportData] = useState(null);
    const [financialData, setFinancialData] = useState(null);
    const [trendData, setTrendData] = useState([]);
    const [loading, setLoading] = useState(false);

    // NEW: Month and Year States
    const today = new Date();
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);

    // Auto-load on mount or change
    useEffect(() => {
        handleGenerateReport();
    }, [reportType, selectedYear, selectedMonth]);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            let data;
            let periodRange = { start: '', end: '' };

            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;

            // 1. General Report Data
            switch (reportType) {
                case 'daily':
                    data = await generateDailyReport(getToday());
                    periodRange = { start: getToday(), end: getToday() };
                    break;
                case 'weekly':
                    data = await generateWeeklyReport();
                    const wRange = getDateRange('weekly');
                    periodRange = { start: wRange.start, end: wRange.end };
                    break;
                case 'monthly':
                    // Usar el mes y año seleccionado
                    data = await generateMonthlyReport(selectedMonth, selectedYear);
                    const mRange = getDateRange('monthly', selectedYear, selectedMonth);
                    periodRange = { start: mRange.start, end: mRange.end };
                    break;
                case 'annual':
                    // Usar el año seleccionado
                    data = await generateAnnualReport(selectedYear);
                    const aRange = getDateRange('annual', selectedYear);
                    periodRange = { start: aRange.start, end: aRange.end };
                    break;
            }
            setReportData(data);

            // 2. Financial Data (if ministryId)
            if (ministryId) {
                try {
                    const finData = await generateFinancialReport(ministryId, periodRange.start, periodRange.end);
                    setFinancialData(finData);
                } catch (err) {
                    console.log("Financial data error (optional)", err);
                }
            }

            // 3. Trend Data (Always fetching weekly or monthly trends logic)
            // Use 'weekly' trends for daily/weekly reports, 'monthly' for monthly/annual
            const trendType = (reportType === 'daily' || reportType === 'weekly') ? 'weekly' : 'monthly';
            const trends = await generateAttendanceTrends(trendType);
            setTrendData(trends);

        } catch (error) {
            console.error('Error al generar reporte:', error);
            // alert('Error al generar reporte'); // Silent fail better for auto-load
        } finally {
            setLoading(false);
        }
    };

    const getReportTypeLabel = (type) => {
        const labels = { daily: 'Diario', weekly: 'Semanal', monthly: 'Mensual', annual: 'Anual' };
        return labels[type];
    };

    const handleExportPDF = () => {
        if (!reportData) return;
        const startDate = reportData.startDate || getToday();
        const endDate = reportData.endDate || getToday();
        exportGroupReportToPDF(reportData.youthReports, startDate, endDate, `Reporte ${getReportTypeLabel(reportType)}`);
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        const startDate = reportData.startDate || getToday();
        const endDate = reportData.endDate || getToday();
        const attendanceRecords = reportData.attendanceRecords || [];
        exportGroupReportToExcel(reportData.youthReports, attendanceRecords, startDate, endDate);
    };

    const SummaryTab = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-5 h-5" /></div>
                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{reportData?.overallStats?.totalMeetings || 0} Reuniones</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">{reportData?.overallStats?.attendance?.presentPercentage || 0}%</div>
                <div className="text-sm text-gray-500">Asistencia Promedio</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp className="w-5 h-5" /></div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${financialData?.netBalance >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {financialData?.netBalance >= 0 ? '+' : ''}{financialData?.netBalance || 0}
                    </span>
                </div>
                <div className="text-3xl font-bold text-gray-900">${financialData?.netBalance || 0}</div>
                <div className="text-sm text-gray-500">Balance Neto</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-gray-900">{reportData?.overallStats?.compliance?.bothPercentage || 0}%</div>
                <div className="text-sm text-gray-500">Cumplimiento Completo (Biblia + Notas)</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><DollarSign className="w-5 h-5" /></div>
                </div>
                <div className="text-3xl font-bold text-gray-900">${financialData?.totalIncome || 0}</div>
                <div className="text-sm text-gray-500">Ingresos Totales</div>
            </div>

            {/* Attendance Trend Chart (Mini) */}
            <div className="col-span-1 md:col-span-2 lg:col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tendencia de Asistencia</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Line type="monotone" dataKey="asistencia" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="% Asistencia" />
                        <Line type="monotone" dataKey="total" stroke="#cbd5e1" strokeWidth={2} dot={false} name="Total Asistentes" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const AttendanceTab = () => {
        const pieData = [
            { name: 'Presentes', value: reportData?.overallStats?.attendance?.presentPercentage || 0 },
            { name: 'Ausentes', value: reportData?.overallStats?.attendance?.absentPercentage || 0 },
            { name: 'Justificados', value: reportData?.overallStats?.attendance?.justifiedPercentage || 0 },
        ];

        const complianceData = [
            { name: 'Biblia', value: reportData?.overallStats?.compliance?.biblePercentage || 0 },
            { name: 'Apuntes', value: reportData?.overallStats?.compliance?.notesPercentage || 0 },
            { name: 'Ambos', value: reportData?.overallStats?.compliance?.bothPercentage || 0 },
        ];

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Distribución de Asistencia</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RePieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                <Cell fill="#22c55e" /> {/* Presentes */}
                                <Cell fill="#ef4444" /> {/* Ausentes */}
                                <Cell fill="#eab308" /> {/* Justificados */}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Legend verticalAlign="bottom" height={36} />
                        </RePieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Cumplimiento de Materiales (Promedio %)</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={complianceData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}%`} />
                            <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px' }} formatter={(value) => `${value}%`} />
                            <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    const FinanceTab = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-80">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Ingresos vs Egresos</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                            { name: 'Ingresos', value: financialData?.totalIncome || 0 },
                            { name: 'Egresos', value: financialData?.totalExpense || 0 },
                        ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ borderRadius: '12px' }} />
                            <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} barSize={60}>
                                {
                                    [
                                        { name: 'Ingresos', value: financialData?.totalIncome || 0 },
                                        { name: 'Egresos', value: financialData?.totalExpense || 0 },
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen Financiero</h3>
                    <div className="flex-1 space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">Transacciones</span>
                            <span className="font-bold text-gray-900">{financialData?.stats?.transactionCount || 0}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">Promedio Ingreso</span>
                            <span className="font-bold text-green-600">${Math.round(financialData?.stats?.avgIncome || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <span className="text-gray-600 font-medium">Promedio Gasto</span>
                            <span className="font-bold text-red-600">${Math.round(financialData?.stats?.avgExpense || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const IndividualTab = () => (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-bold text-gray-900">Reporte Individual</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={handleExportPDF}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                    >
                        <Download className="w-4 h-4" /> PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="flex-1 sm:flex-none justify-center flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Excel
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {reportData?.youthReports.map((youth, index) => (
                    <div key={index} className="flex flex-col md:flex-row justify-between p-5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all gap-4 shadow-sm">
                        <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 text-lg truncate">{youth.nombre}</div>
                            <div className="text-sm text-gray-500 mt-1 truncate">
                                {youth.telefono || 'Sin teléfono'}
                            </div>
                        </div>
                        
                        <div className="flex-1 w-full max-w-md">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-medium text-gray-700">Asistencia ({youth.attendancePercentage || 0}%)</span>
                                <span className="text-gray-500 font-semibold">{youth.attendedDays || 0} de {youth.totalDays || 0} reuniones</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3 overflow-hidden">
                                <div 
                                    className={`h-2.5 rounded-full ${youth.attendancePercentage >= 80 ? 'bg-green-500' : youth.attendancePercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${youth.attendancePercentage || 0}%` }}
                                ></div>
                            </div>
                            <div className="flex items-center gap-6 mt-2">
                                <div className="text-center flex-1 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-1">Biblia</div>
                                    <div className="font-bold text-blue-600 text-sm">{youth.biblePercentage || 0}%</div>
                                </div>
                                <div className="text-center flex-1 bg-white border border-gray-100 rounded-lg p-2 shadow-sm">
                                    <div className="text-xs text-gray-500 mb-1">Apuntes</div>
                                    <div className="font-bold text-indigo-600 text-sm">{youth.notesPercentage || 0}%</div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const GeneralTab = () => (
        <div className="space-y-8 animate-in fade-in pb-8">
            <SummaryTab />
            <AttendanceTab />
            <FinanceTab />
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Control Panel */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-20 z-10">
                <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 scrollbar-hide w-full md:w-auto mt-4 md:mt-0 flex-1 justify-end order-1 md:order-none">
                    {['daily', 'weekly', 'monthly', 'annual'].map(type => (
                        <button
                            key={type}
                            onClick={() => setReportType(type)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex-1 md:flex-none ${reportType === type
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {getReportTypeLabel(type)}
                        </button>
                    ))}
                </div>

                {/* Filtros de Fecha Personalizados */}
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto order-3 md:order-none">
                    {reportType === 'monthly' && (
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 w-full sm:w-auto"
                        >
                            <option value={1}>Enero</option>
                            <option value={2}>Febrero</option>
                            <option value={3}>Marzo</option>
                            <option value={4}>Abril</option>
                            <option value={5}>Mayo</option>
                            <option value={6}>Junio</option>
                            <option value={7}>Julio</option>
                            <option value={8}>Agosto</option>
                            <option value={9}>Septiembre</option>
                            <option value={10}>Octubre</option>
                            <option value={11}>Noviembre</option>
                            <option value={12}>Diciembre</option>
                        </select>
                    )}

                    {(reportType === 'monthly' || reportType === 'annual') && (
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 w-full sm:w-auto"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    )}
                </div>

                <h2 className="text-sm font-medium text-gray-500 whitespace-nowrap order-2 md:order-none w-full md:w-auto text-center md:text-left">
                    Periodo: <span className="text-gray-900 font-bold">{reportData?.period}</span>
                </h2>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : (
                <>
                    {/* Navigation Tabs */}
                    <div className="flex border-b border-gray-200 mb-6">
                        {[
                            { id: 'general', label: 'Reporte General', icon: PieChart },
                            { id: 'individual', label: 'Reporte Individual', icon: Users }
                        ].map(tab => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-8 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Content */}
                    <div className="min-h-[400px]">
                        {activeTab === 'general' && <GeneralTab />}
                        {activeTab === 'individual' && <IndividualTab />}
                    </div>
                </>
            )}
        </div>
    );
};
