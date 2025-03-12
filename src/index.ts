import xss from 'xss';
import path from 'path'
import cors from 'cors'
import helmet from "helmet"
import { v4 as uuidv4 } from 'uuid';
import express, { json, Request, Response, urlencoded } from "express"

import { User } from "@/interfaces"

const app = express()

require('dotenv').config()

app.use(cors())
app.use(json())
app.use(helmet())
app.use(urlencoded())
app.use(express.static('public'))

const users: User[] = [] as User[]

app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname + '/views/index.html'))
});

app.post('/api/users', (req: Request<{}, {}, { username: string }>, res: Response<{ error: string } | User>) => {
  const username = xss(req.body.username)

  if (!username || username.trim() === '') {
    res.status(400).json({ error: 'Username cannot be empty' });

    return
  }

  if (users.find(user => user.username === req.body.username)) {
    res.status(409).json({
      error: 'User already exists with the same username',
    });

    return
  }

  const user: User = {
    id: uuidv4(),
    username: req.body.username
  }

  // TODO use DB
  users.push(user)

  res.status(201).json(user)
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + process.env.PORT || 3000)
})

export default app;

