const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ========================================
// DASHBOARD ANALYTICS
// ========================================

router.get('/analytics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        // Métricas generales
        const totalUsers = await db.collection('users').countDocuments({ status: 'activo' });
        const totalParkingLots = await db.collection('parking_lots').countDocuments({ status: 'activo' });
        
        // Sesiones de hoy
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todaySessions = await db.collection('sessions').countDocuments({
            entryTime: { $gte: today, $lt: tomorrow }
        });

        // Ingresos del mes
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthlyRevenue = await db.collection('payments').aggregate([
            {
                $match: {
                    timestamp: { $gte: startOfMonth },
                    status: 'exitoso'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]).toArray();

        // Sesiones activas
        const activeSessions = await db.collection('sessions').countDocuments({
            status: { $in: ['activa', 'pagada'] }
        });

        // INGRESOS POR ESTACIONAMIENTO - VERSIÓN CORREGIDA
        const revenueByParking = await db.collection('payments').aggregate([
            {
                $match: {
                    status: 'exitoso'
                }
            },
            {
                $lookup: {
                    from: 'sessions',
                    localField: 'sessionId',
                    foreignField: '_id',
                    as: 'session'
                }
            },
            { 
                $unwind: { 
                    path: '$session', 
                    preserveNullAndEmptyArrays: false 
                } 
            },
            {
                $lookup: {
                    from: 'parking_lots',
                    localField: 'session.parkingLotId',
                    foreignField: '_id',
                    as: 'parking'
                }
            },
            { 
                $unwind: { 
                    path: '$parking', 
                    preserveNullAndEmptyArrays: false 
                } 
            },
            {
                $addFields: {
                    parkingName: {
                        $ifNull: [
                            '$parking.name',
                            { $ifNull: ['$parking.nombre', 'Estacionamiento sin nombre'] }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: '$parking._id',
                    parkingName: { $first: '$parkingName' },
                    totalRevenue: { $sum: '$amount' },
                    totalSessions: { $sum: 1 }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 10 }
        ]).toArray();

        console.log('Ingresos por estacionamiento:', JSON.stringify(revenueByParking, null, 2));

        // Sesiones por día (últimos 30 días)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sessionsByDay = await db.collection('sessions').aggregate([
            {
                $match: {
                    entryTime: { $gte: thirtyDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$entryTime' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        // Métodos de pago más usados
        const paymentMethods = await db.collection('payments').aggregate([
            {
                $match: {
                    status: 'exitoso'
                }
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    total: { $sum: '$amount' }
                }
            }
        ]).toArray();

        // Tickets de soporte por estado
        const ticketsByStatus = await db.collection('support_tickets').aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ]).toArray();

        // Distribución de planes
        const plansDistribution = await db.collection('plan_purchases').aggregate([
            {
                $group: {
                    _id: '$plan',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$price' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();

        res.json({
            success: true,
            data: {
                summary: {
                    totalUsers,
                    totalParkingLots,
                    todaySessions,
                    monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0,
                    activeSessions
                },
                revenueByParking,
                sessionsByDay,
                paymentMethods,
                ticketsByStatus,
                plansDistribution
            }
        });
    } catch (error) {
        console.error('Error en analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener analíticas',
            error: error.message
        });
    }
});

// ========================================
// GESTIÓN DE ESTACIONAMIENTOS
// ========================================

router.get('/parking-lots', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        const parkingLots = await db.collection('parking_lots')
            .find({})
            .toArray();

        // Agregar ocupación actual a cada estacionamiento
        for (let lot of parkingLots) {
            const activeSessions = await db.collection('sessions').countDocuments({
                parkingLotId: lot._id,
                status: { $in: ['activa', 'pagada'] }
            });
            lot.ocupacionActual = activeSessions;
            lot.espaciosDisponibles = (lot.totalSpots || lot.capacidadTotal || 0) - activeSessions;
        }

        res.json({
            success: true,
            data: parkingLots
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener estacionamientos',
            error: error.message
        });
    }
});

router.post('/parking-lots', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { nombre, ubicacion, capacidadTotal, tarifaHora, horario, amenidades } = req.body;

        const newParkingLot = {
            nombre,
            ubicacion,
            capacidadTotal: parseInt(capacidadTotal),
            tarifaHora: parseFloat(tarifaHora),
            horario: horario || '24/7',
            amenidades: amenidades || [],
            status: 'activo',
            createdAt: new Date()
        };

        const result = await db.collection('parking_lots').insertOne(newParkingLot);

        res.status(201).json({
            success: true,
            message: 'Estacionamiento creado exitosamente',
            data: {
                _id: result.insertedId,
                ...newParkingLot
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear estacionamiento',
            error: error.message
        });
    }
});

router.put('/parking-lots/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const updateData = req.body;

        delete updateData._id;

        await db.collection('parking_lots').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        res.json({
            success: true,
            message: 'Estacionamiento actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estacionamiento',
            error: error.message
        });
    }
});

router.delete('/parking-lots/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;

        // Eliminación lógica
        await db.collection('parking_lots').updateOne(
            { _id: new ObjectId(id) },
            { $set: { status: 'inactivo' } }
        );

        res.json({
            success: true,
            message: 'Estacionamiento desactivado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al desactivar estacionamiento',
            error: error.message
        });
    }
});

