# Estructura Completa del Proyecto Ocelon

```
ocelon-parking-system/
│
├── config/
│   └── database.js                 # Configuración MongoDB Replica Set
│
├── middleware/
│   └── auth.js                     # Middleware de autenticación JWT
│
├── routes/
│   ├── auth.js                     # Rutas de autenticación (login/register)
│   ├── dashboard.js                # Rutas del dashboard y estadísticas
│   ├── parking.js                  # Gestión de estacionamientos
│   ├── payments.js                 # Procesamiento de pagos
│   ├── sessions.js                 # Gestión de sesiones de estacionamiento
│   ├── support.js                  # Sistema de tickets de soporte
│   └── users.js                    # Gestión de usuarios
│
├── utils/
│   └── seed.js                     # Script para poblar la base de datos
│
├── public/
│   ├── css/
│   │   └── styles.css              # Estilos personalizados (verde esmeralda + oscuros)
│   │
│   ├── js/
│   │   ├── admin.js                # JavaScript del panel de administración
│   │   ├── dashboard.js            # JavaScript del dashboard de usuario
│   │   ├── login.js                # JavaScript del login
│   │   ├── main.js                 # JavaScript de la página principal
│   │   └── register.js             # JavaScript del registro
│   │
│   ├── images/                     # Carpeta para imágenes (crear si necesitas)
│   │   └── .gitkeep                # Mantiene la carpeta en git
│   │
│   ├── videos/                     # Carpeta para videos locales (crear si necesitas)
│   │   └── .gitkeep                # Mantiene la carpeta en git
│   │
│   ├── admin.html                  # Panel de administración
│   ├── dashboard.html              # Dashboard de usuario
│   ├── index.html                  # Página principal
│   ├── login.html                  # Página de login
│   └── register.html               # Página de registro
│
├── data/                           # Datos persistentes de MongoDB (generado automáticamente)
│   ├── mongo1/                     # Datos del nodo primario
│   ├── mongo2/                     # Datos del nodo secundario 1
│   └── mongo3/                     # Datos del nodo secundario 2
│
├── node_modules/                   # Dependencias npm (generado automáticamente)
│
├── .env                            # Variables de entorno
├── .gitignore                      # Archivos excluidos de git
├── CUSTOMIZATION.md                # Guía de personalización
├── docker-compose.yml              # Configuración Docker para MongoDB
├── ESTRUCTURA.md                   # Este archivo
├── package.json                    # Configuración del proyecto Node.js
├── package-lock.json               # Lock de dependencias (generado automáticamente)
├── QUICKSTART.md                   # Guía de inicio rápido
├── README.md                       # Documentación principal
└── server.js                       # Servidor principal Express
```

## Descripción de Directorios

### `/config`
Contiene la configuración de la base de datos MongoDB con Replica Set de 3 nodos.

### `/middleware`
Middleware de Express para autenticación JWT y autorización por roles.

### `/routes`
Todos los endpoints de la API REST organizados por funcionalidad.

### `/utils`
Utilidades del proyecto, incluido el script de seed para datos de prueba.

### `/public`
Archivos estáticos que se sirven directamente al navegador.

#### `/public/css`
Estilos CSS personalizados con diseño verde esmeralda y tonos oscuros.

#### `/public/js`
Scripts JavaScript del frontend para cada página.

#### `/public/images` (crear manualmente)
Carpeta para almacenar imágenes (logos, fotos, etc).

#### `/public/videos` (crear manualmente)
Carpeta para videos promocionales locales.

### `/data`
Datos persistentes de MongoDB. Se genera automáticamente con Docker.

### `/node_modules`
Dependencias instaladas con npm. Se genera automáticamente.

## Archivos de Configuración

### `.env`
Variables de entorno del proyecto (puerto, MongoDB URI, JWT secret).

### `docker-compose.yml`
Configuración de Docker para levantar MongoDB Replica Set de 3 nodos.

### `package.json`
Dependencias y scripts del proyecto Node.js.

