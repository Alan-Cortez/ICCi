import React, { useState, useEffect } from 'react';
import { Calendar, Users, TrendingUp, Award, Clock, CheckCircle2, Sparkles, BarChart3, ClipboardCheck, Cake, AlertTriangle, Mic2, BookOpen, Download } from 'lucide-react';
import { getAllYouthMembers } from '../../services/youthService';
import { getAttendanceByDate, getRiskYouth } from '../../services/attendanceService';
import { getPendingAssignments } from '../../services/leadershipService';
import { getEventsByMinistry } from '../../services/eventService';
import html2canvas from 'html2canvas';
import { FastingCalendar } from './FastingCalendar';

export const YouthDashboard = ({ ministryId, setActiveTab }) => {
    const [stats, setStats] = useState({
        totalYouth: 0,
        thisWeekAttendance: 0,
        attendancePercentage: 0,
        upcomingEvents: [],
        upcomingBirthdays: [],
        riskYouth: [],
        pendingAssignments: []
    });
    const [loading, setLoading] = useState(true);
    const [recentAttendance, setRecentAttendance] = useState([]);
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
    const [showAllRisk, setShowAllRisk] = useState(false);

    const assignmentsRef = React.useRef(null);

    // Helpers
    const getNextSaturdayDate = () => {
        const d = new Date();
        const day = d.getDay();
        const diff = (day === 6 && d.getHours() >= 17) ? 7 : (6 - day + 7) % 7;
        if (diff === 0 && d.getHours() < 17) return d;
        d.setDate(d.getDate() + diff);
        return d;
    };

    const calculateTimeLeft = () => {
        const nextSatDate = getNextSaturdayDate();
        nextSatDate.setHours(17, 0, 0, 0);

        const now = new Date();
        const difference = nextSatDate - now;

        if (difference > 0) {
            setTimeLeft({
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60)
            });
        }
    };

    const getLastSaturday = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 6 ? 0 : (day + 1);
        d.setDate(d.getDate() - diff);
        return d;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', weekday: 'long' });
    };

    const handleExportAssignments = async () => {
        if (!assignmentsRef.current) return;
        try {
            const element = assignmentsRef.current;
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: true, // Enabled for debugging
                useCORS: true,
                allowTaint: true,
                ignoreElements: (element) => element.tagName === 'BUTTON' // Ignore the download button itself
            });

            const image = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            link.href = image;
            link.download = `Asignaciones_Jovenes_${new Date().toISOString().split('T')[0]}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting image:', error);
            alert(`Error al exportar la imagen: ${error.message}`);
        }
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch Data
            const youth = await getAllYouthMembers();

            // Calculate Birthdays
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 14);

            const upcomingBirthdays = youth.filter(m => {
                const bday = new Date(today.getFullYear(), m.mes_cumpleanos - 1, m.dia_cumpleanos);
                if (bday < today) bday.setFullYear(today.getFullYear() + 1);
                return bday >= today && bday <= nextWeek;
            }).sort((a, b) => {
                const dateA = new Date(today.getFullYear(), a.mes_cumpleanos - 1, a.dia_cumpleanos);
                if (dateA < today) dateA.setFullYear(today.getFullYear() + 1);
                const dateB = new Date(today.getFullYear(), b.mes_cumpleanos - 1, b.dia_cumpleanos);
                if (dateB < today) dateB.setFullYear(today.getFullYear() + 1);
                return dateA - dateB;
            });

            // Attendance Data
            const lastSaturday = getLastSaturday(today);
            const lastSaturdayStr = lastSaturday.toISOString().split('T')[0];

            let attendanceData = [];
            try {
                attendanceData = await getAttendanceByDate(lastSaturdayStr);
            } catch (error) {
                console.log('No attendance data available');
            }

            // Events
            let upcomingEvents = [];
            if (ministryId) {
                try {
                    const allEvents = await getEventsByMinistry(ministryId);
                    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());

                    upcomingEvents = allEvents
                        .filter(e => {
                            const [y, m, d] = e.fecha.split('-').map(Number);
                            const eventDate = new Date(y, m - 1, d);
                            return eventDate >= todayMidnight;
                        })
                        .sort((a, b) => a.fecha.localeCompare(b.fecha))
                        .slice(0, 3);
                } catch (error) {
                    console.log('No upcoming events/error', error);
                }
            }

            // Risk Youth
            let riskYouth = [];
            try {
                riskYouth = await getRiskYouth(2);
            } catch (error) {
                console.error('Error fetching risk youth:', error);
            }

            // Assignments
            let pendingAssignments = [];
            try {
                pendingAssignments = await getPendingAssignments();
            } catch (error) {
                console.error('Error fetching assignments:', error);
            }

            // Stats Logic
            const presentCount = attendanceData.filter(a => a.presente).length;
            const attendancePercentage = youth.length > 0
                ? Math.round((presentCount / youth.length) * 100)
                : 0;

            setStats({
                totalYouth: youth.length,
                thisWeekAttendance: presentCount,
                attendancePercentage,
                upcomingEvents,
                upcomingBirthdays,
                riskYouth,
                pendingAssignments
            });

            setRecentAttendance(attendanceData);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
        const timer = setInterval(calculateTimeLeft, 60000);
        calculateTimeLeft();
        return () => clearInterval(timer);
    }, []);


    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Countdown Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                    <div className="text-center lg:text-left">
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold">Sábado de Jóvenes</h2>
                    </div>

                    <div className="flex gap-3 md:gap-4 w-full lg:w-auto justify-center">
                        <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 lg:flex-none lg:min-w-[80px] border border-white/10">
                            <div className="text-xl md:text-3xl font-bold">{timeLeft.days}</div>
                            <div className="text-[10px] md:text-xs text-blue-200 uppercase font-medium">Días</div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 lg:flex-none lg:min-w-[80px] border border-white/10">
                            <div className="text-xl md:text-3xl font-bold">{timeLeft.hours}</div>
                            <div className="text-[10px] md:text-xs text-blue-200 uppercase font-medium">Horas</div>
                        </div>
                        <div className="text-center bg-white/10 backdrop-blur-md rounded-xl p-3 flex-1 lg:flex-none lg:min-w-[80px] border border-white/10">
                            <div className="text-xl md:text-3xl font-bold">{timeLeft.minutes}</div>
                            <div className="text-[10px] md:text-xs text-blue-200 uppercase font-medium">Min</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    icon={Users}
                    label="Total Jóvenes"
                    value={stats.totalYouth}
                    color="text-blue-600"
                    bg="bg-blue-50"
                    trend="+2 nuevos"
                    trendUp={true}
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Asistencia Semanal"
                    value={stats.thisWeekAttendance}
                    color="text-green-600"
                    bg="bg-green-50"
                    trend="Último sábado"
                    trendUp={null}
                />
                <StatCard
                    icon={TrendingUp}
                    label="% Asistencia"
                    value={`${stats.attendancePercentage}%`}
                    color="text-purple-600"
                    bg="bg-purple-50"
                    trend="Promedio"
                    trendUp={true}
                />
                <StatCard
                    icon={Cake}
                    label="Cumpleaños"
                    value={stats.upcomingBirthdays.length}
                    color="text-pink-600"
                    bg="bg-pink-50"
                    trend="Próx. 15 días"
                    trendUp={null}
                />
            </div>

            {/* Pending Assignments Section (Weekly) */}
            {stats.pendingAssignments.length > 0 && (
                <section
                    ref={assignmentsRef}
                    className="rounded-2xl shadow-sm border p-6 animate-in slide-in-from-bottom-2 relative"
                    style={{ backgroundColor: '#ffffff', borderColor: '#f3f4f6' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Mic2 className="w-6 h-6" style={{ color: '#4f46e5' }} />
                            <h2 className="text-xl font-bold" style={{ color: '#111827' }}>Próximas Asignaciones</h2>
                        </div>
                        <button
                            onClick={handleExportAssignments}
                            className="p-2 rounded-lg transition-colors print:hidden"
                            style={{ color: '#9ca3af' }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#4f46e5';
                                e.currentTarget.style.backgroundColor = '#eef2ff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#9ca3af';
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                            title="Descargar imagen"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        {Object.entries(
                            stats.pendingAssignments
                                .filter(a => a.tipo !== 'ayuno')
                                .reduce((groups, assign) => {
                                    const date = assign.fecha_asignada;
                                    if (!groups[date]) groups[date] = [];
                                    groups[date].push(assign);
                                    return groups;
                                }, {})
                        ).sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                            .map(([date, assignments]) => (
                                <div key={date} className="border-b last:border-0 pb-6 last:pb-0" style={{ borderColor: '#f3f4f6' }}>
                                    <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2" style={{ color: '#6b7280' }}>
                                        <Calendar className="w-4 h-4" />
                                        {formatDate(date)}
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {assignments.map(assign => (
                                            <div key={assign.id} className="p-4 rounded-xl border flex items-start gap-3" style={{ backgroundColor: '#eef2ff', borderColor: '#e0e7ff' }}>
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#e0e7ff' }}>
                                                    {assign.tipo === 'predicacion' ? (
                                                        <BookOpen className="w-5 h-5" style={{ color: '#4f46e5' }} />
                                                    ) : (
                                                        <Mic2 className="w-5 h-5" style={{ color: '#4f46e5' }} />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border inline-block mb-1" style={{ color: '#4f46e5', backgroundColor: '#ffffff', borderColor: '#e0e7ff' }}>
                                                        {assign.tipo === 'predicacion' ? 'Predicación' :
                                                            assign.tipo === 'intercesion' ? 'Intercesión' : 'Ayuno'}
                                                    </span>
                                                    <h3 className="font-bold text-sm" style={{ color: '#111827' }}>
                                                        {assign.nombre} {assign.apellido_paterno}
                                                    </h3>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                </section>
            )}

            {/* Calendario de Ayuno */}
            <section className="animate-in slide-in-from-bottom-3 duration-500 delay-100">
                <FastingCalendar assignments={stats.pendingAssignments} loading={loading} />
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Events Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                <Award className="w-5 h-5 text-indigo-600" />
                                Eventos Próximos
                            </h3>
                            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800 transition-colors">
                                Ver todos
                            </button>
                        </div>

                        <div className="space-y-4">
                            {stats.upcomingEvents.length > 0 ? (
                                stats.upcomingEvents.map((event, i) => (
                                    <EventItem key={i} event={event} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    No hay eventos próximos
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Acciones Rápidas</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <QuickAction
                                icon={ClipboardCheck}
                                title="Tomar Asistencia"
                                desc="Registro semanal"
                                color="bg-blue-600"
                                onClick={() => setActiveTab && setActiveTab('attendance')}
                            />
                            <QuickAction
                                icon={BarChart3}
                                title="Ver Reportes"
                                desc="Estadísticas"
                                color="bg-indigo-600"
                                onClick={() => setActiveTab && setActiveTab('reports')}
                            />
                        </div>
                    </div>
                </div>

                {/* Sidebar Column (Birthdays & Recent Activity) */}
                <div className="space-y-6">
                    {/* Birthdays */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <Cake className="w-5 h-5 text-pink-500" />
                            Cumpleaños
                        </h3>
                        {stats.upcomingBirthdays.length > 0 ? (
                            <div className="space-y-4">
                                {stats.upcomingBirthdays.map(m => (
                                    <div key={m.youth_id} className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-sm">
                                            {m.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{m.nombre} {m.apellido_paterno}</p>
                                            <p className="text-xs text-gray-500">{m.dia_cumpleanos} de {getMonthName(m.mes_cumpleanos)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No hay cumpleaños cercanos</p>
                        )}
                    </div>

                    {/* Risk Alerts */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                            Asistencia Baja
                        </h3>
                        {stats.riskYouth.length > 0 ? (
                            <div className="space-y-3">
                                {(showAllRisk ? stats.riskYouth : stats.riskYouth.slice(0, 5)).map(m => ( // Show all or top 5
                                    <div key={m.youth_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${m.riskLevel === 'critical' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                                                {m.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{m.nombre} {m.apellido_paterno}</p>
                                                <p className="text-xs text-gray-500">{m.total_meetings} reuniones</p>
                                            </div>
                                        </div>
                                        <div className={`text-xs font-bold px-2 py-1 rounded-full ${m.riskLevel === 'critical' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                                            {Math.round(m.percentage)}%
                                        </div>
                                    </div>
                                ))}
                                {!showAllRisk && stats.riskYouth.length > 5 && (
                                    <button 
                                        onClick={() => setShowAllRisk(true)}
                                        className="w-full text-xs text-center text-blue-600 hover:text-blue-800 font-medium mt-2 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                        + Mostrar {stats.riskYouth.length - 5} más
                                    </button>
                                )}
                                {showAllRisk && stats.riskYouth.length > 5 && (
                                    <button 
                                        onClick={() => setShowAllRisk(false)}
                                        className="w-full text-xs text-center text-gray-500 hover:text-gray-700 font-medium mt-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                                        Ocultar lista
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-gray-500">¡Todo se ve bien!</p>
                            </div>
                        )}
                    </div>

                    {/* Recent Stats Mini */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-900 text-lg mb-4">Última Reunión</h3>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-3xl font-bold text-gray-900">{recentAttendance.filter(a => a.presente).length}</span>
                                <span className="text-sm text-gray-500 font-medium mb-1.5">Asistentes</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full"
                                    style={{ width: `${stats.attendancePercentage}%` }}
                                ></div>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 text-right">{stats.attendancePercentage}% asistencia</p>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

// Sub-components
const StatCard = ({ icon: Icon, label, value, color, bg, trend, trendUp }) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bg}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            {trend && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${trendUp === true ? 'bg-green-50 text-green-700' : trendUp === false ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <h4 className="text-2xl font-bold text-gray-900">{value}</h4>
            <p className="text-sm text-gray-500 font-medium">{label}</p>
        </div>
    </div>
);

const EventItem = ({ event }) => {
    const [year, month, day] = event.fecha.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    return (
        <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
            <div className="flex-shrink-0 w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex flex-col items-center justify-center border border-indigo-100">
                <span className="text-xs font-bold uppercase">{date.toLocaleDateString('es-MX', { month: 'short' })}</span>
                <span className="text-xl font-bold leading-none">{day}</span>
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.nombre}</h4>
                <p className="text-sm text-gray-500 line-clamp-1">{event.descripcion || 'Sin descripción'}</p>
            </div>
            <div className="text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                {date.toLocaleDateString('es-MX', { weekday: 'short' })}
            </div>
        </div>
    );
};

const QuickAction = ({ icon: Icon, title, desc, color, onClick }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center text-center gap-3 p-4 bg-gray-50 hover:bg-white rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-md transition-all group w-full">
        <div className={`p-4 rounded-full ${color} text-white shadow-lg group-hover:scale-110 group-hover:shadow-blue-200 transition-all`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <span className="block font-bold text-gray-900 text-sm leading-tight mb-1">{title}</span>
            <span className="text-xs text-gray-500">{desc}</span>
        </div>
    </button>
);

const getMonthName = (monthNum) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[monthNum - 1];
};
