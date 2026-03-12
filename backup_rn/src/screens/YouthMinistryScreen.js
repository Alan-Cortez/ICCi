import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    ScrollView,
    Modal
} from 'react-native';
import { theme } from '../styles/theme';
import { YouthCard } from '../components/YouthCard';
import { getAllYouthMembers } from '../services/youthService';
import { getAllMembers } from '../services/memberService';
import { addYouthMember } from '../services/youthService';
import { AttendanceScreen } from './AttendanceScreen';
import { LeadershipScreen } from './LeadershipScreen';
import { ReportsScreen } from './ReportsScreen';
import { EventsScreen } from './EventsScreen';
import { FundsScreen } from './FundsScreen';

export const YouthMinistryScreen = ({ navigation }) => {
    const [youthMembers, setYouthMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');
    const [showAddMember, setShowAddMember] = useState(false);
    const [availableMembers, setAvailableMembers] = useState([]);

    useEffect(() => {
        loadYouthMembers();
    }, []);

    const loadYouthMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllYouthMembers();
            setYouthMembers(data);
        } catch (error) {
            console.error('Error al cargar jóvenes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleShowAddMember = async () => {
        try {
            const allMembers = await getAllMembers();
            const youthIds = youthMembers.map(y => y.member_id);
            const available = allMembers.filter(m => !youthIds.includes(m.id));

            if (available.length === 0) {
                if (typeof alert !== 'undefined') {
                    alert('Todos los miembros ya están en el ministerio de jóvenes');
                }
                return;
            }

            setAvailableMembers(available);
            setShowAddMember(true);
        } catch (error) {
            console.error('Error al cargar miembros:', error);
        }
    };

    const handleAddYouth = async (memberId) => {
        try {
            await addYouthMember(memberId);
            setShowAddMember(false);
            loadYouthMembers();
        } catch (error) {
            console.error('Error al agregar joven:', error);
        }
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
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Ministerio de Jóvenes</Text>
                <Text style={styles.subtitle}>{youthMembers.length} jóvenes activos</Text>
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsScroll}
            >
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'members' && styles.tabActive]}
                        onPress={() => setActiveTab('members')}
                    >
                        <Text style={[styles.tabText, activeTab === 'members' && styles.tabTextActive]}>
                            Miembros
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'attendance' && styles.tabActive]}
                        onPress={() => setActiveTab('attendance')}
                    >
                        <Text style={[styles.tabText, activeTab === 'attendance' && styles.tabTextActive]}>
                            Asistencia
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'leadership' && styles.tabActive]}
                        onPress={() => setActiveTab('leadership')}
                    >
                        <Text style={[styles.tabText, activeTab === 'leadership' && styles.tabTextActive]}>
                            Liderazgo
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reports' && styles.tabActive]}
                        onPress={() => setActiveTab('reports')}
                    >
                        <Text style={[styles.tabText, activeTab === 'reports' && styles.tabTextActive]}>
                            Reportes
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'events' && styles.tabActive]}
                        onPress={() => setActiveTab('events')}
                    >
                        <Text style={[styles.tabText, activeTab === 'events' && styles.tabTextActive]}>
                            Eventos
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'funds' && styles.tabActive]}
                        onPress={() => setActiveTab('funds')}
                    >
                        <Text style={[styles.tabText, activeTab === 'funds' && styles.tabTextActive]}>
                            Fondos
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Contenido */}
            <View style={styles.content}>
                {activeTab === 'members' ? (
                    <View style={styles.membersContainer}>
                        <FlatList
                            data={youthMembers}
                            keyExtractor={item => item.youth_id.toString()}
                            renderItem={({ item }) => <YouthCard member={item} />}
                            contentContainerStyle={styles.listContent}
                        />
                        <TouchableOpacity
                            style={styles.fab}
                            onPress={handleShowAddMember}
                        >
                            <Text style={styles.fabText}>+</Text>
                        </TouchableOpacity>
                    </View>
                ) : activeTab === 'attendance' ? (
                    <AttendanceScreen />
                ) : activeTab === 'leadership' ? (
                    <LeadershipScreen />
                ) : activeTab === 'reports' ? (
                    <ReportsScreen />
                ) : activeTab === 'events' ? (
                    <EventsScreen />
                ) : (
                    <FundsScreen />
                )}
            </View>

            {/* Modal para agregar miembro */}
            <Modal
                visible={showAddMember}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAddMember(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAddMember(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Agregar Joven</Text>
                        <Text style={styles.modalSubtitle}>Selecciona un miembro de la iglesia</Text>

                        <ScrollView style={styles.memberList}>
                            {availableMembers.map(member => (
                                <TouchableOpacity
                                    key={member.id}
                                    style={styles.memberItem}
                                    onPress={() => handleAddYouth(member.id)}
                                >
                                    <Text style={styles.memberName}>
                                        {member.nombre} {member.apellido_paterno}
                                    </Text>
                                    <Text style={styles.memberArrow}>→</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonSecondary]}
                            onPress={() => setShowAddMember(false)}
                        >
                            <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
                        </TouchableOpacity>
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
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.sm,
        paddingTop: theme.spacing.md,
        ...theme.shadows.sm,
    },
    backButton: {
        marginBottom: 4,
    },
    backButtonText: {
        color: theme.colors.primary,
        fontSize: 16,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.textPrimary,
        marginBottom: 2,
    },
    subtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    tabsScroll: {
        maxHeight: 50,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tabs: {
        flexDirection: 'row',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 10,
    },
    tab: {
        marginRight: theme.spacing.lg,
        paddingBottom: 4,
    },
    tabActive: {
        borderBottomWidth: 2,
        borderBottomColor: theme.colors.primary,
    },
    tabText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    tabTextActive: {
        color: theme.colors.primary,
    },
    content: {
        flex: 1,
    },
    membersContainer: {
        flex: 1,
    },
    listContent: {
        padding: theme.spacing.sm,
        paddingBottom: 80,
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    fabText: {
        fontSize: 28,
        color: theme.colors.white,
        fontWeight: '300',
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
    modalButton: {
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    modalButtonSecondary: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    modalButtonTextSecondary: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
});