### `.gitignore`
Archivos y carpetas que no se suben a Git.

## Archivos de Documentación

### `README.md`
Documentación completa del proyecto con instalación y uso.

### `QUICKSTART.md`
Guía rápida para empezar a usar el proyecto en 5 minutos.

### `CUSTOMIZATION.md`
Guía paso a paso para personalizar logo, videos y redes sociales.

### `ESTRUCTURA.md`
Este archivo - estructura completa del proyecto.

## Comandos para Crear Carpetas Faltantes

```bash
# Desde la raíz del proyecto
mkdir -p public/images
mkdir -p public/videos

# Crear archivos .gitkeep para mantener carpetas en git
touch public/images/.gitkeep
touch public/videos/.gitkeep
```

## Tamaño Aproximado del Proyecto

- **Código fuente:** ~500 KB
- **node_modules:** ~50 MB
- **MongoDB data:** Variable (crece con uso)
- **Imágenes/Videos:** Según lo que agregues

## Páginas Web Disponibles

### Públicas (sin login)
- `/` - Página principal
- `/login.html` - Iniciar sesión
- `/register.html` - Registro de usuarios

### Autenticadas (requieren login)
- `/dashboard.html` - Dashboard de usuario
- `/admin.html` - Panel de administración (solo admin)

## Endpoints API

### Autenticación
- `POST /api/auth/register` - Registro
- `POST /api/auth/login` - Login

### Usuarios
- `GET /api/users/:id` - Obtener usuario
- `PUT /api/users/:id` - Actualizar usuario

### Sesiones
- `GET /api/sessions` - Listar sesiones
- `GET /api/sessions/:id` - Obtener sesión
- `POST /api/sessions` - Crear sesión
- `POST /api/sessions/:id/validate` - Validar salida

### Pagos
- `GET /api/payments` - Historial de pagos
- `POST /api/payments/process` - Procesar pago

### Estacionamientos
- `GET /api/parking/lots` - Listar estacionamientos
- `GET /api/parking/lots/:id` - Detalles

### Soporte
- `GET /api/support/tickets` - Listar tickets
- `POST /api/support/tickets` - Crear ticket
- `PUT /api/support/tickets/:id` - Actualizar ticket

### Dashboard
- `GET /api/dashboard/overview` - Resumen de actividad

## Colecciones de MongoDB

1. **users** - Usuarios del sistema
2. **parking_lots** - Estacionamientos
3. **sessions** - Sesiones de estacionamiento
4. **payments** - Transacciones de pago
5. **support_tickets** - Tickets de soporte

## Tecnologías Utilizadas

### Backend
- Node.js v18+
- Express.js 4.18+
- MongoDB 7.0 (Replica Set)
- JWT para autenticación
- Bcrypt para passwords

### Frontend
- HTML5
- CSS3 (diseño personalizado)
- JavaScript (vanilla)
- Bootstrap 5.3.2
- Font Awesome 6.4.0

### DevOps
- Docker & Docker Compose
- MongoDB Replica Set containerizado
- Mongo Express para administración

## Archivos Importantes

### Servidor
- `server.js` - Punto de entrada del servidor

### Configuración
- `.env` - Variables de entorno
- `docker-compose.yml` - Configuración Docker

### Frontend Principal
- `public/index.html` - Landing page
- `public/css/styles.css` - Estilos

### Scripts Útiles
- `utils/seed.js` - Poblar BD con datos de prueba

## Próximos Pasos Después de la Instalación

1. Personalizar logo y textos
2. Agregar video promocional
3. Configurar redes sociales
4. Ajustar colores de marca
5. Agregar contenido propio
6. Probar todas las funcionalidades
7. Configurar para producción

## Notas Importantes

- No subir la carpeta `node_modules` a Git
- No subir la carpeta `data` a Git
- El archivo `.env` debe estar en `.gitignore`
- Crear carpetas `images` y `videos` manualmente
- Los datos de MongoDB se guardan en `./data`