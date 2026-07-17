import { useState } from "react";
import { useAuth } from "@/stores";
import { useUserProfile } from "@/features";
import { CircleQuestionMark, Crown, LoaderCircle } from "lucide-react";
import { maskEmail, WITCH_RANKS } from "@/lib";
import { HeartButton } from "./HeartButton";
import { Modal } from "@/ui";
import HelpModal from "@/components/modals/HelpModal";

function getWitchRankProgress(ecru: number) {
  const rankIndex = WITCH_RANKS.reduce(
    (currentIndex, rank, index) =>
      ecru >= rank.minEcru ? index : currentIndex,
    0,
  );
  const rank = WITCH_RANKS[rankIndex];
  const nextRank = WITCH_RANKS[rankIndex + 1] ?? null;
  const progressPercent =
    nextRank === null
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            ((ecru - rank.minEcru) / (nextRank.minEcru - rank.minEcru)) * 100,
          ),
        );

  return {
    rank,
    rankIndex,
    nextRank,
    progressPercent,
    remainingEcru: nextRank === null ? 0 : Math.max(0, nextRank.minEcru - ecru),
  };
}

// Displays Sign In by default and Sign Out when the user is authenticated.
export function AuthButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenHelp, setIsOpenHelp] = useState(false);

  const user = useAuth((state) => state.user);
  const username = useAuth((state) => state.username);
  const { data: userProfile } = useUserProfile(user?.id);
  const totalNotes = userProfile?.totalNotes ?? 0;
  const ecru = userProfile?.ecru ?? 0;

  const isLoading = useAuth((state) => state.isLoading);
  const signOut = useAuth((state) => state.signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAuthenticated = Boolean(user);
  const isDisabled = isLoading || isSigningOut;
  const witchRankProgress = getWitchRankProgress(ecru);

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
            <p className="text-lg text-center -mt-4">
              <Crown className="w-6 h-6 inline-block mr-2" />
              {witchRankProgress.rank.rank}
            </p>
            <div className="flex flex-col gap-1 pt-1 mb-4">
              <div className="h-2 overflow-hidden rounded bg-white/20">
                <div
                  className="h-full rounded bg-background"
                  style={{
                    width: `${witchRankProgress.progressPercent}%`,
                  }}
                />
              </div>
              <div className="flex flex-row items-center justify-between text-sm text-white">
                <p>{witchRankProgress.rank.minEcru.toLocaleString()}</p>
                <p>{witchRankProgress.nextRank.minEcru.toLocaleString()}</p>
              </div>
            </div>
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
      {isOpenHelp && (
        <HelpModal isAbout={true} onClose={() => setIsOpenHelp(false)} />
      )}
    </div>
  );
}
