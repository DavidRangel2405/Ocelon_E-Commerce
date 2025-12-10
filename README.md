# Ocelon - Sistema Digital de Estacionamiento

Sistema web completo de gestión de estacionamientos digitales con tecnología QR, pagos electrónicos y gestión de clientes.

## Tecnologías Utilizadas

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5.3.2
- Diseño responsive y profesional

### Backend
- Node.js + Express.js
- MongoDB 7.0 con Replica Set (3 nodos)
- JWT para autenticación
- Bcrypt para encriptación de contraseñas

### DevOps
- Docker & Docker Compose
- MongoDB Replica Set containerizado
- Mongo Express para administración visual

## Requisitos Previos

- Node.js v18 o superior
- Docker y Docker Compose
- Git

## Instalación

### 1. Clonar el repositorio
```bash
git clone <tu-repositorio>
cd ocelon-parking-system
```

### 2. Crear directorios para MongoDB
```bash
mkdir -p data/mongo1 data/mongo2 data/mongo3
```

### 3. Configurar variables de entorno
El archivo `.env` ya está incluido con la configuración necesaria.

### 4. Instalación (modo local sin Docker)
```bash
npm install
npm run dev
```

### 5. Levantar MongoDB Replica Set
```bash
docker-compose up --build -d
```

Espera para que el Replica Set se inicialice completamente.

### 6. Verificar que MongoDB está corriendo
```bash
docker-compose ps
```

Deberías ver 4 contenedores corriendo:
- mongo1 (Primary)
- mongo2 (Secondary)
- mongo3 (Secondary)
- mongo-express

### 7. Poblar la base de datos con datos de prueba
```bash
# Modo local
npm run seed
# Modo docker
docker exec -it ocelon-parking-system node utils/seed.js
```

Este comando creará:
- 20 usuarios (todos con password: `password123`)
- 5 estacionamientos
- 50 sesiones de estacionamiento
- Pagos asociados
- 15 tickets de soporte

### 8. Iniciar el servidor en modo local
```bash
npm start
```
O para desarrollo con auto-reload:
```bash
npm run dev
```

## Acceso a la Aplicación

### Aplicación Web
```
http://localhost:3000
```

### Mongo Express (Administración de BD)
```
http://localhost:8081
Usuario: admin
Contraseña: ocelon2025
```

## Usuarios de Prueba

Después de ejecutar `npm run seed`, puedes usar:

**Administrador (acceso completo):**
```
Email: admin@ocelon.com
Password: password123
```

**Conductores (usuarios normales):**
```
Email: juan.garcia0@gmail.com
Password: password123

Email: maria.rodriguez1@gmail.com
Password: password123

Email: carlos.martinez2@gmail.com
Password: password123
```

Todos los usuarios tienen la contraseña: `password123`

## Estructura del Proyecto

```
ocelon-parking-system/
├── config/
│   └── database.js          # Configuración MongoDB Replica Set
├── middleware/
│   └── auth.js              # Middleware de autenticación JWT
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   ├── sessions.js          # Gestión de sesiones de estacionamiento
│   ├── payments.js          # Procesamiento de pagos
│   ├── users.js             # Gestión de usuarios
│   ├── support.js           # Sistema de tickets de soporte
│   ├── parking.js           # Gestión de estacionamientos
│   └── dashboard.js         # Datos del dashboard
├── utils/
│   └── seed.js              # Script de datos de prueba
├── public/
│   ├── admin.html           # Página del administrador
│   ├── index.html           # Página principal
│   ├── login.html           # Inicio de sesión
│   ├── register.html        # Registro de usuarios
│   ├── dashboard.html       # Panel de control
│   ├── css/
│   │   ├── landing.css       # Estilos personalizados
│   │   ├── responsive-fixes.css       # Estilos personalizados
│   │   └── styles.css       # Estilos personalizados
│   ├── js/
│   │   ├── admin.js         # Lógica de admin
│   │   ├── main.js          # Lógica de main
│   │   ├── login.js         # Lógica de login
│   │   ├── register.js      # Lógica de registro
│   │   └── dashboard.js     # Lógica del dashboard
│   ├── images/
│   │   ├── .gitkeep         # Permitir subir en Github
│   │   └── Logo.jpg         # Imagen del logo
│   └── videos/
│       ├── .gitkeep         # Permitir subir en Github
│       └── Demo.mp4         # Video Demo
├── data/                    # Datos persistentes de MongoDB
├── docker-compose.yml       # Configuración Docker
├── Dockerfile               # Configuración Docker con Node
├── server.js               # Servidor principal
├── package.json            # Dependencias
├── .env                    # Variables de entorno
└── README.md              # Este archivo
```

## Funcionalidades Principales

### Para Usuarios (Conductores)
- Registro e inicio de sesión
- Crear nueva estancia de estacionamiento
- Ver estancias activas e historial
- Procesar pagos con múltiples métodos
- Validar salida del estacionamiento
- Ver historial de pagos
- Gestionar perfil personal
- Crear y seguir tickets de soporte

