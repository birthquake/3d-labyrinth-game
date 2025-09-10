import React, { useRef, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSphere, useBox, usePlane } from '@react-three/cannon'
import { Text } from '@react-three/drei'

// Labyrinth maze layout (1 = wall, 0 = path, 2 = start, 3 = goal)
const MAZE = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
  [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 3, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]

// Wall component
function Wall({ position }) {
  const [ref] = useBox(() => ({
    position,
    args: [1, 1, 1],
    type: 'Static',
    material: { friction: 0.4, restitution: 0.3 }
  }))

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshLambertMaterial color="#8B4513" />
    </mesh>
  )
}

// Floor component
function Floor() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.5, 0],
    type: 'Static',
    material: { friction: 0.6, restitution: 0.1 }
  }))

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshLambertMaterial color="#90EE90" />
    </mesh>
  )
}

// Goal area component
function Goal({ position }) {
  const goalRef = useRef()
  
  useFrame((state) => {
    if (goalRef.current) {
      goalRef.current.rotation.y = state.clock.elapsedTime * 2
    }
  })

  return (
    <group position={position}>
      <mesh ref={goalRef} position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.1, 8]} />
        <meshLambertMaterial color="#FFD700" />
      </mesh>
      <Text
        position={[0, 1, 0]}
        fontSize={0.3}
        color="#FFD700"
        anchorX="center"
        anchorY="middle"
      >
        GOAL
      </Text>
    </group>
  )
}

// Main ball component
function Ball({ position, permissionGranted }) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.2],
    material: { friction: 0.4, restitution: 0.6 }
  }))

  const [deviceOrientation, setDeviceOrientation] = useState({ beta: 0, gamma: 0 })
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [isGameWon, setIsGameWon] = useState(false)

  // Device orientation listener
  useEffect(() => {
    if (!permissionGranted) return

    const handleOrientation = (event) => {
      setDeviceOrientation({
        beta: event.beta || 0,   // X-axis tilt
        gamma: event.gamma || 0  // Y-axis tilt
      })
    }

    window.addEventListener('deviceorientation', handleOrientation)
    return () => window.removeEventListener('deviceorientation', handleOrientation)
  }, [permissionGranted])

  // Touch controls for devices without motion sensors
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (permissionGranted) return
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      })
    }

    const handleTouchMove = (e) => {
      if (permissionGranted) return
      e.preventDefault()
      
      const deltaX = (e.touches[0].clientX - touchStart.x) * 0.1
      const deltaY = (e.touches[0].clientY - touchStart.y) * 0.1
      
      api.applyImpulse([deltaX, 0, deltaY], [0, 0, 0])
    }

    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [api, touchStart, permissionGranted])

  // Apply forces based on device orientation
  useFrame(() => {
    if (permissionGranted && !isGameWon) {
      const forceMultiplier = 0.02
      const forceX = Math.sin(deviceOrientation.gamma * Math.PI / 180) * forceMultiplier
      const forceZ = Math.sin(deviceOrientation.beta * Math.PI / 180) * forceMultiplier
      
      api.applyImpulse([forceX, 0, forceZ], [0, 0, 0])
    }
  })

  // Check for goal collision
  useFrame(() => {
    if (ref.current) {
      const ballPos = ref.current.position
      const goalX = 2.5  // Updated for smaller maze
      const goalZ = 2.5  // Updated for smaller maze
      
      const distance = Math.sqrt(
        Math.pow(ballPos.x - goalX, 2) + Math.pow(ballPos.z - goalZ, 2)
      )
      
      if (distance < 0.7 && !isGameWon) {
        setIsGameWon(true)
        setTimeout(() => {
          alert('🎉 Congratulations! You won! 🎉')
          // Reset ball to start position
          api.position.set(-4, 1, -4)
          api.velocity.set(0, 0, 0)
          setIsGameWon(false)
        }, 500)
      }
    }
  })

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.2]} />
      <meshLambertMaterial color={isGameWon ? "#FFD700" : "#FF4444"} />
    </mesh>
  )
}

// Main Game component
function Game({ permissionGranted }) {
  const walls = []
  let startPosition = [0, 1, 0]
  let goalPosition = [0, 0, 0]

  // Generate walls and find start/goal positions from maze
  for (let row = 0; row < MAZE.length; row++) {
    for (let col = 0; col < MAZE[row].length; col++) {
      const cell = MAZE[row][col]
      const x = col - MAZE[0].length / 2 + 0.5
      const z = row - MAZE.length / 2 + 0.5

      if (cell === 1) {
        // Wall
        walls.push(<Wall key={`wall-${row}-${col}`} position={[x, 0.5, z]} />)
      } else if (cell === 2) {
        // Start position
        startPosition = [x, 1, z]
      } else if (cell === 3) {
        // Goal position
        goalPosition = [x, 0, z]
      }
    }
  }

  return (
    <>
      <Floor />
      {walls}
      <Ball position={startPosition} permissionGranted={permissionGranted} />
      <Goal position={goalPosition} />
    </>
  )
}

export default Game
