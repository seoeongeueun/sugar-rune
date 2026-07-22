type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResult = {
  [index: number]: SpeechRecognitionResultItem;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionErrorEvent = {
  error?: string;
};

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  abort?: () => void;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export type SpeechRecognitionSession = {
  stop: () => void;
  abort: () => void;
};

export type SpeechRecognitionStartResult =
  | {
      ok: true;
      session: SpeechRecognitionSession;
    }
  | {
      ok: false;
      reason: "unsupported" | "start-failed";
    };

type StartSpeechRecognitionOptions = {
  maxListeningTimeMs: number;
  onTranscript: (transcript: string) => void;
  onComplete: (transcript: string) => void;
  onError: () => void;
  lang?: string;
};

const EMPTY_TRANSCRIPT_RESTART_WINDOW_MS = 1_500;
const NO_SPEECH_TIMEOUT_MS = 3_000; // Time to wait for speech before stopping the session

export function getSpeechRecognitionLanguage(preferredLanguage?: string) {
  if (preferredLanguage) {
    return preferredLanguage;
  }

  if (typeof navigator === "undefined") {
    return "en-US";
  }

  return navigator.languages?.[0] || navigator.language || "en-US";
}

export function startSpeechRecognition({
  maxListeningTimeMs,
  onTranscript,
  onComplete,
  onError,
  lang = getSpeechRecognitionLanguage(),
}: StartSpeechRecognitionOptions): SpeechRecognitionStartResult {
  const SpeechRecognition =
    (window as SpeechRecognitionWindow).SpeechRecognition ??
    (window as SpeechRecognitionWindow).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    return { ok: false, reason: "unsupported" };
  }

  const recognition = new SpeechRecognition();
  let transcript = "";
  let isSettled = false;
  let isStopRequested = false;
  const sessionStartedAt = Date.now();
  let listeningTimeout: number | null = null;
  let noSpeechTimeout: number | null = null;

  const clearListeningTimeout = () => {
    if (listeningTimeout !== null) {
      window.clearTimeout(listeningTimeout);
      listeningTimeout = null;
    }
  };

  const clearNoSpeechTimeout = () => {
    if (noSpeechTimeout !== null) {
      window.clearTimeout(noSpeechTimeout);
      noSpeechTimeout = null;
    }
  };

  const complete = () => {
    if (isSettled) {
      return;
    }

    if (
      !isStopRequested &&
      !transcript.trim() &&
      Date.now() - sessionStartedAt < EMPTY_TRANSCRIPT_RESTART_WINDOW_MS
    ) {
      try {
        recognition.start();
        return;
      } catch {
        // Fall through and report the empty transcript if the browser refuses
        // to restart the session.
      }
    }

    isSettled = true;
    clearListeningTimeout();
    clearNoSpeechTimeout();
    onComplete(transcript.trim());
  };

  const fail = (event: SpeechRecognitionErrorEvent) => {
    if (isSettled) {
      return;
    }

    if (event.error === "no-speech") {
      return;
    }

    isSettled = true;
    clearListeningTimeout();
    clearNoSpeechTimeout();
    onError();
  };

  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event) => {
    let nextTranscript = "";

    for (let index = 0; index < event.results.length; index += 1) {
      nextTranscript += event.results[index][0].transcript;
    }

    transcript = nextTranscript.trim();
    onTranscript(transcript);

    if (transcript) {
      clearNoSpeechTimeout();
    }
  };

  recognition.onend = complete;
  recognition.onerror = fail;

  try {
    recognition.start();
  } catch {
    return { ok: false, reason: "start-failed" };
  }

  listeningTimeout = window.setTimeout(() => {
    isStopRequested = true;
    recognition.stop();
  }, maxListeningTimeMs);

  noSpeechTimeout = window.setTimeout(() => {
    if (!transcript.trim()) {
      isStopRequested = true;
      recognition.stop();
    }
  }, NO_SPEECH_TIMEOUT_MS);

  return {
    ok: true,
    session: {
      stop: () => {
        isStopRequested = true;
        recognition.stop();
      },
      abort: () => {
        isSettled = true;
        clearListeningTimeout();
        clearNoSpeechTimeout();
        recognition.abort?.();
      },
    },
  };
}
