import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';

export const YouthCard = ({ youth, onPress, showStats = false, stats = null }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.cardContent}>
                {/* Foto */}
                <View style={styles.photoContainer}>
                    {youth.foto ? (
                        <Image source={{ uri: youth.foto }} style={styles.photo} />
                    ) : (
                        <View style={[styles.photo, styles.photoPlaceholder]}>
                            <Text style={styles.photoPlaceholderText}>
                                {youth.nombre?.charAt(0)}{youth.apellido_paterno?.charAt(0)}
                            </Text>
                        </View>
                    )}
                    {youth.es_lider && (
                        <View style={styles.leaderBadge}>
                            <Text style={styles.leaderBadgeText}>L</Text>
                        </View>
                    )}
                </View>

                {/* Información */}
                <View style={styles.info}>
                    <Text style={styles.name}>
                        {youth.nombre} {youth.apellido_paterno}
                    </Text>

                    {showStats && stats && (
                        <View style={styles.statsContainer}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Asistencia:</Text>
                                <Text style={[styles.statValue, getStatColor(stats.attendancePercentage)]}>
                                    {stats.attendancePercentage}%
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Biblia:</Text>
                                <Text style={[styles.statValue, getStatColor(stats.biblePercentage)]}>
                                    {stats.biblePercentage}%
                                </Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Apuntes:</Text>
                                <Text style={[styles.statValue, getStatColor(stats.notesPercentage)]}>
                                    {stats.notesPercentage}%
                                </Text>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
};

const getStatColor = (percentage) => {
    if (percentage >= 80) return { color: theme.colors.success };
    if (percentage >= 60) return { color: theme.colors.warning };
    return { color: theme.colors.error };
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
    },
    photoContainer: {
        marginRight: theme.spacing.md,
        position: 'relative',
    },
    photo: {
        width: 60,
        height: 60,
        borderRadius: theme.borderRadius.md,
    },
    photoPlaceholder: {
        backgroundColor: theme.colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderText: {
        ...theme.typography.h3,
        color: theme.colors.white,
        fontWeight: '700',
    },
    leaderBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.colors.warning,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: theme.colors.white,
    },
    leaderBadgeText: {
        color: theme.colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    name: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.xs,
    },
    statsContainer: {
        marginTop: theme.spacing.xs,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    statLabel: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginRight: theme.spacing.xs,
    },
    statValue: {
        ...theme.typography.caption,
        fontWeight: '600',
    },
});
