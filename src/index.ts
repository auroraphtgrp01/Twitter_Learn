import express from 'express'
import userRoutes from './routes/users.routes'
import databaseService from './services/database.services'
const app = express()
const port = 3000

app.use(express.json())
app.use('/user', userRoutes)
databaseService.connect()

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
