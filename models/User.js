const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  // La app YA NO pide contraseña: el ingreso es siempre el de JPCONNECT. El
  // campo queda por los documentos históricos (no se borra nada).
  password: {
    type: String,
    required: false
  },
  role: {
    type: String,
    default: 'USUARIO'
  },
  // Permisos de PizarraIA. Conviven las DOS formas a propósito:
  //   * plana  (canCreateSessions / canAccessAdmin): la que tienen los ~1.700
  //     usuarios ya cargados en la base y la que leen las páginas del panel.
  //   * anidada (pizarraia.*): la del catálogo central de permisos del
  //     ecosistema (fscauth/lib/fsc-permisos.js), que llega desde JPCONNECT.
  // Un schema estricto que sólo declare una de las dos BORRA la otra al leer.
  permissions: {
    canCreateSessions: { type: Boolean, default: false },
    canAccessAdmin: { type: Boolean, default: false },
    pizarraia: {
      canCreateSessions: { type: Boolean, default: false },
      canAccessAdmin: { type: Boolean, default: false }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving (sólo si alguien la setea: el login es de JPCONNECT)
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Los permisos se leen SIEMPRE por acá (nunca `user.permissions.canX` a mano):
// resuelve las dos formas del schema y da booleano siempre.
userSchema.statics.permisosDe = function(user) {
  const p = (user && user.permissions) || {};
  const anidado = p.pizarraia || {};
  return {
    canCreateSessions: Boolean(anidado.canCreateSessions || p.canCreateSessions),
    canAccessAdmin: Boolean(anidado.canAccessAdmin || p.canAccessAdmin)
  };
};

module.exports = mongoose.model('User', userSchema);
