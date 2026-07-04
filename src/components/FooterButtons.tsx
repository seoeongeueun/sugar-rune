export default function FooterButtons() {
  return (
    <div
      id="modal"
      className="pointer-events-none fixed bottom-10 justify-self-center text-white text-lg flex flex-row gap-40"
    >
      <button
        form="auth-form"
        type="submit"
        className="!pointer-events-auto bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">Add</span>
      </button>
      <button
        form="auth-form"
        type="submit"
        className="!pointer-events-auto bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
      >
        <span className="z-10">List</span>
      </button>
    </div>
  );
}
