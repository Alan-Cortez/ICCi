import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Switch
} from 'react-native';
import { theme } from '../styles/theme';
import { getAllYouthMembers } from '../services/youthService';
import { markAttendance, hasAttendanceForDate } from '../services/attendanceService';
import { markCompliance, hasComplianceForDate } from '../services/complianceService';
import { getToday } from '../utils/dateHelpers';

export const AttendanceScreen = () => {
    const [youthMembers, setYouthMembers] = useState([]);
    const [selectedDate, setSelectedDate] = useState(getToday());
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadYouthMembers();
    }, []);

    const loadYouthMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllYouthMembers();

            // Inicializar estado de asistencia
            const initialAttendance = {};
            data.forEach(youth => {
                initialAttendance[youth.youth_id] = {
                    presente: false,
                    justificado: false,
                    razon: '',
                    biblia: false,
                    apuntes: false
                };
            });

            setYouthMembers(data);
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error al cargar jóvenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePresent = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                presente: !prev[youthId].presente,
                justificado: false,
                razon: ''
            }
        }));
    };

    const toggleJustified = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                justificado: !prev[youthId].justificado,
                presente: false
            }
        }));
    };

    const updateReason = (youthId, razon) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                razon
            }
        }));
    };

    const toggleBible = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                biblia: !prev[youthId].biblia
            }
        }));
    };

    const toggleNotes = (youthId) => {
        setAttendance(prev => ({
            ...prev,
            [youthId]: {
                ...prev[youthId],
                apuntes: !prev[youthId].apuntes
            }
        }));
    };

    const handleSave = async () => {
        try {
            setSaving(true);

            for (const youth of youthMembers) {
                const youthId = youth.youth_id;
                const data = attendance[youthId];

                // Verificar si ya existe asistencia para esta fecha
                const exists = await hasAttendanceForDate(youthId, selectedDate);

                if (!exists) {
                    // Guardar asistencia
                    await markAttendance(
                        youthId,
                        selectedDate,
                        data.presente,
                        data.justificado,
                        data.razon || null
                    );

                    // Guardar cumplimiento si está presente
                    if (data.presente) {
                        const complianceExists = await hasComplianceForDate(youthId, selectedDate);
                        if (!complianceExists) {
                            await markCompliance(youthId, selectedDate, data.biblia, data.apuntes);
                        }
                    }
                }
            }

            if (typeof alert !== 'undefined') {
                alert('Asistencia guardada correctamente');
            }

            // Resetear formulario
            loadYouthMembers();
        } catch (error) {
            console.error('Error al guardar asistencia:', error);
            if (typeof alert !== 'undefined') {
                alert('Error al guardar asistencia');
            }
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    // Contar estadísticas
    const presentCount = Object.values(attendance).filter(a => a.presente).length;
    const justifiedCount = Object.values(attendance).filter(a => a.justificado).length;
    const absentCount = youthMembers.length - presentCount - justifiedCount;

    return (
        <View style={styles.container}>
            {/* Selector de Fecha y Estadísticas */}
            <View style={styles.topBar}>
                <View style={styles.dateSelector}>
                    <Text style={styles.dateLabel}>📅 Fecha:</Text>
                    <TextInput
                        style={styles.dateInput}
                        value={selectedDate}
                        onChangeText={setSelectedDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={theme.colors.textLight}
                    />
                </View>

                {/* Estadísticas rápidas */}
                <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.colors.success }]}>{presentCount}</Text>
                        <Text style={styles.statLabel}>Presentes</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.colors.warning }]}>{justifiedCount}</Text>
                        <Text style={styles.statLabel}>Justif.</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={[styles.statValue, { color: theme.colors.error }]}>{absentCount}</Text>
                        <Text style={styles.statLabel}>Ausentes</Text>
                    </View>
                </View>
            </View>

            {/* Lista de jóvenes */}
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {youthMembers.map(youth => {
                    const data = attendance[youth.youth_id] || {};

                    return (
                        <View key={youth.youth_id} style={styles.youthRow}>
                            {/* Nombre del joven */}
                            <View style={styles.youthInfo}>
                                <Text style={styles.youthName}>
                                    {youth.nombre} {youth.apellido_paterno}
                                </Text>
                            </View>

                            {/* Botones de estado */}
                            <View style={styles.statusButtons}>
                                {/* Botón Presente */}
                                <TouchableOpacity
                                    style={[
                                        styles.statusButton,
                                        styles.presentButton,
                                        data.presente && styles.presentButtonActive
                                    ]}
                                    onPress={() => togglePresent(youth.youth_id)}
                                >
                                    <Text style={[
                                        styles.statusButtonText,
                                        data.presente && styles.statusButtonTextActive
                                    ]}>
                                        {data.presente ? '✓' : ''} Presente
                                    </Text>
                                </TouchableOpacity>

                                {/* Botón Justificado */}
                                <TouchableOpacity
                                    style={[
                                        styles.statusButton,
                                        styles.justifiedButton,
                                        data.justificado && styles.justifiedButtonActive
                                    ]}
                                    onPress={() => toggleJustified(youth.youth_id)}
                                >
                                    <Text style={[
                                        styles.statusButtonText,
                                        data.justificado && styles.statusButtonTextActive
                                    ]}>
                                        {data.justificado ? '✓' : ''} Justificado
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Si está presente, mostrar Biblia y Apuntes */}
                            {data.presente && (
                                <View style={styles.complianceRow}>
                                    <View style={styles.switchContainer}>
                                        <Text style={styles.switchLabel}>📖 Biblia</Text>
                                        <Switch
                                            value={data.biblia}
                                            onValueChange={() => toggleBible(youth.youth_id)}
                                            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                                            thumbColor={data.biblia ? theme.colors.primary : theme.colors.textLight}
                                        />
                                    </View>
                                    <View style={styles.switchContainer}>
                                        <Text style={styles.switchLabel}>📝 Apuntes</Text>
                                        <Switch
                                            value={data.apuntes}
                                            onValueChange={() => toggleNotes(youth.youth_id)}
                                            trackColor={{ false: theme.colors.border, true: theme.colors.primaryLight }}
                                            thumbColor={data.apuntes ? theme.colors.primary : theme.colors.textLight}
                                        />
                                    </View>
                                </View>
                            )}

                            {/* Si está justificado, mostrar campo de razón */}
                            {data.justificado && (
                                <View style={styles.reasonContainer}>
                                    <TextInput
                                        style={styles.reasonInput}
                                        placeholder="Razón de la falta (opcional)..."
                                        value={data.razon}
                                        onChangeText={(text) => updateReason(youth.youth_id, text)}
                                        placeholderTextColor={theme.colors.textLight}
                                    />
                                </View>
                            )}
                        </View>
                    );
                })}
            </ScrollView>

            {/* Botón guardar */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color={theme.colors.white} />
                    ) : (
                        <Text style={styles.saveButtonText}>Guardar Asistencia</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    topBar: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    dateSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    dateLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
        fontWeight: '600',
        marginRight: theme.spacing.xs,
    },
    dateInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.xs,
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: theme.spacing.xs,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    statBox: {
        alignItems: 'center',
    },
    statValue: {
        ...theme.typography.h3,
        fontWeight: '700',
        marginBottom: 2,
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.sm,
        paddingBottom: 80,
    },
    youthRow: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    youthInfo: {
        marginBottom: theme.spacing.xs,
    },
    youthName: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        fontWeight: '600',
    },
    statusButtons: {
        flexDirection: 'row',
        gap: theme.spacing.xs,
        marginBottom: theme.spacing.xs,
    },
    statusButton: {
        flex: 1,
        paddingVertical: 8,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 2,
        alignItems: 'center',
    },
    presentButton: {
        borderColor: theme.colors.success,
        backgroundColor: theme.colors.white,
    },
    presentButtonActive: {
        backgroundColor: theme.colors.success,
    },
    justifiedButton: {
        borderColor: theme.colors.warning,
        backgroundColor: theme.colors.white,
    },
    justifiedButtonActive: {
        backgroundColor: theme.colors.warning,
    },
    statusButtonText: {
        ...theme.typography.bodySmall,
        fontWeight: '600',
    },
    statusButtonTextActive: {
        color: theme.colors.white,
    },
    complianceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    switchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.sm,
    },
    switchLabel: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    reasonContainer: {
        marginTop: theme.spacing.sm,
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    reasonInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        ...theme.typography.body,
        color: theme.colors.textPrimary,
    },
    footer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        ...theme.shadows.sm,
    },
    saveButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        ...theme.typography.h3,
        color: theme.colors.white,
        fontWeight: '600',
    },
});
