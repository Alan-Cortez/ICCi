import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    Modal
} from 'react-native';
import { theme } from '../styles/theme';
import { getLeadershipMembers, addToLeadership, assignTask, getPendingAssignments, completeAssignment } from '../services/leadershipService';
import { getAllYouthMembers } from '../services/youthService';
import { getToday } from '../utils/dateHelpers';

export const LeadershipScreen = () => {
    const [leaders, setLeaders] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAssignTask, setShowAssignTask] = useState(false);
    const [showAddLeader, setShowAddLeader] = useState(false);
    const [selectedLeaders, setSelectedLeaders] = useState([]); // Para selección múltiple
    const [taskType, setTaskType] = useState('predicacion');
    const [taskDate, setTaskDate] = useState(getToday());
    const [taskNotes, setTaskNotes] = useState('');
    const [availableYouth, setAvailableYouth] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadersData, assignmentsData] = await Promise.all([
                getLeadershipMembers(),
                getPendingAssignments()
            ]);
            setLeaders(leadersData);
            setAssignments(assignmentsData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowAddLeader = async () => {
        try {
            const allYouth = await getAllYouthMembers();
            const leaderIds = leaders.map(l => l.youth_member_id);
            const available = allYouth.filter(y => !leaderIds.includes(y.youth_id));

            if (available.length === 0) {
                if (typeof alert !== 'undefined') {
                    alert('Todos los jóvenes ya son líderes');
                }
                return;
            }

            setAvailableYouth(available);
            setShowAddLeader(true);
        } catch (error) {
            console.error('Error al cargar jóvenes:', error);
        }
    };

    const handleAddLeader = async (youthId) => {
        try {
            await addToLeadership(youthId);
            setShowAddLeader(false);
            loadData();
        } catch (error) {
            console.error('Error al agregar líder:', error);
        }
    };

    const handleShowAssignTask = (leader) => {
        setSelectedLeaders([leader]);
        setShowAssignTask(true);
    };

    const toggleLeaderSelection = (leader) => {
        setSelectedLeaders(prev => {
            const isSelected = prev.some(l => l.leadership_id === leader.leadership_id);
            if (isSelected) {
                return prev.filter(l => l.leadership_id !== leader.leadership_id);
            } else {
                return [...prev, leader];
            }
        });
    };

    const handleAssignTask = async () => {
        if (selectedLeaders.length === 0) return;

        try {
            // Asignar tarea a todos los líderes seleccionados
            for (const leader of selectedLeaders) {
                await assignTask(leader.leadership_id, taskType, taskDate, taskNotes || null);
            }

            loadData();
            setShowAssignTask(false);
            setSelectedLeaders([]);
            setTaskNotes('');
            setTaskDate(getToday());
            setTaskType('predicacion');
        } catch (error) {
            console.error('Error al asignar tarea:', error);
        }
    };

    const handleCompleteTask = async (assignmentId) => {
        try {
            await completeAssignment(assignmentId);
            loadData();
        } catch (error) {
            console.error('Error al completar tarea:', error);
        }
    };

    const getTaskTypeLabel = (type) => {
        const labels = {
            predicacion: '📖 Predicación',
            intercesion: '🙏 Intercesión',
            ayuno: '🕊️ Ayuno'
        };
        return labels[type] || type;
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Sección de Líderes */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Líderes ({leaders.length})</Text>
                        <TouchableOpacity style={styles.addButton} onPress={handleShowAddLeader}>
                            <Text style={styles.addButtonText}>+ Agregar</Text>
                        </TouchableOpacity>
                    </View>

                    {leaders.map(leader => (
                        <View key={leader.leadership_id} style={styles.leaderCard}>
                            <View style={styles.leaderInfo}>
                                <Text style={styles.leaderName}>
                                    {leader.nombre} {leader.apellido_paterno}
                                </Text>
                                <Text style={styles.leaderDate}>Desde: {leader.fecha_inicio}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.assignButton}
                                onPress={() => handleShowAssignTask(leader)}
                            >
                                <Text style={styles.assignButtonText}>Asignar Tarea</Text>
                            </TouchableOpacity>
                        </View>
                    ))}

                    {leaders.length === 0 && (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No hay líderes registrados</Text>
                        </View>
                    )}
                </View>

                {/* Sección de Asignaciones Pendientes */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Asignaciones Pendientes ({assignments.length})</Text>

                    {assignments.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No hay asignaciones pendientes</Text>
                        </View>
                    ) : (
                        assignments.map(assignment => (
                            <View key={assignment.id} style={styles.assignmentCard}>
                                <View style={styles.assignmentHeader}>
                                    <Text style={styles.assignmentType}>
                                        {getTaskTypeLabel(assignment.tipo)}
                                    </Text>
                                    <Text style={styles.assignmentDate}>📅 {assignment.fecha_asignada}</Text>
                                </View>
                                <Text style={styles.assignmentName}>
                                    {assignment.nombre} {assignment.apellido_paterno}
                                </Text>
                                {assignment.notas && (
                                    <Text style={styles.assignmentNotes}>{assignment.notas}</Text>
                                )}
                                <TouchableOpacity
                                    style={styles.completeButton}
                                    onPress={() => handleCompleteTask(assignment.id)}
                                >
                                    <Text style={styles.completeButtonText}>✓ Completar</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* Modal para agregar líder */}
            <Modal
                visible={showAddLeader}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAddLeader(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAddLeader(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Agregar Líder</Text>
                        <Text style={styles.modalSubtitle}>Selecciona un joven para agregar al liderazgo</Text>

                        <ScrollView style={styles.memberList}>
                            {availableYouth.map(youth => (
                                <TouchableOpacity
                                    key={youth.youth_id}
                                    style={styles.memberItem}
                                    onPress={() => handleAddLeader(youth.youth_id)}
                                >
                                    <Text style={styles.memberName}>
                                        {youth.nombre} {youth.apellido_paterno}
                                    </Text>
                                    <Text style={styles.memberArrow}>→</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonSecondary]}
                            onPress={() => setShowAddLeader(false)}
                        >
                            <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal para asignar tarea */}
            <Modal
                visible={showAssignTask}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAssignTask(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAssignTask(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Asignar Tarea</Text>

                        {/* Si es ayuno, mostrar opción de selección múltiple */}
                        {taskType === 'ayuno' ? (
                            <>
                                <Text style={styles.modalSubtitle}>Selecciona los líderes para el ayuno</Text>

                                <ScrollView style={styles.leaderSelectionList}>
                                    {leaders.map(leader => {
                                        const isSelected = selectedLeaders.some(l => l.leadership_id === leader.leadership_id);
                                        return (
                                            <TouchableOpacity
                                                key={leader.leadership_id}
                                                style={[styles.leaderSelectionItem, isSelected && styles.leaderSelectionItemActive]}
                                                onPress={() => toggleLeaderSelection(leader)}
                                            >
                                                <Text style={[styles.leaderSelectionName, isSelected && styles.leaderSelectionNameActive]}>
                                                    {leader.nombre} {leader.apellido_paterno}
                                                </Text>
                                                <Text style={styles.leaderSelectionCheck}>
                                                    {isSelected ? '✓' : '○'}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </ScrollView>
                            </>
                        ) : (
                            <Text style={styles.modalSubtitle}>
                                {selectedLeaders[0]?.nombre} {selectedLeaders[0]?.apellido_paterno}
                            </Text>
                        )}

                        {/* Tipo de tarea - Horizontal */}
                        <View style={styles.taskTypeRow}>
                            {['predicacion', 'intercesion', 'ayuno'].map(type => (
                                <TouchableOpacity
                                    key={type}
                                    style={[styles.taskTypeChip, taskType === type && styles.taskTypeChipActive]}
                                    onPress={() => {
                                        setTaskType(type);
                                        // Si cambia a ayuno, permitir selección múltiple
                                        if (type === 'ayuno' && selectedLeaders.length === 1) {
                                            // Mantener el líder actual seleccionado
                                        } else if (type !== 'ayuno' && selectedLeaders.length > 1) {
                                            // Si cambia de ayuno a otra tarea, mantener solo el primero
                                            setSelectedLeaders([selectedLeaders[0]]);
                                        }
                                    }}
                                >
                                    <Text style={[styles.taskTypeChipText, taskType === type && styles.taskTypeChipTextActive]}>
                                        {type === 'predicacion' ? '📖' : type === 'intercesion' ? '🙏' : '🕊️'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Selector de fecha */}
                        <View style={styles.dateContainer}>
                            <Text style={styles.dateLabel}>📅 Fecha:</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={taskDate}
                                onChangeText={setTaskDate}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.textLight}
                            />
                        </View>

                        {/* Notas */}
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Notas (opcional)"
                            value={taskNotes}
                            onChangeText={setTaskNotes}
                            multiline
                            numberOfLines={2}
                            placeholderTextColor={theme.colors.textLight}
                        />

                        {/* Contador de seleccionados para ayuno */}
                        {taskType === 'ayuno' && selectedLeaders.length > 0 && (
                            <Text style={styles.selectionCount}>
                                {selectedLeaders.length} líder{selectedLeaders.length > 1 ? 'es' : ''} seleccionado{selectedLeaders.length > 1 ? 's' : ''}
                            </Text>
                        )}

                        {/* Botones */}
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonSecondary]}
                                onPress={() => {
                                    setShowAssignTask(false);
                                    setSelectedLeaders([]);
                                    setTaskNotes('');
                                    setTaskDate(getToday());
                                    setTaskType('predicacion');
                                }}
                            >
                                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.modalButtonPrimary, selectedLeaders.length === 0 && styles.modalButtonDisabled]}
                                onPress={handleAssignTask}
                                disabled={selectedLeaders.length === 0}
                            >
                                <Text style={styles.modalButtonText}>Asignar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
        paddingBottom: 80,
    },
    section: {
        marginBottom: theme.spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
    },
    addButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
    },
    addButtonText: {
        ...theme.typography.caption,
        color: theme.colors.white,
        fontWeight: '600',
    },
    leaderCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    leaderInfo: {
        marginBottom: theme.spacing.xs,
    },
    leaderName: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        fontWeight: '600',
        marginBottom: 2,
    },
    leaderDate: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    assignButton: {
        backgroundColor: theme.colors.primaryLight,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    assignButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    assignmentCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    assignmentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
    },
    assignmentType: {
        ...theme.typography.body,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    assignmentDate: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    assignmentName: {
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    assignmentNotes: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        marginBottom: theme.spacing.xs,
    },
    completeButton: {
        backgroundColor: theme.colors.success,
        paddingVertical: 8,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    completeButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
    },
    emptyContainer: {
        padding: theme.spacing.md,
        alignItems: 'center',
    },
    emptyText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: theme.borderRadius.xl,
        borderTopRightRadius: theme.borderRadius.xl,
        padding: theme.spacing.md,
        maxHeight: '80%',
    },
    modalTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: 4,
    },
    modalSubtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    memberList: {
        maxHeight: 300,
        marginBottom: theme.spacing.sm,
    },
    memberItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    memberName: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
    },
    memberArrow: {
        ...theme.typography.h3,
        color: theme.colors.primary,
    },
    leaderSelectionList: {
        maxHeight: 200,
        marginBottom: theme.spacing.sm,
    },
    leaderSelectionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        borderWidth: 2,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.xs,
    },
    leaderSelectionItemActive: {
        backgroundColor: theme.colors.primaryLight,
        borderColor: theme.colors.primary,
    },
    leaderSelectionName: {
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
    },
    leaderSelectionNameActive: {
        color: theme.colors.primary,
        fontWeight: '600',
    },
    leaderSelectionCheck: {
        ...theme.typography.h3,
        color: theme.colors.textSecondary,
    },
    taskTypeRow: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    taskTypeChip: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    taskTypeChipActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    taskTypeChipText: {
        fontSize: 24,
    },
    taskTypeChipTextActive: {
        fontSize: 24,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    dateLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
        marginRight: theme.spacing.xs,
        fontWeight: '600',
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
    notesInput: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.sm,
        padding: theme.spacing.sm,
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
        minHeight: 60,
        marginBottom: theme.spacing.sm,
        textAlignVertical: 'top',
    },
    selectionCount: {
        ...theme.typography.caption,
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    modalButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    modalButtonSecondary: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
    },
    modalButtonTextSecondary: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
});
