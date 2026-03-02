import { useGLTF } from "@react-three/drei";
import { useMemo, useEffect } from "react";

export default function GemModel() {
  const gltf = useGLTF("/models/gem.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    // TODO: apply diff color to gem
  }, [scene]);

  return <primitive object={scene} position={[-3, -2, 2]} />;
}

useGLTF.preload("/models/gem.glb");