// ========================================
// GESTIÓN DE USUARIOS
// ========================================

router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { role, status, search } = req.query;

        const filter = {};
        if (role) filter.role = role;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { email: { $regex: search, $options: 'i' } },
                { 'profile.nombre': { $regex: search, $options: 'i' } }
            ];
        }

        const users = await db.collection('users')
            .find(filter, { projection: { passwordHash: 0 } })
            .sort({ createdAt: -1 })
            .toArray();

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
});

router.put('/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { role } = req.body;

        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: { role } }
        );

        res.json({
            success: true,
            message: 'Rol actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar rol',
            error: error.message
        });
    }
});

router.put('/users/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { status } = req.body;

        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: { status } }
        );

        res.json({
            success: true,
            message: 'Estado actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado',
            error: error.message
        });
    }
});

// ========================================
// SESIONES ACTIVAS
// ========================================

router.get('/active-sessions', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();

        const sessions = await db.collection('sessions').aggregate([
            {
                $match: {
                    status: { $in: ['activa', 'pagada'] }
                }
            },
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
                    localField: 'parkingLotId',
                    foreignField: '_id',
                    as: 'parkingLot'
                }
            },
            { $unwind: { path: '$parkingLot', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    userName: { $ifNull: ['$user.profile.nombre', 'Usuario desconocido'] },
                    userEmail: { $ifNull: ['$user.email', 'Sin email'] },
                    parkingName: {
                        $ifNull: [
                            '$parkingLot.name',
                            { $ifNull: ['$parkingLot.nombre', 'Estacionamiento no disponible'] }
                        ]
                    },
                    tarifaHora: {
                        $ifNull: [
                            '$parkingLot.hourlyRate',
                            { $ifNull: ['$parkingLot.tarifaHora', 0] }
                        ]
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    qrCode: 1,
                    vehiclePlates: 1,
                    entryTime: 1,
                    exitTime: 1,
                    status: 1,
                    amount: 1,
                    userName: 1,
                    userEmail: 1,
                    parkingName: 1,
                    tarifaHora: 1
                }
            },
            { $sort: { entryTime: -1 } }
        ]).toArray();

        console.log('Sesiones activas (primera):', sessions.length > 0 ? JSON.stringify(sessions[0], null, 2) : 'Sin sesiones');

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        console.error('Error al obtener sesiones activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener sesiones activas',
            error: error.message
        });
    }
});

// ========================================
// REPORTES
// ========================================

