import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

const Background = () => {
  const count = 100;
  const positions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);
      positions.push(
        1000 * Math.sin(theta) * Math.cos(phi),
        1000 * Math.sin(theta) * Math.sin(phi),
        1000 * Math.cos(theta)
      );
    }
    return new Float32Array(positions);
  }, []);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#000435] to-[#E06002]">
      <Canvas camera={{ position: [0, 0, 1000], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={3}
            sizeAttenuation={true}
            color="#FB7E03"
            transparent
            opacity={0.8}
          />
        </points>
        <Sphere args={[1, 64, 64]}>
          <meshStandardMaterial
            color="#E06002"
            transparent
            opacity={0.3}
            wireframe
          />
        </Sphere>
      </Canvas>
    </div>
  );
};

export default Background;
