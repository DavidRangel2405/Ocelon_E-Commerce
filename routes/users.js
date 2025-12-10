const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(id) },
            { projection: { passwordHash: 0 } }
        );
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { profile } = req.body;
        const db = getDB();
        
        const updateData = {
            'profile.nombre': profile.nombre,
            'profile.telefono': profile.telefono,
            'profile.rfc': profile.rfc
        };
        
        await db.collection('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        res.json({
            success: true,
            message: 'Perfil actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error.message
        });
    }
});

router.get('/:id/history', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const sessions = await db.collection('sessions')
            .find({ userId: new ObjectId(id) })
            .sort({ entryTime: -1 })
            .limit(10)
            .toArray();
        
        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial',
            error: error.message
        });
    }
});

// ========================================
// COMPRA DE PLANES
// ========================================

router.post('/plan', authenticateToken, async (req, res) => {
    try {
        const { plan, discount, price } = req.body;
        const userId = req.user.userId;
        const db = getDB();

        if (!plan || discount === undefined || !price) {
            return res.status(400).json({
                success: false,
                message: 'Plan, descuento y precio son requeridos'
            });
        }

        // Crear documento de compra de plan
        const planPurchase = {
            userId: new ObjectId(userId),
            plan: plan,
            discount: discount,
            price: price,
            createdAt: new Date(),
            status: 'activo'
        };

        // Guardar en colección plan_purchases
        const result = await db.collection('plan_purchases').insertOne(planPurchase);

        // Actualizar el plan actual del usuario
        await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
                $set: { 
                    currentPlan: plan,
                    planDiscount: discount,
                    planUpdatedAt: new Date()
                }
            }
        );

        res.json({
            success: true,
            message: 'Plan comprado exitosamente',
            data: {
                purchaseId: result.insertedId,
                plan: plan,
                discount: discount,
                price: price
            }
        });
    } catch (error) {
        console.error('Error al comprar plan:', error);
        res.status(500).json({
            success: false,
            message: 'Error al comprar plan',
            error: error.message
        });
    }
});

module.exports = router;