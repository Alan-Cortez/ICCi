import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { formatDate } from './dateHelpers';

/**
 * Exporta el reporte grupal a Excel con múltiples hojas
 */
export const exportGroupReportToExcel = (youthList, attendanceRecords, startDate, endDate) => {
    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();

    // HOJA 1: Resumen General
    const summaryData = [
        ['REPORTE GRUPAL DE JÓVENES'],
        [`Periodo: ${formatDate(startDate)} - ${formatDate(endDate)}`],
        [],
        ['Nombre', 'Asistencia %', 'Biblia %', 'Apuntes %', 'Puntualidad %'],
        ...youthList.map(youth => [
            `${youth.nombre} ${youth.apellido_paterno}`,
            youth.attendancePercentage || 0,
            youth.biblePercentage || 0,
            youth.notesPercentage || 0,
            youth.punctualityPercentage || 0
        ]),
        [],
        ['ESTADÍSTICAS GENERALES'],
        ['Total de Jóvenes', youthList.length],
        ['Promedio Asistencia', (youthList.reduce((sum, y) => sum + (y.attendancePercentage || 0), 0) / youthList.length).toFixed(1) + '%'],
        ['Promedio Biblia', (youthList.reduce((sum, y) => sum + (y.biblePercentage || 0), 0) / youthList.length).toFixed(1) + '%'],
        ['Promedio Apuntes', (youthList.reduce((sum, y) => sum + (y.notesPercentage || 0), 0) / youthList.length).toFixed(1) + '%'],
        ['Promedio Puntualidad', (youthList.reduce((sum, y) => sum + (y.punctualityPercentage || 0), 0) / youthList.length).toFixed(1) + '%']
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

    // Aplicar estilos (ancho de columnas)
    ws1['!cols'] = [
        { wch: 30 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
    ];

    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');

    // HOJA 2: Detalle por Joven
    const detailData = [
        ['DETALLE POR JOVEN'],
        [],
        ['Nombre', 'Género', 'Fecha Ingreso', 'Teléfono', 'Asistencias', 'Faltas', 'Justificadas']
    ];

    youthList.forEach(youth => {
        detailData.push([
            `${youth.nombre} ${youth.apellido_paterno}`,
            youth.genero === 'M' ? 'Masculino' : 'Femenino',
            youth.fecha_ingreso ? formatDate(youth.fecha_ingreso) : 'N/A',
            youth.telefono || 'N/A',
            youth.attendedCount || 0,
            youth.absentCount || 0,
            youth.justifiedCount || 0
        ]);
    });

    const ws2 = XLSX.utils.aoa_to_sheet(detailData);
    ws2['!cols'] = [
        { wch: 30 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
    ];

    XLSX.utils.book_append_sheet(wb, ws2, 'Detalle');

    // HOJA 3: Asistencias Diarias
    if (attendanceRecords && attendanceRecords.length > 0) {
        const dailyData = [
            ['ASISTENCIAS DIARIAS'],
            [],
            ['Fecha', 'Nombre', 'Estado', 'Puntual', 'Biblia', 'Apuntes', 'Evento Especial', 'Notas']
        ];

        attendanceRecords.forEach(record => {
            const youth = youthList.find(y => y.youth_id === record.youth_id);
            if (youth) {
                dailyData.push([
                    formatDate(record.fecha),
                    `${youth.nombre} ${youth.apellido_paterno}`,
                    record.presente ? 'Presente' : (record.justificado ? 'Justificado' : 'Ausente'),
                    record.puntual ? 'Sí' : 'No',
                    record.biblia ? 'Sí' : 'No',
                    record.apuntes ? 'Sí' : 'No',
                    record.es_evento_especial ? 'Sí' : 'No',
                    record.notas || ''
                ]);
            }
        });

        const ws3 = XLSX.utils.aoa_to_sheet(dailyData);
        ws3['!cols'] = [
            { wch: 12 },
            { wch: 30 },
            { wch: 12 },
            { wch: 10 },
            { wch: 10 },
            { wch: 10 },
            { wch: 15 },
            { wch: 30 }
        ];

        XLSX.utils.book_append_sheet(wb, ws3, 'Asistencias Diarias');
    }

    // Generar archivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });

    // Descargar
    saveAs(blob, `reporte_jovenes_${startDate}_${endDate}.xlsx`);
};

/**
 * Exporta el perfil individual de un joven a Excel
 */
export const exportYouthProfileToExcel = (youth, attendanceRecords, complianceRecords, stats) => {
    const wb = XLSX.utils.book_new();

    // HOJA 1: Información Personal
    const personalData = [
        ['PERFIL DE JOVEN'],
        [],
        ['Nombre Completo', `${youth.nombre} ${youth.apellido_paterno} ${youth.apellido_materno || ''}`],
        ['Género', youth.genero === 'M' ? 'Masculino' : 'Femenino'],
        ['Fecha de Nacimiento', youth.fecha_nacimiento ? formatDate(youth.fecha_nacimiento) : 'N/A'],
        ['Teléfono', youth.telefono || 'N/A'],
        ['Fecha de Ingreso', youth.fecha_ingreso ? formatDate(youth.fecha_ingreso) : 'N/A'],
        [],
        ['ESTADÍSTICAS'],
        ['Asistencia', `${stats.attendancePercentage}%`],
        ['Biblia', `${stats.biblePercentage}%`],
        ['Apuntes', `${stats.notesPercentage}%`],
        ['Puntualidad', `${stats.punctualityPercentage}%`]
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(personalData);
    ws1['!cols'] = [{ wch: 25 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, ws1, 'Información');

    // HOJA 2: Historial de Asistencia
    if (attendanceRecords && attendanceRecords.length > 0) {
        const attendanceData = [
            ['HISTORIAL DE ASISTENCIA'],
            [],
            ['Fecha', 'Estado', 'Puntual', 'Evento Especial', 'Reunión Cancelada', 'Notas']
        ];

        attendanceRecords.forEach(record => {
            attendanceData.push([
                formatDate(record.fecha),
                record.presente ? 'Presente' : (record.justificado ? 'Justificado' : 'Ausente'),
                record.puntual ? 'Sí' : 'No',
                record.es_evento_especial ? 'Sí' : 'No',
                record.es_reunion_cancelada ? 'Sí' : 'No',
                record.notas || ''
            ]);
        });

        const ws2 = XLSX.utils.aoa_to_sheet(attendanceData);
        ws2['!cols'] = [
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 15 },
            { wch: 18 },
            { wch: 30 }
        ];
        XLSX.utils.book_append_sheet(wb, ws2, 'Asistencia');
    }

    // Generar y descargar
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, `${youth.nombre}_${youth.apellido_paterno}_perfil.xlsx`);
};
