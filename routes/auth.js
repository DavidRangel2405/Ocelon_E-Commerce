const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');
const { ObjectId } = require('mongodb');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');

// ========================================
// REGISTRO DE USUARIO
// ========================================
router.post('/register', async (req, res) => {
    try {
        const { email, password, profile } = req.body;
        const db = getDB();
        
        // Validación de datos
        if (!email || !password || !profile?.nombre) {
            return res.status(400).json({
                success: false,
                message: 'Faltan datos requeridos'
            });
        }
        
        const existingUser = await db.collection('users').findOne({ email });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El correo ya está registrado'
            });
        }
        
        const passwordHash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        const newUser = {
            email,
            passwordHash,
            role: 'conductor',
            profile: {
                nombre: profile.nombre,
                telefono: profile.telefono || null,
                rfc: profile.rfc || null
            },
            createdAt: new Date(),
            status: 'activo'
        };
        
        const result = await db.collection('users').insertOne(newUser);
        
        // Generar token para login automático
        const token = jwt.sign(
            { 
                userId: result.insertedId.toString(),
                email: newUser.email,
                role: newUser.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );
        
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            token,
            userId: result.insertedId.toString(),
            role: newUser.role,
            userName: profile.nombre
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error.message
        });
    }
});

// ========================================
// LOGIN
// ========================================
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = getDB();
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }
        
        const user = await db.collection('users').findOne({ email });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        if (user.status !== 'activo') {
            return res.status(403).json({
                success: false,
                message: 'Cuenta inactiva. Contacta al administrador'
            });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }
        
        const token = jwt.sign(
            { 
                userId: user._id.toString(),
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );
        
        // Actualizar último login
        await db.collection('users').updateOne(
            { _id: user._id },
            { $set: { lastLogin: new Date() } }
        );
        
        res.json({
            success: true,
            token,
            userId: user._id.toString(),
            role: user.role,
            userName: user.profile?.nombre || 'Usuario'
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error.message
        });
    }
});

// ========================================
// VERIFICAR TOKEN
// ========================================
router.get('/verify', authenticateToken, async (req, res) => {
    try {
        const db = getDB();
        
        // Verificar que el userId esté presente
        if (!req.user || !req.user.userId) {
            return res.status(401).json({
                success: false,
                message: 'Token malformado'
            });
        }
        
        // Verificar que el usuario aún existe y está activo
        const user = await db.collection('users').findOne({
            _id: new ObjectId(req.user.userId),
            status: 'activo'
        }, {
            projection: { passwordHash: 0 }
        });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }
        
        res.json({
            success: true,
            userId: req.user.userId,
            role: req.user.role,
            email: req.user.email,
            userName: user.profile?.nombre || 'Usuario'
        });
    } catch (error) {
        console.error('Error en verify:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar token',
            error: error.message
        });
    }
});

// ========================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ========================================
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const db = getDB();
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico es requerido'
            });
        }
        
        // Buscar usuario
        const user = await db.collection('users').findOne({ email });
        
        // Por seguridad, siempre devolver éxito aunque el email no exista
        if (!user) {
            return res.json({
                success: true,
                message: 'Si el correo existe, recibirás instrucciones para restablecer tu contraseña'
            });
        }
        
        // Generar token de recuperación
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
        
        // Guardar token en la base de datos
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    resetPasswordToken: resetTokenHash,
                    resetPasswordExpiry: resetTokenExpiry
                }
            }
        );
        
        // Crear URL de recuperación
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;
        
        // Log para desarrollo (en producción, enviar email)
        console.log('\n=================================');
        console.log('RECUPERACIÓN DE CONTRASEÑA');
        console.log('=================================');
        console.log('Usuario:', user.email);
        console.log('Nombre:', user.profile?.nombre);
        console.log('URL:', resetUrl);
        console.log('Expira en: 1 hora');
        console.log('=================================\n');
        
        // TODO: Implementar envío de email en producción
        /*
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        
        await transporter.sendMail({
            from: 'Ocelon <no-reply@ocelon.com>',
            to: user.email,
            subject: 'Recuperación de Contraseña - Ocelon',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Recuperación de Contraseña</h2>
                    <p>Hola ${user.profile.nombre},</p>
                    <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
                    <div style="margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Restablecer Contraseña
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
                    <p style="color: #999; font-size: 12px;">Si no solicitaste esto, ignora este correo.</p>
                </div>
            `
        });
        */
        
        res.json({
            success: true,
            message: 'Se han enviado las instrucciones a tu correo electrónico',
            resetUrl: resetUrl  // Enviar el URL en la respuesta para desarrollo
        });
        
    } catch (error) {
        console.error('Error en forgot-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar solicitud'
        });
    }
});

// ========================================
// VERIFICAR TOKEN DE RECUPERACIÓN
// ========================================
router.get('/verify-reset-token', async (req, res) => {
    try {
        const { token } = req.query;
        const db = getDB();
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }
        
        // Hashear token para comparar
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Buscar usuario con token válido
        const user = await db.collection('users').findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            email: user.email
        });
        
    } catch (error) {
        console.error('Error en verify-reset-token:', error);
        res.status(500).json({
            success: false,
            message: 'Error al verificar token'
        });
    }
});

// ========================================
// RESTABLECER CONTRASEÑA
// ========================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const db = getDB();
        
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Token y contraseña son requeridos'
            });
        }
        
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 8 caracteres'
            });
        }
        
        // Hashear token para comparar
        const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Buscar usuario con token válido
        const user = await db.collection('users').findOne({
            resetPasswordToken: resetTokenHash,
            resetPasswordExpiry: { $gt: new Date() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        
        // Hashear nueva contraseña
        const passwordHash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS) || 10);
        
        // Actualizar contraseña y limpiar token
        await db.collection('users').updateOne(
            { _id: user._id },
            {
                $set: {
                    passwordHash: passwordHash,
                    updatedAt: new Date()
                },
                $unset: {
                    resetPasswordToken: '',
                    resetPasswordExpiry: ''
                }
            }
        );
        
        console.log(`Contraseña actualizada para: ${user.email}`);
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
        
    } catch (error) {
        console.error('Error en reset-password:', error);
        res.status(500).json({
            success: false,
            message: 'Error al restablecer contraseña'
        });
    }
});

// ========================================
// CERRAR SESIÓN
// ========================================
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // Aquí podrías agregar lógica para invalidar tokens en una blacklist
        // Por ahora, solo respondemos con éxito
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cerrar sesión'
        });
    }
});

module.exports = router;