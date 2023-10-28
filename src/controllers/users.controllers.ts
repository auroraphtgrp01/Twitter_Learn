import { Request, Response, NextFunction } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import usersService from '~/services/users.services'
import RegisterRequestBody from '~/models/requests/User.requests'

export const loginController = (req: Request, res: Response) => {
  res.json({ message: 'Login Success' })
}
export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  try {
    const result = await usersService.register(req.body)
    return res.json({ message: 'Register Success', result })
  } catch (error) {
    return res.status(400).json({ message: 'Register Fail' + error })
  }
}
