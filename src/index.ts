import xss from 'xss';
import path from 'path'
import cors from 'cors'
import helmet from "helmet"
import { body, ValidationError, validationResult, query } from "express-validator";
import express, { json, Request, Response, urlencoded } from "express"

import { customDateValidation, getFormattedDate } from './utils'
import { CreatedExerciseResponse, User, UserExerciseLog } from "@/interfaces"
import { init, getUser, insertUsers, getAllUsers, insertExercise, getUserExercises } from './database'

const app = express()

init()

app.use(cors())
app.use(json())
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.freecodecamp.org"],
    },
  },
}))
app.use(urlencoded())
app.use(express.static('public'))

async function handleUserFetch(userId: number): Promise<User | { error: string, status: number }> {
  if (userId) {
    try {
      const user = await getUser("id", userId)

      if (!user) {
        return { error: 'No user with provided id found', status: 404 }
      }

      return user
    } catch (err) {
      return { error: 'Error during user fetching', status: 500 }
    }
  } else {
    return { error: 'No userId provided', status: 400 }
  }
}

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname + '/views/index.html'))
});

app.post('/api/users', [
  body('username').isString().isLength({ min: 1 }).withMessage('Username cannot be empty')
], async (
  req: Request<{}, {}, { username: string }>,
  res: Response<{ error: string } | { errors: ValidationError[] } | User>) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array().map(({ msg }) => msg) });
    return
  }

  const username = xss(req.body.username)

  try {
    const user = await getUser("username", username)

    if (user) {
      res.status(409).json({
        error: 'User already exists with the same username',
      });

      return
    }

  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ error: error.message })
    }
    return
  }

  try {
    const userId = await insertUsers(username);

    res.json({ id: userId, username });
  } catch (error) {
    res.status(500).json({ error: 'Error inserting users' });
  }
})

app.get('/api/users', async (req: Request, res: Response<{ error: string } | User[]>) => {
  try {
    const users = await getAllUsers()

    if (!users.length) {
      res.status(404).json({ error: "No users found" })
      return
    }

    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Error during user fetching' })
  }
})

app.post('/api/users/:_id/exercises', [
  body('date')
    .optional()
    .custom(val => customDateValidation(val, 'date')),
  body('description').exists().withMessage('Missing required description value').isString().isLength({ min: 1 }).withMessage('Min length of description is 1'),
  body('duration').exists().withMessage('Missing required duration value')
    .isNumeric().withMessage('Duration should be a number')
], async (req: Request<{ _id: string }, {}, { duration?: number; description?: string; date?: string; }>, res: Response<CreatedExerciseResponse | { error: string } | { errors: ValidationError[] }>) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array().map(({ msg }) => msg) });
    return
  }

  const description = xss(req.body.description as string)
  const duration = +xss((req.body.duration as number).toString())

  const date = getFormattedDate(req.body.date ? new Date(xss(req.body.date)) : new Date())

  const userId = +xss(req.params._id)

  let user: User
  const respose = await handleUserFetch(userId)

  if ('error' in respose) {
    res.status(respose.status).json({ error: respose.error })
    return
  } else {
    user = respose
  }

  insertExercise({ userId, duration, description, date }).then(id => {
    res.status(201).json({
      date,
      userId,
      duration,
      description,
      exerciseId: id,
    })

  }).catch((err) => {
    res.status(500).json({ error: err })
  })

})

app.post('/api/users/:_id/logs', [
  query('to').optional().custom(val => customDateValidation(val, 'to')),
  query('from').optional().custom(val => customDateValidation(val, 'from')),
  query('limit').optional().isNumeric().withMessage('Limit should be a number')
],
  async (req: Request<{ _id: string }, {}, {}, { from: string, to: string, limit: number }>, res: Response<{ error: string } | UserExerciseLog | { errors: ValidationError[] }>) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array().map(({ msg }) => msg) });
      return
    }

    const to = xss(req.query.to)
    const from = xss(req.query.from)
    const userId = +xss(req.params._id)
    const limit = req.query.limit ? +xss(req.query.limit.toString()) : 1000

    let user: User
    const respose = await handleUserFetch(userId)

    if ('error' in respose) {
      res.status(respose.status).json({ error: respose.error })
      return
    } else {
      user = respose
    }


    try {
      const userExercises = await getUserExercises(userId, from, to, limit)

      res.json({
        ...user,
        logs: userExercises,
        count: userExercises.length,
      } as UserExerciseLog)
    } catch (err) {
      res.status(500).json({ error: 'Error during exercises fetching' })
    }
  })

app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + process.env.PORT || 3000)
})

export default app;

