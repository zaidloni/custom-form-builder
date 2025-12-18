import { FastifyRequest, FastifyReply } from 'fastify'
import { isValidEmail } from '../utils/validator'

export async function authorize(request: FastifyRequest, reply: FastifyReply) {
  const userEmail = request.headers['x-user-email']
  if (!userEmail || typeof userEmail !== 'string' || !isValidEmail(userEmail).success) {
    return reply.status(401).send({ status: false, error: 'Unauthorized' })
  }
}
