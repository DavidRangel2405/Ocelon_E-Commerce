require('dotenv').config();
const express = require('express');
const path = require('path');
const { connectDB, getDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const supportRoutes = require('./routes/support');
const parkingRoutes = require('./routes/parking');
const parkingLotsRoutes = require('./routes/parking');
const dashboardRoutes = require('./routes/dashboard');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

connectDB();

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api', parkingLotsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get("/api/stats", async (req, res) => {
    try {
        const db = getDB();

        const usuariosActivos = await db.collection("users").countDocuments({
            status: "activo"
        });

        const estacionamientosActivos = await db.collection("parking_lots").countDocuments({
            status: "activo"
        });

        const inicio = new Date();
        inicio.setHours(0, 0, 0, 0);

        const fin = new Date();
        fin.setHours(23, 59, 59, 999);

        const estanciasDiarias = await db.collection("sessions").countDocuments({
            entryTime: { $gte: inicio, $lte: fin }
        });

        res.json({
            usuariosActivos,
            estacionamientosActivos,
            estanciasDiarias
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error obteniendo estadísticas" });
    }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Ocelon ejecutándose en puerto ${PORT}`);
  console.log(`Modo: ${process.env.NODE_ENV}`);
});