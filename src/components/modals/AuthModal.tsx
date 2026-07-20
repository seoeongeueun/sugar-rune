import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { signInWithEmail, signUpWithEmail } from "@/features";
import { Modal } from "@/ui";
import { getErrorMessage } from "@/lib";

interface LoginFormValues {
  username: string;
  email: string;
  password: string;
}

type AuthModalProps = {
  onCreateAccount?: () => void;
};

export function AuthModal({ onCreateAccount }: AuthModalProps) {
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  const signUpMutation = useMutation({ mutationFn: signUpWithEmail });
  const signInMutation = useMutation({ mutationFn: signInWithEmail });

  const isSignupMode = authMode === "signup";
  const isSubmitting = signUpMutation.isPending || signInMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { username: "", email: "", password: "" },
  });

  const handlePrimaryAction = handleSubmit(async (values) => {
    if (isSignupMode) {
      // send API request to sign up the user
      await signUpMutation.mutateAsync({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      onCreateAccount?.();
      return;
    }
    await signInMutation.mutateAsync({
      email: values.email,
      password: values.password,
    });
  });

  const activeMutation = isSignupMode ? signUpMutation : signInMutation;
  const errorMessage = activeMutation.isError
    ? getErrorMessage(activeMutation.error)
    : null;
  const signedInUsername =
    signInMutation.data?.user?.user_metadata?.username?.toString().trim() ||
    null;

  const resetAuthState = (nextMode: "login" | "signup" = "signup") => {
    setAuthMode(nextMode);
    signUpMutation.reset();
    signInMutation.reset();
    reset();
  };

  return (
    <Modal
      isSimple={false}
      title="Sugar Heart"
      description="Le récit de l'apprentie sorcière"
      footer={
        <>
          <button
            form="auth-form"
            type="submit"
            disabled={isSubmitting}
            className="whitespace-nowrap text-shadow bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">Confirm</span>
          </button>
          <button
            type="button"
            onClick={() => reset()}
            className="whitespace-nowrap text-shadow bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">Clear</span>
          </button>
        </>
      }
    >
      <form
        id="auth-form"
        onSubmit={handlePrimaryAction}
        className="flex flex-col gap-2 w-full tablet:px-8 font-sonmat tracking-wide"
      >
        <div className="w-full flex flex-col">
          <input
            type="email"
            placeholder="Email"
            aria-invalid={errors.email ? "true" : "false"}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+\.\S+$/,
                message: "Use a valid email format",
              },
            })}
            className="tablet:p-1 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
          />
          {errors.email && (
            <p className="px-1 text-md text-background font-medium">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="w-full flex flex-col">
          <input
            type="password"
            placeholder="Password"
            aria-invalid={errors.password ? "true" : "false"}
            {...register("password", {
              required: "Password is required",
              minLength: {
                value: 6,
                message: "Password must be at least 6 characters",
              },
            })}
            className="tablet:p-1 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
          />
          {errors.password && (
            <p className="px-1 text-md text-background font-medium">
              {errors.password.message}
            </p>
          )}
        </div>
        {isSignupMode && (
          <div className="w-full flex flex-col">
            <input
              type="text"
              placeholder="Witch name"
              aria-invalid={errors.username ? "true" : "false"}
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 2,
                  message: "Username must be at least 2 characters",
                },
              })}
              className="tablet:p-1 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
            />
            {errors.username && (
              <p className="px-1 text-md text-background font-medium">
                {errors.username.message}
              </p>
            )}
          </div>
        )}
        {errorMessage && (
          <p className="mt-2 px-1 text-md text-background font-medium">
            {errorMessage}
          </p>
        )}
        {activeMutation.isSuccess && (
          <p className="mt-2 px-1 text-lg text-white text-center">
            {isSignupMode
              ? "Sign up complete. Check your email verification link."
              : `Welcome back, ${signedInUsername}!`}
          </p>
        )}
        {!activeMutation.isSuccess && (
          <button
            type="button"
            onClick={() => {
              resetAuthState(isSignupMode ? "login" : "signup");
            }}
            className="text-lg font-sonmat underline underline-offset-3 mt-4 hover:text-background transition-colors duration-100 text-white w-fit px-8 self-center text-center"
          >
            {isSignupMode ? "I already have an account" : "Make a new account"}
          </button>
        )}
      </form>
    </Modal>
  );
}
