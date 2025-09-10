import React, { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/cannon'
import Game from './components/Game'

function App() {
  const [gameStarted, setGameStarted] = useState(false)
  const [deviceSupported, setDeviceSupported] = useState(true)
  const [permissionGranted, setPermissionGranted] = useState(false)

  // Check if device motion is supported
  useEffect(() => {
    if (!window.DeviceOrientationEvent) {
      setDeviceSupported(false)
    }
  }, [])

  // Request permission for iOS devices
  const requestPermission = async () => {
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission()
        if (permission === 'granted') {
          setPermissionGranted(true)
          setGameStarted(true)
        } else {
          alert('Motion sensor permission denied. You can still play with touch controls!')
          setGameStarted(true)
        }
      } catch (error) {
        console.error('Permission request failed:', error)
        setGameStarted(true)
      }
    } else {
      // Non-iOS devices
      setPermissionGranted(true)
      setGameStarted(true)
    }
  }

  if (!gameStarted) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px', fontWeight: 'bold' }}>
          🎯 3D Labyrinth
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', maxWidth: '400px' }}>
          Tilt your device to roll the ball through the maze and reach the goal!
        </p>
        
        {!deviceSupported && (
          <div style={{ marginBottom: '20px', padding: '15px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <p>⚠️ Motion sensors not detected</p>
            <p style={{ fontSize: '0.9rem', marginTop: '5px' }}>You can still play with touch controls</p>
          </div>
        )}

        <button
          onClick={requestPermission}
          style={{
            fontSize: '1.3rem',
            padding: '15px 30px',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid white',
            borderRadius: '25px',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontWeight: 'bold'
          }}
          onMouseOver={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)'
            e.target.style.transform = 'scale(1.05)'
          }}
          onMouseOut={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)'
            e.target.style.transform = 'scale(1)'
          }}
        >
          🚀 Start Game
        </button>
        
        <div style={{ marginTop: '30px', fontSize: '0.9rem', opacity: '0.8' }}>
          <p>📱 Best played on mobile devices</p>
          <p>🎮 Tilt to move • Touch screen for backup controls</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Canvas
        camera={{ position: [0, 6, 4], fov: 75 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #98FB98 100%)' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <Physics gravity={[0, -9.82, 0]}>
          <Game permissionGranted={permissionGranted} />
        </Physics>
      </Canvas>
      
      <div className="ui-overlay">
        <div className="game-info">
          <div>🎯 3D Labyrinth</div>
          <div style={{ fontSize: '14px', marginTop: '5px', opacity: '0.9' }}>
            Roll the ball to the goal!
          </div>
        </div>
        
        <div className="controls-info">
          {permissionGranted ? (
            <div>📱 Tilt your device to move the ball</div>
          ) : (
            <div>👆 Touch and drag to move the ball</div>
          )}
        </div>
      </div>
    </>
  )
}

export default App
