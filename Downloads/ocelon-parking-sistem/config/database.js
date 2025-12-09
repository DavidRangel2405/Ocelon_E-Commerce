const { MongoClient } = require('mongodb');

let db = null;
let client = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  console.log("Intentando conectar a MongoDB:");
  console.log(uri);

  try {
    client = new MongoClient(uri, {
      maxPoolSize: 50,
      minPoolSize: 5,
      retryWrites: true,
      w: "majority",
      serverSelectionTimeoutMS: 10000,  // MÁS ALTO PARA ESPERAR AL PRIMARY
    });

    let connected = false;
    let attempts = 0;

    // Reintenta hasta 10 veces (para esperar que mongo1 sea PRIMARY)
    while (!connected && attempts < 10) {
      try {
        attempts++;
        console.log(`Intento ${attempts} de conexión al Replica Set...`);
        await client.connect();
        connected = true;
      } catch (error) {
        console.log("Replica Set aún no listo. Reintentando en 3s...");
        await new Promise((res) => setTimeout(res, 3000));
      }
    }

    if (!connected) {
      console.error("MongoDB Replica Set no respondió.");
      process.exit(1);
    }

    db = client.db("ocelon_db");

    await createIndexes();

    console.log("MongoDB Replica Set conectado exitosamente");
    return db;

  } catch (error) {
    console.error("Error al conectar MongoDB:", error);
    process.exit(1);
  }
};


const createIndexes = async () => {
  try {
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ qrCode: 1 }, { unique: true });
    await db.collection("sessions").createIndex({ parkingLotId: 1, entryTime: -1 });
    await db.collection("payments").createIndex({ sessionId: 1 });
    await db.collection("payments").createIndex({ transactionId: 1 }, { unique: true });
    await db.collection("support_tickets").createIndex({ status: 1, priority: -1 });
    await db.collection("plan_purchases").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("plan_purchases").createIndex({ createdAt: -1 });
    await db.collection("plan_purchases").createIndex({ plan: 1 });
    console.log("Índices de base de datos creados");
  } catch (error) {
    console.error("Error al crear índices:", error);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database no inicializada");
  }
  return db;
};

const closeDB = async () => {
  if (client) {
    await client.close();
  }
};

module.exports = { connectDB, getDB, closeDB };
