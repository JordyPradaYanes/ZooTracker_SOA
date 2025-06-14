# 🔍 Sistema de Auditoría Angular

<div align="center">

![Angular](https://img.shields.io/badge/Angular-17+-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

**Sistema completo de auditoría y monitoreo de actividades de usuario**

[🚀 Instalación](#-instalación) • [📖 Documentación](#-documentación) • [🎯 Características](#-características) • [🔧 Configuración](#-configuración)

</div>

---

## 📋 Tabla de Contenidos

- [🎯 Descripción General](#-descripción-general)
- [✨ Características Principales](#-características-principales)
- [🏗️ Arquitectura](#-arquitectura)
- [🚀 Instalación](#-instalación)
- [🔧 Configuración](#-configuración)
- [📊 Estructura de Datos](#-estructura-de-datos)
- [🎨 Interfaz de Usuario](#-interfaz-de-usuario)
- [📈 Funcionalidades Avanzadas](#-funcionalidades-avanzadas)
- [🔒 Seguridad](#-seguridad)
- [📚 Uso del Sistema](#-uso-del-sistema)
- [🤝 Contribución](#-contribución)
- [📄 Licencia](#-licencia)

---

## 🎯 Descripción General

Sistema de auditoría empresarial desarrollado en **Angular 17+** que registra automáticamente todas las actividades de los usuarios y proporciona una interfaz moderna para consultar, filtrar y analizar los logs de auditoría en tiempo real.

### 🎪 Demo en Vivo
> 🚧 **Próximamente**: Link a demo interactiva

---

## ✨ Características Principales

### 🔄 **Auditoría Automática**
- ✅ Registro automático de todas las actividades de usuario
- ✅ Seguimiento de sesiones únicas con metadatos
- ✅ Captura de información contextual (IP, User-Agent, ubicación)
- ✅ Timestamps precisos con zona horaria

### 🎨 **Interfaz Moderna**
- ✅ Diseño responsivo con Tailwind CSS
- ✅ Efectos glassmorphism y animaciones suaves
- ✅ Filtros avanzados en tiempo real
- ✅ **Ordenamiento ascendente/descendente** por fecha y usuario
- ✅ Paginación inteligente
- ✅ Estadísticas visuales interactivas

### 📊 **Análisis y Reportes**
- ✅ Estadísticas en tiempo real
- ✅ Exportación a CSV con filtros aplicados
- ✅ Dashboards de actividad
- ✅ Métricas de uso por usuario y acción

### 🔒 **Seguridad y Privacidad**
- ✅ Cumplimiento con regulaciones de privacidad
- ✅ Encriptación de datos sensibles
- ✅ Limpieza automática de logs antiguos
- ✅ Control de acceso basado en roles

### 📋 **Funcionalidades de Ordenamiento**
Este sistema implementa ordenamiento ascendente y descendente para los campos:
- **Fecha y Hora** (`fechaHora`)
- **Usuario** (`nombre`)

---

## 🏗️ Arquitectura

### 🛠️ **Stack Tecnológico**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Angular** | 17+ | Framework principal |
| **TypeScript** | 5.0+ | Tipado estático |
| **Tailwind CSS** | 3.0+ | Estilos y diseño |
| **Firebase Firestore** | 9.0+ | Base de datos NoSQL |
| **Firebase Auth** | 9.0+ | Autenticación |
| **RxJS** | 7.0+ | Programación reactiva |

### 📁 **Estructura del Proyecto**

```
src/
├── 📁 components/
│   ├── 🧩 audit/
│   │   ├── audit.component.ts       # Componente principal de auditoría
│   │   ├── audit.component.html     # Template con diseño moderno
│   │   └── audit.component.css      # Estilos específicos
│   └── 🧩 shared/
│       └── header/
├── 📁 services/
│   ├── 🔧 audit.service.ts          # Servicio principal de auditoría
│   ├── 🔧 auth.service.ts           # Autenticación con auditoría
│   └── 🔧 user.service.ts           # Gestión de usuarios
├── 📁 interfaces/
│   ├── 📝 audit.interface.ts        # Tipos de auditoría
│   └── 📝 user.interface.ts         # Tipos de usuario
├── 📁 guards/
│   └── 🛡️ auth.guard.ts             # Protección de rutas
└── 📁 environments/
    ├── 🌍 environment.ts            # Configuración desarrollo
    └── 🌍 environment.prod.ts       # Configuración producción
```

---

## 🚀 Instalación

### 📋 **Prerrequisitos**

- Node.js 18+ 
- Angular CLI 17+
- Cuenta de Firebase
- Git

### 🔧 **Pasos de Instalación**

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/sistema-auditoria-angular.git
   cd sistema-auditoria-angular
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Instalar dependencias específicas**
   ```bash
   # Firebase
   npm install @angular/fire firebase
   
   # Tailwind CSS
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   
   # Utilidades adicionales
   npm install date-fns uuid
   npm install -D @types/uuid
   ```

4. **Configurar Tailwind CSS**
   ```javascript
   // tailwind.config.js
   module.exports = {
     content: [
       "./src/**/*.{html,ts}",
     ],
     theme: {
       extend: {
         animation: {
           'fade-in': 'fadeIn 0.5s ease-in-out',
           'slide-up': 'slideUp 0.3s ease-out',
           'count-up': 'countUp 1s ease-out',
           'progress': 'progress 1s ease-out',
         }
       },
     },
     plugins: [],
   }
   ```

5. **Ejecutar el proyecto**
   ```bash
   ng serve
   ```

---

## 🔧 Configuración

### 🔥 **Configuración de Firebase**

1. **Crear proyecto en Firebase Console**
2. **Habilitar Firestore y Authentication**
3. **Configurar variables de entorno**

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "tu-api-key-aqui",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789"
  },
  auditConfig: {
    retentionDays: 90,        // Días de retención de logs
    batchSize: 500,           // Tamaño de lote para consultas
    enableRealTime: true,     // Actualizaciones en tiempo real
    enableGeolocation: false  // Captura de ubicación
  }
};
```

### 🔐 **Reglas de Firestore**

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Logs de auditoría - Solo lectura para administradores
    match /audit_logs/{document} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if request.auth != null;
    }
    
    // Sesiones de usuario
    match /user_sessions/{document} {
      allow read, write: if request.auth != null && 
        resource.data.uid == request.auth.uid;
    }
    
    // Usuarios - Control de acceso por rol
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == userId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 📊 Estructura de Datos

### 🗂️ **Modelo de Log de Auditoría**

```typescript
interface AuditLog {
  id?: string;                    // ID único del documento
  uid: string;                    // ID del usuario que realizó la acción
  nombre: string;                 // Nombre completo del usuario
  email?: string;                 // Email del usuario
  accion: AuditAction;           // Tipo de acción realizada
  detalles?: string;             // Descripción detallada del evento
  fechaHora: Date;               // Timestamp preciso del evento
  ipAddress?: string;            // Dirección IP (hasheada por privacidad)
  userAgent?: string;            // Información del navegador/dispositivo
  sessionId?: string;            // ID único de la sesión
  location?: {                   // Ubicación geográfica (opcional)
    country?: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  metadata?: {                   // Metadatos adicionales
    previousValue?: any;         // Valor anterior (para updates)
    newValue?: any;             // Nuevo valor (para updates)
    affectedRecords?: number;   // Número de registros afectados
    duration?: number;          // Duración de la operación (ms)
  };
}
```

### 🎯 **Tipos de Acciones Auditadas**

```typescript
enum AuditAction {
  // Autenticación
  LOGIN = 'login',
  LOGOUT = 'logout',
  REGISTER = 'register',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  
  // CRUD Operations
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  BULK_DELETE = 'bulk_delete',
  
  // Navegación y Acceso
  PAGE_ACCESS = 'page_access',
  PROFILE_VIEW = 'profile_view',
  ADMIN_ACCESS = 'admin_access',
  
  // Datos y Reportes
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data',
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
  SORT_APPLIED = 'sort_applied',
  
  // Sistema
  SYSTEM_ERROR = 'system_error',
  PERMISSION_DENIED = 'permission_denied',
  SESSION_TIMEOUT = 'session_timeout'
}
```

### 📈 **Modelo de Estadísticas**

```typescript
interface AuditStats {
  totalLogs: number;
  logsByAction: { [key: string]: number };
  logsByUser: { [key: string]: number };
  logsByDate: { [key: string]: number };
  activeUsers: number;
  averageSessionDuration: number;
  topActions: Array<{
    action: AuditAction;
    count: number;
    percentage: number;
  }>;
}
```

---

## 🎨 Interfaz de Usuario

### 🖼️ **Capturas de Pantalla**

> 🚧 **Próximamente**: Capturas de pantalla de la interfaz

### 🎛️ **Características de la UI**

#### **Panel de Estadísticas**
- 📊 Tarjetas con métricas clave
- 📈 Gráficos de barras de progreso animados
- 🔄 Actualización en tiempo real
- 📱 Diseño responsivo

#### **Sistema de Filtros Avanzados**
- 🔍 Búsqueda por nombre de usuario
- 📅 Selector de rango de fechas
- 🎯 Filtro por tipo de acción
- 🔄 **Ordenamiento por fecha y usuario (ASC/DESC)**
- 🧹 Limpieza rápida de filtros

#### **Tabla de Auditoría**
- 📋 Vista tabular con paginación
- 🎨 Badges coloridos por tipo de acción
- 👤 Avatares de usuario con iniciales
- 📱 Scroll horizontal en móviles
- ⚡ Carga lazy para mejor rendimiento

#### **Controles de Ordenamiento**
- 🔼 Ordenamiento ascendente por fecha/usuario
- 🔽 Ordenamiento descendente por fecha/usuario
- 🎯 Indicadores visuales de ordenamiento activo
- 🔄 Headers clickeables para ordenamiento rápido

---

## 📈 Funcionalidades Avanzadas

### 🔍 **Filtrado Inteligente**

```typescript
// Ejemplo de uso del sistema de filtros
const filtros: AuditFilters = {
  usuario: 'juan.perez',
  accion: [AuditAction.LOGIN, AuditAction.LOGOUT],
  fechaInicio: new Date('2024-01-01'),
  fechaFin: new Date('2024-12-31'),
  sesion: 'session-123'
};

const logs = await this.auditService.getAuditLogs(filtros);
```

### 📊 **Ordenamiento Dinámico**

```typescript
// Configuración de ordenamiento
interface SortConfig {
  field: 'fechaHora' | 'nombre' | null;
  direction: 'asc' | 'desc';
}

// Aplicar ordenamiento
sortData(field: 'fechaHora' | 'nombre'): void {
  if (this.sortConfig.field === field) {
    // Si ya está ordenado por este campo, cambiar dirección
    this.sortConfig.direction = this.sortConfig.direction === 'asc' ? 'desc' : 'asc'
  } else {
    // Si es un campo nuevo, ordenar ascendente
    this.sortConfig.field = field
    this.sortConfig.direction = 'asc'
  }

  this.applySorting()
  this.calculatePagination()
  this.currentPage = 1

  // Registrar acción de ordenamiento
  this.logComponentAction(
    AuditAction.PROFILE_VIEW, 
    `Ordenamiento aplicado: \${field} \${this.sortConfig.direction}`
  )
}
```

### 📤 **Exportación Avanzada**

```typescript
// Exportar con filtros aplicados
async exportToCSV(): Promise<void> {
  const data = this.filteredLogs.map(log => ({
    'Fecha y Hora': this.formatDate(log.fechaHora),
    'Usuario': log.nombre,
    'Acción': this.translateAction(log.accion),
    'Detalles': log.detalles || '',
    'IP': log.ipAddress || '',
    'Sesión': log.sessionId || ''
  }));
  
  // Generar y descargar CSV
}
```

### 📊 **Dashboard de Métricas**

- **Métricas en Tiempo Real**
  - Total de registros
  - Usuarios activos
  - Acciones por tipo
  - Tendencias temporales

- **Visualizaciones**
  - Gráficos de barras animados
  - Indicadores de progreso
  - Contadores animados
  - Mapas de calor (próximamente)

---

## 🔒 Seguridad

### 🛡️ **Medidas de Protección**

#### **Protección de Datos**
- ✅ **No almacenamiento de contraseñas** en logs
- ✅ **Hashing de IPs** para proteger privacidad
- ✅ **Encriptación** de datos sensibles
- ✅ **Limpieza automática** de logs antiguos

#### **Control de Acceso**
- ✅ **Autenticación requerida** para todas las operaciones
- ✅ **Roles y permisos** granulares
- ✅ **Validación de sesiones** activas
- ✅ **Rate limiting** para prevenir abuso

#### **Cumplimiento Normativo**
- ✅ **GDPR** - Derecho al olvido implementado
- ✅ **LOPD** - Protección de datos personales
- ✅ **SOX** - Trazabilidad de cambios financieros
- ✅ **ISO 27001** - Gestión de seguridad de la información

### 🔐 **Configuración de Seguridad**

```typescript
// Configuración de seguridad en environment
export const securityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keyRotationDays: 90
  },
  retention: {
    defaultDays: 90,
    criticalActionsDays: 365,
    maxRetentionDays: 2555 // 7 años
  },
  privacy: {
    hashIPs: true,
    anonymizeAfterDays: 30,
    enableGeolocation: false
  }
};
```

---

## 📚 Uso del Sistema

### 👨‍💻 **Para Desarrolladores**

#### **Registrar Evento Personalizado**

```typescript
import { AuditService, AuditAction } from './services/audit.service';

constructor(private auditService: AuditService) {}

async registrarAccion() {
  await this.auditService.logAuditEvent({
    uid: this.currentUser.uid,
    nombre: this.currentUser.displayName,
    accion: AuditAction.CREATE,
    detalles: 'Usuario creó un nuevo producto',
    metadata: {
      productId: 'prod-123',
      category: 'electronics'
    }
  });
}
```

#### **Consultar Logs Específicos**

```typescript
// Logs de un usuario específico
const userLogs = await this.auditService.getUserAuditLogs(userId);

// Logs de una sesión específica
const sessionLogs = await this.auditService.getSessionAuditLogs(sessionId);

// Logs con filtros avanzados
const filteredLogs = await this.auditService.getAuditLogs({
  accion: [AuditAction.CREATE, AuditAction.UPDATE],
  fechaInicio: startDate,
  fechaFin: endDate
});
```

#### **Integración con Componentes**

```typescript
@Component({
  selector: 'app-mi-componente',
  template: `...`
})
export class MiComponente implements OnInit {
  
  constructor(private auditService: AuditService) {}
  
  async ngOnInit() {
    // Registrar acceso a la página
    await this.auditService.logPageAccess('mi-componente');
  }
  
  async onUserAction() {
    // Registrar acción específica
    await this.auditService.logAuditEvent({
      uid: this.currentUser.uid,
      nombre: this.currentUser.displayName,
      accion: AuditAction.UPDATE,
      detalles: 'Usuario actualizó configuración'
    });
  }
}
```

### 👨‍💼 **Para Administradores**

#### **Acceso al Panel de Auditoría**
1. Navegar a `/audit`
2. Autenticarse con credenciales de administrador
3. Utilizar filtros para encontrar información específica

#### **Análisis de Actividad**
- **Monitoreo en Tiempo Real**: Ver actividad actual de usuarios
- **Análisis de Tendencias**: Identificar patrones de uso
- **Detección de Anomalías**: Alertas por actividad sospechosa
- **Reportes Periódicos**: Exportación automática de reportes