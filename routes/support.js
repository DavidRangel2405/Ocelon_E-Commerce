const express = require('express');
const router = express.Router();
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../middleware/auth');

router.get('/tickets', authenticateToken, async (req, res) => {
    try {
        const { userId } = req.query;
        const db = getDB();
        
        const tickets = await db.collection('support_tickets')
            .find({ userId: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();
        
        res.json({
            success: true,
            data: tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener tickets',
            error: error.message
        });
    }
});

router.post('/tickets', authenticateToken, async (req, res) => {
    try {
        const { userId, category, subject, description } = req.body;
        const db = getDB();
        
        const ticketCount = await db.collection('support_tickets').countDocuments();
        const ticketNumber = `TKT-${new Date().getFullYear()}-${String(ticketCount + 1).padStart(5, '0')}`;
        
        const newTicket = {
            ticketNumber,
            userId: new ObjectId(userId),
            parkingLotId: null,
            channel: 'web',
            category,
            priority: 'media',
            status: 'abierto',
            subject,
            messages: [
                {
                    autor: 'usuario',
                    texto: description,
                    timestamp: new Date()
                }
            ],
            assignedTo: null,
            createdAt: new Date(),
            resolvedAt: null,
            slaDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000)
        };
        
        const result = await db.collection('support_tickets').insertOne(newTicket);
        
        res.status(201).json({
            success: true,
            message: 'Ticket creado exitosamente',
            data: {
                ticketId: result.insertedId,
                ticketNumber
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear ticket',
            error: error.message
        });
    }
});

router.get('/tickets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const db = getDB();
        
        const ticket = await db.collection('support_tickets').findOne({ _id: new ObjectId(id) });
        
        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener ticket',
            error: error.message
        });
    }
});

router.put('/tickets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, message } = req.body;
        const db = getDB();
        
        const updateData = { status };
        
        if (message) {
            await db.collection('support_tickets').updateOne(
                { _id: new ObjectId(id) },
                {
                    $push: {
                        messages: {
                            autor: 'usuario',
                            texto: message,
                            timestamp: new Date()
                        }
                    }
                }
            );
        }
        
        if (status === 'resuelto') {
            updateData.resolvedAt = new Date();
        }
        
        await db.collection('support_tickets').updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );
        
        res.json({
            success: true,
            message: 'Ticket actualizado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al actualizar ticket',
            error: error.message
        });
    }
});

module.exports = router;