import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense } from "react";
import HeartModel from "./components/HeartModel";
import GemModel from "./components/GemModel";

export default function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [-7, -0.5, 2], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-2, 5, 0]} intensity={1.2} />

        <Suspense fallback={null}>
          <HeartModel />
          <GemModel />
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
    </div>
  );
}
