import { Server } from 'socket.io'
import { UserVerifyStatus } from '~/constants/enums'
import { ErrorWithStatus } from '~/models/Errors'
import { verifyAccessToken } from './commons'
import { TokenPayload } from '~/models/requests/User.requests'
import { USER_MESSAGES } from '~/constants/messages'
import HTTP_STATUS from '~/constants/httpStatus'
import Conversation from '~/models/schemas/Conversation.schemas'
import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'
import { Server as ServerHTTP } from 'http'
const initSocket = (httpServer: ServerHTTP) => {
  const io = new Server(httpServer, {
    cors: {
      origin: 'http://localhost:3000'
    }
  })
  const users: {
    [key: string]: {
      socket_id: string
    }
  } = {}
  io.use(async (socket, next) => {
    const { Authorization } = socket.handshake.auth
    const access_token = Authorization?.split(' ')[1]
    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      const { verify } = decoded_authorization as TokenPayload
      if (verify !== UserVerifyStatus.Verified) {
        throw new ErrorWithStatus({
          message: USER_MESSAGES.USER_NOT_VERIFIED,
          status: HTTP_STATUS.FORBIDDEN
        })
      }
      socket.handshake.auth.decoded_authorization = decoded_authorization as TokenPayload
      socket.handshake.auth.access_token = access_token
      next()
    } catch (error) {
      next({
        message: 'Unauthorized',
        name: 'UnauthorizedError',
        data: error
      })
    }
  })
  io.on('connection', (socket) => {
    console.log(`${socket.id} connected`)
    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = {
      socket_id: socket.id
    }
    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })
    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`${socket.id} disconnected`)
    })
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })
    socket.on('private_message', async (data) => {
      const { receiver_id, sender_id, content } = data.payload
      const receive_socket_id = users[receiver_id]?.socket_id
      const conversation = new Conversation({
        sender_id: new ObjectId(sender_id),
        receiver_id: new ObjectId(receiver_id),
        content: content
      })
      const result = await databaseService.conversation.insertOne(conversation)
      conversation._id = result.insertedId
      socket.to(receive_socket_id).emit('private_message_rec', {
        payload: conversation
      })
    })
  })
}

export default initSocket
