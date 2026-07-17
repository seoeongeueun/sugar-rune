import {
  getCameraAccessErrorMessage,
  helpPages,
  requestCameraAccess,
} from "@/lib";
import { HEART_LIST } from "@/shared";
import { ModalSimple } from "@/ui";
import { useState } from "react";

type HelpModalProps = {
  isAbout?: boolean;
  onClose: () => void;
  onCameraAccessGranted?: () => void;
};

export default function HelpModal({
  isAbout = false,
  onClose,
  onCameraAccessGranted,
}: HelpModalProps) {
  const [pageIndex, setPageIndex] = useState(
    isAbout ? helpPages.length - 1 : 0,
  );
  const [cameraAccessStatus, setCameraAccessStatus] = useState<
    "idle" | "requesting" | "granted" | "denied"
  >("idle");
  const [cameraAccessMessage, setCameraAccessMessage] = useState("");

  const heartColor = HEART_LIST[pageIndex % HEART_LIST.length].color;
  const isLastPage = pageIndex === helpPages.length - 1;
  const shouldShowCameraAccessButton = pageIndex === 1;

  const handleCameraAccessRequest = async () => {
    try {
      setCameraAccessStatus("requesting");
      setCameraAccessMessage("");
      await requestCameraAccess();
      setCameraAccessStatus("granted");
      setCameraAccessMessage("Camera access granted.");
      onCameraAccessGranted?.();
    } catch (error) {
      console.error("Camera access denied:", error);
      setCameraAccessStatus("denied");
      setCameraAccessMessage(getCameraAccessErrorMessage(error));
    }
  };

  return (
    <ModalSimple
      key={helpPages[pageIndex].page}
      title={helpPages[pageIndex].title}
      heartColor={heartColor}
      description={(isAbout ? "" : helpPages[pageIndex].description) ?? ""}
      footer={
        <>
          {!isAbout && (
            <button
              type="button"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              className="disabled:opacity-30 disabled:!cursor-default bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:not-disabled:brightness-75"
              style={{
                backgroundImage: `url('/hearts/heart_${HEART_LIST[(pageIndex - 1 + HEART_LIST.length) % HEART_LIST.length].color}_icon.png')`,
              }}
            >
              <span className="z-10">Back</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (isLastPage) {
                onClose();
                return;
              }

              setPageIndex((prev) => Math.min(helpPages.length - 1, prev + 1));
            }}
            className="ml-auto bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
            style={{
              backgroundImage: `url('/hearts/heart_${heartColor}_icon.png')`,
            }}
          >
            <span className="z-10">{isLastPage ? "Close" : "Next"}</span>
          </button>
        </>
      }
      onClose={onClose}
    >
      <div className="flex flex-col items-center gap-8 text-lg font-sonmat leading-8 px-2 text-center">
        {helpPages[pageIndex].image && (
          <img
            src={helpPages[pageIndex].image}
            alt={helpPages[pageIndex].title}
            className="rounded black-button max-h-50 object-contain w-fit"
          />
        )}
        <p className="whitespace-pre-line px-2 text-[1.8rem]">
          {helpPages[pageIndex].content}
        </p>
        {shouldShowCameraAccessButton && (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              disabled={cameraAccessStatus === "requesting"}
              onClick={handleCameraAccessRequest}
              className="white-button !aspect-auto w-fit px-4 py-2 text-base disabled:cursor-wait disabled:opacity-60 text-md"
            >
              {cameraAccessStatus === "requesting"
                ? "Opening Camera Prompt..."
                : "Check Camera Access"}
            </button>
            {cameraAccessStatus && (
              <p className="max-w-sm mt-2 text-md leading-5 text-white text-shadow">
                {cameraAccessMessage}
              </p>
            )}
          </div>
        )}
      </div>
    </ModalSimple>
  );
}
