import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { theme } from '../styles/theme';
import { MemberForm } from '../components/MemberForm';
import { createMember } from '../services/memberService';

export const AddMemberScreen = ({ navigation }) => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (formData) => {
        try {
            setLoading(true);
            await createMember(formData);
            // Navegar de vuelta inmediatamente después de guardar
            navigation.goBack();
            // En web, Alert no funciona bien, así que simplemente regresamos
        } catch (error) {
            console.error('Error al crear miembro:', error);
            // Mostrar error en consola y alert si está disponible
            if (typeof alert !== 'undefined') {
                alert('Error: No se pudo registrar el miembro. Intenta de nuevo.');
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
                <Text style={styles.title}>Nuevo Miembro</Text>
                <Text style={styles.subtitle}>Completa la información del miembro</Text>
            </View>

            <View style={styles.formContainer}>
                <MemberForm
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
