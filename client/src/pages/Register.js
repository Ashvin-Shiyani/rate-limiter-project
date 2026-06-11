import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleRegister = async (e) => {
        e.preventDefault()
        try {
            await api.post('/auth/register', { name, email, password })
            navigate('/login')
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed')
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
                <h2>Register</h2>
                {error && <p className='error'>{error}</p>}
                <form onSubmit={handleRegister}>
                    <input
                        type='text'
                        placeholder='Name'
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                    <button type='submit'>Register</button>
                </form>
                <p>Already have an account? <Link to='/login'>Login</Link></p>
            </div>
        </div>
    </div>
    )
}

export default Register