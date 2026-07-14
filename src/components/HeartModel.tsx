import { useGLTF } from "@react-three/drei";
import { createPortal, useFrame } from "@react-three/fiber";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OPEN_ANGLE, OPEN_SPEED } from "@/lib";
import { HEART_LIST } from "@/shared";
import { useNote } from "@/stores";

type HeartModelProps = {
  open: boolean;
  onToggle: () => void;
  children?: ReactNode;
};

type FloatingHeart = {
  id: number;
  kind: "heart" | "star";
  position: [number, number, number];
  drift: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  life: number;
  fadeLife: number;
};

type FloatingHeartMeshProps = {
  heart: FloatingHeart;
  geometry: THREE.ShapeGeometry;
  color: string;
  onDone: (id: number) => void;
};

function createHeartShape() {
  const shape = new THREE.Shape();

  shape.moveTo(0, 0.28);
  shape.bezierCurveTo(0, 0.45, -0.28, 0.55, -0.42, 0.34);
  shape.bezierCurveTo(-0.58, 0.1, -0.36, -0.16, 0, -0.42);
  shape.bezierCurveTo(0.36, -0.16, 0.58, 0.1, 0.42, 0.34);
  shape.bezierCurveTo(0.28, 0.55, 0, 0.45, 0, 0.28);

  return shape;
}

function createStarShape() {
  const shape = new THREE.Shape();
  const points = 10;
  const outerRadius = 0.44;
  const innerRadius = 0.18;

  for (let index = 0; index <= points; index += 1) {
    const angle = (index / points) * Math.PI * 2 - Math.PI / 2;
    const radius = index % 2 === 0 ? outerRadius : innerRadius;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    if (index === 0) {
      shape.moveTo(x, y);
    } else {
      shape.lineTo(x, y);
    }
  }

  shape.closePath();

  return shape;
}

function createFloatingHeart(id: number): FloatingHeart {
  const angle = Math.random() * Math.PI * 2;
  const verticalAngle = Math.acos(THREE.MathUtils.randFloatSpread(2));
  const radius = 1.05 + Math.random() * 1.85;
  const direction = new THREE.Vector3(
    Math.sin(verticalAngle) * Math.cos(angle),
    Math.cos(verticalAngle),
    Math.sin(verticalAngle) * Math.sin(angle),
  );
  const drift = direction
    .clone()
    .multiplyScalar(0.45 + Math.random() * 0.85)
    .add(
      new THREE.Vector3(
        THREE.MathUtils.randFloatSpread(0.3),
        THREE.MathUtils.randFloatSpread(0.35),
        THREE.MathUtils.randFloatSpread(0.3),
      ),
    );

  return {
    id,
    kind: Math.random() < 0.38 ? "star" : "heart",
    position: [
      direction.x * radius,
      0.35 + direction.y * radius * 0.8,
      direction.z * radius * 0.9,
    ],
    drift: [drift.x, drift.y, drift.z],
    rotation: [
      Math.random() * 0.4 - 0.2,
      Math.random() * Math.PI,
      Math.random() * Math.PI * 2,
    ],
    scale: 0.05 + Math.random() * 0.18,
    life: 1.7 + Math.random() * 0.8,
    fadeLife: 0.7 + Math.random() * 0.35,
  };
}

