const mongoose = require('mongoose');
const User = require('../models/User');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/pizarraia', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createMasterUser() {
  try {
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ username: 'j' });
    
    if (existingUser) {
      console.log('El usuario maestro "j" ya existe.');
      
      // Actualizar permisos si no los tiene
      if (!existingUser.permissions || !existingUser.permissions.canCreateSessions || !existingUser.permissions.canAccessAdmin) {
        existingUser.permissions = {
          canCreateSessions: true,
          canAccessAdmin: true
        };
        await existingUser.save();
        console.log('Permisos del usuario maestro actualizados.');
      }
    } else {
      // Crear nuevo usuario maestro
      const masterUser = new User({
        username: 'j',
        password: 'j',
        permissions: {
          canCreateSessions: true,
          canAccessAdmin: true
        }
      });
      
      await masterUser.save();
      console.log('Usuario maestro "j" creado exitosamente con todos los permisos.');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error creando usuario maestro:', error);
    mongoose.connection.close();
  }
}

createMasterUser();