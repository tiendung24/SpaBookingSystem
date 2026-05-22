import mongoose from 'mongoose'

const { Schema } = mongoose

export const baseOptions = {
  timestamps: false,
  strict: false,
  versionKey: false
}

export function createModel(name, collection, shape = {}) {
  const schema = new Schema(shape, { ...baseOptions, collection })
  return mongoose.models[name] || mongoose.model(name, schema)
}

