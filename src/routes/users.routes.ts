import { Router } from 'express'
import {
  verifyEmailController,
  loginController,
  logoutController,
  registerController,
  deleteDBController,
  resendVerifyEmailController,
  forgotPasswordController,
  verifyForgotPasswordToken,
  resetPasswordController,
  getMe,
  updateMeController,
  followController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  emailVerifyToken,
  forgotPasswordValidator,
  verifyForgotPasswordTokenValidator,
  resetPasswordValidator,
  verifiedUserValidator,
  updateMeValidator,
  followValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeRequestBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'
const usersRoutes = Router()

/**
 * Description. Login a new user
 * Path: /login
 * Method: POST
 * Body: {  email: string,  password: string}
 */
usersRoutes.post('/login', loginValidator, wrapRequestHandler(loginController))
/**
 * Description. Register a new user
 * Path: /register
 * Method: POST
 * Body: {
 * name: string,
 * email: string,
 * password: string,
 * confirm_password: string,
 * date_of_birth: ISO8601
 * }
 */
usersRoutes.post('/register', registerValidator, wrapRequestHandler(registerController))
/**
 * Description. Logout a new user
 * Path: /logout
 * Method: POST
 * Header: {Authorization: Bearer <access_token>}
 * Body: {Refresh Token: string}
 */
usersRoutes.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
/**
 * Description. Verify Email
 * Path: /verify-email
 * Method: POST
 * Body: {email-verification-token: string}
 */
usersRoutes.post('/verify-email', emailVerifyToken, wrapRequestHandler(verifyEmailController))
/**
 * Description. Verify Email
 * Path: /resend-verify-email
 * Method: POST
 * Header {Authorization: Bearer <access_token>}
 * Body: {}
 */
usersRoutes.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))
/**
 * Description. Forgot Password
 * Path: /forgot-password
 * Method: POST
 * Header {}
 * Body: {email: string}
 */
usersRoutes.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
/**
 * Description. Verify link forgot password
 * Path: /verify-forgot-password
 * Method: POST
 * Body: {email: string}
 */
usersRoutes.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordToken)
)
/**
 * Description. Reset Password
 * Path: /reset-password
 * Method: POST
 * Body: {email: string}
 */
usersRoutes.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))
/**
 * Description. Get My Profile
 * Path: /me
 * Header {Authorization: Bearer <access_token>}
 * Method: GET
 */
usersRoutes.get('/me', accessTokenValidator, wrapRequestHandler(getMe))
/**
 * Description. Update My Profile
 * Path: /me
 * Method: PATCH
 * Header {Authorization: Bearer <access_token>}
 * Body: {
 *  'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'}
 */
usersRoutes.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeRequestBody>([
    'name',
    'date_of_birth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)
/**
 * Description. Follow Someone
 * Path: /follow
 * Method: POST
 * Header {Authorization: Bearer <access_token>}
 * Body: {followed_user_id: string}
 */
usersRoutes.post(
  '/follow',
  accessTokenValidator,
  verifiedUserValidator,
  followValidator,
  wrapRequestHandler(followController)
)

usersRoutes.get('/delete-db', deleteDBController)

export default usersRoutes
