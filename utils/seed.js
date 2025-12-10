require("dotenv").config();
console.log("MONGODB_URI actual:", process.env.MONGODB_URI);
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const client = new MongoClient(process.env.MONGODB_URI);

// ========== MUCHOS MÁS NOMBRES (120+) ==========
const nombres = [
    'Juan','María','Carlos','Ana','Luis','Sofía','Miguel','Laura','Pedro','Carmen','Valeria','Andrés','Fernanda','Diego','Paola','Ricardo','Daniela','Jorge','Luisa','Roberto',
    'Adriana','Sebastián','Gabriela','Héctor','Diana','Mauricio','Patricia','Óscar','Rebeca','Fabián','Alejandro','Montserrat','Iván','Claudia','Erick','Julieta','Tomás','Alejandra',
    'Elena','Gael','Emilia','Marco','Araceli','Kevin','Marisol','Esteban','Lorena','Rafael','Felipe','Beatriz','Patricio','Ximena','Renata','Camila','Santiago','Leonardo','Isabella',
    'Regina','Mateo','Bárbara','Liliana','Raúl','Francisco','Amelia','Paulina','Ismael','Miriam','Alan','Cecilia','Noemí','Tania','Pilar','Agustín','Salvador','Nadia','Adrián',
    'Emanuel','Omar','Lourdes','Viridiana','Edgar','Selene','Karina','Matías','Alexa','Ariadna','Edwin','Lucero','Evelyn','Cristina','Bruno','Mariano','Fátima','Yamila','Pablo',
    'Ernesto','Berenice','Mauren','Itzel','Yazmín','Gonzalo','Joel','Romeo','Miranda','Thiago','Abril','Arlette'
];

// ========== MUCHOS MÁS APELLIDOS (120+) ==========
const apellidos = [
    'García','Rodríguez','Martínez','López','González','Hernández','Pérez','Sánchez','Ramírez','Flores','Torres','Álvarez','Ruiz','Castillo','Ortiz','Morales','Vargas','Jiménez',
    'Navarro','Domínguez','Cortés','Reyes','Mendoza','Romero','Silva','Delgado','Guerrero','Pacheco','Salazar','Castañeda','Valenzuela','Carrillo','Esparza','Aguilar','Bautista',
    'Corral','Zamora','Luna','Mejía','Camacho','Gallegos','Acosta','Solís','Beltrán','Rentería','Cuevas','Peralta','Rosales','Maldonado','Franco','Arredondo','Muñoz','Calderón',
    'Peña','Núñez','Villegas','Cervantes','Soto','Arellano','Quiroz','Treviño','Montoya','Serrano','Ochoa','Robles','Escobedo','Téllez','Becerra','Zúñiga','Vallejo','Ríos','Bravo',
    'Cano','Sandoval','Saucedo','Macías','Miranda','Molina','Tapia','Belmont','Aragón','Palacios','Barrón','Granados','Acero','Mora','Trevizo','Borbolla','Cedillo','Fuentes'
];

const dominios = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];

