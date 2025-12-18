import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    formId: { type: String, required: true },
    formVersion: { type: Number, required: true },
    slug: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    submittedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

submissionSchema.index({ formId: 1, submittedAt: -1 });
submissionSchema.index({ slug: 1 });

export default mongoose.model('Submission', submissionSchema);

