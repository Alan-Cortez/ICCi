
import React, { useState, useRef } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Download, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export const FastingCalendar = ({ assignments = [], loading = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const calendarRef = useRef(null);
    const [exporting, setExporting] = useState(false);

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

    // Filter ayuno assignments for the displayed month (including overlap days)
    const getAssignmentsForDay = (day) => {
        return assignments.filter(a =>
            a.tipo === 'ayuno' &&
            isSameDay(new Date(a.fecha_asignada + 'T00:00:00'), day) // Fix date parsing issue by adding time component or handling timezone if needed. 
            // Assuming fecha_asignada is YYYY-MM-DD string. 
            // Better: parse ISO string.
        );
    };

    const handleDownload = async () => {
        if (!calendarRef.current) return;

        try {
            setExporting(true);
            const element = calendarRef.current;

            // Wait a bit for any reliable rendering if needed
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                scale: 2, // Retína quality
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    const exportContainer = clonedDoc.getElementById('fasting-calendar-export');
                    if (exportContainer) {
                        // Force a fixed, wide width for the export to ensure grid layout is clean
                        exportContainer.style.width = '1200px';
                        exportContainer.style.minWidth = '1200px';
                        exportContainer.style.maxWidth = 'none';
                        exportContainer.style.height = 'auto'; // Ensure it grows

                        // Adjust grid columns if necessary, but 1200px should be enough for 7 columns (~170px each)
                    }

                    // Remove truncation from names to prevent cutting off text
                    // And ensure they wrap nicely instead of overlapping
                    const truncatedElements = clonedDoc.querySelectorAll('.truncate'); // Select all truncated elements within the clone
                    truncatedElements.forEach(el => {
                        el.classList.remove('truncate');
                        el.style.whiteSpace = 'normal';
                        el.style.overflow = 'visible';
                        el.style.textOverflow = 'clip';
                        el.style.height = 'auto'; // Let it grow
                    });

                    // Find the day cells and ensure they can grow
                    // They have min-h-[120px] and relative, update logic if needed
                    // But removing truncate and whiteSpace normal should handle the text content.
                }
            });

            const image = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = image;
            link.download = `Ayuno_${format(currentDate, 'MMMM_yyyy', { locale: es })}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading calendar:', error);
            alert('Error al descargar el calendario');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {/* Header controls - Not included in screenshot unless we capture parent. 
                We will capture `calendarRef` which usually allows specific capture. 
                Let's include the header in the capture for context. 
            */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900">Calendario de Ayuno</h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Mes anterior"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-semibold w-24 text-center capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: es })}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                        title="Mes siguiente"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    <button
                        onClick={handleDownload}
                        disabled={exporting}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Descargar
                    </button>
                </div>
            </div>

            {/* Calendar Grid to Capture */}
            <div className="overflow-x-auto pb-4 custom-scrollbar">
                <div
                    ref={calendarRef}
                    id="fasting-calendar-export"
                    className="p-4 md:p-6 min-w-[750px] lg:min-w-full"
                    style={{ backgroundColor: '#ffffff' }}
                >
                    <div className="text-center mb-6">
                        <h1 className="text-xl sm:text-3xl font-bold capitalize mb-1" style={{ color: '#111827' }}>
                            Ayuno de {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </h1>
                        <p className="text-sm" style={{ color: '#6b7280' }}>Ministerio de Jóvenes</p>
                    </div>

                    <div className="grid grid-cols-7 rounded-t-xl overflow-hidden" style={{ borderColor: '#e5e7eb', borderWidth: '1px', borderStyle: 'solid' }}>
                        {weekDays.map(day => (
                            <div key={day} className="py-3 text-center text-xs font-bold uppercase tracking-wider last:border-r-0" style={{ backgroundColor: '#fff7ed', color: '#9a3412', borderRight: '1px solid #e5e7eb' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 border-l border-b" style={{ borderColor: '#e5e7eb' }}>
                        {calendarDays.map((day, idx) => {
                            const dayAssignments = getAssignmentsForDay(day);
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            const isTodayDate = isToday(day);

                            return (
                                <div
                                    key={day.toString()}
                                    className="min-h-[120px] p-2 border-r border-b relative"
                                    style={{
                                        borderColor: '#e5e7eb',
                                        backgroundColor: !isCurrentMonth ? '#f9fafb' : '#ffffff'
                                    }}
                                >
                                    <span
                                        className={`text-sm font-medium block mb-2 ${isTodayDate ? 'w-6 h-6 rounded-full flex items-center justify-center' : ''}`}
                                        style={{
                                            backgroundColor: isTodayDate ? '#2563eb' : 'transparent',
                                            color: isTodayDate ? '#ffffff' : (!isCurrentMonth ? '#9ca3af' : '#374151')
                                        }}
                                    >
                                        {format(day, 'd')}
                                    </span>

                                    <div className="space-y-1">
                                        {dayAssignments.map((assign, i) => (
                                            <div
                                                key={`${assign.id}-${i}`}
                                                className="text-xs p-1.5 rounded border leading-tight"
                                                style={{
                                                    backgroundColor: '#fff7ed',
                                                    color: '#7c2d12',
                                                    borderColor: '#ffedd5'
                                                }}
                                            >
                                                <span className="font-semibold block truncate">
                                                    {assign.nombre}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
