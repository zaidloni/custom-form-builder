import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';
import { authorize } from '../middlewares/authorize';
import {
  createFormSchema,
  editFormSchema,
  listFormsSchema,
  renderFormSchema,
  submitFormSchema,
  listSubmissionsSchema,
  generateFormSchema,
} from '../schemas/form.schema';
import FormDefinition from '../db/models/formDefinition';
import Submission from '../db/models/submission';
import { validateSubmission, generateFieldKey } from '../utils/validator/submission.validator';
import { validateFieldPositions } from '../utils/validator/position.validator';
import { generateUrlHash } from '../utils/urlHash';
import { generateCSV } from '../utils/csvExporter';

const DOMAIN = process.env.APP_DOMAIN || 'http://localhost:5173';
interface FormBody {
  name: string;
  description: string;
  fields: any[];
}

interface FormParams {
  formId: string;
}

interface SlugParams {
  slug: string;
}

interface SubmissionQuery {
  from?: string;
  to?: string;
  export?: boolean;
  page?: number;
  limit?: number;
}

interface GenerateFormBody {
  prompt: string;
}

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// Optimized prompt template for form generation
const FORM_GENERATION_PROMPT = `Generate a JSON form definition. Rules:
- Fields: single-line-text, textarea, number, email, dropdown, checkbox, date
- Position format: Row(A-Z) + Column(1-4), e.g., A1, A2, B1
- Rows must be contiguous starting from A
- Columns per row must start at 1 and be contiguous
- Maximum 4 columns per row

Return ONLY valid JSON (no markdown, no code blocks):
{
  "name": "Form Name",
  "description": "Brief description",
  "fields": [
    {
      "label": "Field Label",
      "fieldType": "single-line-text",
      "required": true,
      "position": "A1",
      "placeholder": "optional placeholder",
      "helpText": "optional help text",
      "validation": { "minLength": 1, "maxLength": 100 }
    }
  ]
}

Validation rules by type:
- single-line-text/textarea: { "minLength": number, "maxLength": number }
- number: { "min": number, "max": number }
- email: { "emailPolicy": "any" }
- dropdown: add "options": ["opt1", "opt2"] array to field
- checkbox/date: no validation needed

User request: `;

