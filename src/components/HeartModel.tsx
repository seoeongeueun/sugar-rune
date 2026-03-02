import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OPEN_ANGLE, OPEN_SPEED } from "../lib/constants";

export default function HeartModel() {
  const gltf = useGLTF("/models/heart.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const pivotRef = useRef<THREE.Object3D | null>(
    scene.getObjectByName("pivot"),
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    // apply glass material
    const glass: THREE.Object3D | undefined = scene.getObjectByName("glass");
    if (!glass) return;

    const glassTexture = new THREE.MeshPhysicalMaterial({
      name: "glass",
      color: new THREE.Color("#1383c4"),
      transparent: true,
      opacity: 0.55,
      transmission: 0,
      roughness: 0.4,
      ior: 1.2,
      thickness: 0.08,
    });
    glassTexture.depthWrite = false;

    (glass as THREE.Mesh).material = glassTexture;
  }, [scene]);

  // smooth open / close animation
  useFrame((_, delta) => {
    const pivot = pivotRef.current;
    if (!pivot) return;

    const target = open ? OPEN_ANGLE : 0;

    const lerpValue = 1 - Math.exp(-OPEN_SPEED * delta);
    pivot.rotation.z = THREE.MathUtils.lerp(
      pivot.rotation.z,
      target,
      lerpValue,
    );
  });

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/models/heart.glb");
