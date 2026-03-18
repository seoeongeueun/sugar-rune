import { useForm } from "react-hook-form";

const MODAL_TYPES = {
  delete: {
    title: "Delete Note?",
    description: "This action cannot be undone",
    buttons: [
      {
        label: "No",
        action: () => {},
      },
      {
        label: "Yes",
        action: () => {},
      },
    ],
  },
  login: {
    title: "Sugar Heart",
    description: "Le récit de l'apprentie sorcière",
    buttons: [
      {
        label: "Close",
        action: () => {},
      },
      {
        label: "Log In",
        action: () => {},
      },
    ],
  },
};

interface ModalProps {
  type: keyof typeof MODAL_TYPES;
}

interface LoginFormValues {
  username: string;
  password: string;
}

export function Modal({ type }: ModalProps) {
  const modal = MODAL_TYPES[type];
  const isLoginModal = type === "login";
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handlePrimaryAction = handleSubmit(() => {
    modal.buttons[0].action();
  });

  return (
    <div
      id="modal"
      className="font-alegro fixed inset-0 w-full h-full bg-black/30 flex items-center justify-center z-99"
    >
      <form
        onSubmit={handlePrimaryAction}
        className="text-white pt-16 pl-14 tablet:pt-24 tablet:pl-22 text-lg w-postcard-height h-postcard-height rounded-full bg-night shadow-[20px_20px_0px_30px_var(--gold),21px_21px_10px_34px_rgba(0,0,0,0.2)] tablet:shadow-[30px_30px_0px_40px_var(--gold),31px_31px_20px_44px_rgba(0,0,0,0.2)] drop-shadow-xl flex flex-col items-center justify-center gap-1 tablet:gap-8 border border-white/50"
      >
        <img
          src="/hearts/heart_purple_icon.png"
          alt="Heart Icon"
          aria-hidden="true"
          className="w-8 tablet:w-10 h-auto animate-bounce [animation-duration:1.8s]"
        />
        <header className="flex flex-col items-center justify-center w-full">
          <h1 className="leading-20 font-bold!">{modal.title}</h1>
          <p className="text-center">{modal.description}</p>
        </header>
        {isLoginModal && (
          <div className="flex flex-col w-full tablet:px-8">
            <input
              type="text"
              placeholder="Witch name"
              aria-invalid={errors.username ? "true" : "false"}
              {...register("username", { required: "Username is required" })}
              className="tablet:p-1 mb-2 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
            />
            {errors.username && (
              <p className="px-1 text-md text-background">
                {errors.username.message}
              </p>
            )}
            <input
              type="password"
              placeholder="Password"
              aria-invalid={errors.password ? "true" : "false"}
              {...register("password", { required: "Password is required" })}
              className="tablet:p-1 mt-2 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
            />
            {errors.password && (
              <p className="mt-2 px-1 text-md text-background">
                {errors.password.message}
              </p>
            )}
            <button
              type="button"
              className="underline underline-offset-2 decoration-1 text-background text-lg"
            >
              Make a new account
            </button>
          </div>
        )}
        <footer className="text-lg flex flex-row items-center justify-between gap-2 w-full tablet:w-2/3">
          {/* <button
            type="button"
            className="heart large before:bg-gray-400 after:bg-gray-400"
          >
            <span className="z-10">{modal.buttons[0].label}</span>
          </button>
          <button
            type="button"
            className="heart large before:bg-pink-400 after:bg-pink-400"
          >
            <span className="z-10">{modal.buttons[1].label}</span>
          </button> */}
          <button
            type={isLoginModal ? "submit" : "button"}
            onClick={isLoginModal ? undefined : modal.buttons[0].action}
            className="bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">{modal.buttons[0].label}</span>
          </button>
          <button
            type="button"
            onClick={modal.buttons[1].action}
            className="bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">{modal.buttons[1].label}</span>
          </button>
        </footer>
      </form>
    </div>
  );
}
