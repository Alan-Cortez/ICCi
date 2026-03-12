import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { theme } from '../styles/theme';
import { generateDailyReport, generateWeeklyReport, generateMonthlyReport, generateAnnualReport } from '../services/reportService';
import { getToday } from '../utils/dateHelpers';

export const ReportsScreen = () => {
    const [reportType, setReportType] = useState('daily'); // daily, weekly, monthly, annual
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGenerateReport = async () => {
        try {
            setLoading(true);
            let data;

            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1;

            switch (reportType) {
                case 'daily':
                    data = await generateDailyReport(getToday());
                    break;
                case 'weekly':
                    data = await generateWeeklyReport();
                    break;
                case 'monthly':
                    data = await generateMonthlyReport(currentMonth, currentYear);
                    break;
                case 'annual':
                    data = await generateAnnualReport(currentYear);
                    break;
            }

            setReportData(data);
        } catch (error) {
            console.error('Error al generar reporte:', error);
            if (typeof alert !== 'undefined') {
                alert('Error al generar reporte');
            }
        } finally {
            setLoading(false);
        }
    };

    const getReportTypeLabel = (type) => {
        const labels = {
            daily: 'Diario',
            weekly: 'Semanal',
            monthly: 'Mensual',
            annual: 'Anual'
        };
        return labels[type];
    };

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Selector de tipo de reporte */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Tipo de Reporte</Text>
                    <View style={styles.reportTypeContainer}>
                        {['daily', 'weekly', 'monthly', 'annual'].map(type => (
                            <TouchableOpacity
                                key={type}
                                style={[styles.reportTypeButton, reportType === type && styles.reportTypeButtonActive]}
                                onPress={() => setReportType(type)}
                            >
                                <Text style={[styles.reportTypeText, reportType === type && styles.reportTypeTextActive]}>
                                    {getReportTypeLabel(type)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Botón generar */}
                <TouchableOpacity
                    style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                    onPress={handleGenerateReport}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.generateButtonText}>Generar Reporte</Text>
                    )}
                </TouchableOpacity>

                {/* Resultados del reporte */}
                {reportData && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{reportData.period}</Text>

                        {/* Estadísticas Generales */}
                        <View style={styles.statsCard}>
                            <Text style={styles.statsTitle}>Estadísticas Generales</Text>

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Asistencia</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                                        {reportData.overallStats.attendance.presentPercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.attendance.present} presentes
                                    </Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Faltas</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.error }]}>
                                        {reportData.overallStats.attendance.absentPercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.attendance.absent} ausentes
                                    </Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Justificadas</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.warning }]}>
                                        {reportData.overallStats.attendance.justifiedPercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.attendance.justified} justificadas
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.divider} />

                            <View style={styles.statsRow}>
                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Biblia</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                                        {reportData.overallStats.compliance.biblePercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.compliance.withBible} con Biblia
                                    </Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Apuntes</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                                        {reportData.overallStats.compliance.notesPercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.compliance.withNotes} con apuntes
                                    </Text>
                                </View>

                                <View style={styles.statBox}>
                                    <Text style={styles.statLabel}>Ambos</Text>
                                    <Text style={[styles.statValue, { color: theme.colors.success }]}>
                                        {reportData.overallStats.compliance.bothPercentage}%
                                    </Text>
                                    <Text style={styles.statSubtext}>
                                        {reportData.overallStats.compliance.withBoth} completos
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Reporte Individual por Joven */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Reporte Individual</Text>

                            {reportData.youthReports.map((youth, index) => (
                                <View key={index} style={styles.youthReportCard}>
                                    <Text style={styles.youthReportName}>{youth.nombre}</Text>

                                    <View style={styles.youthReportStats}>
                                        <View style={styles.youthStatItem}>
                                            <Text style={styles.youthStatLabel}>Asistencia</Text>
                                            <Text style={[styles.youthStatValue, getStatColor(youth.attendancePercentage)]}>
                                                {youth.attendancePercentage}%
                                            </Text>
                                        </View>

                                        <View style={styles.youthStatItem}>
                                            <Text style={styles.youthStatLabel}>Biblia</Text>
                                            <Text style={[styles.youthStatValue, getStatColor(youth.biblePercentage)]}>
                                                {youth.biblePercentage}%
                                            </Text>
                                        </View>

                                        <View style={styles.youthStatItem}>
                                            <Text style={styles.youthStatLabel}>Apuntes</Text>
                                            <Text style={[styles.youthStatValue, getStatColor(youth.notesPercentage)]}>
                                                {youth.notesPercentage}%
                                            </Text>
                                        </View>
                                    </View>

                                    <Text style={styles.youthReportDays}>
                                        Total de días: {youth.totalDays}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {!reportData && !loading && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            Selecciona un tipo de reporte y presiona "Generar Reporte"
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const getStatColor = (percentage) => {
    if (percentage >= 80) return { color: theme.colors.success };
    if (percentage >= 60) return { color: theme.colors.warning };
    return { color: theme.colors.error };
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },

    content: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    reportTypeContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.sm,
    },
    reportTypeButton: {
        flex: 1,
        minWidth: '45%',
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    reportTypeButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    reportTypeText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    reportTypeTextActive: {
        color: theme.colors.white,
    },
    generateButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    generateButtonDisabled: {
        opacity: 0.6,
    },
    generateButtonText: {
        ...theme.typography.h3,
        color: theme.colors.white,
        fontWeight: '600',
    },
    statsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        ...theme.shadows.md,
    },
    statsTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.sm,
    },
    statBox: {
        alignItems: 'center',
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    statValue: {
        ...theme.typography.h2,
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
    },
    statSubtext: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: theme.spacing.md,
    },
    youthReportCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    youthReportName: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    youthReportStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: theme.spacing.sm,
    },
    youthStatItem: {
        alignItems: 'center',
    },
    youthStatLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    youthStatValue: {
        ...theme.typography.h3,
        fontWeight: '700',
    },
    youthReportDays: {
        ...theme.typography.caption,
        color: theme.colors.textLight,
        textAlign: 'center',
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
});
