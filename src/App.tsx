import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import HeartModel from "./components/HeartModel";
import GemModel from "./components/GemModel";
import { supabase, isSupabaseConfigured } from "@/lib";
import { useAuth } from "@/stores";
import { AuthModal } from "@/components/modals";
import { AuthButton } from "@/ui";

export default function App() {
  const isLoading = useAuth((state) => state.isLoading);
  const user = useAuth((state) => state.user);
  const setIsLoading = useAuth((state) => state.setIsLoading);
  const setSession = useAuth((state) => state.setSession);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error) {
        setSession(null);
      } else {
        setSession(data.session);
      }

      setIsLoading(false);
    };

    void loadSession();

    // Listen for auth state changes and update the session accordingly
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [setIsLoading, setSession]);

  return (
    <>
      <header className="z-99 pointer-events-none w-full fixed inset-0 h-fit flex flex-row justify-end items-center p-8">
        <AuthButton />
      </header>
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
      {!isLoading && !user && <AuthModal />}
    </>
  );
}
