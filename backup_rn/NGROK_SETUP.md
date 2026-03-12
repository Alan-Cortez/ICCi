# Instrucciones para usar ngrok con Expo Web

## Problema
ngrok no funciona directamente con Expo porque Expo valida el host de las peticiones.

## Solución: Usar Expo Web con ngrok

### Paso 1: Iniciar Expo en modo web
```bash
npm start
# Luego presiona 'w' para abrir en web
```

### Paso 2: Crear túnel ngrok al puerto web de Expo
El servidor web de Expo corre en el puerto **19006** (no 8081).

```bash
.\ngrok.exe http 19006
```

### Paso 3: Acceder a la aplicación
- Abre la URL que ngrok te proporciona (ejemplo: https://xxxx.ngrok-free.dev)
- La aplicación debería cargar correctamente

## Alternativa: Usar directamente en localhost
Si solo quieres probar en web localmente:
```bash
npm start
# Presiona 'w'
```
Esto abrirá http://localhost:19006 en tu navegador.

## Nota sobre el puerto
- Puerto 8081: Metro Bundler (para React Native móvil)
- Puerto 19006: Webpack Dev Server (para Web)
