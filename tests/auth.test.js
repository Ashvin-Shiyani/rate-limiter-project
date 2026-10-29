const jwt = require('jsonwebtoken')

const SECRET = 'test-secret'
process.env.JWT_SECRET = SECRET

const verifyJWT = require('../src/middleware/auth')

const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

describe('verifyJWT middleware', () => {
    let res
    let next

    beforeEach(() => {
        process.env.JWT_SECRET = SECRET
        res = mockResponse()
        next = jest.fn()
    })

    test('rejects a request with no Authorization header', () => {
        verifyJWT({ headers: {} }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' })
        expect(next).not.toHaveBeenCalled()
    })

    test('rejects a header without a Bearer token', () => {
        verifyJWT({ headers: { authorization: 'Bearer' } }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' })
    })

    test('accepts a valid token and attaches the decoded user to the request', () => {
        const token = jwt.sign({ userId: 42 }, SECRET)
        const req = { headers: { authorization: `Bearer ${token}` } }

        verifyJWT(req, res, next)

        expect(next).toHaveBeenCalled()
        expect(req.user.userId).toBe(42)
    })

    test('rejects a token signed with a different secret', () => {
        const token = jwt.sign({ userId: 42 }, 'wrong-secret')

        verifyJWT({ headers: { authorization: `Bearer ${token}` } }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' })
        expect(next).not.toHaveBeenCalled()
    })

    test('rejects an expired token', () => {
        const token = jwt.sign({ userId: 42, exp: Math.floor(Date.now() / 1000) - 10 }, SECRET)

        verifyJWT({ headers: { authorization: `Bearer ${token}` } }, res, next)

        expect(res.status).toHaveBeenCalledWith(401)
        expect(next).not.toHaveBeenCalled()
    })
})
