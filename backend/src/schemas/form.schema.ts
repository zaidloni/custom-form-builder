// Common error response schemas
const errorResponses = {
    400: {
        type: 'object',
        required: ['statusCode', 'message'],
        properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
        },
    },
    404: {
        type: 'object',
        required: ['status', 'error'],
        properties: {
            status: { type: 'boolean', const: false },
            error: { type: 'string' },
        },
    },
    500: {
        type: 'object',
        required: ['statusCode', 'message'],
        properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
        },
    },
};

// Field definition schema (reusable)
const fieldSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['label', 'required', 'fieldType', 'position'],
    properties: {
        label: { type: 'string', minLength: 1, maxLength: 255 },
        required: { type: 'boolean' },
        placeholder: { type: 'string', minLength: 1, maxLength: 255 },
        helpText: { type: 'string', minLength: 1, maxLength: 255 },
        position: { type: 'string', pattern: '^[A-Z][1-4]$' }, // Grid position: A1-Z4
        fieldType: {
            type: 'string',
            enum: [
                'single-line-text',
                'textarea',
                'number',
                'email',
                'dropdown',
                'checkbox',
                'date',
            ],
        },
        validation: {
            type: 'object',
            additionalProperties: false,
            properties: {
                minLength: { type: 'number', minimum: 0 },
                maxLength: { type: 'number', minimum: 1 },
                min: { type: 'number' },
                max: { type: 'number' },
                emailPolicy: {
                    type: 'string',
                    enum: ['any', 'allowed-domains'],
                },
                allowedDomains: {
                    type: 'array',
                    minItems: 1,
                    items: { type: 'string', minLength: 1 },
                },
                regex: { type: 'string' },
            },
        },
    },
    allOf: [
        // TEXT / TEXTAREA validation
        {
            if: {
                properties: {
                    fieldType: { enum: ['single-line-text', 'textarea'] },
                },
                required: ['fieldType'],
            },
            then: {
                required: ['validation'],
                properties: {
                    validation: {
                        type: 'object',
                        required: ['minLength', 'maxLength'],
                        not: {
                            anyOf: [
                                {
                                    type: 'object',
                                    required: ['emailPolicy', 'allowedDomains', 'regex', 'min', 'max'],
                                },
                            ],
                        },
                    },
                },
            },
        },
        // NUMBER validation
        {
            if: {
                properties: {
                    fieldType: { const: 'number' },
                },
                required: ['fieldType'],
            },
            then: {
                required: ['validation'],
                properties: {
                    validation: {
                        type: 'object',
                        required: ['min', 'max'],
                        not: {
                            anyOf: [
                                {
                                    type: 'object',
                                    required: ['minLength', 'maxLength', 'emailPolicy', 'allowedDomains', 'regex'],
                                },
                            ],
                        },
                    },
                },
            },
        },
        // EMAIL validation
        {
            if: {
                properties: {
                    fieldType: { const: 'email' },
                },
                required: ['fieldType'],
            },
            then: {
                required: ['validation'],
                properties: {
                    validation: {
                        type: 'object',
                        required: ['emailPolicy'],
                        not: {
                            anyOf: [
                                {
                                    type: 'object',
                                    required: ['minLength', 'maxLength', 'regex'],
                                },
                            ],
                        },
                    },
                },
                allOf: [
                    {
                        if: {
                            properties: {
                                validation: {
                                    type: 'object',
                                    properties: {
                                        emailPolicy: { const: 'allowed-domains' },
                                    },
                                },
                            },
                        },
                        then: {
                            properties: {
                                validation: {
                                    type: 'object',
                                    required: ['allowedDomains'],
                                },
                            },
                        },
                    },
                ],
            },
        },
    ],
};

// Create form schema
export const createFormSchema = {
    body: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'fields'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', minLength: 1, maxLength: 255 },
            fields: {
                type: 'array',
                minItems: 1,
                items: fieldSchema,
            },
        },
    },
    response: {
        201: {
            type: 'object',
            required: ['status', 'formId', 'version', 'url'],
            properties: {
                status: { type: 'boolean', const: true },
                formId: { type: 'string' },
                version: { type: 'number' },
                url: { type: 'string' },
            },
        },
        ...errorResponses,
    },
};

