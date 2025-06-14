# 📋 Sistema de Auditoría - Proyecto Angular

## 🎯 Descripción General

Este proyecto implementa un **sistema completo de auditoría** para una aplicación Angular con TypeScript y Tailwind CSS. El sistema registra automáticamente todas las actividades de los usuarios y proporciona una interfaz moderna para consultar y analizar los logs de auditoría.

## 🏗️ Arquitectura del Sistema

### Tecnologías Utilizadas
- **Frontend**: Angular 17+ con TypeScript
- **Estilos**: Tailwind CSS
- **Base de Datos**: Firebase Firestore
- **Autenticación**: Firebase Authentication
- **Patrones**: Servicios Injectable, Observables RxJS

### Componentes Principales

```
src/
├── services/
│   ├── audit.service.ts      # Servicio principal de auditoría
│   ├── auth.service.ts       # Autenticación con auditoría integrada
│   └── user.service.ts       # Gestión de usuarios con auditoría
├── components/
│   ├── audit.component.ts    # Componente de interfaz de auditoría
│   └── audit.component.html  # Template con diseño moderno
└── interfaces/
    └── audit.interface.ts    # Definiciones de tipos TypeScript
```

## 🔧 Implementación de la Auditoría

### 1. Servicio de Auditoría (`audit.service.ts`)

**Funcionalidades principales:**
- ✅ Registro automático de eventos de usuario
- ✅ Gestión de sesiones únicas
- ✅ Filtrado avanzado de logs
- ✅ Estadísticas en tiempo real
- ✅ Exportación de datos
- ✅ Limpieza automática de logs antiguos

**Eventos registrados:**
- 🔐 Login/Logout de usuarios
- ➕ Creación de registros
- ✏️ Actualizaciones de datos
- 🗑️ Eliminaciones
- 🔑 Cambios de contraseña
- 👁️ Acceso a páginas sensibles
- 📊 Exportación de datos
- 🔍 Búsquedas realizadas

### 2. Integración con Autenticación

El `auth.service.ts` registra automáticamente:
- Inicios de sesión exitosos
- Cierres de sesión
- Creación de nuevas cuentas
- Cambios de contraseña
- Información de sesión y ubicación

### 3. Auditoría en Gestión de Usuarios

El `user.service.ts` registra:
- Creación de usuarios
- Actualizaciones de perfil
- Eliminación de cuentas
- Cambios de permisos

## 🎨 Interfaz de Usuario

### Características del Componente de Auditoría

**Diseño moderno con Tailwind CSS:**
- 🎨 Gradientes y efectos glassmorphism
- 📱 Diseño completamente responsivo
- ⚡ Animaciones suaves y transiciones
- 🔍 Filtros avanzados en tiempo real
- 📊 Estadísticas visuales con barras de progreso
- 📄 Paginación inteligente
- 📤 Exportación a CSV

**Filtros disponibles:**
- Búsqueda por nombre de usuario
- Filtro por tipo de acción
- Rango de fechas (inicio y fin)
- Filtro por sesión específica

## 📊 Estructura de Datos

### Modelo de Log de Auditoría

```typescript
interface AuditLog {
  id?: string
  uid: string              // ID del usuario
  nombre: string           // Nombre del usuario
  accion: AuditAction      // Tipo de acción realizada
  detalles?: string        // Descripción detallada
  fechaHora: Date          // Timestamp del evento
  ipAddress?: string       // Dirección IP del usuario
  userAgent?: string       // Información del navegador
  sessionId?: string       // ID único de sesión
  location?: string        // Ubicación geográfica
}
```

### Tipos de Acciones Auditadas

```typescript
enum AuditAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  PASSWORD_CHANGE = 'password_change',
  PROFILE_VIEW = 'profile_view',
  EXPORT_DATA = 'export_data',
  SEARCH_PERFORMED = 'search_performed',
  PAGE_ACCESS = 'page_access'
}
```

## 🚀 Configuración e Instalación

### 1. Dependencias Requeridas

```bash
npm install @angular/fire firebase
npm install -D tailwindcss postcss autoprefixer
```

### 2. Configuración de Firebase

```typescript
// environment.ts
export const environment = {
  firebase: {
    apiKey: "tu-api-key",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "tu-app-id"
  }
}
```

### 3. Estructura de Firestore

**Colecciones necesarias:**
- `audit_logs` - Almacena todos los eventos de auditoría
- `user_sessions` - Gestiona las sesiones de usuario
- `users` - Información de usuarios

## 📈 Funcionalidades Avanzadas

### Estadísticas en Tiempo Real
- Conteo total de registros
- Distribución por tipo de acción
- Usuarios más activos
- Actividad por día/semana/mes

### Filtrado Inteligente
- Búsqueda por texto libre
- Filtros combinables
- Rango de fechas flexible
- Filtro por sesión específica

### Exportación de Datos
- Formato CSV con todos los campos
- Filtros aplicados a la exportación
- Nombres de archivo con timestamp
- Codificación UTF-8 compatible

### Gestión de Sesiones
- ID único por sesión de usuario
- Seguimiento de duración de sesión
- Conteo de acciones por sesión
- Información de dispositivo y ubicación

## 🔒 Consideraciones de Seguridad

### Protección de Datos
- ✅ No se almacenan contraseñas en logs
- ✅ IPs hasheadas para privacidad
- ✅ Limpieza automática de logs antiguos
- ✅ Acceso restringido a administradores

### Reglas de Firestore
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /audit_logs/{document} {
      allow read, write: if request.auth != null && 
        resource.data.uid == request.auth.uid;
    }
  }
}
```

## 📱 Uso del Sistema

### Para Desarrolladores

1. **Registrar evento personalizado:**
```typescript
await this.auditService.logAuditEvent({
  uid: currentUser.uid,
  nombre: currentUser.displayName,
  accion: AuditAction.CUSTOM_ACTION,
  detalles: 'Descripción del evento personalizado'
});
```

2. **Consultar logs específicos:**
```typescript
const userLogs = await this.auditService.getUserAuditLogs(userId);
const sessionLogs = await this.auditService.getSessionAuditLogs(sessionId);
```

### Para Administradores

1. **Acceder al panel de auditoría**
2. **Aplicar filtros según necesidades**
3. **Exportar datos para análisis**
4. **Monitorear actividad en tiempo real**