function FloatingHeartMesh({
  heart,
  geometry,
  color,
  onDone,
}: FloatingHeartMeshProps) {
  const meshRef = useRef<THREE.Mesh | null>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = clock.elapsedTime;
    }

    const elapsed = clock.elapsedTime - startTimeRef.current;
    const progress = Math.min(elapsed / heart.life, 1);
    const mesh = meshRef.current;
    const material = materialRef.current;

    if (mesh) {
      mesh.position.set(
        heart.position[0] + heart.drift[0] * progress,
        heart.position[1] + heart.drift[1] * progress,
        heart.position[2] + heart.drift[2] * progress,
      );
      mesh.rotation.z = heart.rotation[2] + progress * 1.4;
      mesh.scale.setScalar(heart.scale * (1 + progress * 0.55));
    }

    if (material) {
      const fadeProgress = Math.min(elapsed / heart.fadeLife, 1);
      material.opacity = (1 - fadeProgress) * 0.62;
    }

    if (progress >= 1) {
      onDone(heart.id);
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={heart.position}
      rotation={heart.rotation}
      scale={heart.scale}
    >
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function HeartModel({
  open,
  onToggle,
  children,
}: HeartModelProps) {
  const gltf = useGLTF("/models/heart_final.glb");
  const heartColor = useNote((state) => state.note?.heart_content) || "pink";
  const floatingHeartColor = useMemo(() => {
    const selectedHex =
      HEART_LIST.find((heart) => heart.color === heartColor)?.hex ?? "#eb77b4";

    return new THREE.Color(selectedHex).lerp(new THREE.Color("#ffffff"), 0.15);
  }, [heartColor]);
  const scene = useMemo(() => {
    const clonedScene = gltf.scene.clone(true);

    clonedScene.renderOrder = 0;
    clonedScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      child.renderOrder = 0;
    });

    return clonedScene;
  }, [gltf.scene]);
  const heart = useMemo(() => scene.getObjectByName("heart") ?? null, [scene]);
  const pivotRef = useRef<THREE.Object3D | null>(null);
  const glowMiddleRef = useRef<THREE.Mesh | null>(null);
  const glowOuterRef = useRef<THREE.Mesh | null>(null);
  const glowMiddleMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const glowOuterMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const nextHeartIdRef = useRef(0);
  const emitDelayRef = useRef(0);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const floatingHeartGeometry = useMemo(
    () => new THREE.ShapeGeometry(createHeartShape()),
    [],
  );
  const floatingStarGeometry = useMemo(
    () => new THREE.ShapeGeometry(createStarShape()),
    [],
  );
  const removeFloatingHeart = useCallback((id: number) => {
    setFloatingHearts((current) => current.filter((heart) => heart.id !== id));
  }, []);

  useEffect(() => {
    return () => {
      floatingHeartGeometry.dispose();
      floatingStarGeometry.dispose();
    };
  }, [floatingHeartGeometry, floatingStarGeometry]);

  useEffect(() => {
    pivotRef.current = scene.getObjectByName("pivot") ?? null;
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

  useFrame(({ clock }, delta) => {
    const pulse = 0.5 + Math.sin(clock.elapsedTime * 4) * 0.5;
    const lerpValue = 1 - Math.exp(-6 * delta);

    const updateGlowLayer = (
      mesh: THREE.Mesh | null,
      material: THREE.MeshBasicMaterial | null,
      scale: number,
      opacity: number,
    ) => {
      if (mesh) {
        const targetScale = open ? scale + pulse * 0.18 : 0.01;
        mesh.scale.lerp(
          new THREE.Vector3(targetScale, targetScale, targetScale),
          lerpValue,
        );
      }

      if (material) {
        const targetOpacity = open ? opacity + pulse * opacity * 0.35 : 0;
        material.opacity = THREE.MathUtils.lerp(
          material.opacity,
          targetOpacity,
          1 - Math.exp(-8 * delta),
        );
      }
    };

    updateGlowLayer(
      glowMiddleRef.current,
      glowMiddleMaterialRef.current,
      2.9,
      0.022,
    );
    updateGlowLayer(
      glowOuterRef.current,
      glowOuterMaterialRef.current,
      4.45,
      0.012,
    );

    if (!open) {
      emitDelayRef.current = 0;
      return;
    }

    emitDelayRef.current -= delta;
    if (emitDelayRef.current <= 0) {
      emitDelayRef.current = 0.12;
      const id = nextHeartIdRef.current;
      nextHeartIdRef.current += 1;
      setFloatingHearts((current) => [
        ...current.slice(-28),
        createFloatingHeart(id),
      ]);
    }
  });

  return (
    <group
      onPointerDown={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      <primitive object={scene} />
      <mesh ref={glowOuterRef} position={[0, 0.55, 0.15]}>
        <sphereGeometry args={[0.85, 32, 32]} />
        <meshBasicMaterial
          ref={glowOuterMaterialRef}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={glowMiddleRef} position={[0, 0.55, 0.15]}>
        <sphereGeometry args={[0.78, 32, 32]} />
        <meshBasicMaterial
          ref={glowMiddleMaterialRef}
          color="#ffffff"
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {floatingHearts.map((heart) => (
        <FloatingHeartMesh
          key={heart.id}
          heart={heart}
          geometry={
            heart.kind === "star" ? floatingStarGeometry : floatingHeartGeometry
          }
          color={`#${floatingHeartColor.getHexString()}`}
          onDone={removeFloatingHeart}
        />
      ))}
      {heart ? createPortal(children, heart) : null}
    </group>
  );
}

useGLTF.preload("/models/heart.glb");
