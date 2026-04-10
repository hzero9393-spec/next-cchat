"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Stars } from "@react-three/drei";
import * as THREE from "three";
import React from "react";

// ============ MOUSE PARALLAX CAMERA ============

function CameraRig() {
  const mouse = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
    mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }, []);

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useFrame(({ camera }) => {
    camera.position.x += (mouse.current.x * 0.3 - camera.position.x) * 0.02;
    camera.position.y += (mouse.current.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// ============ FLOATING GEOMETRIC SHAPES ============

interface FloatingShapeProps {
  position: [number, number, number];
  geometry: "icosahedron" | "torus" | "octahedron";
  color: string;
  speed?: number;
  scale?: number;
}

const FloatingShape = React.memo(function FloatingShape({
  position,
  geometry,
  color,
  speed = 1,
  scale = 1,
}: FloatingShapeProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.15 * speed;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.2 * speed;
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.1 * speed;
    }
  });

  const geometryNode = useMemo(() => {
    switch (geometry) {
      case "icosahedron":
        return <icosahedronGeometry args={[1, 0]} />;
      case "torus":
        return <torusGeometry args={[0.8, 0.3, 16, 32]} />;
      case "octahedron":
        return <octahedronGeometry args={[1, 0]} />;
    }
  }, [geometry]);

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <mesh ref={meshRef} position={position} scale={scale}>
        {geometryNode}
        <meshStandardMaterial
          color={color}
          wireframe
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
});

// ============ PARTICLE SYSTEM ============

function Particles({ count = 200 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const radius = 3 + Math.random() * 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      pos[i3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i3 + 2] = radius * Math.cos(phi);

      // Emerald / teal / gold color palette
      const palette = [
        [0.18, 0.8, 0.44],  // emerald
        [0.2, 0.74, 0.6],   // teal
        [0.96, 0.76, 0.12], // amber/gold
        [0.4, 0.9, 0.7],    // mint
        [1, 1, 1],           // white
      ];
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i3] = c[0];
      col[i3 + 1] = c[1];
      col[i3 + 2] = c[2];
    }

    return [pos, col];
  }, [count]);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.02;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ============ GRADIENT BACKGROUND ============

function GradientBackground() {
  return (
    <mesh position={[0, 0, -8]}>
      <planeGeometry args={[50, 50]} />
      <meshBasicMaterial color="#0a0a0a" />
    </mesh>
  );
}

// ============ GLOWING ORB ============

function GlowingOrb() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(
        1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1
      );
    }
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]}>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial
        color="#10b981"
        emissive="#10b981"
        emissiveIntensity={0.3}
        transparent
        opacity={0.15}
      />
    </mesh>
  );
}

// ============ MAIN SCENE ============

function Scene() {
  return (
    <>
      <GradientBackground />
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={0.8} color="#10b981" />
      <pointLight position={[-5, -3, 3]} intensity={0.4} color="#f59e0b" />
      <pointLight position={[0, 5, -5]} intensity={0.3} color="#14b8a6" />

      <GlowingOrb />

      <FloatingShape
        position={[-3, 1.5, -2]}
        geometry="icosahedron"
        color="#10b981"
        speed={0.8}
        scale={0.7}
      />
      <FloatingShape
        position={[3, -1, -1]}
        geometry="torus"
        color="#14b8a6"
        speed={1.2}
        scale={0.6}
      />
      <FloatingShape
        position={[-2, -2, 1]}
        geometry="octahedron"
        color="#f59e0b"
        speed={0.6}
        scale={0.5}
      />
      <FloatingShape
        position={[2.5, 2, -3]}
        geometry="icosahedron"
        color="#34d399"
        speed={1}
        scale={0.4}
      />
      <FloatingShape
        position={[-4, -0.5, -3]}
        geometry="torus"
        color="#059669"
        speed={0.9}
        scale={0.45}
      />
      <FloatingShape
        position={[1, -2.5, -2]}
        geometry="octahedron"
        color="#fbbf24"
        speed={0.7}
        scale={0.35}
      />

      <Particles count={300} />
      <Stars
        radius={50}
        depth={50}
        count={1000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      <CameraRig />
    </>
  );
}

// ============ EXPORTED COMPONENT ============

export interface ThreeSceneProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ThreeScene = React.memo(function ThreeScene({
  className = "",
  style,
}: ThreeSceneProps) {
  return (
    <div className={`w-full h-full ${className}`} style={style}>
      <Canvas
        camera={{ position: [0, 0, 6], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ background: "linear-gradient(135deg, #0a0a0a 0%, #0d1b0e 50%, #0a0a0a 100%)" }}
      >
        <Scene />
      </Canvas>
    </div>
  );
});

export default ThreeScene;
