import { useState } from "react";
import { useAuth } from "@/stores";
import { Mail, Heart, LoaderCircle } from "lucide-react";
import { maskEmail } from "@/lib";
import { twMerge } from "tailwind-merge";
import { HeartButton } from "./HeartButton";
import { Modal } from "@/ui";

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
          "pointer-events-auto text-lg outline-0 rounded-full w-16 h-16 flex items-center justify-center hover:bg-white/40 text-night hover:text-white transition-colors duration-200",
          isOpen && "bg-white/40 border-2 border-white outline outline-night",
        )}
      >
        <img
          src={`/hearts/heart_${String(isOpen ? "white" : "black")}_icon.png`}
          alt="Heart Icon"
          className="w-10 h-10"
        />
      </button>
      {isOpen && (
        <Modal
          isSimple={true}
          title={username}
          heartColor={"black"}
          onClose={() => setIsOpen(false)}
          footer={
            <>
              <HeartButton
                heartColor="black"
                onClick={handleAuthButtonClick}
                disabled={isSigningOut}
                ariaLabel={
                  isAuthenticated
                    ? "Log out from your account"
                    : "Log in to your account"
                }
                label={
                  isAuthenticated ? (
                    isSigningOut ? (
                      <LoaderCircle className="w-8 h-8 animate-spin text-white" />
                    ) : (
                      "Log Out"
                    )
                  ) : (
                    "Log In"
                  )
                }
              />
              <HeartButton
                heartColor="white"
                onClick={() => setIsOpen(false)}
                disabled={isSigningOut}
                ariaLabel={"Close the authentication modal"}
                label={"Close"}
              />
            </>
          }
        >
          <dl
            id="no-text-shadow"
            className="text-md font-medium space-y-1 text-night"
          >
            <div className="flex flex-row gap-2 justify-start items-center">
              <Mail className="w-4 h-4 mr-1" />
              <dt>Email:</dt>
              <dd className="ml-auto">{maskEmail(user?.email || "")}</dd>
            </div>
            <div className="flex flex-row gap-2 justify-start items-center">
              <Heart className="w-4 h-4 mr-1" />
              <dt>Hearts:</dt>
              <dd className="ml-auto">0</dd>
            </div>
          </dl>
        </Modal>
      )}
    </div>
  );
}
