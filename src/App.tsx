import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useState } from "react";
import HeartModel from "./components/HeartModel";
import GemModel from "./components/GemModel";
import GestureDetector from "./components/GestureDetector";
import { supabase, isSupabaseConfigured } from "@/lib";
import { useAuth, useNote } from "@/stores";
import { AuthModal } from "@/components/modals";
import { AuthButton } from "@/ui";
import HeartsList from "./components/HeartsList";
import PostCard from "./components/PostCard";
import { DeleteModal } from "@/components/modals";
import Calendar from "./components/Calendar";

export default function App() {
  const [heartOpen, setHeartOpen] = useState(false);
  const isLoading = useAuth((state) => state.isLoading);
  const user = useAuth((state) => state.user);
  const setIsLoading = useAuth((state) => state.setIsLoading);
  const setSession = useAuth((state) => state.setSession);
  const isOpen = useNote((state) => state.isOpen);
  const openNote = useNote((state) => state.openNote);
  // open the heart when gesture is detected, but do not close it even when gesture is no longer detected
  // so that it can be closed by the user manually
  const handleVictoryChange = useCallback((isVictory: boolean) => {
    if (isVictory) setHeartOpen(true);
  }, []);

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
      <header className="z-99 pointer-events-none w-full fixed inset-0 h-fit flex flex-row justify-between items-center px-8">
        <h1 className="text-white font-bold! text-shadow">Sugar Heart</h1>
        <AuthButton />
      </header>

      <Canvas camera={{ position: [-7, -0.5, 2], fov: 60 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[-2, 5, 0]} intensity={1.2} />

        <Suspense fallback={null}>
          <HeartModel
            open={heartOpen}
            onToggle={() => setHeartOpen((value) => !value)}
          ></HeartModel>
          <GemModel open={heartOpen} />
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
      <HeartsList />
      <GestureDetector onVictoryChange={handleVictoryChange} />
      {heartOpen && (
        <div
          id="modal"
          className="pointer-events-none fixed bottom-10 justify-self-center text-white text-lg flex flex-row gap-40"
        >
          <button
            form="auth-form"
            type="button"
            onClick={openNote}
            className="!pointer-events-auto bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">Add</span>
          </button>
          <button
            form="auth-form"
            type="button"
            className="!pointer-events-auto bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">List</span>
          </button>
        </div>
      )}
      {isOpen && <PostCard />}
      {/* <DeleteModal
        onCancel={() => console.log("Cancel")}
        onConfirm={() => console.log("Confirm")}
      /> */}
      <Calendar />
      {!isLoading && !user && <AuthModal />}
    </>
  );
}
