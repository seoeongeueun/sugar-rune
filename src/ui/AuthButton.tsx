import { useState } from "react";
import { useAuth } from "@/stores";
import { Crown, Mail, Heart, BookHeart, LoaderCircle } from "lucide-react";
import { maskEmail } from "@/lib";
import { twMerge } from "tailwind-merge";

// Displays Sign In by default and Sign Out when the user is authenticated.
export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false);

  const user = useAuth((state) => state.user);
  const username = useAuth((state) => state.username);
  const isLoading = useAuth((state) => state.isLoading);
  const signOut = useAuth((state) => state.signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAuthenticated = Boolean(user);
  const isDisabled = isLoading || isSigningOut;

  const handleAuthButtonClick = async () => {
    if (isAuthenticated) {
      setIsSigningOut(true);
      try {
        await signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      } finally {
        setIsSigningOut(false);
      }
    }
    //close the dropdown after action (either sign in or sign out)
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col items-end gap-4 text-white">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDisabled}
        className={twMerge(
          "pointer-events-auto text-lg rounded-full w-16 h-16 flex items-center justify-center bg-background hover:bg-night text-night hover:text-white transition-colors",
          isOpen && "bg-night text-white border border-white",
        )}
      >
        <BookHeart className="w-8 h-8" />
      </button>
      {isOpen && (
        <section className="w-120 min-h-36 p-4 bg-night border-white border-4 border-double rounded-xs whitespace-prewrap break-all flex flex-col gap-6 pointer-events-auto">
          <div className="flex flex-row gap-2 justify-start items-center">
            <Crown className="w-6 h-6" />
            <h3>Witch {username}</h3>
          </div>
          <dl className="text-sm space-y-1">
            <div className="flex flex-row gap-2 justify-start items-center">
              <Mail className="w-4 h-4" />
              <dt className="font-medium">Email:</dt>
              <dd className="ml-auto">{maskEmail(user?.email || "")}</dd>
            </div>
            <div className="flex flex-row gap-2 justify-start items-center">
              <Heart className="w-4 h-4" />
              <dt className="font-medium">Hearts:</dt>
              <dd className="ml-auto">0</dd>
            </div>
          </dl>
          <button
            id="heart-button"
            type="button"
            onClick={handleAuthButtonClick}
            disabled={isSigningOut}
            aria-label={
              isAuthenticated
                ? "Log out from your account"
                : "Log in to your account"
            }
            className="bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 hover:brightness-75 text-center gap-2 flex flex-row items-center justify-center"
          >
            {isAuthenticated ? (
              isSigningOut ? (
                <LoaderCircle className="w-8 h-8 animate-spin text-white" />
              ) : (
                "Log Out"
              )
            ) : (
              "Log In"
            )}
          </button>
        </section>
      )}
    </div>
  );
}
