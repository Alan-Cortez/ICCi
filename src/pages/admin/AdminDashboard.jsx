import React, { useState, useEffect } from 'react';
import { Users, Church, Calendar, DollarSign, TrendingUp, Cake, AlertTriangle, UserX } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { ChartCard } from '../../components/admin/ChartCard';
import {
    getGeneralStats,
    getMemberGrowthStats,
    getAttendanceStats,
    getAgeDistribution,
    getUpcomingBirthdays,
    getUpcomingEvents,
    getLowFundsMinistries,
    getInactiveMembers,
    getMemberTrend
} from '../../services/statsService';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [memberGrowth, setMemberGrowth] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState(null);
    const [ageDistribution, setAgeDistribution] = useState([]);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState([]);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [lowFunds, setLowFunds] = useState([]);
    const [inactiveMembers, setInactiveMembers] = useState([]);
    const [memberTrend, setMemberTrend] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [
                generalStats,
                growthData,
                attendance,
                ageData,
                birthdays,
                events,
                lowFundsData,
                inactive,
                trend
            ] = await Promise.all([
                getGeneralStats(),
                getMemberGrowthStats(6),
                getAttendanceStats(),
                getAgeDistribution(),
                getUpcomingBirthdays(7),
                getUpcomingEvents(7),
                getLowFundsMinistries(1000),
                getInactiveMembers(30),
                getMemberTrend()
            ]);

            setStats(generalStats);
            setMemberGrowth(growthData);
            setAttendanceStats(attendance);
            setAgeDistribution(ageData);
            setUpcomingBirthdays(birthdays);
            setUpcomingEvents(events);
            setLowFunds(lowFundsData);
            setInactiveMembers(inactive);
            setMemberTrend(trend);
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    const formattedGrowthData = memberGrowth.map(item => ({
        mes: monthNames[parseInt(item.mes.split('-')[1]) - 1],
        total: item.total
    }));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Dashboard
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Vista general del sistema
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Miembros"
                    value={stats?.totalMembers || 0}
                    icon={Users}
                    color="blue"
                    trend={memberTrend?.trend}
                    trendValue={`${memberTrend?.percentage}%`}
                    loading={loading}
                />
                <StatCard
                    title="Ministerios Activos"
                    value={stats?.totalMinistries || 0}
                    icon={Church}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Eventos Este Mes"
                    value={stats?.eventsThisMonth || 0}
                    icon={Calendar}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Fondos Totales"
                    value={`$${(stats?.totalFunds || 0).toLocaleString()}`}
                    icon={DollarSign}
                    color="yellow"
                    loading={loading}
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Member Growth Chart */}
                <ChartCard
                    title="Crecimiento de Miembros"
                    description="Últimos 6 meses"
                    loading={loading}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={formattedGrowthData}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                            <XAxis
                                dataKey="mes"
                                className="text-gray-600 dark:text-gray-400"
                                tick={{ fill: 'currentColor' }}
                            />
                            <YAxis
                                className="text-gray-600 dark:text-gray-400"
                                tick={{ fill: 'currentColor' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--tooltip-bg)',
                                    border: '1px solid var(--tooltip-border)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="total"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                name="Miembros"
                                dot={{ fill: '#3B82F6', r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Age Distribution Chart */}
                <ChartCard
                    title="Distribución por Edad"
                    description="Rangos de edad de miembros"
                    loading={loading}
                >
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={ageDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ rango, percent }) => `${rango}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="total"
                            >
                                {ageDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Alerts and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Birthdays */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Cake className="w-5 h-5 text-pink-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Cumpleaños Próximos
                        </h3>
                    </div>
                    {upcomingBirthdays.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay cumpleaños próximos
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingBirthdays.map((member) => (
                                <div key={member.id} className="flex items-center gap-3 p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg">
                                    <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                                        <Cake className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {member.nombre} {member.apellido_paterno}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {member.dia_cumpleanos} de {monthNames[member.mes_cumpleanos - 1]}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upcoming Events */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            Eventos Próximos
                        </h3>
                    </div>
                    {upcomingEvents.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            No hay eventos próximos
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {upcomingEvents.map((event) => (
                                <div key={event.id} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-gray-100">
                                            {event.nombre}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(event.fecha).toLocaleDateString('es-MX')}
                                            {event.ministerio_nombre && ` • ${event.ministerio_nombre}`}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Warnings Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Funds Alert */}
                {lowFunds.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Ministerios con Fondos Bajos
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {lowFunds.map((ministry) => (
                                <div key={ministry.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {ministry.nombre}
                                    </span>
                                    <span className="text-red-600 dark:text-red-400 font-bold">
                                        ${ministry.balance.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inactive Members */}
                {inactiveMembers.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900/50 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <UserX className="w-5 h-5 text-yellow-500" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Miembros Inactivos
                            </h3>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                            Sin asistencia en los últimos 30 días
                        </p>
                        <div className="space-y-2">
                            {inactiveMembers.slice(0, 5).map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {member.nombre} {member.apellido_paterno}
                                    </span>
                                    {member.telefono && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {member.telefono}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
