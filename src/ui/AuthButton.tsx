import { useState } from "react";
import { useAuth } from "@/stores";
import { Crown, Mail, Heart, LoaderCircle } from "lucide-react";
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
          "pointer-events-auto text-lg rounded-full w-16 h-16 flex items-center justify-center hover:bg-white/50 text-night hover:text-white transition-colors duration-200",
          isOpen && "bg-white/50 border border-white/20 ",
        )}
      >
        <img
          src={`/hearts/heart_${isOpen ? "black" : "white"}_icon.png`}
          alt="Heart Icon"
          className="w-10 h-10"
        />
      </button>
      {isOpen && (
        <section className="border border-white/20 w-116 min-h-36 py-4 px-6 bg-white/50 backdrop-blur-xl rounded-sm whitespace-prewrap break-all flex flex-col gap-2 pointer-events-auto">
          <div className="flex flex-col justify-start items-center text-night">
            <Crown
              fill="var(--color-night)"
              className="text-night w-6 h-6 -mb-3"
            />
            <h3 className="underline underline-offset-4 decoration-1">
              {username}
            </h3>
          </div>
          <dl className="text-md space-y-1 text-night">
            <div className="flex flex-row gap-2 justify-start items-center">
              <Mail className="w-4 h-4 mr-1" />
              <dt>Email:</dt>
              <dd className="ml-auto ">{maskEmail(user?.email || "")}</dd>
            </div>
            <div className="flex flex-row gap-2 justify-start items-center">
              <Heart className="w-4 h-4 mr-1" />
              <dt>Hearts:</dt>
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
            className="bg-[url('/hearts/heart_black_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 hover:brightness-75 text-center gap-2 flex flex-row items-center justify-center text-md"
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
