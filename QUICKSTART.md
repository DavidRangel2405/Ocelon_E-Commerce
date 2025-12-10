# Guía de Inicio Rápido - Ocelon

## Instalación en 5 Minutos

### 1. Crear carpeta del proyecto
```bash
mkdir ocelon-parking-system
cd ocelon-parking-system
```

### 2. Copiar todos los archivos del proyecto
Asegúrate de tener la siguiente estructura:

```
ocelon-parking-system/
├── config/
│   └── database.js
├── middleware/
│   └── auth.js
├── routes/
│   ├── auth.js
│   ├── dashboard.js
│   ├── parking.js
│   ├── payments.js
│   ├── sessions.js
│   ├── support.js
│   └── users.js
├── utils/
│   └── seed.js
├── public/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── dashboard.js
│   │   ├── login.js
│   │   └── register.js
│   ├── dashboard.html
│   ├── index.html
│   ├── login.html
│   └── register.html
├── .env
├── .gitignore
├── docker-compose.yml
├── package.json
├── server.js
└── README.md
```

### 3. Ejecutar comandos de instalación

```bash
# Instalar dependencias
npm install

# Crear directorios para datos de MongoDB
mkdir -p data/mongo1 data/mongo2 data/mongo3

# Iniciar MongoDB con Docker
docker-compose up -d

# Esperar 30 segundos para que MongoDB inicialice
# Luego poblar la base de datos
npm run seed

# Iniciar el servidor
npm start
```

### 4. Acceder a la aplicación

Abre tu navegador en:
```
http://localhost:3000
```

### 5. Iniciar sesión

**Como Administrador:**
```
Email: admin@ocelon.com
Password: password123
```
Luego accede al panel de administración en `/admin.html`

**Como Usuario Normal:**
```
Email: juan.garcia0@gmail.com
Password: password123
```

## Verificación de Instalación

### Revisar que MongoDB esté corriendo
```bash
docker-compose ps
```

Deberías ver 4 contenedores activos:
- mongo1
- mongo2  
- mongo3
- mongo-express

### Ver la base de datos
Accede a Mongo Express:
```
http://localhost:8081
Usuario: admin
Password: ocelon2025
```

### Ver logs del servidor
```bash
npm start
```

Deberías ver:
```
Servidor Ocelon ejecutándose en puerto 3000
MongoDB Replica Set conectado exitosamente
```

## Flujo de Prueba Completo

### Para Administradores

1. **Iniciar Sesión como Admin**
   - Email: admin@ocelon.com
   - Password: password123

2. **Acceder al Panel de Administración**
   - Desde el dashboard, busca el enlace al panel de admin
   - O accede directamente a http://localhost:3000/admin.html

3. **Configurar Contenido**
   - Sección "Contenido":
     - Personaliza el texto del logo
     - Sube o configura un video promocional
     - Agrega imágenes a la galería

4. **Configurar Redes Sociales**
   - Sección "Redes Sociales":
     - Agrega enlaces a Facebook, Twitter, Instagram, etc.
     - Vista previa en tiempo real
     - Guarda los cambios

5. **Configuración General**
   - Actualiza información de contacto
   - Configura emails de soporte

6. **Ver Estadísticas**
   - Revisa métricas del sitio
   - Analiza fuentes de tráfico

### Para Usuarios (Conductores)

1. **Registro de Usuario**
   - Ve a http://localhost:3000
   - Click en "Registrarse"
   - Completa el formulario
   - Serás redirigido al login

2. **Inicio de Sesión**
   - Email: juan.garcia0@gmail.com
   - Password: password123
   - Click en "Iniciar Sesión"

3. **Crear Nueva Estancia**
   - En el dashboard, ve a "Mis Estancias"
   - Click en "Nueva Estancia"
   - Selecciona un estacionamiento
   - Ingresa placas del vehículo
   - Se generará un código QR único

4. **Procesar Pago**
   - En la tabla de estancias, busca la sesión activa
   - Click en "Pagar"
   - Selecciona método de pago
   - Confirma el pago
   - El monto se calcula automáticamente según duración

5. **Validar Salida**
   - Una vez pagada, click en "Validar Salida"
   - La sesión cambiará a estado "finalizada"

6. **Ver Historial**
   - Ve a "Pagos" para ver historial de transacciones
   - Todos los pagos incluyen IVA calculado

7. **Crear Ticket de Soporte**
   - Ve a "Soporte"
   - Click en "Nuevo Ticket"
   - Completa el formulario
   - Se asignará un número de ticket único

## Comandos Útiles

```bash
# Reiniciar todo desde cero
docker-compose down -v
rm -rf data/
mkdir -p data/mongo1 data/mongo2 data/mongo3
docker-compose up -d
sleep 30
npm run seed
npm start

# Ver logs de MongoDB
docker-compose logs -f

# Detener servicios
docker-compose down

# Reiniciar solo MongoDB
docker-compose restart

# Desarrollo con auto-reload
npm run dev
```

## Resolución de Problemas

### El servidor no inicia
```bash
# Verifica que el puerto 3000 esté libre
lsof -i :3000

# Si está en uso, cambia el puerto en .env
PORT=3001
```

### MongoDB no conecta
```bash
# Espera más tiempo después de iniciar Docker
docker-compose up -d
sleep 60
npm run seed
```

### Página en blanco
- Limpia cache del navegador (Ctrl + Shift + R)
- Verifica la consola del navegador (F12)
- Revisa logs del servidor

### Error al crear sesión
- Asegúrate de que la base de datos tenga estacionamientos:
```bash
npm run seed
```

## Datos de Prueba Incluidos

Después de `npm run seed`:

- **20 usuarios** con password `password123`
- **5 estacionamientos** en diferentes ubicaciones
- **50 sesiones** de estacionamiento (activas, pagadas y finalizadas)
- **~35 pagos** procesados exitosamente
- **15 tickets** de soporte en diferentes estados

## Próximos Pasos

1. Explora todas las secciones del dashboard
2. Crea tus propios datos desde la interfaz
3. Revisa la base de datos en Mongo Express
4. Prueba diferentes flujos de usuario
5. Revisa el código para entender la arquitectura

## Soporte

Si encuentras problemas:
1. Revisa el README.md completo
2. Verifica los logs: `npm start`
3. Revisa logs de Docker: `docker-compose logs`
4. Asegúrate de tener las versiones correctas:
   - Node.js v18+
   - Docker instalado y corriendo

## Características Destacadas

- **Diseño Profesional**: Verde esmeralda con tonos oscuros (sin emojis en el código)
- **Página Principal Completa**: 
  - Hero section con animaciones
  - Sección "Nosotros" con información del negocio
  - Video promocional integrable
  - Catálogo de servicios con 3 planes
  - Beneficios y características detalladas
  - Estadísticas con animaciones de conteo
  - Tecnologías utilizadas
  - Formulario de contacto funcional
  - Redes sociales configurables
  - Footer completo
- **Panel de Administración**: Gestión completa de contenido, redes sociales y configuración
- **Replica Set MongoDB**: 3 nodos para alta disponibilidad
- **Datos Relacionados**: Todas las tablas están vinculadas correctamente
- **CRUD Completo**: Crear, leer, actualizar funcionalidades
- **Responsive**: Funciona en escritorio, tablet y móvil
- **Seguridad**: JWT, bcrypt, validaciones
- **Smooth Scroll**: Navegación fluida entre secciones
- **Animaciones**: Contadores, fade-in, parallax
- **Iconos Font Awesome**: Para todas las secciones