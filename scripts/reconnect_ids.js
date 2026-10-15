require('dotenv').config();
const mongoose = require('mongoose');

const APP_URI = process.env.MONGODB_URI;
const GLOBAL_URI = process.env.MONGODB_AUTH_URI;

if (!APP_URI || !GLOBAL_URI) {
  console.error('❌ MONGODB_URI o MONGODB_AUTH_URI no configurados en .env');
  process.exit(1);
}

async function reconnect() {
  try {
    console.log('--- Iniciando Reconexión de IDs de Usuario en Pizarraia ---');

    const appConn = await mongoose.createConnection(APP_URI).asPromise();
    const globalConn = await mongoose.createConnection(GLOBAL_URI).asPromise();

    console.log('[OK] Conectado a ambas bases de datos.');

    const OldUserModel = appConn.model('OldUser', new mongoose.Schema({}, { strict: false, collection: 'users' }));
    const GlobalUserModel = globalConn.model('User', new mongoose.Schema({}, { strict: false, collection: 'users' }));

    const ImageModel = appConn.model('Image', new mongoose.Schema({}, { strict: false, collection: 'images' }));
    const InteractionModel = appConn.model('Interaction', new mongoose.Schema({}, { strict: false, collection: 'interactions' }));

    const appUsers = await OldUserModel.find({});
    console.log(`[INFO] Encontrados ${appUsers.length} usuarios antiguos en Pizarraia.`);

    let count = 0;

    for (const oldU of appUsers) {
      if (!oldU.username) continue;
      
      // En Pizarraia usamos username ya que algunos podrían no tener email
      const newU = await GlobalUserModel.findOne({ username: oldU.username.toLowerCase() });
      if (!newU) {
        // console.warn(`[SKIP] No se encontró usuario global para: ${oldU.username}`);
        continue;
      }

      const oldId = oldU._id;
      const newId = newU._id;

      if (oldId.toString() === newId.toString()) continue;

      console.log(`[LINK] ${oldU.username}: ${oldId} -> ${newId}`);

      // Actualizar Imágenes
      await ImageModel.updateMany({ userId: oldId }, { $set: { userId: newId } });
      await ImageModel.updateMany({ 'likes.userId': oldId }, { $set: { 'likes.$.userId': newId } });
      await ImageModel.updateMany({ 'comments.userId': oldId }, { $set: { 'comments.$.userId': newId } });

      // Actualizar Interacciones (Analytics)
      await InteractionModel.updateMany({ userId: oldId }, { $set: { userId: newId } });

      count++;
    }

    console.log(`\n--- Reconexión finalizada: ${count} usuarios vinculados exitosamente ---`);
    process.exit(0);
  } catch (err) {
    console.error('--- ERROR DURANTE RECONEXIÓN ---', err);
    process.exit(1);
  }
}

reconnect();
