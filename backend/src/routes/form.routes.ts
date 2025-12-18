import { FastifyInstance } from 'fastify';
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { authorize } from '../middlewares/authorize';
import {
  createFormSchema,
  editFormSchema,
  listFormsSchema,
  renderFormSchema,
  submitFormSchema,
  listSubmissionsSchema,
} from '../schemas/form.schema';
import FormDefinition from '../db/models/formDefinition';
import Submission from '../db/models/submission';
import { validateSubmission, generateFieldKey } from '../utils/validator/submission.validator';
import { generateCSV } from '../utils/csvExporter';

const DOMAIN = process.env.APP_DOMAIN || 'http://localhost:4000';

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
}

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

        const formId = uuidv4();
        const slug = nanoid(10);
        const formUrl = `${DOMAIN}/forms/${slug}`;

        const form = new FormDefinition({
          formId,
          slug,
          formUrl,
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
   * PUT /api/v1/forms/:formId - Edit a form (creates new version)
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

        // Find the latest version of this form
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

        const newVersion = (existingForm.version as number) + 1;

        // Create new version document
        const newForm = new FormDefinition({
          formId: existingForm.formId,
          slug: existingForm.slug,
          formUrl: existingForm.formUrl,
          name,
          description,
          fields,
          createdBy: existingForm.createdBy,
          updatedBy: userEmail,
          version: newVersion,
        });

        await newForm.save();

        return reply.status(200).send({
          status: true,
          formId: existingForm.formId,
          version: newVersion,
          url: existingForm.formUrl,
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
   * ─────────────────────────────────────────
   */
  fastify.get(
    '/api/v1/forms',
    { preHandler: [authorize], schema: listFormsSchema },
    async (req, reply) => {
      try {
        const userEmail = req.headers['x-user-email'] as string;

        const forms = await FormDefinition.find({ createdBy: userEmail })
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

        const submission = new Submission({
          formId: form.formId,
          formVersion: form.version,
          slug: form.slug,
          data: normalizedData,
          submittedAt: new Date(),
        });

        await submission.save();

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
   * Supports filtering by date range and CSV export
   * ─────────────────────────────────────────
   */
  fastify.get<{ Params: FormParams; Querystring: SubmissionQuery }>(
    '/api/v1/forms/:formId/submissions',
    { preHandler: [authorize], schema: listSubmissionsSchema },
    async (req, reply) => {
      try {
        const { formId } = req.params;
        const { from, to, export: exportCSV } = req.query;
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

        const submissions = await Submission.find(query)
          .sort({ submittedAt: -1 })
          .lean();

        // If export is requested, return CSV file
        if (exportCSV) {
          const csvContent = generateCSV(
            form.fields as any[],
            submissions.map((s: any) => ({
              submittedAt: s.submittedAt,
              data: s.data,
            }))
          );

          return reply
            .header('Content-Type', 'text/csv')
            .header('Content-Disposition', `attachment; filename="${form.name}-submissions.csv"`)
            .send(csvContent);
        }

        return reply.status(200).send({
          status: true,
          submissions: submissions.map((s: any) => ({
            submissionId: s._id.toString(),
            formVersion: s.formVersion,
            data: s.data,
            submittedAt: s.submittedAt?.toISOString(),
          })),
          total: submissions.length,
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
