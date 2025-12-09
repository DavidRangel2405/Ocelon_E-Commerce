const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.query;
    const db = getDB();

    const sessions = await db.collection('sessions')
      .aggregate([
        { $match: { userId: new ObjectId(userId) } },
        { $sort: { entryTime: -1 } },
        {
          $lookup: {
            from: 'parking_lots',
            localField: 'parkingLotId',
            foreignField: '_id',
            as: 'parkingLot'
          }
        },
        {
          $unwind: {
            path: '$parkingLot',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            _id: 1,
            qrCode: 1,
            entryTime: 1,
            exitTime: 1,
            status: 1,
            amount: 1,
            parkingLotName: { $ifNull: ['$parkingLot.name', 'Estacionamiento no disponible'] },
            vehiclePlates: 1
          }
        }
      ])
      .toArray();

    res.json({ success: true, data: sessions });
  } catch (error) {
    console.error('Error al cargar sesiones:', error);
    res.status(500).json({ success: false, message: 'Error al cargar sesiones' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const session = await db.collection('sessions')
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'parking_lots',
                        localField: 'parkingLotId',
                        foreignField: '_id',
                        as: 'parkingLot'
                    }
                },
                { $unwind: '$parkingLot' }
            ])
            .toArray();
        
        if (session.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: {
                ...session[0],
                tarifaHora: session[0].parkingLot.tarifaHora
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesión',
            error: error.message
        });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    try {
        const { userId, parkingLotId, vehiclePlates } = req.body;
        const db = getDB();
        
        const parkingLot = await db.collection('parking_lots').findOne({ _id: new ObjectId(parkingLotId) });
        
        if (!parkingLot) {
            return res.status(404).json({
                success: false,
                message: 'Estacionamiento no encontrado'
            });
        }
        
        const qrCode = uuidv4();
        
        const newSession = {
            userId: new ObjectId(userId),
            parkingLotId: new ObjectId(parkingLotId),
            qrCode,
            vehiclePlates: vehiclePlates.toUpperCase(),
            entryTime: new Date(),
            exitTime: null,
            status: 'activa',
            amount: null,
            metadata: {
                createdBy: 'web',
                ipAddress: req.ip
            }
        };
        
        const result = await db.collection('sessions').insertOne(newSession);

await db.collection('parking_lots').updateOne(
    { _id: new ObjectId(parkingLotId) },
    { $inc: { occupiedSpots: 1 } }
);
        
        res.status(201).json({
            success: true,
            message: 'Sesión creada exitosamente',
            data: {
                sessionId: result.insertedId,
                qrCode
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear sesión',
            error: error.message
        });
    }
});

router.post('/:id/validate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const session = await db.collection('sessions').findOne({ _id: new ObjectId(id) });
        
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }
        
        if (session.status !== 'pagada') {
            return res.status(400).json({
                success: false,
                message: 'La sesión debe estar pagada para validar la salida'
            });
        }
        
        await db.collection('sessions').updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    exitTime: new Date(),
                    status: 'finalizada'
                }
            }
        );
        
        res.json({
            success: true,
            message: 'Salida validada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al validar salida',
            error: error.message
        });
    }
});

module.exports = router;