// ========== ESTACIONAMIENTOS CON COORDENADAS REALES DE AGUASCALIENTES ==========
const estacionamientos = [
    { nombre:'Plaza Patria', address:'Av. Independencia 1234, Centro', latitude:21.8853, longitude:-102.2916, totalSpots:100, hourlyRate:25, openTime:'07:00', closeTime:'22:00' },
    { nombre:'Galerías Mall', address:'Blvd. Zacatecas 1000, Norte', latitude:21.9234, longitude:-102.2987, totalSpots:200, hourlyRate:30, openTime:'10:00', closeTime:'21:00' },
    { nombre:'Hospital Regional', address:'Av. Independencia 456, Centro', latitude:21.8820, longitude:-102.2950, totalSpots:80, hourlyRate:20, openTime:'00:00', closeTime:'23:59' },
    { nombre:'Universidad Tecnológica', address:'Blvd. Juan Pablo II 1850', latitude:21.9156, longitude:-102.3201, totalSpots:150, hourlyRate:15, openTime:'06:00', closeTime:'23:00' },
    { nombre:'Aeropuerto Jesús Terán', address:'Carretera Panamericana Km 22', latitude:21.7056, longitude:-102.3178, totalSpots:300, hourlyRate:40, openTime:'00:00', closeTime:'23:59' },
    
    { nombre:'Parque San Marcos', address:'Av. Convención Sur 890, Centro', latitude:21.8790, longitude:-102.2890, totalSpots:180, hourlyRate:22, openTime:'08:00', closeTime:'20:00' },
    { nombre:'Centro de Convenciones', address:'Av. Universidad 1001', latitude:21.9012, longitude:-102.2734, totalSpots:250, hourlyRate:35, openTime:'08:00', closeTime:'22:00' },
    { nombre:'Mercado Morelos', address:'Calle 5 de Mayo 245, Centro', latitude:21.8812, longitude:-102.2923, totalSpots:90, hourlyRate:18, openTime:'06:00', closeTime:'19:00' },
    { nombre:'Estadio Victoria', address:'Av. Tecnológico 901', latitude:21.9123, longitude:-102.2845, totalSpots:400, hourlyRate:50, openTime:'08:00', closeTime:'23:00' },
    { nombre:'Plaza Vestir', address:'Av. Aguascalientes Norte 101', latitude:21.8900, longitude:-102.2850, totalSpots:220, hourlyRate:28, openTime:'10:00', closeTime:'21:00' },
    
    { nombre:'Museo José Guadalupe Posada', address:'Jardín del Encino, Centro', latitude:21.8834, longitude:-102.2901, totalSpots:70, hourlyRate:16, openTime:'09:00', closeTime:'18:00' },
    { nombre:'Zona Financiera', address:'Av. Convención Norte 617', latitude:21.8945, longitude:-102.2812, totalSpots:260, hourlyRate:38, openTime:'07:00', closeTime:'20:00' },
    { nombre:'Terminal de Autobuses', address:'Av. Convención de 1914 Sur 102', latitude:21.8678, longitude:-102.2934, totalSpots:300, hourlyRate:30, openTime:'00:00', closeTime:'23:59' },
    { nombre:'Parque México', address:'Av. Alameda 520', latitude:21.8756, longitude:-102.2978, totalSpots:110, hourlyRate:14, openTime:'06:00', closeTime:'22:00' },
    { nombre:'Cinépolis Altaria', address:'Av. Aguascalientes Norte 1205', latitude:21.9087, longitude:-102.2789, totalSpots:150, hourlyRate:26, openTime:'10:00', closeTime:'00:00' },
    
    { nombre:'Torre Ejecutiva Norte', address:'Blvd. Zacatecas Norte 850', latitude:21.9201, longitude:-102.2901, totalSpots:190, hourlyRate:32, openTime:'07:00', closeTime:'21:00' },
    { nombre:'Torre Ejecutiva Sur', address:'Av. Adolfo López Mateos 801', latitude:21.8712, longitude:-102.2845, totalSpots:210, hourlyRate:33, openTime:'07:00', closeTime:'21:00' },
    { nombre:'Hospital Hidalgo', address:'Av. Galeana 465', latitude:21.8798, longitude:-102.2867, totalSpots:140, hourlyRate:25, openTime:'00:00', closeTime:'23:59' },
    { nombre:'Plaza Las Américas', address:'Av. Las Américas 1702', latitude:21.8623, longitude:-102.2756, totalSpots:170, hourlyRate:27, openTime:'10:00', closeTime:'21:00' },
    { nombre:'Jardín de San Marcos', address:'Av. José María Chávez s/n', latitude:21.8801, longitude:-102.2889, totalSpots:130, hourlyRate:20, openTime:'06:00', closeTime:'23:00' },
    
    { nombre:'Central de Abastos', address:'Carretera a San Luis Potosí Km 5', latitude:21.8534, longitude:-102.2612, totalSpots:500, hourlyRate:45, openTime:'00:00', closeTime:'23:59' },
    { nombre:'Residencial Pulgas Pandas', address:'Av. Mahatma Gandhi 101', latitude:21.9312, longitude:-102.3123, totalSpots:90, hourlyRate:15, openTime:'00:00', closeTime:'23:59' },
    { nombre:'Expo Plaza', address:'Blvd. José María Chávez 1902', latitude:21.8956, longitude:-102.2723, totalSpots:350, hourlyRate:22, openTime:'09:00', closeTime:'21:00' },
    { nombre:'Altaria Shopping', address:'Av. Aguascalientes Norte 1302', latitude:21.9156, longitude:-102.2801, totalSpots:200, hourlyRate:28, openTime:'10:00', closeTime:'22:00' },
    { nombre:'Centro Cultural Los Arquitos', address:'Av. Tecnológico 504', latitude:21.9078, longitude:-102.2934, totalSpots:75, hourlyRate:18, openTime:'09:00', closeTime:'20:00' }
];

