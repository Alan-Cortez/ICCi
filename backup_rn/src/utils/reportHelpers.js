// Funciones auxiliares para generar reportes

// Calcular porcentaje de asistencia
export const calculateAttendancePercentage = (attendanceRecords) => {
    if (attendanceRecords.length === 0) return 0;

    const present = attendanceRecords.filter(r => r.presente === 1).length;
    return Math.round((present / attendanceRecords.length) * 100);
};

// Calcular porcentaje de cumplimiento de Biblia
export const calculateBibleCompliance = (complianceRecords) => {
    if (complianceRecords.length === 0) return 0;

    const withBible = complianceRecords.filter(r => r.tiene_biblia === 1).length;
    return Math.round((withBible / complianceRecords.length) * 100);
};

// Calcular porcentaje de cumplimiento de apuntes
export const calculateNotesCompliance = (complianceRecords) => {
    if (complianceRecords.length === 0) return 0;

    const withNotes = complianceRecords.filter(r => r.tiene_apuntes === 1).length;
    return Math.round((withNotes / complianceRecords.length) * 100);
};

// Agrupar asistencia por joven
export const groupAttendanceByYouth = (attendanceRecords) => {
    const grouped = {};

    attendanceRecords.forEach(record => {
        const youthId = record.youth_member_id;
        if (!grouped[youthId]) {
            grouped[youthId] = {
                youth_id: youthId,
                nombre: record.nombre,
                apellido_paterno: record.apellido_paterno,
                apellido_materno: record.apellido_materno,
                records: []
            };
        }
        grouped[youthId].records.push(record);
    });

    return Object.values(grouped);
};

// Generar estadísticas de asistencia
export const generateAttendanceStats = (attendanceRecords) => {
    const total = attendanceRecords.length;
    const present = attendanceRecords.filter(r => r.presente === 1).length;
    const absent = attendanceRecords.filter(r => r.presente === 0 && r.justificado === 0).length;
    const justified = attendanceRecords.filter(r => r.justificado === 1).length;

    return {
        total,
        present,
        absent,
        justified,
        presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
        absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
        justifiedPercentage: total > 0 ? Math.round((justified / total) * 100) : 0
    };
};

// Generar estadísticas de cumplimiento
export const generateComplianceStats = (complianceRecords) => {
    const total = complianceRecords.length;
    const withBible = complianceRecords.filter(r => r.tiene_biblia === 1).length;
    const withNotes = complianceRecords.filter(r => r.tiene_apuntes === 1).length;
    const withBoth = complianceRecords.filter(r => r.tiene_biblia === 1 && r.tiene_apuntes === 1).length;

    return {
        total,
        withBible,
        withNotes,
        withBoth,
        biblePercentage: total > 0 ? Math.round((withBible / total) * 100) : 0,
        notesPercentage: total > 0 ? Math.round((withNotes / total) * 100) : 0,
        bothPercentage: total > 0 ? Math.round((withBoth / total) * 100) : 0
    };
};

// Formatear datos para reporte individual
export const formatIndividualReport = (youthData, attendanceRecords, complianceRecords) => {
    return {
        youth: youthData,
        attendance: {
            records: attendanceRecords,
            percentage: calculateAttendancePercentage(attendanceRecords),
            stats: generateAttendanceStats(attendanceRecords)
        },
        compliance: {
            records: complianceRecords,
            biblePercentage: calculateBibleCompliance(complianceRecords),
            notesPercentage: calculateNotesCompliance(complianceRecords),
            stats: generateComplianceStats(complianceRecords)
        }
    };
};

// Formatear datos para reporte grupal
export const formatGroupReport = (allAttendance, allCompliance, period) => {
    const attendanceByYouth = groupAttendanceByYouth(allAttendance);

    const youthReports = attendanceByYouth.map(youth => {
        const youthCompliance = allCompliance.filter(c => c.youth_member_id === youth.youth_id);

        return {
            youth_id: youth.youth_id,
            nombre: `${youth.nombre} ${youth.apellido_paterno} ${youth.apellido_materno}`,
            attendancePercentage: calculateAttendancePercentage(youth.records),
            biblePercentage: calculateBibleCompliance(youthCompliance),
            notesPercentage: calculateNotesCompliance(youthCompliance),
            totalDays: youth.records.length
        };
    });

    return {
        period,
        youthReports,
        overallStats: {
            attendance: generateAttendanceStats(allAttendance),
            compliance: generateComplianceStats(allCompliance)
        }
    };
};
