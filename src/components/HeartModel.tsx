import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import { ReactNode, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { OPEN_ANGLE, OPEN_SPEED } from "@/lib/constants";

type HeartModelProps = {
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

export default function HeartModel({
  open,
  onToggle,
  children,
}: HeartModelProps) {
  const gltf = useGLTF("/models/heart.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const pivotRef = useRef<THREE.Object3D | null>(
    scene.getObjectByName("pivot"),
  );
  const heartRef = useRef<THREE.Object3D | null>(scene.getObjectByName("heart"));

  useEffect(() => {
    scene.renderOrder = 0;
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.renderOrder = 0;
    });
  }, [scene]);

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
        onToggle();
      }}
    >
      <primitive object={scene} />
      {heartRef.current ? createPortal(children, heartRef.current) : null}
    </group>
  );
}

useGLTF.preload("/models/heart.glb");