// ===== no cambiar lógica =====
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function randomElement(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function generatePlate() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    return `${letters[Math.floor(Math.random()*letters.length)]}${letters[Math.floor(Math.random()*letters.length)]}${letters[Math.floor(Math.random()*letters.length)]}-${numbers[Math.floor(Math.random()*10)]}${numbers[Math.floor(Math.random()*10)]}${numbers[Math.floor(Math.random()*10)]}`;
}

async function seedDatabase() {
    try {
        await client.connect();
        const db = client.db('ocelon_db');

        await db.collection('users').deleteMany({});
        await db.collection('parking_lots').deleteMany({});
        await db.collection('sessions').deleteMany({});
        await db.collection('payments').deleteMany({});
        await db.collection('support_tickets').deleteMany({});

        const users = [];
        const passwordHash = await bcrypt.hash('password123', 12);

        // admin
        users.push({
            email: 'admin@ocelon.com',
            passwordHash,
            role: 'admin',
            profile: { nombre: 'Administrador Ocelon', telefono: '4491234567', rfc: null },
            createdAt: new Date(2024,0,1),
            status: 'activo'
        });

        // generar más usuarios (de 20 → 150)
        for (let i = 0; i < 149; i++) {
            let nombre = randomElement(nombres);
            let apellido = randomElement(apellidos);
            const cleanNombre = removeAccents(nombre);
            const cleanApellido = removeAccents(apellido);

            const email = `${cleanNombre.toLowerCase()}.${cleanApellido.toLowerCase()}${i}@${randomElement(dominios)}`;

            users.push({
                email,
                passwordHash,
                role: 'conductor',
                profile: {
                    nombre: `${nombre} ${apellido}`, 
                    telefono: `449${Math.floor(1000000 + Math.random()*9000000)}`,
                    rfc: null
                },
                createdAt: randomDate(new Date(2024,0,1), new Date()),
                status: 'activo'
            });
        }

        const usersResult = await db.collection('users').insertMany(users);

// Crear parking lots con formato correcto para el mapa
const parkingLots = estacionamientos.map(e => {
    // Calcular ocupados aleatoriamente (30-90%)
    const occupancyPercent = 30 + Math.random() * 60;
    const occupiedSpots = Math.floor(e.totalSpots * occupancyPercent / 100);
    
    return {
        // AMBOS CAMPOS PARA COMPATIBILIDAD
        name: e.nombre,
        nombre: e.nombre,
        address: e.address,
        ubicacion: e.address,
        latitude: e.latitude,
        longitude: e.longitude,
        // AMBOS CAMPOS PARA COMPATIBILIDAD
        totalSpots: e.totalSpots,
        capacidadTotal: e.totalSpots,
        occupiedSpots: occupiedSpots,
        ocupacionActual: occupiedSpots,
        // AMBOS CAMPOS PARA COMPATIBILIDAD
        hourlyRate: e.hourlyRate,
        tarifaHora: e.hourlyRate,
        openTime: e.openTime,
        closeTime: e.closeTime,
        horario: `${e.openTime} - ${e.closeTime}`,
        amenidades: ['Vigilancia','Techado','Cámaras','Seguro'],
        status: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
    };
});

        const parkingLotsResult = await db.collection('parking_lots').insertMany(parkingLots);

        // sesiones → aumentar de 50 → 300
        const sessions = [];
        const payments = [];
        const userIds = Object.values(usersResult.insertedIds);
        const parkingLotIds = Object.values(parkingLotsResult.insertedIds);

        for (let i = 0; i < 300; i++) {
            const userId = randomElement(userIds);
            const parkingLotId = randomElement(parkingLotIds);
            const entryTime = randomDate(new Date(2024,10,1), new Date());
            const status = randomElement(['activa','pagada','pagada','finalizada']);

            const duration = Math.floor(1 + Math.random()*8);
            const exitTime = status !== 'activa' ? new Date(entryTime.getTime() + duration*3600000) : null;

            const parkingLot = parkingLots[ Math.floor(Math.random()*parkingLots.length) ];
            const subtotal = duration * parkingLot.hourlyRate;
            const iva = subtotal * 0.16;
            const total = subtotal + iva;

            const sessionId = new ObjectId();

            sessions.push({
                _id: sessionId,
                userId,
                parkingLotId,
                qrCode: uuidv4(),
                vehiclePlates: generatePlate(),
                entryTime,
                exitTime,
                status,
                amount: status !== 'activa' ? total : null,
                metadata:{ createdBy:'seed', ipAddress:'127.0.0.1' }
            });

            if (status !== 'activa') {
                payments.push({
                    sessionId,
                    userId,
                    transactionId:`TXN-${Date.now()}-${uuidv4().substring(0,8)}`,
                    amount: total,
                    subtotal,
                    taxes:{ iva, retencionIva:0, retencionIsr:0 },
                    paymentMethod: randomElement(['tarjeta','wallet','transferencia']),
                    provider: 'OpenPayments',
                    status:'exitoso',
                    timestamp:new Date(entryTime.getTime() + (duration-0.5)*3600000),
                    metadata:{ duration, hourlyRate:parkingLot.hourlyRate, parkingLotId }
                });
            }
        }

        await db.collection('sessions').insertMany(sessions);
        await db.collection('payments').insertMany(payments);

        // Tickets -> aumentar 15 → 80
        const tickets = [];
        const categorias = ['tecnico','facturacion','comercial','otro'];
        const prioridades = ['baja','media','alta'];
        const estados = ['abierto','en_proceso','resuelto','cerrado'];

        for (let i = 0; i < 80; i++) {
            const userId = randomElement(userIds);
            const createdAt = randomDate(new Date(2024,10,1), new Date());
            const status = randomElement(estados);

            tickets.push({
                ticketNumber:`TKT-2024-${String(i+1).padStart(5,'0')}`,
                userId,
                parkingLotId: Math.random()>0.5 ? randomElement(parkingLotIds) : null,
                channel: randomElement(['web','chat','email']),
                category: randomElement(categorias),
                priority: randomElement(prioridades),
                status,
                subject:`Problema con ${randomElement(['pago','QR','facturación','acceso'])}`,
                messages:[{
                    autor:'usuario',
                    texto:'Necesito ayuda con este problema',
                    timestamp:createdAt
                }],
                assignedTo: status !== 'abierto' ? randomElement(userIds) : null,
                createdAt,
                resolvedAt: status === 'resuelto' || status === 'cerrado' ? 
                    new Date(createdAt.getTime() + 7200000) : null,
                slaDeadline:new Date(createdAt.getTime() + 7200000)
            });
        }

        await db.collection('support_tickets').insertMany(tickets);

        console.log("\n=== BASE DE DATOS POBLADA EXITOSAMENTE ===");
        console.log(`${users.length} usuarios creados`);
        console.log(`${parkingLots.length} estacionamientos creados (con coordenadas reales)`);
        console.log(`${sessions.length} sesiones creadas`);
        console.log(`${payments.length} pagos creados`);
        console.log(`${tickets.length} tickets creados`);
        console.log("\nADMIN: admin@ocelon.com / password123");

    } catch (error) {
        console.error("Error al poblar:", error);
    } finally {
        await client.close();
    }
}

seedDatabase();