import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';
import { resetPassword } from '../services/authService';

const MIN_LENGTH = 8;

function PasswordStrengthBar({ password }) {
    const checks = [
        { label: 'Al menos 8 caracteres', pass: password.length >= 8 },
        { label: 'Letra mayúscula', pass: /[A-Z]/.test(password) },
        { label: 'Letra minúscula', pass: /[a-z]/.test(password) },
        { label: 'Número', pass: /\d/.test(password) },
    ];

    const score = checks.filter((c) => c.pass).length;
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-400'];
    const labels = ['Muy débil', 'Débil', 'Regular', 'Fuerte'];

    if (!password) return null;

    return (
        <div className="mt-2 space-y-2">
            {/* Bar */}
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i < score ? colors[score - 1] : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs font-medium ${score <= 1 ? 'text-red-500' : score === 2 ? 'text-yellow-500' : score === 3 ? 'text-yellow-500' : 'text-green-500'}`}>
                {labels[score - 1] || ''}
            </p>
            {/* Checks */}
            <ul className="grid grid-cols-2 gap-1">
                {checks.map((c) => (
                    <li key={c.label} className={`flex items-center gap-1.5 text-xs ${c.pass ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        <span className="text-lg leading-none">{c.pass ? '✓' : '·'}</span>
                        {c.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // null | 'success' | 'error'
    const [message, setMessage] = useState('');

    // Redirigir si no hay token
    useEffect(() => {
        if (!token) {
            navigate('/forgot-password', { replace: true });
        }
    }, [token, navigate]);

    const passwordsMatch = password && confirm && password === confirm;
    const isPasswordStrong = password.length >= MIN_LENGTH;
    const canSubmit = passwordsMatch && isPasswordStrong && !loading;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!canSubmit) return;

        setLoading(true);
        setStatus(null);

        try {
            const data = await resetPassword(token, password);
            setStatus('success');
            setMessage(data.message || '¡Contraseña actualizada correctamente!');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Error al restablecer la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) return null;

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Animated Background */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 sm:p-10">

                    {status === 'success' ? (
                        /* ── Éxito ────────────────────────────────────────── */
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 mb-5">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                                ¡Contraseña actualizada!
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                                {message} Ya puedes iniciar sesión con tu nueva contraseña.
                            </p>
                            <Link
                                to="/login"
                                className="w-full inline-block py-3.5 px-4 text-center rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Ir al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        /* ── Formulario ──────────────────────────────────── */
                        <>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-8 group"
                            >
                                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                Volver al inicio de sesión
                            </Link>

                            {/* Header */}
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 mb-5">
                                    <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                                    Nueva contraseña
                                </h1>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    Crea una contraseña segura para tu cuenta.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                {/* Nueva contraseña */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        Nueva contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            id="new-password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className="block w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 outline-none"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    <PasswordStrengthBar password={password} />
                                </div>

                                {/* Confirmar contraseña */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                        Confirmar contraseña
                                    </label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        </div>
                                        <input
                                            id="confirm-password"
                                            type={showConfirm ? 'text' : 'password'}
                                            value={confirm}
                                            onChange={(e) => setConfirm(e.target.value)}
                                            required
                                            autoComplete="new-password"
                                            className={`block w-full pl-11 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900/50 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 transition-all duration-200 outline-none ${
                                                confirm && !passwordsMatch
                                                    ? 'border-red-400 dark:border-red-500 focus:border-red-400'
                                                    : confirm && passwordsMatch
                                                    ? 'border-green-400 dark:border-green-500 focus:border-green-400'
                                                    : 'border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400'
                                            }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                                            tabIndex={-1}
                                        >
                                            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                    {confirm && !passwordsMatch && (
                                        <p className="text-xs text-red-500 ml-1">Las contraseñas no coinciden</p>
                                    )}
                                    {passwordsMatch && (
                                        <p className="text-xs text-green-500 ml-1">✓ Las contraseñas coinciden</p>
                                    )}
                                </div>

                                {/* Error */}
                                {status === 'error' && (
                                    <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                                        <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={!canSubmit}
                                    id="reset-submit"
                                    className="w-full py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                            Actualizando...
                                        </span>
                                    ) : (
                                        'Establecer nueva contraseña'
                                    )}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