router.get('/reports/revenue', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { startDate, endDate, parkingLotId } = req.query;

        const matchFilter = {
            status: 'exitoso',
            timestamp: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        const payments = await db.collection('payments').aggregate([
            { $match: matchFilter },
            {
                $lookup: {
                    from: 'sessions',
                    localField: 'sessionId',
                    foreignField: '_id',
                    as: 'session'
                }
            },
            { $unwind: '$session' },
            {
                $lookup: {
                    from: 'parking_lots',
                    localField: 'session.parkingLotId',
                    foreignField: '_id',
                    as: 'parking'
                }
            },
            { $unwind: '$parking' },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        parking: '$parking.nombre'
                    },
                    totalAmount: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { '_id.date': -1 } }
        ]).toArray();

        const summary = await db.collection('payments').aggregate([
            { $match: matchFilter },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: '$amount' },
                    totalTransactions: { $sum: 1 },
                    avgTransaction: { $avg: '$amount' },
                    totalIVA: { $sum: '$taxes.iva' }
                }
            }
        ]).toArray();

        res.json({
            success: true,
            data: {
                details: payments,
                summary: summary.length > 0 ? summary[0] : null
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al generar reporte de ingresos',
            error: error.message
        });
    }
});

// ========================================
// LOGS Y AUDITORÍA
// ========================================

router.get('/logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        const { type, startDate, endDate, limit = 100 } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (startDate && endDate) {
            filter.timestamp = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        // Si existe colección de logs
        const logsExist = await db.listCollections({ name: 'system_logs' }).hasNext();
        
        if (!logsExist) {
            return res.json({
                success: true,
                data: [],
                message: 'No hay logs registrados aún'
            });
        }

        const logs = await db.collection('system_logs')
            .find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .toArray();

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener logs',
            error: error.message
        });
    }
});

// ========================================
// GESTIÓN DE TICKETS (SOLO ADMIN)
// ========================================

// Obtener TODOS los tickets (para admins)
router.get('/tickets', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { status, priority, limit = 50 } = req.query;
        const db = getDB();
        
        let query = {};
        if (status) query.status = status;
        if (priority) query.priority = priority;
        
        const tickets = await db.collection('support_tickets')
            .aggregate([
                { $match: query },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'userId',
                        foreignField: '_id',
                        as: 'user'
                    }
                },
                { $unwind: '$user' },
                {
                    $project: {
                        ticketNumber: 1,
                        subject: 1,
                        category: 1,
                        priority: 1,
                        status: 1,
                        createdAt: 1,
                        resolvedAt: 1,
                        messages: 1,
                        'user.profile.nombre': 1,
                        'user.email': 1
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: parseInt(limit) }
            ])
            .toArray();
        
        res.json({
            success: true,
            data: tickets,
            total: tickets.length
        });
    } catch (error) {
        console.error('Error al obtener tickets:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener tickets',
            error: error.message
        });
    }
});

// Responder a un ticket (solo admin)
router.post('/tickets/:id/reply', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { message, status } = req.body;
        const db = getDB();
        
        if (!message || message.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'El mensaje debe tener al menos 10 caracteres'
            });
        }
        
        const updateData = {
            $push: {
                messages: {
                    autor: 'soporte',
                    texto: message.trim(),
                    timestamp: new Date(),
                    adminId: req.user.userId
                }
            }
        };
        
        // Si se proporciona un nuevo estado, actualizarlo
        if (status) {
            updateData.$set = { status };
            
            // Si se marca como resuelto, agregar fecha
            if (status === 'resuelto') {
                updateData.$set.resolvedAt = new Date();
            }
        } else {
            // Si no se especifica estado, cambiarlo a "en_proceso"
            updateData.$set = { status: 'en_proceso' };
        }
        
        const result = await db.collection('support_tickets').updateOne(
            { _id: new ObjectId(id) },
            updateData
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ticket no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Respuesta enviada exitosamente'
        });
    } catch (error) {
        console.error('Error al responder ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error al responder ticket',
            error: error.message
        });
    }
});

