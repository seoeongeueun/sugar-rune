import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useEffect, useRef } from "react";
import * as THREE from "three";

type GemModelProps = {
  open: boolean;
};

export default function GemModel({ open }: GemModelProps) {
  const gltf = useGLTF("/models/gem.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const gemRef = useRef<THREE.Group | null>(null);
  const materialRefs = useRef<THREE.Material[]>([]);

  useEffect(() => {
    // TODO: apply diff color to gem
    const gem = gemRef.current;
    if (!gem) return;

    gem.rotation.z += 0.15;
  }, [scene]);

  // useEffect(() => {
  //   scene.renderOrder = 999;
  //   scene.visible = open;
  //   materialRefs.current = [];

  //   scene.traverse((child) => {
  //     if (!(child instanceof THREE.Mesh)) return;

  //     child.renderOrder = 999;
  //     child.frustumCulled = false;

  //     const materials = Array.isArray(child.material)
  //       ? child.material
  //       : [child.material];

  //     materials.forEach((material) => {
  //       material.transparent = true;
  //       material.depthTest = false;
  //       material.depthWrite = false;
  //       material.opacity = open ? 1 : 0;
  //       material.needsUpdate = true;
  //       materialRefs.current.push(material);
  //     });
  //   });
  // }, [scene]);

  useEffect(() => {
    if (gemRef.current && !open) {
      gemRef.current.position.set(0, -0.2, 0);
      gemRef.current.scale.setScalar(0.2);
    }
  }, [open]);

  useFrame((_, delta) => {
    const gem = gemRef.current;
    if (!gem) return;

    const targetY = open ? 1.15 : -0.2;
    const targetX = open ? -1.2 : 0;
    const targetScale = open ? 2 : 0.2;
    const targetOpacity = open ? 1 : 0;
    const lerpValue = 1 - Math.exp(-6 * delta);

    gem.position.y = THREE.MathUtils.lerp(gem.position.y, targetY, lerpValue);
    gem.position.x = THREE.MathUtils.lerp(gem.position.x, targetX, lerpValue);

    //rotate gem around y axis
    gem.rotation.y += delta * 0.9;

    const scale = THREE.MathUtils.lerp(gem.scale.x, targetScale, lerpValue);
    gem.scale.setScalar(scale);

    materialRefs.current.forEach((material) => {
      material.opacity = THREE.MathUtils.lerp(
        material.opacity ?? 1,
        targetOpacity,
        lerpValue,
      );
    });

    //make the gem disappear when it's closed and out of view
    gem.visible = open || gem.position.y > -0.18 || gem.scale.x > 0.22;
  });

  return <primitive ref={gemRef} object={scene} position={[0, 0, 0]} />;
}

useGLTF.preload("/models/gem.glb");
