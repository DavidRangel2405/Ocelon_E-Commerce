// ========================================
// OCELON - Routes: Parking Lots
// ========================================

const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');

// ========================================
// GET /api/parking/lots - Para el modal de nueva sesión
// ========================================

router.get('/lots', async (req, res) => {
    try {
        const db = getDB();
        
        const parkingLots = await db.collection('parking_lots')
            .find({ status: 'activo' })
            .sort({ name: 1 })
            .toArray();

        // Formato para el select del modal
        const lotsData = parkingLots.map(lot => ({
            _id: lot._id.toString(),
            nombre: lot.name || lot.nombre,
            ubicacion: lot.address || lot.ubicacion,
            tarifaHora: lot.hourlyRate || lot.tarifaHora,
            capacidadTotal: lot.totalSpots || lot.capacidadTotal,
            ocupacionActual: lot.occupiedSpots || lot.ocupacionActual || 0
        }));

        res.json({
            success: true,
            data: lotsData
        });

    } catch (error) {
        console.error('Error al obtener lots:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estacionamientos',
            error: error.message
        });
    }
});

// ========================================
// GET /api/parking-lots - Obtener todos los estacionamientos (para mapa)
// ========================================

router.get('/parking-lots', async (req, res) => {
    try {
        const db = getDB();
        
        const parkingLots = await db.collection('parking_lots')
            .find({ status: 'activo' })
            .sort({ name: 1 })
            .toArray();

        const parkingData = parkingLots.map(lot => ({
            _id: lot._id.toString(),
            name: lot.name,
            address: lot.address,
            latitude: lot.latitude,
            longitude: lot.longitude,
            totalSpots: lot.totalSpots,
            occupiedSpots: lot.occupiedSpots || 0,
            hourlyRate: lot.hourlyRate,
            openTime: lot.openTime,
            closeTime: lot.closeTime,
            amenidades: lot.amenidades || [],
            status: lot.status
        }));

        res.json({
            success: true,
            parkingLots: parkingData,
            total: parkingData.length
        });

    } catch (error) {
        console.error('Error al obtener parking lots:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estacionamientos',
            error: error.message
        });
    }
});

// ========================================
// GET /api/parking-lots/:id - Obtener un estacionamiento específico
// ========================================

router.get('/parking-lots/:id', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        const parkingLot = await db.collection('parking_lots')
            .findOne({ _id: new ObjectId(id) });

        if (!parkingLot) {
            return res.status(404).json({
                success: false,
                message: 'Estacionamiento no encontrado'
            });
        }

        res.json({
            success: true,
            parkingLot: {
                _id: parkingLot._id.toString(),
                name: parkingLot.name,
                address: parkingLot.address,
                latitude: parkingLot.latitude,
                longitude: parkingLot.longitude,
                totalSpots: parkingLot.totalSpots,
                occupiedSpots: parkingLot.occupiedSpots || 0,
                hourlyRate: parkingLot.hourlyRate,
                openTime: parkingLot.openTime,
                closeTime: parkingLot.closeTime,
                amenidades: parkingLot.amenidades || [],
                status: parkingLot.status
            }
        });

    } catch (error) {
        console.error('Error al obtener parking lot:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estacionamiento',
            error: error.message
        });
    }
});

// ========================================
// GET /api/parking-lots/nearby - Buscar estacionamientos cercanos
// ========================================

router.get('/parking-lots/nearby', async (req, res) => {
    try {
        const db = getDB();
        const { lat, lng, radius = 5 } = req.query;

        if (!lat || !lng) {
            return res.status(400).json({
                success: false,
                message: 'Se requieren coordenadas (lat y lng)'
            });
        }

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusInMeters = parseFloat(radius) * 1000;

        const parkingLots = await db.collection('parking_lots')
            .find({
                status: 'activo',
                latitude: {
                    $gte: latitude - (radiusInMeters / 111000),
                    $lte: latitude + (radiusInMeters / 111000)
                },
                longitude: {
                    $gte: longitude - (radiusInMeters / (111000 * Math.cos(latitude * Math.PI / 180))),
                    $lte: longitude + (radiusInMeters / (111000 * Math.cos(latitude * Math.PI / 180)))
                }
            })
            .toArray();

        const parkingData = parkingLots.map(lot => {
            const distance = calculateDistance(
                latitude, longitude,
                lot.latitude, lot.longitude
            );

            return {
                _id: lot._id.toString(),
                name: lot.name,
                address: lot.address,
                latitude: lot.latitude,
                longitude: lot.longitude,
                totalSpots: lot.totalSpots,
                occupiedSpots: lot.occupiedSpots || 0,
                hourlyRate: lot.hourlyRate,
                openTime: lot.openTime,
                closeTime: lot.closeTime,
                amenidades: lot.amenidades || [],
                status: lot.status,
                distance: distance
            };
        }).sort((a, b) => a.distance - b.distance);

        res.json({
            success: true,
            parkingLots: parkingData,
            total: parkingData.length,
            location: { latitude, longitude }
        });

    } catch (error) {
        console.error('Error al buscar parking lots cercanos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al buscar estacionamientos cercanos',
            error: error.message
        });
    }
});

// ========================================
// PATCH /api/parking-lots/:id/occupancy - Actualizar ocupación
// ========================================

router.patch('/parking-lots/:id/occupancy', async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { occupiedSpots } = req.body;

        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido'
            });
        }

        if (typeof occupiedSpots !== 'number' || occupiedSpots < 0) {
            return res.status(400).json({
                success: false,
                message: 'occupiedSpots debe ser un número positivo'
            });
        }

        const parkingLot = await db.collection('parking_lots')
            .findOne({ _id: new ObjectId(id) });

        if (!parkingLot) {
            return res.status(404).json({
                success: false,
                message: 'Estacionamiento no encontrado'
            });
        }

        if (occupiedSpots > parkingLot.totalSpots) {
            return res.status(400).json({
                success: false,
                message: 'occupiedSpots no puede ser mayor que totalSpots'
            });
        }

        await db.collection('parking_lots').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    occupiedSpots: occupiedSpots,
                    updatedAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: 'Ocupación actualizada',
            occupiedSpots: occupiedSpots,
            availableSpots: parkingLot.totalSpots - occupiedSpots
        });

    } catch (error) {
        console.error('Error al actualizar ocupación:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ocupación',
            error: error.message
        });
    }
});

// ========================================
// UTILIDADES
// ========================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

module.exports = router;