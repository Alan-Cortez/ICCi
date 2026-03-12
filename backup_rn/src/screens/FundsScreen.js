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
import { getCurrentBalance, addTransaction, getAllTransactions, deleteTransaction } from '../services/fundService';
import { getToday } from '../utils/dateHelpers';

export const FundsScreen = () => {
    const [balance, setBalance] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [tipo, setTipo] = useState('ingreso');
    const [monto, setMonto] = useState('');
    const [concepto, setConcepto] = useState('');
    const [fecha, setFecha] = useState(getToday());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [balanceData, transData] = await Promise.all([
                getCurrentBalance(),
                getAllTransactions()
            ]);
            setBalance(balanceData);
            setTransactions(transData);
        } catch (error) {
            console.error('Error al cargar datos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        if (!monto || !concepto.trim()) {
            if (typeof alert !== 'undefined') {
                alert('El monto y concepto son requeridos');
            }
            return;
        }

        try {
            await addTransaction(tipo, parseFloat(monto), concepto, fecha);
            setMonto('');
            setConcepto('');
            setFecha(getToday());
            setShowForm(false);
            loadData();
        } catch (error) {
            console.error('Error al agregar transacción:', error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteTransaction(id);
            loadData();
        } catch (error) {
            console.error('Error al eliminar transacción:', error);
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
                <Text style={styles.title}>Fondos del Ministerio</Text>

                {/* Balance Card */}
                <View style={[
                    styles.balanceCard,
                    balance?.alerta && styles.balanceCardAlert
                ]}>
                    <Text style={styles.balanceLabel}>Balance Actual</Text>
                    <Text style={[
                        styles.balanceAmount,
                        balance?.alerta && styles.balanceAmountAlert
                    ]}>
                        ${balance?.balance.toFixed(2)}
                    </Text>

                    {balance?.alerta && (
                        <View style={styles.alertBanner}>
                            <Text style={styles.alertText}>
                                ⚠️ ALERTA: El fondo está por debajo de los $1,000
                            </Text>
                        </View>
                    )}

                    <View style={styles.balanceDetails}>
                        <View style={styles.balanceDetailItem}>
                            <Text style={styles.balanceDetailLabel}>Fondo Base:</Text>
                            <Text style={styles.balanceDetailValue}>${balance?.fondoBase}</Text>
                        </View>
                        <View style={styles.balanceDetailItem}>
                            <Text style={styles.balanceDetailLabel}>Ingresos:</Text>
                            <Text style={[styles.balanceDetailValue, { color: theme.colors.success }]}>
                                +${balance?.ingresos.toFixed(2)}
                            </Text>
                        </View>
                        <View style={styles.balanceDetailItem}>
                            <Text style={styles.balanceDetailLabel}>Salidas:</Text>
                            <Text style={[styles.balanceDetailValue, { color: theme.colors.error }]}>
                                -${balance?.salidas.toFixed(2)}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Formulario */}
                {showForm && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>Nueva Transacción</Text>

                        {/* Tipo de transacción */}
                        <View style={styles.typeButtons}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    tipo === 'ingreso' && styles.typeButtonActiveIngreso
                                ]}
                                onPress={() => setTipo('ingreso')}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    tipo === 'ingreso' && styles.typeButtonTextActive
                                ]}>
                                    💰 Ingreso
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    tipo === 'salida' && styles.typeButtonActiveSalida
                                ]}
                                onPress={() => setTipo('salida')}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    tipo === 'salida' && styles.typeButtonTextActive
                                ]}>
                                    💸 Salida
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Monto *"
                            value={monto}
                            onChangeText={setMonto}
                            keyboardType="numeric"
                            placeholderTextColor={theme.colors.textLight}
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Concepto *"
                            value={concepto}
                            onChangeText={setConcepto}
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
                                    setMonto('');
                                    setConcepto('');
                                    setFecha(getToday());
                                }}
                            >
                                <Text style={styles.buttonTextSecondary}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonPrimary]}
                                onPress={handleAddTransaction}
                            >
                                <Text style={styles.buttonText}>Registrar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Historial de transacciones */}
                <Text style={styles.sectionTitle}>Historial de Transacciones</Text>

                {transactions.map(trans => (
                    <View key={trans.id} style={styles.transactionCard}>
                        <View style={styles.transactionHeader}>
                            <View style={styles.transactionInfo}>
                                <View style={[
                                    styles.transactionBadge,
                                    trans.tipo === 'ingreso' ? styles.badgeIngreso : styles.badgeSalida
                                ]}>
                                    <Text style={styles.transactionBadgeText}>
                                        {trans.tipo === 'ingreso' ? '💰' : '💸'}
                                    </Text>
                                </View>
                                <View style={styles.transactionDetails}>
                                    <Text style={styles.transactionConcepto}>{trans.concepto}</Text>
                                    <Text style={styles.transactionFecha}>📅 {trans.fecha}</Text>
                                </View>
                            </View>
                            <View style={styles.transactionRight}>
                                <Text style={[
                                    styles.transactionMonto,
                                    trans.tipo === 'ingreso' ? styles.montoIngreso : styles.montoSalida
                                ]}>
                                    {trans.tipo === 'ingreso' ? '+' : '-'}${parseFloat(trans.monto).toFixed(2)}
                                </Text>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(trans.id)}
                                >
                                    <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                ))}

                {transactions.length === 0 && !showForm && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No hay transacciones registradas</Text>
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
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
        ...theme.shadows.sm,
    },
    title: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.sm,
    },
    balanceCard: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
    },
    balanceCardAlert: {
        backgroundColor: theme.colors.error,
    },
    balanceLabel: {
        ...theme.typography.body,
        color: theme.colors.white,
        opacity: 0.9,
        marginBottom: theme.spacing.xs,
    },
    balanceAmount: {
        ...theme.typography.h1,
        fontSize: 36,
        color: theme.colors.white,
        fontWeight: '700',
        marginBottom: theme.spacing.sm,
    },
    balanceAmountAlert: {
        color: theme.colors.white,
    },
    alertBanner: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    alertText: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
        textAlign: 'center',
    },
    balanceDetails: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.3)',
        paddingTop: theme.spacing.sm,
    },
    balanceDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: theme.spacing.xs,
    },
    balanceDetailLabel: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        opacity: 0.9,
    },
    balanceDetailValue: {
        ...theme.typography.bodySmall,
        color: theme.colors.white,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: theme.spacing.sm,
        paddingTop: theme.spacing.xs,
        paddingBottom: 80,
    },
    sectionTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    formCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        ...theme.shadows.md,
    },
    formTitle: {
        ...theme.typography.h3,
        color: theme.colors.textPrimary,
        marginBottom: theme.spacing.md,
    },
    typeButtons: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginBottom: theme.spacing.md,
    },
    typeButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        borderWidth: 2,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    typeButtonActiveIngreso: {
        backgroundColor: theme.colors.success,
        borderColor: theme.colors.success,
    },
    typeButtonActiveSalida: {
        backgroundColor: theme.colors.error,
        borderColor: theme.colors.error,
    },
    typeButtonText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
        fontWeight: '600',
    },
    typeButtonTextActive: {
        color: theme.colors.white,
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
    transactionCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
        ...theme.shadows.sm,
    },
    transactionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    transactionBadge: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    badgeIngreso: {
        backgroundColor: theme.colors.success + '20',
    },
    badgeSalida: {
        backgroundColor: theme.colors.error + '20',
    },
    transactionBadgeText: {
        fontSize: 20,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionConcepto: {
        ...theme.typography.body,
        color: theme.colors.textPrimary,
        fontWeight: '600',
        marginBottom: theme.spacing.xs,
    },
    transactionFecha: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
    },
    transactionRight: {
        alignItems: 'flex-end',
    },
    transactionMonto: {
        ...theme.typography.h3,
        fontWeight: '700',
        marginBottom: theme.spacing.xs,
    },
    montoIngreso: {
        color: theme.colors.success,
    },
    montoSalida: {
        color: theme.colors.error,
    },
    deleteButton: {
        padding: theme.spacing.xs,
    },
    deleteButtonText: {
        fontSize: 16,
    },
    emptyContainer: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
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
