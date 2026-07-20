import { useState, useEffect } from "react";
import { useAuth } from "@/stores";
import {
  useUpdateUserLockMode,
  useUserProfile,
  verifyUserPassword,
} from "@/features";
import {
  Check,
  CircleQuestionMark,
  Crown,
  KeyRound,
  LoaderCircle,
} from "lucide-react";
import {
  getErrorMessage,
  maskEmail,
  WITCH_RANKS,
  normalizeString,
} from "@/lib";
import { HeartButton } from "./HeartButton";
import { Modal } from "@/ui";
import HelpModal from "@/components/modals/HelpModal";
import LockModal from "@/components/modals/LockModal";

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
  const [isOpenPassword, setIsOpenPassword] = useState(false);
  const [isOpenLock, setIsOpenLock] = useState(false);
  const [lockPassword, setLockPassword] = useState("");
  const [lockPasswordMessage, setLockPasswordMessage] = useState<string | null>(
    null,
  );
  const [isLockMessageError, setIsLockMessageError] = useState(false);
  const [isVerifyingLockPassword, setIsVerifyingLockPassword] = useState(false);

  const user = useAuth((state) => state.user);
  const username = useAuth((state) => state.username);
  const { data: userProfile } = useUserProfile(user?.id);

  const totalNotes = userProfile?.totalNotes ?? 0;
  const ecru = userProfile?.ecru ?? 0;
  const isLockMode = userProfile?.isLockMode ?? false;
  const updateUserLockModeMutation = useUpdateUserLockMode(user?.id);

  const isLoading = useAuth((state) => state.isLoading);
  const signOut = useAuth((state) => state.signOut);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isAuthenticated = Boolean(user);
  const isDisabled = isLoading || isSigningOut;
  const witchRankProgress = getWitchRankProgress(ecru);

  useEffect(() => {
    if (lockPasswordMessage && !isLockMessageError) {
      const timer = setTimeout(() => {
        setLockPasswordMessage(null);
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isLockMessageError, lockPasswordMessage]);

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

  const handleVerifyLockPassword = async () => {
    const email = user?.email;
    const password = lockPassword.trim();

    if (!email) {
      setLockPasswordMessage("Sign in before changing lock mode");
      setIsLockMessageError(true);
      return;
    }

    if (!password) {
      setLockPasswordMessage("Enter your password");
      setIsLockMessageError(true);
      return;
    }

    setIsVerifyingLockPassword(true);
    setLockPasswordMessage(null);
    setIsLockMessageError(false);

    try {
      await verifyUserPassword({ email, password });
      setLockPassword("");
      setIsOpenPassword(false);
      setLockPasswordMessage(null);
      setIsLockMessageError(false);
      setIsOpenLock(true);
    } catch (error) {
      setLockPasswordMessage(
        error instanceof Error ? error.message : "Password is incorrect",
      );
      setIsLockMessageError(true);
    } finally {
      setIsVerifyingLockPassword(false);
    }
  };

  const handleLockModeConfirm = (nextIsLockMode: boolean, spell: string) => {
    const currentIsLockMode = userProfile?.isLockMode ?? false;
    const currentSpell = userProfile?.spell ?? "";

    if (
      nextIsLockMode === currentIsLockMode &&
      normalizeString(spell) === normalizeString(currentSpell)
    ) {
      setIsOpenLock(false);
      setLockPasswordMessage(null);
      setIsLockMessageError(false);
      return;
    }

    updateUserLockModeMutation.mutate(
      { isLockMode: nextIsLockMode, spell },
      {
        onSuccess: () => {
          setLockPasswordMessage("Lock mode saved");
          setIsLockMessageError(false);
          setIsOpenLock(false);
        },
        onError: (error) => {
          setLockPasswordMessage(getErrorMessage(error));
          setIsLockMessageError(true);
          setIsOpenLock(false);
        },
      },
    );
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
      {isOpen && !isOpenLock && (
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
            className="text-md font-medium space-y-1 text-white w-[75%]"
          >
            <p className="text-lg text-center -mt-4">
              <Crown className="w-6 h-6 inline-block mr-2" />
              {witchRankProgress.rank.rank}
            </p>
            <div className="flex flex-col gap-1 pt-1 mb-4">
              <div className="h-2 overflow-hidden rounded bg-white/20 border border-white/50">
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
            <div className="flex flex-row items-center justify-between mt-8">
              <label className="text-white/50 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lock-mode"
                  disabled={true}
                  className="rounded"
                  checked={isLockMode}
                />
                Lock Pendant
              </label>
              <button
                onClick={() => {
                  setIsOpenPassword((prev) => !prev);
                  setLockPasswordMessage(null);
                }}
                type="button"
                className="black-button px-1 aspect-square"
              >
                <KeyRound className="w-5 h-5" />
              </button>
            </div>
            {!isOpenPassword ? (
              <p className="text-sm whitespace-pre-line text-white">
                Requires a secret phrase to open locked pendant
              </p>
            ) : (
              <div className="flex flex-row gap-2">
                <input
                  type="password"
                  placeholder="Enter password to change lock mode"
                  className="white-button text-sm px-2 !aspect-auto w-full font-medium"
                  value={lockPassword}
                  disabled={isVerifyingLockPassword}
                  onChange={(event) => {
                    setLockPassword(event.target.value);
                    setLockPasswordMessage(null);
                    setIsLockMessageError(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      void handleVerifyLockPassword();
                    }
                  }}
                />
                <button
                  type="button"
                  className="white-button px-2"
                  disabled={isVerifyingLockPassword}
                  onClick={() => void handleVerifyLockPassword()}
                >
                  {isVerifyingLockPassword ? (
                    <LoaderCircle className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </dl>
          {lockPasswordMessage && (
            <p
              role={isLockMessageError ? "alert" : "status"}
              className="text-center text-shadow text-md"
            >
              {lockPasswordMessage}
            </p>
          )}
        </Modal>
      )}
      {isOpenHelp && (
        <HelpModal isAbout={true} onClose={() => setIsOpenHelp(false)} />
      )}
      {isOpenLock && (
        <LockModal
          isLockMode={isLockMode}
          currentSpell={userProfile?.spell ?? ""}
          isSaving={updateUserLockModeMutation.isPending}
          onClose={() => setIsOpenLock(false)}
          onConfirm={handleLockModeConfirm}
        />
      )}
    </div>
  );
}