export async function formRoutes(fastify: FastifyInstance) {
  /**
   * ─────────────────────────────────────────
   * POST /api/v1/forms - Create a new form
   * ─────────────────────────────────────────
   */
  fastify.post<{ Body: FormBody }>(
    '/api/v1/forms',
    { preHandler: [authorize], schema: createFormSchema },
    async (req, reply) => {
      try {
        const { name, description, fields } = req.body;
        const userEmail = req.headers['x-user-email'] as string;

        // Validate field positions (uniqueness and contiguity)
        const positionValidation = validateFieldPositions(fields);
        if (!positionValidation.valid) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Position Validation Error',
            message: positionValidation.errors.join(', '),
          });
        }

        const formId = uuidv4();
        const slug = nanoid(10);
        const formUrl = `${DOMAIN}/forms/${slug}`;
        const urlHash = generateUrlHash(formUrl);

        const form = new FormDefinition({
          formId,
          slug,
          formUrl,
          urlHash,
          name,
          description,
          fields,
          createdBy: userEmail,
          updatedBy: userEmail,
          version: 1,
        });

        await form.save();

        return reply.status(201).send({
          status: true,
          formId,
          version: 1,
          url: formUrl,
        });
      } catch (err) {
        console.error('Create form API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to create form',
        });
      }
    }
  );

  /**
   * ─────────────────────────────────────────
   * POST /api/v1/forms/generate - Generate form using AI
   * ─────────────────────────────────────────
   */

    fastify.post<{ Body: GenerateFormBody }>(
      '/api/v1/forms/generate',
      {
        preHandler: [authorize],
        schema: generateFormSchema,
      },
      async (req, reply) => {
        try {
          const { prompt } = req.body;
          const userEmail = req.headers['x-user-email'] as string;
  
          if (!process.env.GEMINI_API_KEY) {
            return reply.status(500).send({
              statusCode: 500,
              error: 'Configuration Error',
              message: 'Gemini API key is not configured',
            });
          }
  
          // ✅ Using new @google/genai API with gemini-2.5-flash
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: FORM_GENERATION_PROMPT + '\n' + prompt,
            config: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          });
  
          const text = response.text ?? '';
  
          let formData: {
            name: string;
            description: string;
            fields: any[];
          };
  
          try {
            formData = JSON.parse(text);
          } catch (err) {
            console.error('Invalid JSON from Gemini:', text);
            return reply.status(500).send({
              statusCode: 500,
              error: 'AI Response Error',
              message: 'Failed to parse AI-generated form JSON',
            });
          }
  
          // ✅ Validate structure
          if (
            !formData.name ||
            !formData.description ||
            !Array.isArray(formData.fields) ||
            formData.fields.length === 0
          ) {
            return reply.status(500).send({
              statusCode: 500,
              error: 'AI Response Error',
              message: 'AI generated an incomplete form structure',
            });
          }
  
          const positionValidation = validateFieldPositions(formData.fields);
          if (!positionValidation.valid) {
            return reply.status(400).send({
              statusCode: 400,
              error: 'Position Validation Error',
              message: positionValidation.errors.join(', '),
            });
          }
  
          // ✅ Create form
          const formId = uuidv4();
          const slug = nanoid(10);
          const formUrl = `${DOMAIN}/forms/${slug}`;
          const urlHash = generateUrlHash(formUrl);
  
          const form = new FormDefinition({
            formId,
            slug,
            formUrl,
            urlHash,
            name: formData.name,
            description: formData.description,
            fields: formData.fields,
            createdBy: userEmail,
            updatedBy: userEmail,
            version: 1,
          });
  
          await form.save();
  
          return reply.status(201).send({
            status: true,
            formId,
            version: 1,
            url: formUrl,
            name: formData.name,
          });
        } catch (err: any) {
          console.error('Generate form API Error:', err);
  
          if (err.message?.includes('API key')) {
            return reply.status(502).send({
              statusCode: 502,
              error: 'Bad Gateway',
              message: 'Failed to connect to AI service',
            });
          }
  
          return reply.status(500).send({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'Failed to generate form',
          });
        }
      }
    );

  /**
   * ─────────────────────────────────────────
   * PUT /api/v1/forms/:formId - Edit a form (creates completely new form)
   * ─────────────────────────────────────────
   */
  fastify.put<{ Params: FormParams; Body: FormBody }>(
    '/api/v1/forms/:formId',
    { preHandler: [authorize], schema: editFormSchema },
    async (req, reply) => {
      try {
        const { formId } = req.params;
        const { name, description, fields } = req.body;
        const userEmail = req.headers['x-user-email'] as string;

        // Validate field positions (uniqueness and contiguity)
        const positionValidation = validateFieldPositions(fields);
        if (!positionValidation.valid) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Position Validation Error',
            message: positionValidation.errors.join(', '),
          });
        }

        // Find the existing form to verify ownership
        const existingForm = await FormDefinition.findOne({ formId })
          .sort({ version: -1 })
          .lean();

        if (!existingForm) {
          return reply.status(404).send({
            status: false,
            error: 'Form not found',
          });
        }

        // Check if user owns the form
        if (existingForm.createdBy !== userEmail) {
          return reply.status(403).send({
            status: false,
            error: 'You do not have permission to edit this form',
          });
        }

        // Generate versioned name from original form name
        // Pattern: "FormName-N" where N is the version number
        const originalName = existingForm.name as string;
        const versionMatch = originalName.match(/^(.+)-(\d+)$/);
        let versionedName: string;
        let newVersion: number;
        
        if (versionMatch) {
          // Already has version suffix, increment it
          const baseName = versionMatch[1];
          const currentVersion = parseInt(versionMatch[2], 10);
          newVersion = currentVersion + 1;
          versionedName = `${baseName}-${newVersion}`;
        } else {
          // No version suffix, this is version 1, new form is version 2
          newVersion = 2;
          versionedName = `${originalName}-${newVersion}`;
        }

        // Create a completely new form with new identifiers
        const newFormId = uuidv4();
        const newSlug = nanoid(10);
        const newFormUrl = `${DOMAIN}/forms/${newSlug}`;
        const newUrlHash = generateUrlHash(newFormUrl);

        const newForm = new FormDefinition({
          formId: newFormId,
          slug: newSlug,
          formUrl: newFormUrl,
          urlHash: newUrlHash,
          name: versionedName,
          description,
          fields,
          createdBy: userEmail,
          updatedBy: userEmail,
          version: 1,
        });

        await newForm.save();

        return reply.status(200).send({
          status: true,
          formId: newFormId,
          version: 1,
          url: newFormUrl,
        });
      } catch (err) {
        console.error('Edit form API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to edit form',
        });
      }
    }
  );

  /**
   * ─────────────────────────────────────────
   * GET /api/v1/forms - List all forms for user
   * (each version is listed separately)
   * Supports filtering by formUrl using urlHash index
   * ─────────────────────────────────────────
   */
  fastify.get<{ Querystring: { formUrl?: string } }>(
    '/api/v1/forms',
    { preHandler: [authorize], schema: listFormsSchema },
    async (req, reply) => {
      try {
        const userEmail = req.headers['x-user-email'] as string;
        const { formUrl } = req.query;

        // Build query with user filter and optional urlHash filter
        const query: any = { createdBy: userEmail };
        if (formUrl) {
          const urlHash = generateUrlHash(formUrl);
          query.urlHash = urlHash;
        }

        const forms = await FormDefinition.find(query)
          .sort({ formId: 1, version: -1 })
          .select('formId slug name description version formUrl createdAt updatedAt')
          .lean();

        return reply.status(200).send({
          status: true,
          forms: forms.map((form: any) => ({
            formId: form.formId,
            slug: form.slug,
            name: form.name,
            description: form.description,
            version: form.version,
            formUrl: form.formUrl,
            createdAt: form.createdAt?.toISOString(),
            updatedAt: form.updatedAt?.toISOString(),
          })),
        });
      } catch (err) {
        console.error('List forms API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list forms',
        });
      }
    }
  );

  /**
   * ─────────────────────────────────────────
   * GET /forms/:slug - Render form (public, no auth)
   * ─────────────────────────────────────────
   */
  fastify.get<{ Params: SlugParams }>(
    '/forms/:slug',
    { schema: renderFormSchema },
    async (req, reply) => {
      try {
        const { slug } = req.params;

        // Get the latest version of the form
        const form = await FormDefinition.findOne({ slug })
          .sort({ version: -1 })
          .select('formId slug name description fields version')
          .lean();

        if (!form) {
          return reply.status(404).send({
            status: false,
            error: 'Form not found',
          });
        }

        return reply.status(200).send({
          status: true,
          form: {
            formId: form.formId,
            slug: form.slug,
            name: form.name,
            description: form.description,
            fields: form.fields,
            version: form.version,
          },
        });
      } catch (err) {
        console.error('Render form API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to render form',
        });
      }
    }
  );

  /**
   * ─────────────────────────────────────────
   * POST /forms/:slug/submit - Submit form data (public, no auth)
   * ─────────────────────────────────────────
   */
  fastify.post<{ Params: SlugParams; Body: Record<string, any> }>(
    '/forms/:slug/submit',
    { schema: submitFormSchema },
    async (req, reply) => {
      try {
        const { slug } = req.params;
        const submissionData = req.body;

        // Get the latest version of the form
        const form = await FormDefinition.findOne({ slug })
          .sort({ version: -1 })
          .lean();

        if (!form) {
          return reply.status(404).send({
            status: false,
            error: 'Form not found',
          });
        }

        console.log('[BE] Received submission data:', JSON.stringify(submissionData));
        console.log('[BE] Form fields:', (form.fields as any[]).map((f: any) => ({ label: f.label, key: generateFieldKey(f.label) })));

        // Validate submission against form field definitions
        const validationResult = validateSubmission(form.fields as any[], submissionData);

        if (!validationResult.valid) {
          return reply.status(400).send({
            statusCode: 400,
            error: 'Validation Error',
            message: validationResult.errors.join(', '),
          });
        }

        // Normalize data keys to match field labels
        const normalizedData: Record<string, any> = {};
        for (const field of form.fields as any[]) {
          const fieldKey = generateFieldKey(field.label);
          if (submissionData[fieldKey] !== undefined) {
            normalizedData[fieldKey] = submissionData[fieldKey];
          }
        }

        console.log('[BE] Normalized data to save:', JSON.stringify(normalizedData));

        const submission = new Submission({
          formId: form.formId,
          formVersion: form.version,
          slug: form.slug,
          data: normalizedData,
          submittedAt: new Date(),
        });

        await submission.save();
        console.log('[BE] Submission saved successfully with data:', JSON.stringify(submission.data));

        return reply.status(201).send({
          status: true,
          submissionId: submission._id.toString(),
          message: 'Form submitted successfully',
        });
      } catch (err) {
        console.error('Submit form API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to submit form',
        });
      }
    }
  );

  /**
   * ─────────────────────────────────────────
   * GET /api/v1/forms/:formId/submissions - List submissions
   * Supports filtering by date range, pagination, and CSV export
   * ─────────────────────────────────────────
   */
  fastify.get<{ Params: FormParams; Querystring: SubmissionQuery }>(
    '/api/v1/forms/:formId/submissions',
    { preHandler: [authorize], schema: listSubmissionsSchema },
    async (req, reply) => {
      try {
        const { formId } = req.params;
        const { from, to, export: exportCSV, page = 1, limit = 50 } = req.query;
        const userEmail = req.headers['x-user-email'] as string;

        // Verify form exists and user owns it
        const form = await FormDefinition.findOne({ formId })
          .sort({ version: -1 })
          .lean();

        if (!form) {
          return reply.status(404).send({
            status: false,
            error: 'Form not found',
          });
        }

        if (form.createdBy !== userEmail) {
          return reply.status(403).send({
            status: false,
            error: 'You do not have permission to view these submissions',
          });
        }

        // Build query with date filters
        const query: any = { formId };

        if (from || to) {
          query.submittedAt = {};
          if (from) {
            query.submittedAt.$gte = new Date(from);
          }
          if (to) {
            query.submittedAt.$lte = new Date(to);
          }
        }

        // If export is requested, return all submissions as CSV (no pagination)
        if (exportCSV) {
          const allSubmissions = await Submission.find(query)
            .sort({ submittedAt: -1 })
            .lean();

          const csvContent = generateCSV(
            form.fields as any[],
            allSubmissions.map((s: any) => ({
              submittedAt: s.submittedAt,
              data: s.data,
            }))
          );

          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${form.name}-submissions.csv"`)
            .send(csvContent);
        }

        // Get total count for pagination
        const total = await Submission.countDocuments(query);
        const totalPages = Math.ceil(total / limit);
        const skip = (page - 1) * limit;

        // Fetch paginated submissions
        const submissions = await Submission.find(query)
          .sort({ submittedAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();

        return reply.status(200).send({
          status: true,
          submissions: submissions.map((s: any) => ({
            submissionId: s._id.toString(),
            formVersion: s.formVersion,
            data: s.data,
            submittedAt: s.submittedAt?.toISOString(),
          })),
          total,
          page,
          limit,
          totalPages,
        });
      } catch (err) {
        console.error('List submissions API Error:', err);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to list submissions',
        });
      }
    }
  );
}
