import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Link2 } from 'lucide-react';
import { forgotPassword } from '../services/authService';

export const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // null | 'success' | 'error'
    const [message, setMessage] = useState('');
    const [devLink, setDevLink] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus(null);

        try {
            const data = await forgotPassword(email.trim());
            setStatus('success');
            setMessage(data.message || 'Si el correo existe, recibirás un enlace de restablecimiento.');
            if (data.devResetLink) setDevLink(data.devResetLink);
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Error al procesar la solicitud. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Animated Background */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-300 dark:bg-indigo-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-8 sm:p-10">

                    {/* Back link */}
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
                            <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                            ¿Olvidaste tu contraseña?
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Ingresa tu correo y te enviaremos un enlace para restablecerla.
                        </p>
                    </div>

                    {/* Success State */}
                    {status === 'success' ? (
                        <div className="text-center">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/30 mb-5">
                                <CheckCircle className="h-8 w-8 text-green-500" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                ¡Correo enviado!
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                {message}
                            </p>
                            {devLink && (
                                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl text-left">
                                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                        <Link2 className="h-3.5 w-3.5" />
                                        MODO DESARROLLO — Enlace de restablecimiento:
                                    </p>
                                    <a
                                        href={devLink}
                                        className="text-xs text-blue-600 dark:text-blue-400 break-all hover:underline"
                                    >
                                        {devLink}
                                    </a>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                                        Configura SMTP en .env.local para enviar emails reales.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                                El enlace expira en <strong>30 minutos</strong>.
                            </p>
                            <Link
                                to="/login"
                                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Volver al inicio de sesión
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">
                                    Correo Electrónico
                                </label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 outline-none"
                                        placeholder="tu@email.com"
                                    />
                                </div>
                            </div>

                            {/* Error Message */}
                            {status === 'error' && (
                                <div className="flex items-start gap-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4">
                                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !email}
                                id="forgot-submit"
                                className="w-full py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Enviando enlace...
                                    </span>
                                ) : (
                                    'Enviar enlace de restablecimiento'
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
