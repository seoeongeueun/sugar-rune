import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { signInWithEmail, signUpWithEmail } from "@/features";
import { Modal } from "./Modal";
import { getErrorMessage } from "../lib";

interface LoginFormValues {
  username: string;
  email: string;
  password: string;
}

export function AuthModal() {
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
      title="Sugar Heart"
      description="Le récit de l'apprentie sorcière"
      footer={
        <>
          <button
            form="auth-form"
            type="submit"
            disabled={isSubmitting}
            className="bg-[url('/hearts/heart_white_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">{isSignupMode ? "Sign Up" : "Log In"}</span>
          </button>
          <button
            type="button"
            onClick={() => resetAuthState("signup")}
            className="bg-[url('/hearts/heart_purple_icon.png')] bg-no-repeat bg-contain bg-center w-16 h-16 tablet:w-24 tablet:h-24 hover:brightness-75"
          >
            <span className="z-10">Reset</span>
          </button>
        </>
      }
    >
      <form
        id="auth-form"
        onSubmit={handlePrimaryAction}
        className="flex flex-col w-full tablet:px-8"
      >
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
          className="mb-1 tablet:p-1 tablet:mb-3 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
        />
        {errors.email && (
          <p className="px-1 text-md text-background">{errors.email.message}</p>
        )}
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
          className="mb-1 tablet:p-1 tablet:mb-3 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
        />
        {errors.password && (
          <p className="px-1 text-md text-background">
            {errors.password.message}
          </p>
        )}
        {isSignupMode && (
          <>
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
              className="mb-1 tablet:p-1 tablet:mb-3 px-2 tablet:px-4 rounded bg-white/20 border border-white/30 text-lg text-white focus:outline-none focus:ring-1 focus:ring-background"
            />
            {errors.username && (
              <p className="px-1 text-md text-background">
                {errors.username.message}
              </p>
            )}
          </>
        )}
        {errorMessage && (
          <p className="mt-2 px-1 text-md text-background">{errorMessage}</p>
        )}
        {activeMutation.isSuccess && (
          <p className="mt-2 px-1 text-lg text-white text-center">
            {isSignupMode
              ? "Sign up complete. Check your email verification link."
              : `Welcome back, ${signedInUsername}!`}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            resetAuthState(isSignupMode ? "login" : "signup");
          }}
          className="underline underline-offset-2 decoration-1 text-background text-lg"
        >
          {isSignupMode ? "I already have an account" : "Make a new account"}
        </button>
      </form>
    </Modal>
  );
}
