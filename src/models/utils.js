import mongoose from 'mongoose'
import autoIncrement from 'mongoose-auto-increment'

autoIncrement.initialize(mongoose.connection);

exports.autoIncrement = autoIncrement;