const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// ========================================
// OBTENER PAGOS
// ========================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { userId, sessionId } = req.query;
        const db = getDB();
        
        // Construir query según los parámetros
        let query = {};
        
        if (sessionId) {
            query.sessionId = new ObjectId(sessionId);
        } else if (userId) {
            query.userId = new ObjectId(userId);
        }
        
        const payments = await db.collection('payments')
            .find(query)
            .sort({ timestamp: -1 })
            .toArray();
        
        res.json({
            success: true,
            data: payments
        });
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pagos',
            error: error.message
        });
    }
});

// ========================================
// OBTENER DETALLE DE UN PAGO
// ========================================
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const payment = await db.collection('payments')
            .aggregate([
                { $match: { _id: new ObjectId(id) } },
                {
                    $lookup: {
                        from: 'sessions',
                        localField: 'sessionId',
                        foreignField: '_id',
                        as: 'session'
                    }
                },
                { $unwind: { path: '$session', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: 'parking_lots',
                        localField: 'session.parkingLotId',
                        foreignField: '_id',
                        as: 'parkingLot'
                    }
                },
                { $unwind: { path: '$parkingLot', preserveNullAndEmptyArrays: true } }
            ])
            .toArray();
        
        if (payment.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: payment[0]
        });
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pago',
            error: error.message
        });
    }
});

// ========================================
// PROCESAR PAGO
// ========================================
router.post('/process', authenticateToken, async (req, res) => {
    try {
        const { sessionId, paymentMethod } = req.body;
        const db = getDB();
        
        // Obtener sesión con información del estacionamiento
        const session = await db.collection('sessions')
            .aggregate([
                { $match: { _id: new ObjectId(sessionId) } },
                {
                    $lookup: {
                        from: 'parking_lots',
                        localField: 'parkingLotId',
                        foreignField: '_id',
                        as: 'parkingLot'
                    }
                },
                { $unwind: { path: '$parkingLot', preserveNullAndEmptyArrays: false } }
            ])
            .toArray();
        
        if (session.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sesión no encontrada'
            });
        }
        
        if (session[0].status !== 'activa') {
            return res.status(400).json({
                success: false,
                message: 'La sesión no está activa'
            });
        }
        
        // Calcular duración y costos
        const entryTime = new Date(session[0].entryTime);
        const now = new Date();
        const durationMs = now - entryTime;
        const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Redondear hacia arriba
        
        // Obtener tarifa (manejar ambos campos)
        const tarifaHora = session[0].parkingLot.tarifaHora || 
                          session[0].parkingLot.hourlyRate || 
                          0;
        
        if (tarifaHora === 0) {
            return res.status(400).json({
                success: false,
                message: 'Tarifa de estacionamiento no configurada'
            });
        }
        
        const subtotal = durationHours * tarifaHora;
        const iva = subtotal * 0.16;
        const total = subtotal + iva;
        
        const transactionId = `TXN-${Date.now()}-${uuidv4().substring(0, 8)}`;
        
        // Crear registro de pago
        const payment = {
            sessionId: new ObjectId(sessionId),
            userId: session[0].userId,
            transactionId,
            amount: total,
            subtotal,
            taxes: {
                iva,
                retencionIva: 0,
                retencionIsr: 0
            },
            paymentMethod: paymentMethod || 'tarjeta',
            provider: 'OpenPayments',
            status: 'exitoso',
            timestamp: new Date(),
            metadata: {
                duration: durationHours,
                tarifaHora,
                parkingLotId: session[0].parkingLotId,
                parkingLotName: session[0].parkingLot.name || session[0].parkingLot.nombre,
                vehiclePlates: session[0].vehiclePlates
            }
        };
        
        const paymentResult = await db.collection('payments').insertOne(payment);
        
        // Actualizar sesión a pagada
        await db.collection('sessions').updateOne(
            { _id: new ObjectId(sessionId) },
            {
                $set: {
                    status: 'pagada',
                    amount: total,
                    paymentId: paymentResult.insertedId
                }
            }
        );
        
        res.json({
            success: true,
            message: 'Pago procesado exitosamente',
            data: {
                transactionId,
                amount: total,
                subtotal,
                iva,
                duration: durationHours,
                paymentId: paymentResult.insertedId
            }
        });
    } catch (error) {
        console.error('Error al procesar pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar pago',
            error: error.message
        });
    }
});

// ========================================
// GENERAR FACTURA (Simulación)
// ========================================
router.post('/:id/invoice', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { rfc, razonSocial, usoCFDI } = req.body;
        const db = getDB();
        
        const payment = await db.collection('payments').findOne({ 
            _id: new ObjectId(id) 
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        
        // Aquí iría la integración con un servicio de facturación real
        // Por ahora, solo guardamos la solicitud
        const invoice = {
            paymentId: new ObjectId(id),
            userId: payment.userId,
            rfc,
            razonSocial,
            usoCFDI,
            folio: `FAC-${Date.now()}`,
            status: 'generada',
            createdAt: new Date(),
            metadata: {
                amount: payment.amount,
                subtotal: payment.subtotal,
                taxes: payment.taxes
            }
        };
        
        const result = await db.collection('invoices').insertOne(invoice);
        
        res.json({
            success: true,
            message: 'Factura generada exitosamente',
            data: {
                invoiceId: result.insertedId,
                folio: invoice.folio
            }
        });
    } catch (error) {
        console.error('Error al generar factura:', error);
        res.status(500).json({
            success: false,
            message: 'Error al generar factura',
            error: error.message
        });
    }
});

// ========================================
// OBTENER REPORTE DE PAGOS (ADMIN)
// ========================================
router.get('/report/summary', authenticateToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const db = getDB();
        
        const matchFilter = {
            status: 'exitoso'
        };
        
        if (startDate && endDate) {
            matchFilter.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }
        
        const summary = await db.collection('payments').aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: '$amount' },
                    totalSubtotal: { $sum: '$subtotal' },
                    totalIVA: { $sum: '$taxes.iva' },
                    totalTransactions: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            }
        ]).toArray();
        
        const byMethod = await db.collection('payments').aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            }
        ]).toArray();
        
        res.json({
            success: true,
            data: {
                summary: summary.length > 0 ? summary[0] : null,
                byMethod
            }
        });
    } catch (error) {
        console.error('Error al obtener reporte:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener reporte',
            error: error.message
        });
    }
});

// AÑADIR ESTA RUTA AL FINAL, ANTES DE module.exports
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        // Validar que sea un ObjectId válido
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'ID de pago inválido'
            });
        }
        
        const payment = await db.collection('payments').findOne({ 
            _id: new ObjectId(id) 
        });
        
        if (!payment) {
            return res.status(404).json({
                success: false,
                message: 'Pago no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: payment
        });
    } catch (error) {
        console.error('Error al obtener pago:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pago',
            error: error.message
        });
    }
});

module.exports = router;