// Edit form schema
export const editFormSchema = {
    params: {
        type: 'object',
        required: ['formId'],
        properties: {
            formId: { type: 'string', minLength: 1 },
        },
    },
    body: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'description', 'fields'],
        properties: {
            name: { type: 'string', minLength: 1, maxLength: 255 },
            description: { type: 'string', minLength: 1, maxLength: 255 },
            fields: {
                type: 'array',
                minItems: 1,
                items: fieldSchema,
            },
        },
    },
    response: {
        200: {
            type: 'object',
            required: ['status', 'formId', 'version', 'url'],
            properties: {
                status: { type: 'boolean', const: true },
                formId: { type: 'string' },
                version: { type: 'number' },
                url: { type: 'string' },
            },
        },
        ...errorResponses,
    },
};

// List forms schema
export const listFormsSchema = {
    querystring: {
        type: 'object',
        properties: {
            formUrl: { type: 'string' }, // Search by form URL (converted to hash for lookup)
        },
    },
    response: {
        200: {
            type: 'object',
            required: ['status', 'forms'],
            properties: {
                status: { type: 'boolean', const: true },
                forms: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            formId: { type: 'string' },
                            slug: { type: 'string' },
                            name: { type: 'string' },
                            description: { type: 'string' },
                            version: { type: 'number' },
                            formUrl: { type: 'string' },
                            createdAt: { type: 'string' },
                            updatedAt: { type: 'string' },
                        },
                    },
                },
            },
        },
        ...errorResponses,
    },
};

// Render form schema (public)
export const renderFormSchema = {
    params: {
        type: 'object',
        required: ['slug'],
        properties: {
            slug: { type: 'string', minLength: 1 },
        },
    },
    response: {
        200: {
            type: 'object',
            required: ['status', 'form'],
            properties: {
                status: { type: 'boolean', const: true },
                form: {
                    type: 'object',
                    properties: {
                        formId: { type: 'string' },
                        slug: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        fields: { type: 'array' },
                        version: { type: 'number' },
                    },
                },
            },
        },
        ...errorResponses,
    },
};

// Submit form schema (public)
export const submitFormSchema = {
    params: {
        type: 'object',
        required: ['slug'],
        properties: {
            slug: { type: 'string', minLength: 1 },
        },
    },
    body: {
        type: 'object',
        additionalProperties: true, // Allow dynamic fields
    },
    response: {
        201: {
            type: 'object',
            required: ['status', 'submissionId'],
            properties: {
                status: { type: 'boolean', const: true },
                submissionId: { type: 'string' },
                message: { type: 'string' },
            },
        },
        ...errorResponses,
    },
};

// List submissions schema
export const listSubmissionsSchema = {
    params: {
        type: 'object',
        required: ['formId'],
        properties: {
            formId: { type: 'string', minLength: 1 },
        },
    },
    querystring: {
        type: 'object',
        properties: {
            from: { type: 'string' }, // ISO date string
            to: { type: 'string' },   // ISO date string
            export: { type: 'boolean' },
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
        },
    },
    response: {
        200: {
            type: 'object',
            required: ['status', 'submissions'],
            properties: {
                status: { type: 'boolean', const: true },
                submissions: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            submissionId: { type: 'string' },
                            formVersion: { type: 'number' },
                            data: { type: 'object', additionalProperties: true },
                            submittedAt: { type: 'string' },
                        },
                    },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
                totalPages: { type: 'number' },
            },
        },
        ...errorResponses,
    },
};

// Generate form schema (AI-powered)
export const generateFormSchema = {
    body: {
        type: 'object',
        additionalProperties: false,
        required: ['prompt'],
        properties: {
            prompt: { type: 'string', minLength: 10, maxLength: 1000 },
        },
    },
    response: {
        201: {
            type: 'object',
            required: ['status', 'formId', 'version', 'url', 'name'],
            properties: {
                status: { type: 'boolean', const: true },
                formId: { type: 'string' },
                version: { type: 'number' },
                url: { type: 'string' },
                name: { type: 'string' },
            },
        },
        ...errorResponses,
    },
};

// Keep backward compatibility with old name
export const formSchema = createFormSchema;
