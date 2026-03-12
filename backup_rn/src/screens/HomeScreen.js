import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { MemberCard } from '../components/MemberCard';
import { getAllMembers, deleteMember } from '../services/memberService';

export const HomeScreen = ({ navigation }) => {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadMembers = async () => {
        try {
            setLoading(true);
            const data = await getAllMembers();
            setMembers(data);
        } catch (error) {
            console.error('Error al cargar miembros:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadMembers();
        }, [])
    );

    const handleEdit = (member) => {
        navigation.navigate('EditMember', { member });
    };

    const handleDelete = async (id) => {
        try {
            await deleteMember(id);
            loadMembers();
        } catch (error) {
            console.error('Error al eliminar miembro:', error);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadMembers();
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Cargando miembros...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Registro de Miembros</Text>
                <Text style={styles.subtitle}>
                    {members.length} {members.length === 1 ? 'miembro' : 'miembros'} registrados
                </Text>

                {/* Botón para Ministerio de Jóvenes */}
                <TouchableOpacity
                    style={styles.youthButton}
                    onPress={() => navigation.navigate('YouthMinistry')}
                >
                    <Text style={styles.youthButtonText}>👥 Ministerio de Jóvenes</Text>
                </TouchableOpacity>
            </View>

            {/* Lista de miembros */}
            {members.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No hay miembros registrados</Text>
                    <Text style={styles.emptySubtext}>Presiona el botón + para agregar uno</Text>
                </View>
            ) : (
                <FlatList
                    data={members}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <MemberCard
                            member={item}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                />
            )}

            {/* Botón flotante para agregar */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('AddMember')}
                activeOpacity={0.8}
            >
                <Text style={styles.fabText}>+</Text>
            </TouchableOpacity>
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
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        ...theme.shadows.sm,
    },
    title: {
        ...theme.typography.h1,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    youthButton: {
        marginTop: theme.spacing.md,
        backgroundColor: theme.colors.primary,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    youthButtonText: {
        ...theme.typography.body,
        color: theme.colors.white,
        fontWeight: '600',
    },
    listContent: {
        padding: theme.spacing.md,
        paddingBottom: 100,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing.xl,
    },
    emptyText: {
        ...theme.typography.h3,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    emptySubtext: {
        ...theme.typography.body,
        color: theme.colors.textLight,
        textAlign: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: theme.spacing.lg,
        right: theme.spacing.lg,
        width: 64,
        height: 64,
        borderRadius: theme.borderRadius.full,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.lg,
    },
    fabText: {
        fontSize: 32,
        color: theme.colors.white,
        fontWeight: '300',
    },
});
