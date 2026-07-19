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

type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
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

export function startSpeechRecognition({
  maxListeningTimeMs,
  onTranscript,
  onComplete,
  onError,
  lang = navigator.language || "en-US",
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
  let listeningTimeout: number | null = null;

  const clearListeningTimeout = () => {
    if (listeningTimeout !== null) {
      window.clearTimeout(listeningTimeout);
      listeningTimeout = null;
    }
  };

  const complete = () => {
    if (isSettled) {
      return;
    }

    isSettled = true;
    clearListeningTimeout();
    onComplete(transcript.trim());
  };

  const fail = () => {
    if (isSettled) {
      return;
    }

    isSettled = true;
    clearListeningTimeout();
    onError();
  };

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = lang;

  recognition.onresult = (event) => {
    let nextTranscript = "";

    for (let index = 0; index < event.results.length; index += 1) {
      nextTranscript += event.results[index][0].transcript;
    }

    transcript = nextTranscript.trim();
    onTranscript(transcript);
  };

  recognition.onend = complete;
  recognition.onerror = fail;

  try {
    recognition.start();
  } catch {
    return { ok: false, reason: "start-failed" };
  }

  listeningTimeout = window.setTimeout(() => {
    recognition.stop();
  }, maxListeningTimeMs);

  return {
    ok: true,
    session: {
      stop: () => {
        recognition.stop();
      },
      abort: () => {
        isSettled = true;
        clearListeningTimeout();
        recognition.stop();
      },
    },
  };
}
