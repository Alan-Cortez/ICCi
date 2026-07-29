import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { Camera, Image as ImageIcon, X } from 'lucide-react';

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
        telefono: initialData.telefono || '',
    });

    const [showCamera, setShowCamera] = useState(false);
    const [stream, setStream] = useState(null);
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    const updateField = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const processImage = (imageData) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            // Redimensionar si es muy grande (max 800px)
            const MAX_SIZE = 800;
            if (width > MAX_SIZE || height > MAX_SIZE) {
                if (width > height) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                } else {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Comprimir a JPEG con calidad 0.7
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            updateField('foto', compressedBase64);
        };
        img.src = imageData;
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith('image/')) {
                alert('Por favor selecciona un archivo de imagen válido');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                processImage(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' }
            });
            setStream(mediaStream);
            setShowCamera(true);

            // Esperar a que el video esté listo
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            }, 100);
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
            alert('No se pudo acceder a la cámara. Por favor verifica los permisos.');
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setShowCamera(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);

            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            processImage(imageData);
            stopCamera();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Validación
        if (!formData.nombre.trim()) return alert('Error: El nombre es requerido');
        if (!formData.apellido_paterno.trim()) return alert('Error: El apellido paterno es requerido');
        if (!formData.apellido_materno.trim()) return alert('Error: El apellido materno es requerido');

        const dia = parseInt(formData.dia_cumpleanos);
        if (!dia || dia < 1 || dia > 31) return alert('Error: El día debe estar entre 1 y 31');

        onSubmit({
            ...formData,
            dia_cumpleanos: dia,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                <div className="flex flex-col items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-semibold text-gray-500">Foto del Miembro</span>

                    {!showCamera ? (
                        <>
                            <div className="relative group">
                                {formData.foto ? (
                                    <img src={formData.foto} alt="Preview" className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-200 shadow-md" />
                                ) : (
                                    <div className="w-28 h-28 rounded-2xl bg-gray-50 border-2 border-dashed border-blue-400 flex flex-col items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-blue-400 mb-1" />
                                        <span className="text-xs text-gray-400">Sin foto</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                                >
                                    <ImageIcon className="w-3.5 h-3.5" />
                                    Galería
                                </button>
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="px-3 py-2 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                                >
                                    <Camera className="w-3.5 h-3.5" />
                                    Cámara
                                </button>
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                className="hidden"
                            />
                        </>
                    ) : (
                        <div className="relative w-full">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full max-w-xs rounded-xl object-cover border-2 border-blue-500"
                            />
                            <canvas ref={canvasRef} className="hidden" />

                            <div className="flex gap-2 mt-3 justify-center">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capturar
                                </button>
                                <button
                                    type="button"
                                    onClick={stopCamera}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Género al lado de la foto en tablet+ */}
                <div className="hidden sm:flex flex-col justify-center flex-1">
                    <label className="block text-sm font-semibold text-gray-500 mb-2">Género *</label>
                    <div className="flex flex-col gap-2">
                        {['Masculino', 'Femenino', 'Otro'].map((genero) => (
                            <button
                                type="button"
                                key={genero}
                                onClick={() => updateField('genero', genero)}
                                className={`py-2.5 px-4 rounded-lg border-2 text-sm text-left transition-all ${formData.genero === genero
                                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                    }`}
                            >
                                {genero}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Campos de texto — 1 col móvil / 2 col tablet / 3 col desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Nombre *</label>
                    <input
                        type="text"
                        value={formData.nombre}
                        onChange={(e) => updateField('nombre', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Nombre"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Apellido Paterno *</label>
                    <input
                        type="text"
                        value={formData.apellido_paterno}
                        onChange={(e) => updateField('apellido_paterno', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Apellido paterno"
                    />
                </div>
                <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Apellido Materno *</label>
                    <input
                        type="text"
                        value={formData.apellido_materno}
                        onChange={(e) => updateField('apellido_materno', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Apellido materno"
                    />
                </div>
            </div>

            {/* Cumpleaños + Teléfono en grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Día *</label>
                    <select
                        value={formData.dia_cumpleanos}
                        onChange={(e) => updateField('dia_cumpleanos', e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                        <option value="">Día</option>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <option key={day} value={day}>{day}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Mes *</label>
                    <select
                        value={formData.mes_cumpleanos}
                        onChange={(e) => updateField('mes_cumpleanos', parseInt(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white"
                    >
                        {MESES.map((mes) => (
                            <option key={mes.value} value={mes.value}>
                                {mes.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Teléfono</label>
                    <input
                        type="tel"
                        value={formData.telefono}
                        onChange={(e) => updateField('telefono', e.target.value)}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Ej: 5551234567"
                    />
                </div>
            </div>

            {/* Género — solo visible en móvil (en tablet ya aparece al lado de la foto) */}
            <div className="sm:hidden">
                <label className="block text-sm font-semibold text-gray-500 mb-2">Género *</label>
                <div className="flex flex-row gap-2">
                    {['Masculino', 'Femenino', 'Otro'].map((genero) => (
                        <button
                            type="button"
                            key={genero}
                            onClick={() => updateField('genero', genero)}
                            className={`flex-1 py-2.5 rounded-lg border-2 text-sm transition-all ${formData.genero === genero
                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                        >
                            {genero}
                        </button>
                    ))}
                </div>
            </div>

            {/* Botones */}
            <div className="flex flex-row gap-4 pt-4">
                <Button
                    title={initialData.id ? 'Actualizar' : 'Guardar'}
                    onClick={handleSubmit}
                    loading={loading}
                    className="flex-1"
                />
                <Button
                    title="Cancelar"
                    onClick={onCancel}
                    variant="secondary"
                    className="flex-1"
                />
            </div>
        </form>
    );
};
