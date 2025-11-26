# Sistema de Gestión de Semillas - Backend

API REST desarrollada con NestJS para la gestión integral de operaciones de procesamiento y distribución de semillas certificadas.

## 📋 Descripción

Sistema backend que gestiona el ciclo completo de operaciones de semillas, desde el ingreso de materia prima hasta la distribución final, incluyendo:

- Gestión de órdenes de ingreso y salida
- Control de inventario y lotes de producción
- Trazabilidad completa de movimientos
- Gestión multiusuario con roles y permisos
- Generación de reportes en PDF
- Sistema multi-unidad organizacional

## 🚀 Tecnologías

- **Framework**: NestJS 11.x
- **Base de datos**: MySQL 8.0
- **ORM**: TypeORM 0.3.x
- **Autenticación**: JWT (Passport)
- **Validación**: Class Validator & Class Transformer
- **Generación de PDFs**: PDFMake
- **Encriptación**: Bcrypt

## 📁 Estructura del Proyecto

```
src/
├── common/                 # Recursos compartidos
│   ├── decorators/        # Decoradores personalizados
│   ├── enums/            # Enumeraciones
│   ├── guards/           # Guards de autenticación y autorización
│   └── interfaces/       # Interfaces TypeScript
├── config/               # Configuraciones
│   ├── database.config.ts
│   └── jwt.config.ts
├── modules/              # Módulos funcionales
│   ├── auth/            # Autenticación y autorización
│   ├── usuarios/        # Gestión de usuarios
│   ├── unidades/        # Unidades organizacionales
│   ├── semillas/        # Catálogo de semillas
│   ├── variedades/      # Variedades de semillas
│   ├── categorias/      # Categorías de clasificación
│   ├── cooperadores/    # Gestión de cooperadores
│   ├── conductores/     # Registro de conductores
│   ├── vehiculos/       # Gestión de vehículos
│   ├── clientes/        # Base de datos de clientes
│   ├── semilleras/      # Empresas semilleras
│   ├── ordenes-ingreso/ # Órdenes de ingreso
│   ├── lotes-produccion/ # Lotes de producción
│   ├── ordenes-salidas/ # Órdenes de salida
│   ├── movimientos-lote/ # Trazabilidad de movimientos
│   └── reportes/        # Generación de reportes
└── main.ts              # Punto de entrada
```

## 🔧 Instalación

### Prerrequisitos

- Node.js >= 18.x
- MySQL >= 8.0
- npm o yarn

### Configuración

1. **Clonar el repositorio**

```bash
   git clone <repository-url>
   cd backend
```

2. **Instalar dependencias**

```bash
   npm install
```

3. **Configurar variables de entorno**

   Crear archivo `.env` basado en `.env.example`:

```env
   # Application
   NODE_ENV=development
   PORT=3000
   API_PREFIX=api/v1

   # Database
   DB_HOST=localhost
   DB_PORT=3306
   DB_USERNAME=semillas_user
   DB_PASSWORD=semillas_pass
   DB_DATABASE=semillas_db

   # JWT
   JWT_SECRET=tu_clave_secreta_super_segura
   JWT_EXPIRATION=1d
   JWT_REFRESH_SECRET=tu_clave_refresh_super_segura
   JWT_REFRESH_EXPIRATION=7d

   # CORS
   CORS_ORIGIN=http://localhost:3001
```

4. **Iniciar base de datos con Docker** (opcional)

```bash
   docker-compose up -d
```

## 🎯 Ejecución

### Modo desarrollo

```bash
npm run start:dev
```

### Modo producción

```bash
npm run build
npm run start:prod
```

### Modo debug

```bash
npm run start:debug
```

## 🔐 Sistema de Autenticación

### Roles disponibles

- **ADMIN**: Acceso total al sistema
- **ENCARGADO**: Gestión de operaciones de su unidad
- **OPERADOR**: Operaciones básicas de registro

