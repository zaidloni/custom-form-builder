import { FastifyInstance } from 'fastify'
import { formRoutes } from './form.routes'

export async function registerRoutes(app: FastifyInstance) {
  app.get('/', async (request, reply) => {
    return reply.status(200).send({
      status: true,
      message: 'Welcome to the Form Builder API',
    })
  })
  await formRoutes(app)
}
