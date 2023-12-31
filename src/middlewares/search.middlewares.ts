import { checkSchema } from 'express-validator'
import { MediaQueryType, PeopleFollow } from '~/constants/enums'
import { SEARCH_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const searchValidator = validate(
  checkSchema({
    content: {
      isString: {
        errorMessage: SEARCH_MESSAGES.CONTENT_MUST_BE_A_STRING
      }
    },
    media_type: {
      optional: true,
      isIn: {
        options: [Object.values(MediaQueryType)]
      },
      errorMessage: SEARCH_MESSAGES.INVALID_MEDIA_TYPE
    },
    people_follow: {
      optional: true,
      isIn: {
        options: [Object.values(PeopleFollow)],
        errorMessage: SEARCH_MESSAGES.INVALID_PEOPLE_FOLLOW
      }
    }
  })
)
