
const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    semester: { type: Number, min: 1, max: 8, required: true },
    description: { type: String, default: '' },
    topics: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

subjectSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);