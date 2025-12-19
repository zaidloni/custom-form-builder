import mongoose from 'mongoose';

const formDefinitionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true }, // UUID - same across all versions
    slug: { type: String, required: true },   // nanoid - unique, used in URL
    formUrl: { type: String, required: true }, // Full public URL
    urlHash: { type: String, required: true }, // SHA-256 hash of formUrl for fast lookups
    name: { type: String, required: true },
    description: { type: String, required: true },
    fields: { type: Array, required: true },
    createdBy: { type: String, required: true },
    updatedBy: { type: String, required: true },
    version: { type: Number, required: true, default: 1 },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

formDefinitionSchema.index({ formId: 1, version: -1 });
formDefinitionSchema.index({ slug: 1, version: -1 });
formDefinitionSchema.index({ createdBy: 1 });
formDefinitionSchema.index({ urlHash: 1 }); // Fast lookup by URL hash

export default mongoose.model('FormDefinition', formDefinitionSchema);
