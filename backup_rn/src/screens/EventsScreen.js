import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator
} from 'react-native';
import { theme } from '../styles/theme';
import { getAllEvents, createEvent, deleteEvent } from '../services/eventService';
import { getToday } from '../utils/dateHelpers';

export const EventsScreen = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [fecha, setFecha] = useState(getToday());

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        try {
            setLoading(true);
            const data = await getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error('Error al cargar eventos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!nombre.trim()) {
            if (typeof alert !== 'undefined') {
                alert('El nombre del evento es requerido');
            }
            return;
        }

        try {
            await createEvent(nombre, descripcion, fecha);
            setNombre('');
            setDescripcion('');
            setFecha(getToday());
            setShowForm(false);
            loadEvents();
        } catch (error) {
            console.error('Error al crear evento:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteEvent(id);
            loadEvents();
        } catch (error) {
            console.error('Error al eliminar evento:', error);
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
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Formulario */}
                {showForm && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Nuevo Evento</Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del evento *"
                            value={nombre}
                            onChangeText={setNombre}
                            placeholderTextColor={theme.colors.textLight}
                        />

                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Descripción"
                            value={descripcion}
                            onChangeText={setDescripcion}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor={theme.colors.textLight}
                        />

                        <View style={styles.dateContainer}>
                            <Text style={styles.dateLabel}>📅 Fecha:</Text>
                            <TextInput
                                style={styles.dateInput}
                                value={fecha}
                                onChangeText={setFecha}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={theme.colors.textLight}
                            />
                        </View>

                        <View style={styles.formButtons}>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={() => {
                                    setShowForm(false);
                                    setNombre('');
                                    setDescripcion('');
                                    setFecha(getToday());
                                }}
                            >
                                <Text style={styles.buttonTextSecondary}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary]}
                                onPress={handleCreate}
                            >
                                <Text style={styles.buttonText}>Crear Evento</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Lista de eventos */}
                {events.map(event => (
                    <View key={event.id} style={styles.eventCard}>
                        <View style={styles.eventHeader}>
                            <Text style={styles.eventName}>{event.nombre}</Text>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(event.id)}
                            >
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>

                        {event.descripcion && (
                            <Text style={styles.eventDescription}>{event.descripcion}</Text>
                        )}

                        <View style={styles.eventFooter}>
                            <Text style={styles.eventDate}>📅 {event.fecha}</Text>
                        </View>
                    </View>
                ))}

                {events.length === 0 && !showForm && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay eventos registrados</Text>
                        <Text style={styles.emptySubtext}>Presiona el botón + para crear uno</Text>
                    </View>
                )}
            </ScrollView>

            {/* Botón flotante */}
            {!showForm && (
                <TouchableOpacity
                    style={styles.fab}
                    onPress={() => setShowForm(true)}
                >
                    <Text style={styles.fabText}>+</Text>
                </TouchableOpacity>
            )}
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
    formCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.md,
    },
    formTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    input: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    dateLabel: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        marginRight: theme.spacing.sm,
        fontWeight: '600',
    },
    dateInput: {
        flex: 1,
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        ...theme.typography.body,
        color: theme.colors.textPrimary,
    },
    formButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    button: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
    },
    buttonPrimary: {
        backgroundColor: theme.colors.primary,
    },
    buttonSecondary: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    buttonText: {
        ...theme.typography.body,
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonTextSecondary: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    eventCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        ...theme.shadows.sm,
    },
    eventHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    eventName: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        flex: 1,
    },
    deleteButton: {
        padding: theme.spacing.xs,
    },
    deleteButtonText: {
        fontSize: 20,
    },
    eventDescription: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    eventFooter: {
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingTop: theme.spacing.sm,
    },
    eventDate: {
        ...theme.typography.bodySmall,
        color: theme.colors.primary,
        fontWeight: '600',
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
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
