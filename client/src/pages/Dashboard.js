import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
    const [keys, setKeys] = useState([])
    const [algorithm, setAlgorithm] = useState('sliding_window')
    const [tier, setTier] = useState('free')
    const [message, setMessage] = useState('')
    const navigate = useNavigate()

    const token = localStorage.getItem('token')

    useEffect(() => {
        fetchKeys()
    }, [])

    const fetchKeys = async () => {
        try {
            const response = await axios.get('/keys', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setKeys(response.data.keys)
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('token')
                navigate('/login')
            }
        }
    }

    const generateKey = async () => {
        try {
            const response = await axios.post('/keys/generate',
                { algorithm, tier },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setMessage('API key generated successfully!')
            fetchKeys()
        } catch (err) {
            setMessage('Failed to generate key')
        }
    }

    const deleteKey = async (id) => {
        try {
            await axios.delete(`/keys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setMessage('API key deleted!')
            fetchKeys()
        } catch (err) {
            setMessage('Failed to delete key')
        }
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        navigate('/login')
    }
    return (
        <div className='dashboard'>
            <div className='dashboard-header'>
                <h1>Rate Limiter Dashboard</h1>
                <button onClick={handleLogout} className='logout-btn'>Logout</button>
            </div>

            {message && <p className='message'>{message}</p>}

            <div className='generate-section'>
                <h2>Generate New API Key</h2>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                    <option value='sliding_window'>Sliding Window</option>
                    <option value='fixed_window'>Fixed Window</option>
                    <option value='token_bucket'>Token Bucket</option>
                </select>
                <select value={tier} onChange={(e) => setTier(e.target.value)}>
                    <option value='free'>Free (100 req/min)</option>
                    <option value='silver'>Silver (200 req/min)</option>
                    <option value='gold'>Gold (500 req/min)</option>
                </select>
                <button onClick={generateKey} className='generate-btn'>Generate Key</button>
            </div>

            <div className='keys-section'>
                <h2>Your API Keys</h2>
                {keys.length === 0 ? (
                    <p>No API keys yet. Generate one above!</p>
                ) : (
                    keys.map((key) => (
                        <div key={key.id} className='key-card'>
                            <p><strong>Key:</strong> {key.api_key}</p>
                            <p><strong>Algorithm:</strong> {key.algorithm}</p>
                            <p><strong>Limit:</strong> {key.limit_count} req/{key.window_seconds}s</p>
                            <p><strong>Created:</strong> {new Date(key.created_at).toLocaleDateString()}</p>
                            <button onClick={() => deleteKey(key.id)} className='delete-btn'>Delete</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default Dashboard