### Endpoints de autenticación

```http
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
GET  /api/v1/auth/profile
```

### Ejemplo de login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "usuario": "admin",
    "password": "password123"
  }'
```

## 📊 Módulos Principales

### Órdenes de Ingreso

Gestión de ingresos de materia prima con registro completo de:

- Datos del transportista (cooperador, conductor, vehículo)
- Información del producto (semilla, variedad, categoría)
- Datos de pesaje y análisis de laboratorio
- Control automático de estados

**Endpoints principales:**

```
GET    /api/v1/ordenes-ingreso
POST   /api/v1/ordenes-ingreso
GET    /api/v1/ordenes-ingreso/:id
PATCH  /api/v1/ordenes-ingreso/:id
DELETE /api/v1/ordenes-ingreso/:id
GET    /api/v1/ordenes-ingreso/:id/resumen-produccion
```

### Lotes de Producción

Control de lotes procesados con:

- Trazabilidad completa desde la orden de ingreso
- Gestión de estados del inventario
- Validación automática de cantidades
- Registro de movimientos

**Endpoints principales:**

```
GET    /api/v1/lotes-produccion
POST   /api/v1/lotes-produccion
GET    /api/v1/lotes-produccion/inventario
GET    /api/v1/lotes-produccion/disponibles
```

### Órdenes de Salida

Despacho de productos con:

- Gestión de detalles multi-lote
- Actualización automática de inventario
- Registro de movimientos de salida
- Validación de disponibilidad

**Endpoints principales:**

```
GET    /api/v1/ordenes-salida
POST   /api/v1/ordenes-salida
GET    /api/v1/ordenes-salida/lotes-disponibles-filtrados
```

### Reportes

Generación de documentos PDF:

- Órdenes de ingreso
- Órdenes de salida
- Inventario consolidado con filtros avanzados

**Endpoints principales:**

```
GET /api/v1/reportes/orden-ingreso/:id
GET /api/v1/reportes/orden-salida/:id
GET /api/v1/reportes/inventario-consolidado
```

## 🔒 Seguridad

- Autenticación basada en JWT
- Guards de autorización por roles
- Validación de datos con class-validator
- Encriptación de contraseñas con bcrypt
- Control de acceso a nivel de unidad organizacional

## 📝 Características Destacadas

### Control de Inventario Inteligente

- Validación automática de cantidades en producción
- Actualización en tiempo real de estados de lotes
- Trazabilidad completa de movimientos
- Alertas de inventario por estados

### Sistema Multi-Unidad

- Aislamiento de datos por unidad organizacional
- Administradores pueden gestionar todas las unidades
- Encargados y operadores limitados a su unidad

### Gestión de Estados Automática

**Órdenes de Ingreso:**

- `pendiente` → Sin lotes creados
- `en_proceso` → Con lotes parciales
- `completado` → 100% del peso neto procesado
- `cancelado` → Cancelada manualmente

**Lotes de Producción:**

- `disponible` → Sin ventas
- `parcialmente_vendido` → Ventas parciales
- `vendido` → Totalmente vendido
- `descartado` → Dado de baja

### Reportes Personalizables

Generación de PDFs con:

- Logos institucionales
- Formato oficial de documentos
- Filtros avanzados para inventario
- Resúmenes estadísticos

## 📦 Scripts Disponibles

```bash
npm run build          # Compilar proyecto
npm run format         # Formatear código
npm run lint           # Linter
npm run migration:generate  # Generar migración
npm run migration:run       # Ejecutar migraciones
npm run migration:revert    # Revertir migración
```

## 🐳 Docker

El proyecto incluye configuración Docker con:

- MySQL 8.0
- phpMyAdmin para gestión visual de BD

```bash
# Iniciar servicios
docker-compose up -d

# Detener servicios
docker-compose down

# Ver logs
docker-compose logs -f
```

**Acceso phpMyAdmin:** http://localhost:8083
