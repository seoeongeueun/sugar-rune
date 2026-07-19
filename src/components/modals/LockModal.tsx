import { useEffect, useRef, useState } from "react";
import { ModalSimple, HeartButton } from "@/ui";
import { startSpeechRecognition } from "@/lib";
import type { SpeechRecognitionSession } from "@/lib";
import { Check, Mic, RotateCcw, Sparkles, X } from "lucide-react";

type LockModalProps = {
  isLockMode: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (isLockMode: boolean) => void;
};

type RecorderStep =
  | "ready"
  | "recording"
  | "review"
  | "confirmReady"
  | "confirming"
  | "complete"
  | "mismatch"
  | "error"
  | "unsupported";

const MAX_LISTENING_TIME_MS = 14_000;

function normalizeSpell(spell: string) {
  return spell.trim().toLowerCase().replace(/\s+/g, " ");
}

export default function LockModal({
  isLockMode,
  isSaving,
  onClose,
  onConfirm,
}: LockModalProps) {
  const [nextIsLockMode, setNextIsLockMode] = useState<boolean>(isLockMode);
  const [spell, setSpell] = useState<string>("");
  const [step, setStep] = useState<RecorderStep>("ready");
  const [recordedSpell, setRecordedSpell] = useState<string>("");
  const [spokenSpell, setSpokenSpell] = useState<string>("");
  const recognitionSessionRef = useRef<SpeechRecognitionSession | null>(null);
  const recordedSpellRef = useRef<string>("");
  const modeRef = useRef<"record" | "confirm">("record");
  const needsCompletedSpell = nextIsLockMode && !spell;
  const isListening = step === "recording" || step === "confirming";
  const displayedSpell =
    step === "confirming" || step === "mismatch" ? spokenSpell : recordedSpell;
  const spellDisplayText = !nextIsLockMode
    ? "Enable lock mode to record"
    : step === "confirmReady"
      ? "Say the spell again to confirm"
      : step === "complete"
        ? "Matching!"
        : step === "mismatch"
          ? "The spells do not match"
          : displayedSpell ||
            (isListening
              ? "Listening..."
              : "Click on the mic and say your spell");

  useEffect(() => {
    return () => {
      recognitionSessionRef.current?.abort();
    };
  }, []);

  const resetRecording = () => {
    recognitionSessionRef.current?.abort();
    recognitionSessionRef.current = null;
    recordedSpellRef.current = "";
    setSpell("");
    setRecordedSpell("");
    setSpokenSpell("");
    setStep("ready");
  };

  const finishListening = (transcript: string) => {
    recognitionSessionRef.current = null;

    if (!transcript) {
      setStep("error");
      return;
    }

    if (modeRef.current === "record") {
      recordedSpellRef.current = transcript;
      setRecordedSpell(transcript);
      setStep("review");
      return;
    }

    setSpokenSpell(transcript);

    if (
      normalizeSpell(transcript) === normalizeSpell(recordedSpellRef.current)
    ) {
      setSpell(recordedSpellRef.current);
      setStep("complete");
      return;
    }

    setSpell("");
    setStep("mismatch");
  };

  const startListening = (mode: "record" | "confirm") => {
    if (isSaving || !nextIsLockMode) {
      return;
    }

    modeRef.current = mode;
    setSpell("");
    setSpokenSpell("");

    if (mode === "record") {
      recordedSpellRef.current = "";
      setRecordedSpell("");
    }

    setStep(mode === "record" ? "recording" : "confirming");

    const result = startSpeechRecognition({
      maxListeningTimeMs: MAX_LISTENING_TIME_MS,
      onTranscript: (transcript) => {
        if (mode === "record") {
          setRecordedSpell(transcript);
          return;
        }

        setSpokenSpell(transcript);
      },
      onComplete: finishListening,
      onError: () => {
        recognitionSessionRef.current = null;
        setStep("error");
      },
    });

    if (!result.ok) {
      setStep(result.reason === "unsupported" ? "unsupported" : "error");
      return;
    }

    recognitionSessionRef.current = result.session;
  };

  const handleMicClick = () => {
    if (isListening) {
      recognitionSessionRef.current?.stop();
      return;
    }

    startListening(step === "confirmReady" ? "confirm" : "record");
  };

  return (
    <ModalSimple
      title="Lock Mode"
      onClose={onClose}
      footer={
        <>
          <HeartButton
            heartColor="black"
            disabled={isSaving || needsCompletedSpell}
            ariaLabel="Confirm"
            label={isSaving ? "Saving" : "Confirm"}
            onClick={() => onConfirm(nextIsLockMode)}
          />
          <HeartButton
            heartColor="white"
            disabled={isSaving}
            ariaLabel="Cancel"
            label="Cancel"
            onClick={onClose}
          />
        </>
      }
    >
      <div className="max-w-[75%] flex flex-col gap-4">
        <label className="flex items-center gap-2 text-white text-md">
          <input
            type="checkbox"
            checked={nextIsLockMode}
            disabled={isSaving}
            onChange={(event) => setNextIsLockMode(event.target.checked)}
          />
          Use Lock Mode
        </label>
        <div className="text-sm">
          <p>{"This will be your spell to unlock your pendant."}</p>
          <div className="flex-row flex gap-3">
            <p>Make sure you can</p>
            <p className="text-shadow">{` pronounce `}</p>
            <p className="text-sm whitespace-pre-line">it!</p>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 items-center mt-2 bg-background/60 border border-white py-4 rounded">
          {(step === "ready" ||
            step === "recording" ||
            step === "confirmReady" ||
            step === "confirming") && (
            <button
              type="button"
              className={`disabled:hover:!bg-white/30 disabled:!cursor-default black-button h-full px-2 aspect-square disabled:opacity-60 ${
                isListening ? "animate-pulse" : ""
              }`}
              disabled={isSaving || !nextIsLockMode}
              aria-pressed={isListening}
              aria-label={
                isListening
                  ? "Stop listening"
                  : step === "confirmReady"
                    ? "Record spell again"
                    : "Start listening"
              }
              onClick={handleMicClick}
            >
              <Mic className="w-6 h-6 text-black" />
            </button>
          )}

          {isListening && (
            <div className="flex items-center gap-1" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span className="h-2 w-2 rounded-full bg-white animate-pulse [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-white animate-pulse [animation-delay:300ms]" />
            </div>
          )}

          <p className="text-center text-white text-shadow h-fit px-2 w-full text-md min-h-8">
            {spellDisplayText}
          </p>

          {step === "review" && (
            <div className="flex items-center gap-2">
              <p className="text-sm">Is this correct?</p>
              <button
                type="button"
                className="black-button px-2 aspect-square"
                aria-label="Spell is correct"
                onClick={() => {
                  setSpokenSpell("");
                  setStep("confirmReady");
                }}
              >
                <Check className="w-5 h-5 text-black" />
              </button>
              <button
                type="button"
                className="black-button px-2 aspect-square"
                aria-label="Spell is not correct"
                onClick={resetRecording}
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
          )}

          {step === "complete" && (
            <div className="flex items-center gap-2 text-sm">
              <p>Start over?</p>
              <button
                type="button"
                className="black-button px-2 aspect-square"
                aria-label="Record a different spell"
                onClick={resetRecording}
              >
                <RotateCcw className="w-5 h-5 text-black" />
              </button>
            </div>
          )}

          {step === "mismatch" && (
            <div className="flex items-center gap-2 text-sm">
              <button
                type="button"
                className="black-button px-2 aspect-square"
                aria-label="Try recording again"
                onClick={resetRecording}
              >
                <RotateCcw className="w-5 h-5 text-black" />
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="flex items-center gap-2 text-sm">
              <p>No spell was recorded.</p>
              <button
                type="button"
                className="black-button px-2 aspect-square"
                aria-label="Try recording again"
                onClick={resetRecording}
              >
                <RotateCcw className="w-5 h-5 text-black" />
              </button>
            </div>
          )}

          {step === "unsupported" && (
            <p className="text-sm">
              Speech recognition is not supported in this browser.
            </p>
          )}
        </div>
        {spell && (
          <div className="flex flex-col text-sm text-left gap-2 mt-2 ">
            <div className="flex flex-row items-center gap-1">
              <p>Your Spell</p>
              <Sparkles className="inline w-5 h-5 text-yellow-400" />
            </div>
            <p className="bg-night/50 px-2 rounded text-md">{spell}</p>
          </div>
        )}
      </div>
    </ModalSimple>
  );
}
