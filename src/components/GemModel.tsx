import { useGLTF } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useEffect, useRef } from "react";
import { useNote } from "@/stores";
import { HEART_LIST, saturateHexColor } from "@/lib";
import * as THREE from "three";

type GemModelProps = {
  open: boolean;
};

export default function GemModel({ open }: GemModelProps) {
  const { camera } = useThree();
  const gltf = useGLTF("/models/gem.glb");
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const gemRef = useRef<THREE.Group | null>(null);
  const spinRef = useRef<THREE.Group | null>(null);
  const glowLightRef = useRef<THREE.PointLight | null>(null);
  const materialRefs = useRef<THREE.Material[]>([]);
  const cameraDirectionRef = useRef(new THREE.Vector3());

  const heartColor = useNote((state) => state.note?.heart_content) || "pink";
  const baseGemHexColor =
    HEART_LIST.find((heart) => heart.color === heartColor)?.hex ?? "#eb77b4";
  const gemHexColor = useMemo(
    () => saturateHexColor(baseGemHexColor, 1.5),
    [baseGemHexColor],
  );

  useEffect(() => {
    const gemColor = new THREE.Color(gemHexColor);
    materialRefs.current = [];

    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;

      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((material) => {
        materialRefs.current.push(material);

        if ("color" in material && material.color instanceof THREE.Color) {
          material.color.copy(gemColor);
        }

        material.needsUpdate = true;
      });
    });
  }, [gemHexColor, scene]);

  // useEffect(() => {
  //   scene.renderOrder = 999;
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
  // }, [open, scene]);

  useEffect(() => {
    if (gemRef.current && !open) {
      gemRef.current.position.set(0, -0.2, 0);
      gemRef.current.scale.setScalar(0.2);
    }
  }, [open]);

  useFrame((_, delta) => {
    const gem = gemRef.current;
    const spinGroup = spinRef.current;
    if (!gem || !spinGroup) return;

    const targetY = open ? 1.15 : -0.2;
    const targetX = open ? -1.3 : 0;
    const targetScale = open ? 2.2 : 0.2;
    const targetOpacity = open ? 1 : 0;
    const lerpValue = 1 - Math.exp(-6 * delta);

    gem.position.y = THREE.MathUtils.lerp(gem.position.y, targetY, lerpValue);
    gem.position.x = THREE.MathUtils.lerp(gem.position.x, targetX, lerpValue);

    const scale = THREE.MathUtils.lerp(gem.scale.x, targetScale, lerpValue);
    gem.scale.setScalar(scale);

    // rotate the gem to face the camera on camera rotation
    camera.getWorldDirection(cameraDirectionRef.current);
    const pitch = Math.atan2(
      cameraDirectionRef.current.y,
      Math.hypot(cameraDirectionRef.current.x, cameraDirectionRef.current.z),
    );

    gem.rotation.z = THREE.MathUtils.lerp(
      gem.rotation.z,
      Math.max(-0.1, pitch),
      lerpValue,
    );
    spinGroup.rotation.y += delta * 1.2;

    materialRefs.current.forEach((material) => {
      material.opacity = THREE.MathUtils.lerp(
        material.opacity ?? 1,
        targetOpacity,
        lerpValue,
      );
    });

    const glowLight = glowLightRef.current;
    if (glowLight) {
      const pulse = 1 + Math.sin(performance.now() * 0.006) * 0.18;
      glowLight.intensity = THREE.MathUtils.lerp(
        glowLight.intensity,
        (open ? 2 : 0) * pulse,
        lerpValue,
      );
    }

    //make the gem disappear when it's closed and out of view
    gem.visible = open || gem.position.y > -0.18 || gem.scale.x > 0.22;
  });

  return (
    <group ref={gemRef} position={[0, 0, 0]}>
      <pointLight
        ref={glowLightRef}
        color="#ff2929"
        distance={6}
        intensity={1}
        position={[-0.2, -0.3, 0]}
      />
      <group ref={spinRef}>
        <primitive object={scene} />
      </group>
    </group>
  );
}

useGLTF.preload("/models/gem.glb");
