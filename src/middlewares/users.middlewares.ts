/* eslint-disable prettier/prettier */
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import HTTP_STATUS from '~/constants/httpStatus'
import { USER_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import usersService from '~/services/users.services'
import { hashPassword } from '~/utils/crypto'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
export const loginValidator = validate(
  checkSchema({
    email: {
      trim: true,
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value, { req }) => {
          const user = await databaseService.users.findOne({
            email: value,
            password: hashPassword(req.body.password)
          })
          if (user === null) {
            throw new Error(USER_MESSAGES.EMAIL_OR_PASSWORD_IS_INVALID)
          }
          req.user = user
          return true
        }
      }
    },
    password: {
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    }
  }, ['body'])
)

export const registerValidator = validate(
  checkSchema({
    name: {
      isString: {
        errorMessage: USER_MESSAGES.NAME_MUST_BE_A_STRING
      },
      notEmpty: {
        errorMessage: USER_MESSAGES.NAME_IS_REQUIRED
      },
      trim: true,
      isLength: {
        options: {
          min: 1,
          max: 100
        },
        errorMessage: USER_MESSAGES.NAME_LENGTH_MUST_BE_FROM_1_TO_100
      }
    },
    email: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_IS_REQUIRED
      },
      trim: true,
      isEmail: {
        errorMessage: USER_MESSAGES.EMAIL_IS_INVALID
      },
      custom: {
        options: async (value) => {
          const isExitsEmail = await usersService.checkEmailExits(value)
          if (isExitsEmail) {
            throw new Error(USER_MESSAGES.EMAIL_ALREADY_EXISTS)
          }
          return true
        }
      }
    },
    password: {
      notEmpty: {
        errorMessage: USER_MESSAGES.PASSWORD_IS_REQUIRED
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        errorMessage: USER_MESSAGES.PASSWORD_MUST_BE_STRONG,
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        }
      }
    },
    confirm_password: {
      errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG,
      notEmpty: {
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED
      },
      isLength: {
        options: {
          min: 6,
          max: 50
        },
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50
      },
      isStrongPassword: {
        options: {
          minLength: 6,
          minLowercase: 1,
          minUppercase: 1,
          minNumbers: 1,
          minSymbols: 1
        },
        errorMessage: USER_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
      },
      custom: {
        options: (value, { req }) => {
          if (value !== req.body.password) {
            throw new Error(USER_MESSAGES.PASSWORDS_DO_NOT_MATCH)
          } else {
            return true
          }
        }
      }
    },
    date_of_birth: {
      isISO8601: {
        options: {
          strict: true,
          strictSeparator: true
        },
        errorMessage: USER_MESSAGES.DATE_OF_BIRTH_IS_ISO8601
      }
    }
  }, ['body'])
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      authorization: {
        notEmpty: {
          errorMessage: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED
        },
        custom: {
          options: async (value: string, { req }) => {
            const access_token = value.split(' ')[1]
            if (!access_token) {
              throw new ErrorWithStatus({
                message: USER_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }
            try {
              const decoded_authorization = await verifyToken({ token: access_token, secretOnPublicKey: process.env.JWT_ACCESS_TOKEN_SECRET });
              req.decoded_authorization = decoded_authorization
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: USER_MESSAGES.ACCESS_TOKEN_IS_IN_INVAILD,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              } throw error
            }
            return true
          }
        }
      }
    }, ['headers']))


export const refreshTokenValidator = validate(
  checkSchema({
    refresh_token: {
      notEmpty: {
        errorMessage: USER_MESSAGES.REFRESH_TOKEN_IS_REQUIRED
      },
      isString: {
        errorMessage: USER_MESSAGES.REFRESH_TOKEN_MUST_A_STRING
      },
      custom: {
        options: async (value, { req }) => {
          try {
            const [decoded_refresh_token, refresh_token] = await Promise.all([
              verifyToken({ token: value, secretOnPublicKey: process.env.JWT_REFRESH_TOKEN_SECRET }),
              databaseService.refreshTokens.findOne({ token: value })
            ])
            if (refresh_token === null) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.REFRESH_TOKEN_NOT_EXITS, status: HTTP_STATUS.UNAUTHORIZED })
            }
            req.decoded_refresh_token = decoded_refresh_token
          } catch (error) {
            if (error instanceof JsonWebTokenError) {
              throw new ErrorWithStatus({ message: USER_MESSAGES.REFRESH_TOKEN_INVALID, status: HTTP_STATUS.UNAUTHORIZED })
            }
            throw error
          }
        }
      }
    }
  }, ['body']))

export const emailVerifyToken = validate(
  checkSchema({
    email_verify_token: {
      notEmpty: {
        errorMessage: USER_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED
      },
      custom: {
        options: async (value, { req }) => {
          const decoded_email_verify_token = await verifyToken({ token: value, secretOnPublicKey: process.env.JWT_EMAIL_VERIFY_TOKEN_SECRET })
          req.decoded_email_verify_token = decoded_email_verify_token
        }
      }
    }
  }, ['body']))