### Para Administradores
- Panel de administración completo
- Gestión de contenido:
  - Configurar logo y marca
  - Subir video promocional
  - Gestionar galería de imágenes
- Gestión de redes sociales:
  - Configurar enlaces a Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok
  - Vista previa en tiempo real
- Configuración general del sitio
- Ver estadísticas y analíticas

### Página Principal
- Diseño profesional con colores verde esmeralda y tonos oscuros
- Sección hero con animaciones
- Información sobre el servicio
- Video promocional
- Catálogo de servicios (Básico, Premium, Enterprise)
- Beneficios y características
- Estadísticas en tiempo real
- Formulario de contacto
- Enlaces a redes sociales
- Navegación smooth scroll

### Sistema de Pagos
- Cálculo automático basado en duración
- Aplicación de IVA (16%)
- Múltiples métodos de pago
- Generación de ID de transacción único
- Historial completo de pagos

### Sistema de Soporte
- Creación de tickets
- Categorización automática
- Seguimiento de estado
- Sistema de prioridades
- SLA de respuesta

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión

### Sesiones
- `GET /api/sessions` - Listar sesiones del usuario
- `GET /api/sessions/:id` - Obtener sesión específica
- `POST /api/sessions` - Crear nueva sesión
- `POST /api/sessions/:id/validate` - Validar salida

### Pagos
- `GET /api/payments` - Historial de pagos
- `POST /api/payments/process` - Procesar pago

### Usuarios
- `GET /api/users/:id` - Obtener perfil
- `PUT /api/users/:id` - Actualizar perfil

### Soporte
- `GET /api/support/tickets` - Listar tickets
- `POST /api/support/tickets` - Crear ticket
- `GET /api/support/tickets/:id` - Ver ticket
- `PUT /api/support/tickets/:id` - Actualizar ticket

### Estacionamientos
- `GET /api/parking/lots` - Listar estacionamientos
- `GET /api/parking/lots/:id` - Detalles de estacionamiento

### Dashboard
- `GET /api/dashboard/overview` - Resumen de actividad

## Base de Datos

### Colecciones

#### users
- Email único
- Contraseña encriptada con bcrypt
- Perfil (nombre, teléfono, RFC)
- Rol (conductor/admin)

#### parking_lots
- Nombre y ubicación
- Capacidad total
- Tarifa por hora
- Coordenadas geográficas

#### sessions
- Usuario y estacionamiento vinculados
- Código QR único
- Tiempos de entrada/salida
- Estado (activa/pagada/finalizada)

#### payments
- Sesión vinculada
- Montos y cálculos fiscales
- Método de pago
- ID de transacción único

#### support_tickets
- Usuario vinculado
- Categoría y prioridad
- Estado y mensajes
- SLA tracking

## Arquitectura de Seguridad

- Contraseñas hasheadas con bcrypt (12 rounds)
- Autenticación con JWT
- Tokens con expiración de 24 horas
- Validación de permisos en cada endpoint
- Sanitización de inputs
- HTTPS recomendado en producción

## MongoDB Replica Set

El proyecto usa un Replica Set de 3 nodos para:
- Alta disponibilidad (99.9% uptime)
- Failover automático en <15 segundos
- Replicación en tiempo real
- Respaldos redundantes
- RPO < 1 segundo

## Comandos Útiles

```bash
# Iniciar desarrollo
npm run dev

# Poblar base de datos
npm run seed

# Ver logs de Docker
docker-compose logs -f

# Detener contenedores
docker-compose down

# Limpiar todo (incluyendo datos)
docker-compose down -v
rm -rf data/

# Reiniciar MongoDB
docker-compose restart

# Acceder a MongoDB shell
docker exec -it mongo1 mongosh
```

## Troubleshooting

### MongoDB no inicia
```bash
docker-compose down -v
rm -rf data/
mkdir -p data/mongo1 data/mongo2 data/mongo3
docker-compose up -d
```

### Error de conexión
Espera 30-60 segundos después de `docker-compose up -d` para que el Replica Set se inicialice.

### Puertos en uso
Si los puertos 3000, 27017, 27018, 27019 o 8081 están en uso, modifica `docker-compose.yml` y `.env`.

## Mejoras Futuras

- Integración con pasarelas de pago reales
- Generación real de códigos QR visuales
- Sistema de notificaciones push
- Aplicación móvil con React Native
- Facturación electrónica (CFDI)
- Analytics avanzado con BI
- Sistema de lealtad y puntos
- Integración con IoT para barreras automáticas

## Créditos

**Proyecto:** Ocelon - Sistema Digital de Estacionamiento  
**Materia:** Negocios Electrónicos 2  
**Institución:** Ingeniería en TIC  
**Equipo 4:**
- Alondra Rubí Valdés Mora (21151091)
- David Antonio Rangel García (21151065)

**Docente:** Ruth Mayeli Ponce Rosales  
**Fecha:** Noviembre 2025  
**Ubicación:** Aguascalientes, México

## Licencia

Este proyecto es con fines educativos para la materia de Negocios Electrónicos 2.