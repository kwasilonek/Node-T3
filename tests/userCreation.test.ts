import request from 'supertest';

import app from "../src";

import * as database from '../src/database';

const USER_CREATION_URL = '/api/users'

describe("Users", () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.restoreAllMocks()
    })

    it('should return error if username is empty', async () => {
        const response = await request(app).post(USER_CREATION_URL).send({ username: "" })

        expect(response.status).toBe(400)
        expect(response.body.errors[0].msg).toBe('Username cannot be empty');
    })

    it('should return error if user with provided username exists', async () => {
        jest.spyOn(database, 'getUser').mockResolvedValue({ id: 1, username: "" });

        const response = await request(app).post(USER_CREATION_URL).send({
            username: 'test'
        })

        expect(response.status).toBe(409)
        expect(response.body.error).toBe('User already exists with the same username')
    })

    it('should create user', async () => {
        const spy = jest.spyOn(database, 'insertUsers').mockResolvedValue(1)

        const response = await request(app).post(USER_CREATION_URL).send({ username: 'Test' })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('Test')

        expect(response.status).toBe(200)
        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toBe('Test');
    })

    it('should catch error on user fetch and return 500 status', async () => {
        jest.spyOn(database, 'getUser').mockImplementation(() => {
            throw new Error("")
        })

        const response = await request(app).post(USER_CREATION_URL).send({ username: 'Test' })

        expect(response.status).toBe(500)
    })

    it('should catch error on user insert and return 500 status', async () => {
        jest.spyOn(database, 'insertUsers').mockImplementation(() => {

            throw new Error("")
        })

        const response = await request(app).post(USER_CREATION_URL).send({ username: 'Test' })

        expect(response.status).toBe(500)
    })
})

describe("Fetching", () => {
    it('should catch error', async () => {
        jest.spyOn(database, 'getAllUsers').mockImplementation(() => {
            throw new Error
        })

        const response = await request(app).get(USER_CREATION_URL)

        expect(response.status).toBe(500)
    })

    it('should return errors if no users', async () => {
        jest.spyOn(database, 'getAllUsers').mockResolvedValue([])

        const response = await request(app).get(USER_CREATION_URL)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No users found')
    })

    it('should return users', async () => {
        jest.spyOn(database, 'getAllUsers').mockResolvedValue([{ id: 1, username: "Test" }])

        const response = await request(app).get(USER_CREATION_URL)

        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual([{ id: 1, username: "Test" }])
    })



})

describe('Exeecises', () => {
    it('should validate body', async () => {
        const response = await request(app).post(`${USER_CREATION_URL}/1/exercises`).send({})

        const dateError = response.body.errors.find(({ msg }: { msg: string }) => msg === 'Date must be in YYYY-MM-DD format')
        const descError = response.body.errors.find(({ msg }: { msg: string }) => msg === 'Missing required description value')
        const durationError = response.body.errors.find(({ msg }: { msg: string }) => msg === 'Missing required duration value')

        expect(dateError).toBeDefined()
        expect(descError).toBeDefined()
        expect(durationError).toBeDefined()
    })

    it('should show error if user not found', async () => {
        const response = await request(app).post(`${USER_CREATION_URL}/1/exercises`).send({ date: '2025-10-10', description: "Test", duration: 1000 })

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('No user with provided id found')
    })

    it('should create exercise', async () => {
        const spy = jest.spyOn(database, 'insertExercise').mockResolvedValue(1)
        jest.spyOn(database, 'getUser').mockResolvedValue({ id: 1, username: "" })

        const response = await request(app).post(`${USER_CREATION_URL}/1/exercises`).send({ date: '2025-10-10', description: "Test", duration: 1000 })

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith({ date: '2025-10-10', description: "Test", duration: 1000, userId: 1 })

        expect(response.status).toBe(201)
        expect(response.body).toStrictEqual({ date: '2025-10-10', description: "Test", duration: 1000, userId: 1, exerciseId: 1 })
    })
})

describe('Logs', () => {
    it('should validate body', async () => {
        const response = await request(app).post(`${USER_CREATION_URL}/1/logs?to="to"&from="from"&limit='DD'`)

        const toError = response.body.errors.find(({ msg }: { msg: string }) => msg === 'To must be in YYYY-MM-DD format')
        const fromError = response.body.errors.find(({ msg }: { msg: string }) => msg === 'To must be in YYYY-MM-DD format')
        const limitError = response.body.errors.find(({ msg, path }: { msg: string, path: string }) => {
            return msg === 'Invalid value' && path === 'limit'
        })

        expect(toError).toBeDefined()
        expect(fromError).toBeDefined()
        expect(limitError).toBeDefined()
    })

    it('should return data', async () => {
        jest.spyOn(database, 'getUser').mockResolvedValue({ id: 1, username: "Test" })

        const spy = jest.spyOn(database, 'getUserExercises').mockResolvedValue([{
            id: 1,
            description: "desc",
            duration: 1000,
            date: '2025-10-10'
        }])

        const response = await request(app).post(`${USER_CREATION_URL}/1/logs?to=2025-10-12&from=2025-10-10&limit=10`)

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(1, '2025-10-10', '2025-10-12', 10)

        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual({
            id: 1,
            username: "Test",
            logs: [{
                id: 1,
                description: "desc",
                duration: 1000,
                date: '2025-10-10'
            }],
            count: 1
        })

    })
})

