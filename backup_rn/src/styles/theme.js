// Sistema de diseño minimalista blanco y azul elegante
export const theme = {
    colors: {
        // Paleta principal azul elegante
        primary: '#2563EB', // Azul vibrante
        primaryLight: '#60A5FA', // Azul claro
        primaryDark: '#1E40AF', // Azul oscuro

        // Tonos de blanco y grises
        white: '#FFFFFF',
        background: '#F8FAFC',
        surface: '#FFFFFF',
        border: '#E2E8F0',

        // Textos
        textPrimary: '#1E293B',
        textSecondary: '#64748B',
        textLight: '#94A3B8',

        // Estados
        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',

        // Overlays
        overlay: 'rgba(0, 0, 0, 0.5)',
        shadow: 'rgba(37, 99, 235, 0.1)',
    },

    spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
        xxl: 48,
    },

    borderRadius: {
        sm: 8,
        md: 12,
        lg: 16,
        xl: 24,
        full: 9999,
    },

    typography: {
        h1: {
            fontSize: 32,
            fontWeight: '700',
            lineHeight: 40,
        },
        h2: {
            fontSize: 24,
            fontWeight: '600',
            lineHeight: 32,
        },
        h3: {
            fontSize: 20,
            fontWeight: '600',
            lineHeight: 28,
        },
        body: {
            fontSize: 16,
            fontWeight: '400',
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontWeight: '400',
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontWeight: '400',
            lineHeight: 16,
        },
    },

    shadows: {
        sm: {
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
            elevation: 2,
        },
        md: {
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
        },
        lg: {
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
        },
    },
};
