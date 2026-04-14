import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Users, Calendar, Search, Shield, Menu, X,
    ChevronLeft, ChevronRight, Cake, LogOut, User, BookOpen, Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OfflineIndicator } from '../components/OfflineIndicator';
import { ThemeToggle } from '../components/ThemeToggle';
import { DailyVerse } from '../components/DailyVerse';
import { getMembersByBirthdayMonth, getAllMembers } from '../services/memberService';
import { getEventsByMonth } from '../services/eventService';
import { getAllMinistries } from '../services/ministryService';
import { Loader2 } from 'lucide-react';
import { MemberProfileModal } from '../components/MemberProfileModal';
import { NotificationBell } from '../components/notifications/NotificationBell';

export const Home = () => {
    const navigate = useNavigate();
    const { currentUser, logout, isAdmin, isLeader } = useAuth();

    // Data States
    const [birthdays, setBirthdays] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [events, setEvents] = useState([]);
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);

    // UI States
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
    const [searchTerm, setSearchTerm] = useState('');

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const loadData = async () => {
        try {
            setLoading(true);

            const currentMonth = currentDate.getMonth() + 1; // 1-12
            const currentYear = currentDate.getFullYear();

            const [birthdaysData, allMembersData, eventsData, ministriesData] = await Promise.all([
                getMembersByBirthdayMonth(currentMonth),
                getAllMembers(),
                getEventsByMonth(currentMonth, currentYear),
                getAllMinistries()
            ]);

            setBirthdays(birthdaysData);
            setAllMembers(allMembersData);
            setEvents(eventsData);
            setMinistries(ministriesData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const handleMinistryClick = (ministry) => {
        if (ministry.nombre.toLowerCase().includes('jóvenes') || ministry.nombre.toLowerCase().includes('jovenes')) {
            navigate('/youth-ministry');
        } else {
            navigate(`/ministry/${ministry.id}`);
        }
    };

    const changeMonth = (increment) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + increment);
        setCurrentDate(newDate);
    };



    const currentMonthName = monthNames[currentDate.getMonth()];

    if (loading && ministries.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Offline Indicator */}
            <OfflineIndicator />

            {/* Sidebar Navigation */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0
                `}
            >
                <div className="p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-bold text-blue-600">ICCi</h2>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="md:hidden text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <nav className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        <button
                            onClick={() => navigate('/members')}
                            className={`
                                w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                                ${window.location.pathname === '/members' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}
                            `}
                        >
                            <Users className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-sm">Directorio de Miembros</span>
                        </button>

                        {(isAdmin() || isLeader()) && (
                            <>
                                <div className="pt-4 pb-2">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ministerios</p>
                                </div>
                                {ministries
                                    .filter(ministry => isAdmin() || (isLeader() && ministry.id === currentUser?.ministry_id))
                                    .map(ministry => (
                                        <button
                                            key={ministry.id}
                                            onClick={() => handleMinistryClick(ministry)}
                                            className={`
                                            w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 transition-colors
                                            ${ministry.nombre.toLowerCase().includes('jóvenes')
                                                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }
                                        `}
                                        >
                                            <Users className={`w-5 h-5 ${ministry.nombre.toLowerCase().includes('jóvenes') ? 'text-blue-600' : 'text-gray-400'}`} />
                                            <span className="font-medium text-sm">{ministry.nombre}</span>
                                        </button>
                                    ))}
                            </>
                        )}
                    </nav>

                    <div className="pt-6 border-t border-gray-100 mt-4 space-y-2">
                        {isAdmin() && (
                            <>
                                <button
                                    onClick={() => navigate('/sermons')}
                                    className="w-full flex items-center gap-3 p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                                >
                                    <BookOpen className="w-5 h-5 text-gray-400" />
                                    <span className="font-medium text-sm">Escritos</span>
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => navigate('/notifications')}
                            className="w-full flex items-center gap-3 p-3 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-400" />
                            <span className="font-medium text-sm">Notificaciones</span>
                        </button>

                        {/* User Info & Logout */}
                        <div className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{currentUser?.nombre}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {currentUser?.role === 'admin' ? 'Administrador' : currentUser?.role === 'leader' ? 'Líder' : 'Miembro'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* Header / Topbar */}
                <header className="bg-white dark:bg-gray-800 shadow-sm px-8 py-4 z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="relative hidden sm:block w-64 lg:w-96">
                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-100 border-transparent focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 rounded-xl transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <ThemeToggle />

                        {isAdmin() && (
                            <button
                                onClick={() => navigate('/admin')}
                                className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Administración"
                            >
                                <Shield className="w-5 h-5" />
                                <span className="hidden sm:inline text-sm font-medium">Admin</span>
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/add-member')}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
                        >
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline text-sm font-bold">Nuevo Miembro</span>
                        </button>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
                    {/* Welcome Banner */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bienvenido, {currentUser?.nombre}</h1>
                        <p className="text-gray-500 dark:text-gray-400">{isAdmin() ? 'Panel de control general' : isLeader() ? 'Gestiona tu ministerio y ve eventos' : 'Puedes agregar nuevos miembros'}</p>
                    </div>

                    {/* Search Results */}
                    {searchTerm && (
                        <section className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    <Search className="w-5 h-5 text-blue-600" />
                                    Resultados para "{searchTerm}"
                                </h2>
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                >
                                    Limpiar búsqueda
                                </button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {allMembers
                                    .filter(m =>
                                        m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        m.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        m.apellido_materno?.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .slice(0, 12) // Limit for performance on Home
                                    .map(member => (
                                        <button
                                            key={member.id}
                                            onClick={() => setSelectedMember(member)}
                                            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3 hover:shadow-md transition-all text-left group"
                                        >
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 dark:text-white truncate">{member.nombre} {member.apellido_paterno}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {member.genero} • {member.dia_cumpleanos} de {monthNames[member.mes_cumpleanos - 1]}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                {allMembers.filter(m =>
                                    m.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    m.apellido_paterno.toLowerCase().includes(searchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="mb-1 font-medium">No se encontraron miembros</p>
                                        <p className="text-sm italic">Prueba con otro nombre o apellido</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}

                    {/* Daily Verse */}
                    <DailyVerse />

                    {/* Calendar Section */}
                    <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
                            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-2 text-blue-600">
                                    <Calendar className="w-6 h-6" />
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Calendario de Eventos</h2>
                                </div>

                                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => changeMonth(-1)}
                                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-500"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <span className="px-4 font-bold text-gray-700 w-32 text-center">
                                        {currentMonthName}
                                    </span>
                                    <button
                                        onClick={() => changeMonth(1)}
                                        className="p-1 hover:bg-white rounded-md shadow-sm transition-all text-gray-500"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6">
                                {events.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        No hay eventos programados para {currentMonthName}
                                    </div>
                                ) : (
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {events.map(event => (
                                            <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-100 hover:shadow-md transition-shadow group">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 text-blue-700 rounded-lg font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                        <span className="text-xs uppercase">{currentMonthName.substring(0, 3)}</span>
                                                        <span className="text-xl">{event.fecha.split('-')[2]}</span>
                                                    </div>
                                                    {event.ministerio_nombre && (
                                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                                                            {event.ministerio_nombre}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-gray-900 mb-1">{event.nombre}</h3>
                                                <p className="text-sm text-gray-500 line-clamp-2">{event.descripcion}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                        </section>

                    {/* Birthdays Section - Admin Only */}
                    {birthdays.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Cake className="w-6 h-6 text-pink-500" />
                                <h2 className="text-xl font-bold text-gray-900">Cumpleaños de {currentMonthName}</h2>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {birthdays.map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => setSelectedMember(member)}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer text-left w-full hover:scale-105"
                                    >
                                        <div className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center shrink-0">
                                            <Cake className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{member.nombre}</div>
                                            <div className="text-xs text-gray-500">{member.dia_cumpleanos} de {currentMonthName}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Member Profile Modal */}
            <MemberProfileModal
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
            />
        </div>
    );
};
