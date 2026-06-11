import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'

function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        try {
            const response = await api.post('/auth/login', { email, password })
            localStorage.setItem('token', response.data.token)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed')
        }
    }

    return (
        <div>
            <div className='wave-container'>
                <div className='wave wave1'></div>
                <div className='wave wave2'></div>
                <div className='wave wave3'></div>
            </div>
            <div className='auth-wrapper page-enter'>
                <div className='auth-container'>
                    <h2>Login</h2>
                    {error && <p className='error'>{error}</p>}
                    <form onSubmit={handleLogin}>
                        <input
                            type='email'
                            placeholder='Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type='password'
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <button type='submit'>Login</button>
                    </form>
                    <p>Don't have an account? <Link to='/register'>Register</Link></p>
                </div>
            </div>
        </div>
    )
}

export default Login