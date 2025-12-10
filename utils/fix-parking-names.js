require("dotenv").config();
const { MongoClient } = require('mongodb');

const client = new MongoClient(process.env.MONGODB_URI);

async function fixParkingNames() {
    try {
        await client.connect();
        const db = client.db('ocelon_db');

        console.log('🔧 Actualizando nombres de estacionamientos...');

        // Obtener todos los estacionamientos
        const parkingLots = await db.collection('parking_lots').find({}).toArray();

        for (const lot of parkingLots) {
            const updateData = {};

            // Asegurar que ambos campos existan
            if (!lot.name && lot.nombre) {
                updateData.name = lot.nombre;
            }
            if (!lot.nombre && lot.name) {
                updateData.nombre = lot.name;
            }

            // Asegurar campos de ubicación
            if (!lot.address && lot.ubicacion) {
                updateData.address = lot.ubicacion;
            }
            if (!lot.ubicacion && lot.address) {
                updateData.ubicacion = lot.address;
            }

            // Asegurar campos de capacidad
            if (!lot.totalSpots && lot.capacidadTotal) {
                updateData.totalSpots = lot.capacidadTotal;
            }
            if (!lot.capacidadTotal && lot.totalSpots) {
                updateData.capacidadTotal = lot.totalSpots;
            }

            // Asegurar campos de ocupación
            if (lot.occupiedSpots === undefined && lot.ocupacionActual !== undefined) {
                updateData.occupiedSpots = lot.ocupacionActual;
            }
            if (lot.ocupacionActual === undefined && lot.occupiedSpots !== undefined) {
                updateData.ocupacionActual = lot.occupiedSpots;
            }

            // Asegurar campos de tarifa
            if (!lot.hourlyRate && lot.tarifaHora) {
                updateData.hourlyRate = lot.tarifaHora;
            }
            if (!lot.tarifaHora && lot.hourlyRate) {
                updateData.tarifaHora = lot.hourlyRate;
            }

            if (Object.keys(updateData).length > 0) {
                await db.collection('parking_lots').updateOne(
                    { _id: lot._id },
                    { $set: updateData }
                );
                console.log(`Actualizado: ${lot.name || lot.nombre}`);
            }
        }

        console.log('\nMigración completada exitosamente');

        // Verificar resultados
        const updated = await db.collection('parking_lots').find({}).toArray();
        console.log('\nEstacionamientos actualizados:');
        updated.forEach(lot => {
            console.log(`- ${lot.name || lot.nombre} | Tarifa: $${lot.hourlyRate || lot.tarifaHora}`);
        });

    } catch (error) {
        console.error('Error en migración:', error);
    } finally {
        await client.close();
    }
}

fixParkingNames();