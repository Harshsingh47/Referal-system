import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

/**
 * Get next sequence number atomically
 * Ensures start from 10001 (10000 + sequence count)
 * @param {string} sequenceName 
 * @param {number} baseOffset
 * @returns {Promise<number>}
 */
counterSchema.statics.getNextSequence = async function (sequenceName, baseOffset = 10000) {
  const counter = await this.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return baseOffset + counter.seq;
};

const Counter = mongoose.model('Counter', counterSchema);
export default Counter;
