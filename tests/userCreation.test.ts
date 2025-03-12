// import { expect } from 'chai';
import request from 'supertest';

import app from "../src";

const USER_CREATION_URL = '/api/users'

describe("User creation", () => {
    it('should return error if username is empty', async () => {
        const response = await request(app).post(USER_CREATION_URL)

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Username cannot be empty');
    })

    // it('should return error if user with the same name exists', async () => {
    //     // HOW to mock DB
    //     const response = await request(app).post(USER_CREATION_URL).send({ username: 'test' })

    //     expect(response.status).toBe(400)
    //     expect(response.body.error).toBe('Username cannot be empty');
    // })

    it('should create user', async () => {
        const response = await request(app).post(USER_CREATION_URL).send({ username: 'User' })

        expect(response.status).toBe(201)
        expect(response.body).toHaveProperty('id');
        expect(response.body.username).toBe('User');
    })

})