import { useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { OPEN_ANGLE, OPEN_SPEED } from "../lib/constants";

export default function GemModel() {
  const gltf = useGLTF("/models/gem.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

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

  return <primitive object={scene} position={[-3, -2, 2]} />;
}

useGLTF.preload("/models/gem.glb");
