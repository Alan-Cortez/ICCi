import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { MemberForm } from '../components/MemberForm';
import { updateMember } from '../services/memberService';

export const EditMemberScreen = ({ navigation, route }) => {
    const { member } = route.params;
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            await updateMember(member.id, formData);
            // Navegar de vuelta inmediatamente después de actualizar
            navigation.goBack();
        } catch (error) {
            console.error('Error al actualizar miembro:', error);
            if (typeof alert !== 'undefined') {
                alert('Error: No se pudo actualizar el miembro. Intenta de nuevo.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        navigation.goBack();
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Editar Miembro</Text>
                <Text style={styles.subtitle}>Actualiza la información del miembro</Text>
            </View>

            <View style={styles.formContainer}>
                <MemberForm
                    initialData={member}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    loading={loading}
                />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        paddingTop: theme.spacing.xxl,
        ...theme.shadows.sm,
    },
    title: {
        ...theme.typography.h2,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    formContainer: {
        flex: 1,
        padding: theme.spacing.lg,
    },
});