// Cambiar estado de un ticket (solo admin)
router.put('/tickets/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, priority } = req.body;
        const db = getDB();
        
        const updateData = {};
        if (status) {
            updateData.status = status;
            if (status === 'resuelto') {
                updateData.resolvedAt = new Date();
            }
        }
        if (priority) {
            updateData.priority = priority;
        }
        
        const result = await db.collection('support_tickets').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ticket no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Ticket actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar ticket:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ticket',
            error: error.message
        });
    }
});

// Obtener estadísticas de tickets (solo admin)
router.get('/tickets/stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        const stats = await db.collection('support_tickets').aggregate([
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: '$status', count: { $sum: 1 } } }
                    ],
                    byPriority: [
                        { $group: { _id: '$priority', count: { $sum: 1 } } }
                    ],
                    byCategory: [
                        { $group: { _id: '$category', count: { $sum: 1 } } }
                    ],
                    total: [
                        { $count: 'count' }
                    ],
                    unassigned: [
                        { $match: { assignedTo: null, status: { $in: ['abierto', 'en_proceso'] } } },
                        { $count: 'count' }
                    ]
                }
            }
        ]).toArray();
        
        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
});

// ========================================
// PLANES - ANALYTICS
// ========================================

// Obtener planes comprados del mes
router.get('/plans-month', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        // Calcular inicio y fin del mes actual
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        
        const plans = await db.collection('plan_purchases').aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $addFields: {
                    userName: {
                        $cond: [
                            { $ne: ['$user.profile.nombre', null] },
                            '$user.profile.nombre',
                            { $split: ['$user.email', '@'] }
                        ]
                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $project: {
                    _id: 1,
                    plan: 1,
                    price: 1,
                    discount: 1,
                    createdAt: 1,
                    userEmail: '$user.email',
                    userName: 1
                }
            }
        ]).toArray();
        
        res.json({
            success: true,
            data: plans
        });
    } catch (error) {
        console.error('Error al obtener planes del mes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener planes del mes',
            error: error.message
        });
    }
});

// Calcular ingresos mensuales incluyendo planes
router.get('/monthly-revenue', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        // Calcular inicio y fin del mes actual
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        
        // Ingresos de pagos de sesiones
        const paymentRevenue = await db.collection('payments').aggregate([
            {
                $match: {
                    timestamp: { $gte: startOfMonth, $lte: endOfMonth },
                    status: 'exitoso'
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amount' }
                }
            }
        ]).toArray();
        
        // Ingresos de planes
        const plansRevenue = await db.collection('plan_purchases').aggregate([
            {
                $match: {
                    createdAt: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$price' }
                }
            }
        ]).toArray();
        
        const paymentTotal = paymentRevenue.length > 0 ? paymentRevenue[0].total : 0;
        const plansTotal = plansRevenue.length > 0 ? plansRevenue[0].total : 0;
        const totalRevenue = paymentTotal + plansTotal;
        
        res.json({
            success: true,
            data: {
                paymentRevenue: paymentTotal,
                plansRevenue: plansTotal,
                totalRevenue: totalRevenue
            }
        });
    } catch (error) {
        console.error('Error al calcular ingresos mensuales:', error);
        res.status(500).json({
            success: false,
            message: 'Error al calcular ingresos mensuales',
            error: error.message
        });
    }
});

// Obtener distribución de planes
router.get('/plans-distribution', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const db = getDB();
        
        const distribution = await db.collection('plan_purchases').aggregate([
            {
                $group: {
                    _id: '$plan',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$price' }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]).toArray();
        
        res.json({
            success: true,
            data: distribution
        });
    } catch (error) {
        console.error('Error al obtener distribución de planes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener distribución de planes',
            error: error.message
        });
    }
});

module.exports = router;