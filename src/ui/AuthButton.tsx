import { useState } from "react";
import { useAuth } from "@/stores";
import { CircleQuestionMark, LoaderCircle } from "lucide-react";
import { maskEmail } from "@/lib";
import { HeartButton } from "./HeartButton";
import { Modal } from "@/ui";
import HelpModal from "@/components/modals/HelpModal";

// Displays Sign In by default and Sign Out when the user is authenticated.
export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenHelp, setIsOpenHelp] = useState(false);

  const user = useAuth((state) => state.user);
  const username = useAuth((state) => state.username);
  const totalNotes = useAuth((state) => state.totalNotes);

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
    <div className="flex flex-row gap-4 items-center justify-end text-white">
      <button
        type="button"
        onClick={() => setIsOpenHelp(true)}
        className="black-button p-2 pointer-events-auto !text-white h-full aspect-square"
      >
        <CircleQuestionMark className="w-10 h-8" />
      </button>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isDisabled}
        className="black-button p-2 pointer-events-auto shrink-0"
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
          title={username ?? "Account"}
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
            className="text-md font-medium space-y-1 text-white"
          >
            <div className="flex flex-row gap-2 justify-start items-center">
              <dt>Email:</dt>
              <dd className="ml-auto">{maskEmail(user?.email || "")}</dd>
            </div>
            <div className="flex flex-row gap-2 justify-start items-center">
              <dt>Hearts:</dt>
              <dd className="ml-auto">{totalNotes}</dd>
            </div>
          </dl>
        </Modal>
      )}
      {isOpenHelp && <HelpModal />}
    </div>
  );
}
