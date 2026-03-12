import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { Button } from './Button';

const MESES = [
    { label: 'Enero', value: 1 },
    { label: 'Febrero', value: 2 },
    { label: 'Marzo', value: 3 },
    { label: 'Abril', value: 4 },
    { label: 'Mayo', value: 5 },
    { label: 'Junio', value: 6 },
    { label: 'Julio', value: 7 },
    { label: 'Agosto', value: 8 },
    { label: 'Septiembre', value: 9 },
    { label: 'Octubre', value: 10 },
    { label: 'Noviembre', value: 11 },
    { label: 'Diciembre', value: 12 },
];

export const MemberForm = ({ initialData = {}, onSubmit, onCancel, loading = false }) => {
    const [formData, setFormData] = useState({
        nombre: initialData.nombre || '',
        apellido_paterno: initialData.apellido_paterno || '',
        apellido_materno: initialData.apellido_materno || '',
        dia_cumpleanos: initialData.dia_cumpleanos?.toString() || '',
        mes_cumpleanos: initialData.mes_cumpleanos || 1,
        foto: initialData.foto || null,
        genero: initialData.genero || 'Masculino',
    });

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const pickImage = async () => {
        // En web, usar input de archivo
        if (typeof document !== 'undefined') {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        updateField('foto', event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
            return;
        }

        // En móvil, mostrar opciones
        if (typeof Alert !== 'undefined' && Alert.alert) {
            Alert.alert(
                'Seleccionar Foto',
                'Elige una opción',
                [
                    {
                        text: 'Tomar Foto',
                        onPress: takePhoto
                    },
                    {
                        text: 'Elegir de Galería',
                        onPress: pickFromGallery
                    },
                    {
                        text: 'Cancelar',
                        style: 'cancel'
                    }
                ]
            );
        } else {
            // Si Alert no está disponible, usar galería por defecto
            pickFromGallery();
        }
    };

    const takePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (!permissionResult.granted) {
            if (typeof alert !== 'undefined') {
                alert('Se necesita permiso para acceder a la cámara');
            }
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            updateField('foto', result.assets[0].uri);
        }
    };

    const pickFromGallery = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permissionResult.granted) {
            if (typeof alert !== 'undefined') {
                alert('Se necesita permiso para acceder a la galería');
            }
            return;
        }

        const result = await ImagePicker.launchImagePickerAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            updateField('foto', result.assets[0].uri);
        }
    };

    const handleSubmit = () => {
        // Validación
        if (!formData.nombre.trim()) {
            if (typeof alert !== 'undefined') {
                alert('Error: El nombre es requerido');
            }
            return;
        }
        if (!formData.apellido_paterno.trim()) {
            if (typeof alert !== 'undefined') {
                alert('Error: El apellido paterno es requerido');
            }
            return;
        }
        if (!formData.apellido_materno.trim()) {
            if (typeof alert !== 'undefined') {
                alert('Error: El apellido materno es requerido');
            }
            return;
        }

        const dia = parseInt(formData.dia_cumpleanos);
        if (!dia || dia < 1 || dia > 31) {
            if (typeof alert !== 'undefined') {
                alert('Error: El día debe estar entre 1 y 31');
            }
            return;
        }

        onSubmit({
            ...formData,
            dia_cumpleanos: dia,
        });
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Foto */}
            <View style={styles.section}>
                <Text style={styles.label}>Foto</Text>
                <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                    {formData.foto ? (
                        <Image source={{ uri: formData.foto }} style={styles.photoPreview} />
                    ) : (
                        <View style={styles.photoPlaceholder}>
                            <Text style={styles.photoPlaceholderText}>+</Text>
                            <Text style={styles.photoPlaceholderSubtext}>Agregar foto</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Nombre */}
            <View style={styles.section}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.nombre}
                    onChangeText={(value) => updateField('nombre', value)}
                    placeholder="Ingresa el nombre"
                    placeholderTextColor={theme.colors.textLight}
                />
            </View>

            {/* Apellido Paterno */}
            <View style={styles.section}>
                <Text style={styles.label}>Apellido Paterno *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.apellido_paterno}
                    onChangeText={(value) => updateField('apellido_paterno', value)}
                    placeholder="Ingresa el apellido paterno"
                    placeholderTextColor={theme.colors.textLight}
                />
            </View>

            {/* Apellido Materno */}
            <View style={styles.section}>
                <Text style={styles.label}>Apellido Materno *</Text>
                <TextInput
                    style={styles.input}
                    value={formData.apellido_materno}
                    onChangeText={(value) => updateField('apellido_materno', value)}
                    placeholder="Ingresa el apellido materno"
                    placeholderTextColor={theme.colors.textLight}
                />
            </View>

            {/* Cumpleaños */}
            <View style={styles.row}>
                <View style={[styles.section, { flex: 1, marginRight: theme.spacing.sm }]}>
                    <Text style={styles.label}>Día *</Text>
                    <TextInput
                        style={styles.input}
                        value={formData.dia_cumpleanos}
                        onChangeText={(value) => updateField('dia_cumpleanos', value)}
                        placeholder="DD"
                        keyboardType="numeric"
                        maxLength={2}
                        placeholderTextColor={theme.colors.textLight}
                    />
                </View>

                <View style={[styles.section, { flex: 2 }]}>
                    <Text style={styles.label}>Mes *</Text>
                    <View style={styles.pickerContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {MESES.map((mes) => (
                                <TouchableOpacity
                                    key={mes.value}
                                    style={[
                                        styles.monthButton,
                                        formData.mes_cumpleanos === mes.value && styles.monthButtonActive
                                    ]}
                                    onPress={() => updateField('mes_cumpleanos', mes.value)}
                                >
                                    <Text style={[
                                        styles.monthButtonText,
                                        formData.mes_cumpleanos === mes.value && styles.monthButtonTextActive
                                    ]}>
                                        {mes.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </View>

            {/* Género */}
            <View style={styles.section}>
                <Text style={styles.label}>Género *</Text>
                <View style={styles.genderContainer}>
                    {['Masculino', 'Femenino', 'Otro'].map((genero) => (
                        <TouchableOpacity
                            key={genero}
                            style={[
                                styles.genderButton,
                                formData.genero === genero && styles.genderButtonActive
                            ]}
                            onPress={() => updateField('genero', genero)}
                        >
                            <Text style={[
                                styles.genderButtonText,
                                formData.genero === genero && styles.genderButtonTextActive
                            ]}>
                                {genero}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Botones */}
            <View style={styles.buttonContainer}>
                <Button
                    title={initialData.id ? 'Actualizar' : 'Guardar'}
                    onPress={handleSubmit}
                    loading={loading}
                    style={{ flex: 1, marginRight: theme.spacing.sm }}
                />
                <Button
                    title="Cancelar"
                    onPress={onCancel}
                    variant="secondary"
                    style={{ flex: 1 }}
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    section: {
        marginBottom: theme.spacing.lg,
    },
    label: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
        fontWeight: '600',
    },
    input: {
        backgroundColor: theme.colors.white,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        ...theme.typography.body,
        color: theme.colors.textPrimary,
    },
    row: {
        flexDirection: 'row',
    },
    photoButton: {
        alignSelf: 'center',
    },
    photoPreview: {
        width: 120,
        height: 120,
        borderRadius: theme.borderRadius.lg,
    },
    photoPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: theme.borderRadius.lg,
        backgroundColor: theme.colors.background,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    photoPlaceholderText: {
        ...theme.typography.h1,
        color: theme.colors.primary,
    },
    photoPlaceholderSubtext: {
        ...theme.typography.caption,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    pickerContainer: {
        backgroundColor: theme.colors.white,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
    },
    monthButton: {
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.borderRadius.sm,
        marginRight: theme.spacing.xs,
    },
    monthButtonActive: {
        backgroundColor: theme.colors.primary,
    },
    monthButtonText: {
        ...theme.typography.bodySmall,
        color: theme.colors.textSecondary,
    },
    monthButtonTextActive: {
        color: theme.colors.white,
        fontWeight: '600',
    },
    genderContainer: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    genderButton: {
        flex: 1,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        backgroundColor: theme.colors.white,
        borderWidth: 1.5,
        borderColor: theme.colors.border,
        alignItems: 'center',
    },
    genderButtonActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    genderButtonText: {
        ...theme.typography.body,
        color: theme.colors.textSecondary,
    },
    genderButtonTextActive: {
        color: theme.colors.white,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        marginTop: theme.spacing.lg,
        marginBottom: theme.spacing.xxl,
    },
});
