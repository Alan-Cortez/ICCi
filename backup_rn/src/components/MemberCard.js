import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { theme } from '../styles/theme';

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MemberCard = ({ member, onEdit, onDelete }) => {
    const handleDelete = () => {
        Alert.alert(
            'Eliminar Miembro',
            `¿Estás seguro de eliminar a ${member.nombre} ${member.apellido_paterno}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(member.id) }
            ]
        );
    };

    const mesNombre = MESES[member.mes_cumpleanos - 1] || '';

    return (
        <View style={styles.card}>
            <View style={styles.cardContent}>
                {/* Foto del miembro */}
                <View style={styles.photoContainer}>
                    {member.foto ? (
                        <Image source={{ uri: member.foto }} style={styles.photo} />
                    ) : (
                        <View style={[styles.photo, styles.photoPlaceholder]}>
                            <Text style={styles.photoPlaceholderText}>
                                {member.nombre.charAt(0)}{member.apellido_paterno.charAt(0)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Información del miembro */}
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {member.nombre} {member.apellido_paterno} {member.apellido_materno}
                    </Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Cumpleaños:</Text>
                        <Text style={styles.value}>{member.dia_cumpleanos} de {mesNombre}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Género:</Text>
                        <Text style={styles.value}>{member.genero}</Text>
                    </View>
                </View>
            </View>

            {/* Botones de acción */}
            <View style={styles.actions}>
                <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => onEdit(member)}
                >
                    <Text style={styles.editButtonText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={handleDelete}
                >
                    <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.md,
    },
    cardContent: {
        flexDirection: 'row',
        marginBottom: theme.spacing.md,
    },
    photoContainer: {
        marginRight: theme.spacing.md,
    },
    photo: {
        width: 80,
        height: 80,
        borderRadius: theme.borderRadius.md,
    },
    photoPlaceholder: {
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderText: {
        ...theme.typography.h2,
        color: theme.colors.white,
        fontWeight: '700',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: theme.spacing.xs,
    },
    label: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.xs,
        fontWeight: '600',
    },
    value: {
        ...theme.typography.bodySmall,
        color: theme.colors.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        alignItems: 'center',
    },
    editButton: {
        backgroundColor: theme.colors.primary,
    },
    editButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
    },
    deleteButton: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.error,
    },
    deleteButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.error,
        fontWeight: '600',
    },
});
