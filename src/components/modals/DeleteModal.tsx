import { Modal } from "@/ui";

interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <Modal
      title="Delete Note?"
      description="This action cannot be undone"
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className="bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">No</span>
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">Yes</span>
          </button>
        </>
      }
    />
  );
}
