import { jsPDF } from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { formatDate } from './dateHelpers';

applyPlugin(jsPDF);

const downloadPdf = (doc, filename) => {
    saveAs(doc.output('blob'), filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
};

const tableFinalY = (doc, fallback = 50) => doc.lastAutoTable?.finalY ?? fallback;

/**
 * Exporta el perfil individual de un joven a PDF
 */
export const exportYouthProfileToPDF = (youth, attendanceRecords, complianceRecords, stats) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(59, 130, 246); // blue-600
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('Perfil de Joven', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont(undefined, 'normal');
    doc.text(`${youth.nombre} ${youth.apellido_paterno} ${youth.apellido_materno || ''}`, pageWidth / 2, 30, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    let yPos = 50;

    // Información Personal
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Información Personal', 14, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Género: ${youth.genero === 'M' ? 'Masculino' : 'Femenino'}`, 14, yPos);
    yPos += 7;

    if (youth.fecha_nacimiento) {
        doc.text(`Fecha de Nacimiento: ${formatDate(youth.fecha_nacimiento)}`, 14, yPos);
        yPos += 7;
    }

    if (youth.telefono) {
        doc.text(`Teléfono: ${youth.telefono}`, 14, yPos);
        yPos += 7;
    }

    if (youth.fecha_ingreso) {
        doc.text(`Fecha de Ingreso: ${formatDate(youth.fecha_ingreso)}`, 14, yPos);
        yPos += 7;
    }

    yPos += 5;

    // Estadísticas Generales
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Estadísticas', 14, yPos);
    yPos += 10;

    const statsData = [
        ['Asistencia', `${stats.attendancePercentage}%`],
        ['Biblia', `${stats.biblePercentage}%`],
        ['Apuntes', `${stats.notesPercentage}%`],
        ['Puntualidad', `${stats.punctualityPercentage}%`]
    ];

    doc.autoTable({
        startY: yPos,
        head: [['Indicador', 'Porcentaje']],
        body: statsData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
    });

    yPos = tableFinalY(doc, yPos) + 10;

    // Historial de Asistencia (últimos 10 registros)
    if (attendanceRecords && attendanceRecords.length > 0) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('Historial de Asistencia (Últimos 10 registros)', 14, yPos);
        yPos += 10;

        const attendanceData = attendanceRecords.slice(0, 10).map(record => [
            formatDate(record.fecha),
            record.presente ? '✓ Presente' : (record.justificado ? '⚠ Justificado' : '✗ Ausente'),
            record.puntual ? 'Sí' : 'No',
            record.es_evento_especial ? 'Sí' : 'No'
        ]);

        doc.autoTable({
            startY: yPos,
            head: [['Fecha', 'Estado', 'Puntual', 'Evento Especial']],
            body: attendanceData,
            theme: 'striped',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 14 }
        });

        yPos = tableFinalY(doc, yPos) + 10;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generado el ${formatDate(new Date().toISOString().split('T')[0])} - Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    downloadPdf(doc, `${youth.nombre}_${youth.apellido_paterno}_perfil.pdf`);
};

/**
 * Exporta el reporte grupal a PDF
 */
export const exportGroupReportToPDF = (youthList, startDate, endDate, title = 'Reporte Grupal', filename) => {
    if (!youthList?.length) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.width;
    const periodText = startDate && endDate
        ? `${formatDate(startDate)} - ${formatDate(endDate)}`
        : title;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Periodo: ${periodText}`, pageWidth / 2, 28, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    const tableData = youthList.map((youth) => [
        youth.nombre,
        `${youth.attendedDays ?? 0} / ${youth.totalDays ?? 0}`,
        `${youth.attendancePercentage || 0}%`,
        `${youth.biblePercentage || 0}%`,
        `${youth.notesPercentage || 0}%`,
        `${youth.punctualityPercentage || 0}%`,
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nombre', 'Reuniones', 'Asistencia', 'Biblia', 'Apuntes', 'Puntualidad']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246], fontStyle: 'bold' },
        margin: { left: 10, right: 10 },
        styles: { fontSize: 8, overflow: 'linebreak', cellWidth: 'wrap' },
        columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 28, halign: 'center' },
            2: { cellWidth: 28, halign: 'center' },
            3: { cellWidth: 24, halign: 'center' },
            4: { cellWidth: 24, halign: 'center' },
            5: { cellWidth: 28, halign: 'center' },
        },
    });

    const yPos = tableFinalY(doc, 50) + 15;

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Estadísticas Generales', 14, yPos);

    const count = youthList.length;
    const avgAttendance = youthList.reduce((sum, y) => sum + (y.attendancePercentage || 0), 0) / count;
    const avgBible = youthList.reduce((sum, y) => sum + (y.biblePercentage || 0), 0) / count;
    const avgNotes = youthList.reduce((sum, y) => sum + (y.notesPercentage || 0), 0) / count;
    const avgPunctuality = youthList.reduce((sum, y) => sum + (y.punctualityPercentage || 0), 0) / count;

    const statsData = [
        ['Promedio de Asistencia', `${avgAttendance.toFixed(1)}%`],
        ['Promedio de Biblia', `${avgBible.toFixed(1)}%`],
        ['Promedio de Apuntes', `${avgNotes.toFixed(1)}%`],
        ['Promedio de Puntualidad', `${avgPunctuality.toFixed(1)}%`],
        ['Total de Jóvenes', count.toString()],
    ];

    doc.autoTable({
        startY: yPos + 5,
        body: statsData,
        theme: 'plain',
        margin: { left: 14, right: 14 },
        styles: { fontSize: 11 },
    });

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Generado el ${formatDate(new Date().toISOString().split('T')[0])} - Página ${i} de ${pageCount}`,
            pageWidth / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
        );
    }

    const safeName = (filename || `reporte_jovenes_${startDate || 'periodo'}_${endDate || ''}`)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();

    downloadPdf(doc, `${safeName || 'reporte_jovenes'}.pdf`);
};

/**
 * Exporta una lista de miembros general a PDF
 */
export const exportMemberListToPDF = (memberList, title = 'Lista de Miembros') => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(title, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Generado el ${formatDate(new Date().toISOString().split('T')[0])}`, pageWidth / 2, 28, { align: 'center' });

    doc.setTextColor(0, 0, 0);

    const tableData = memberList.map(m => [
        `${m.nombre} ${m.apellido_paterno} ${m.apellido_materno || ''}`,
        m.telefono || 'N/A',
        m.genero === 'M' ? 'Masc' : 'Fem',
        m.fecha_nacimiento ? formatDate(m.fecha_nacimiento) : 'N/A'
    ]);

    doc.autoTable({
        startY: 50,
        head: [['Nombre Completo', 'Teléfono', 'Género', 'Cumpleaños']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
        margin: { left: 14, right: 14 }
    });

    downloadPdf(doc, `${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};
