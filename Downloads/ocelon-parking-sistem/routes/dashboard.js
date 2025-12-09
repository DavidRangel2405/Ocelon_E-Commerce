const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/overview', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'Falta userId' });

        const db = getDB();

        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        // Estadísticas básicas
        const totalSessions = await db.collection('sessions').countDocuments({ userId: new ObjectId(userId) });
        const activeSessions = await db.collection('sessions').countDocuments({ userId: new ObjectId(userId), status: { $in: ['activa', 'pagada'] } });

        const paymentsData = await db.collection('payments').aggregate([
            { $match: { userId: new ObjectId(userId), status: 'exitoso' } },
            { $group: { _id: null, totalSpent: { $sum: '$amount' }, totalPayments: { $sum: 1 } } }
        ]).toArray();

        const totalSpent = paymentsData.length > 0 ? paymentsData[0].totalSpent : 0;
        const totalPayments = paymentsData.length > 0 ? paymentsData[0].totalPayments : 0;

        // Actividad reciente
        const recentSessions = await db.collection('sessions')
            .aggregate([
                { $match: { userId: new ObjectId(userId) } },
                { $sort: { entryTime: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: 'parking_lots',
                        localField: 'parkingLotId',
                        foreignField: '_id',
                        as: 'parking'
                    }
                },
                { $unwind: '$parking' }
            ]).toArray();

        const recentActivity = recentSessions.map(session => ({
            description: `Estancia en ${session.parking.name} - ${session.status}`,
            timestamp: session.entryTime
        }));


// Datos para gráficas
const sessionsByDay = await db.collection('sessions').aggregate([
    { $match: { userId: new ObjectId(userId) } },
    {
        $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$entryTime' } },
            count: { $sum: 1 }
        }
    },
    { $sort: { _id: 1 } }
]).toArray();

const sessionsByStatus = await db.collection('sessions').aggregate([
    { $match: { userId: new ObjectId(userId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
]).toArray();

const spendingByMonth = await db.collection('payments').aggregate([
    { $match: { userId: new ObjectId(userId), status: 'exitoso' } },
    {
        $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
            total: { $sum: '$amount' }
        }
    },
    { $sort: { _id: 1 } }
]).toArray();

const parkingUsage = await db.collection('sessions').aggregate([
    { $match: { userId: new ObjectId(userId) } },
    {
        $lookup: {
            from: 'parking_lots',
            localField: 'parkingLotId',
            foreignField: '_id',
            as: 'parking'
        }
    },
    { $unwind: '$parking' },
    {
        $group: {
            _id: '$parking.name',
            count: { $sum: 1 }
        }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
]).toArray();

console.log("Enviando al frontend:");
console.log("sessionsByDay:", sessionsByDay);
console.log("sessionsByStatus:", sessionsByStatus);
console.log("spendingByMonth:", spendingByMonth);
console.log("parkingUsage:", parkingUsage);

res.json({
    success: true,
    data: {
        userName: user.profile.nombre,
        totalSessions,
        activeSessions,
        totalSpent,
        totalPayments,
        recentActivity,
        sessionsByDay,
        sessionsByStatus,
        spendingByMonth,
        parkingUsage
    }
});
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener datos del dashboard', error: error.message });
    }
});

router.get('/analytics/user', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ success: false, message: 'Falta userId' });

        const db = getDB();

        // Gastos por mes del usuario
        const spendingByMonth = await db.collection('payments').aggregate([
            { $match: { userId: new ObjectId(userId), status: 'exitoso' } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$timestamp' } },
                    total: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        // Estacionamientos más usados por el usuario
        const parkingUsage = await db.collection('sessions').aggregate([
            { $match: { userId: new ObjectId(userId) } },
            {
                $lookup: {
                    from: 'parking_lots',
                    localField: 'parkingLotId',
                    foreignField: '_id',
                    as: 'parking'
                }
            },
            { $unwind: '$parking' },
            {
                $group: {
                    _id: '$parking.name',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]).toArray();

        res.json({
            success: true,
            data: {
                spendingByMonth,
                parkingUsage
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener analíticas del usuario', error: error.message });
    }
});

module.exports = router;