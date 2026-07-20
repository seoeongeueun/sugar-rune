import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import HeartModel from "./components/HeartModel";
import GemModel from "./components/GemModel";
import GestureDetector from "./components/GestureDetector";
import { supabase, isSupabaseConfigured } from "@/lib";
import { useAuth, useCalendar, useNote } from "@/stores";
import {
  clearNotesQueryCache,
  clearUserProfileQueryCache,
  useUserProfile,
  useUserNotes,
} from "@/features";
import { AuthModal } from "@/components/modals";
import { AuthButton } from "@/ui";
import HeartsList from "./components/HeartsList";
import PostCard from "./components/PostCard";
import FooterButtons from "./components/FooterButtons";
import Calendar from "./components/Calendar";
import HelpModal from "./components/modals/HelpModal";
import { LockKeyhole } from "lucide-react";

const HELP_SEEN_KEY = "is_seen";

export default function App() {
  const [heartOpen, setHeartOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isLockMessageOpen, setIsLockMessageOpen] = useState(false);
  const [cameraAccessRequestCount, setCameraAccessRequestCount] = useState(0);
  const isLoading = useAuth((state) => state.isLoading);
  const user = useAuth((state) => state.user);
  const isAdmin = useAuth((state) => state.isAdmin);
  const setIsLoading = useAuth((state) => state.setIsLoading);
  const setSession = useAuth((state) => state.setSession);
  const isOpen = useNote((state) => state.isOpen);
  const isCalendarOpen = useCalendar((state) => state.isOpen);
  const queryClient = useQueryClient();

  useUserNotes(user?.id, new Date().getFullYear());
  const { data: userProfile } = useUserProfile(user?.id);
  const isLockMode = userProfile?.isLockMode ?? false;

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
      if (!nextSession) {
        clearNotesQueryCache(queryClient);
        clearUserProfileQueryCache(queryClient);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient, setIsLoading, setSession]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (isAdmin && localStorage.getItem(HELP_SEEN_KEY) !== "true") {
      localStorage.setItem(HELP_SEEN_KEY, "true");
      setIsHelpOpen(true);
    }
  }, [isAdmin, isLoading]);

  const handleHelpClose = useCallback(() => {
    setIsHelpOpen(false);
  }, []);

  const handleBlockedHeartClick = useCallback(() => {
    setIsLockMessageOpen(true);
  }, []);

  useEffect(() => {
    if (!isLockMessageOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      setIsLockMessageOpen(false);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isLockMessageOpen]);

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
            canOpenOnClick={!isLockMode}
            onBlockedOpenClick={handleBlockedHeartClick}
            onToggle={() => setHeartOpen((value) => !value)}
          ></HeartModel>
          <GemModel open={heartOpen} />
          <Environment preset="apartment" />
        </Suspense>

        <OrbitControls enableDamping dampingFactor={0.1} />
      </Canvas>
      <HeartsList />
      <GestureDetector
        onVictoryChange={handleVictoryChange}
        cameraAccessRequestCount={cameraAccessRequestCount}
      />
      {heartOpen && <FooterButtons />}

      {isCalendarOpen && <Calendar />}
      {isOpen && <PostCard />}
      {isHelpOpen && (
        <HelpModal
          onClose={handleHelpClose}
          onCameraAccessGranted={() =>
            setCameraAccessRequestCount((count) => count + 1)
          }
        />
      )}
      {!isLoading && !user && !isHelpOpen && (
        <AuthModal onCreateAccount={() => setIsHelpOpen(true)} />
      )}
      {isLockMessageOpen && (
        <div className="px-4 rounded fixed bottom-30 left-1/2 -translate-x-1/2 flex flex-row items-center text-white text-lg">
          <LockKeyhole size={18} />
          <p className="ml-4">Your pendant is locked</p>
        </div>
      )}
    </>
  );
}
