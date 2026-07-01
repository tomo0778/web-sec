"use client";

// ServerAction (Custom Invocation) を利用した実装
// （ /api/signup のようなAPIエンドポイントを実装する必要がない ）

import React, { useState, useEffect, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupRequestSchema, SignupRequest } from "@/app/_types/SignupRequest";
import { TextInputField } from "@/app/_components/TextInputField";
import { ErrorMsgField } from "@/app/_components/ErrorMsgField";
import { Button } from "@/app/_components/Button";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { faSpinner, faPenNib } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { signupServerAction } from "@/app/_actions/signup";

const Page: React.FC = () => {
  const c_Name = "name";
  const c_Email = "email";
  const c_Password = "password";
  const c_ConfirmPassword = "confirmPassword";

  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUpCompleted, setIsSignUpCompleted] = useState(false);

  // フォーム処理関連の準備と設定
  const formMethods = useForm<SignupRequest>({
    mode: "onChange",
    resolver: zodResolver(signupRequestSchema),
  });
  const fieldErrors = formMethods.formState.errors;
  const watchedPassword = useWatch({
    control: formMethods.control,
    name: c_Password,
  });

  // ルートエラー（サーバサイドで発生した認証エラー）の表示設定の関数
  const setRootError = (errorMsg: string) => {
    formMethods.setError("root", {
      type: "manual",
      message: errorMsg,
    });
  };

  // ルートエラーのクリア用 onChange ハンドラ合成
  const { onChange: onEmailChange, ...emailRegister } = formMethods.register(c_Email);
  const { onChange: onPasswordChange, ...passwordRegister } = formMethods.register(c_Password);
  const {
    onChange: onConfirmPasswordChange,
    ...confirmPasswordRegister
  } = formMethods.register(c_ConfirmPassword);
  const clearRootOnChange =
    (originalOnChange: React.ChangeEventHandler<HTMLInputElement>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      originalOnChange(e);
      formMethods.clearErrors("root");
    };

  // サインアップ完了後のリダイレクト処理
  useEffect(() => {
    if (isSignUpCompleted) {
      router.replace(`/login?${c_Email}=${formMethods.getValues(c_Email)}`);
      router.refresh();
      console.log("サインアップ完了");
    }
  }, [formMethods, isSignUpCompleted, router]);

  const getPasswordStrength = (password: string) => {
    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (score <= 2)
      return {
        text: "弱い",
        color: "text-red-500",
      };

    if (score <= 4)
      return {
        text: "普通",
        color: "text-yellow-500",
      };

    return {
      text: "強い",
      color: "text-green-600",
    };
  };

  const strength = getPasswordStrength(watchedPassword || "");

  // フォームの送信処理
  const onSubmit = async (signupRequest: SignupRequest) => {
    try {
      startTransition(async () => {
        // ServerAction (Custom Invocation) の利用
        const res = await signupServerAction(signupRequest);
        if (!res.success) {
          setRootError(res.message);
          return;
        }
        setIsSignUpCompleted(true);
      });
    } catch (e) {
      const errorMsg =
        e instanceof Error ? e.message : "予期せぬエラーが発生しました。";
      setRootError(errorMsg);
    }
  };

  return (
    <main>
      <div className="text-2xl font-bold">
        <FontAwesomeIcon icon={faPenNib} className="mr-1.5" />
        Signup
      </div>
      <form
        noValidate
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="mt-4 flex flex-col gap-y-4"
      >
        <div>
          <label htmlFor={c_Name} className="mb-2 block font-bold">
            表示名
          </label>
          <TextInputField
            {...formMethods.register(c_Name)}
            id={c_Name}
            placeholder="寝屋川 タヌキ"
            type="text"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.name}
            autoComplete="name"
          />
          <ErrorMsgField msg={fieldErrors.name?.message} />
        </div>

        <div>
          <label htmlFor={c_Email} className="mb-2 block font-bold">
            メールアドレス（ログインID）
          </label>
          <TextInputField
            {...emailRegister}
            onChange={clearRootOnChange(onEmailChange)}
            id={c_Email}
            placeholder="name@example.com"
            type="email"
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.email}
            autoComplete="email"
          />
          <ErrorMsgField msg={fieldErrors.email?.message} />
        </div>

        <div>
          <label htmlFor={c_Password} className="mb-2 block font-bold">
            パスワード
          </label>
          <TextInputField
            {...passwordRegister}
            onChange={clearRootOnChange(onPasswordChange)}
            id={c_Password}
            placeholder="*****"
            type={showPassword ? "text" : "password"}
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.password}
            autoComplete="off"
          />
          <ErrorMsgField msg={fieldErrors.password?.message} />
          {watchedPassword && (
            <div className={`mt-1 text-sm ${strength.color}`}>
              パスワード強度：{strength.text}
            </div>
          )}
          <ErrorMsgField msg={fieldErrors.root?.message} />
        </div>

        <div>
          <label htmlFor={c_ConfirmPassword} className="mb-2 block font-bold">
            確認用パスワード
          </label>

          <TextInputField
            {...confirmPasswordRegister}
            onChange={clearRootOnChange(onConfirmPasswordChange)}
            id={c_ConfirmPassword}
            placeholder="*****"
            type={showPassword ? "text" : "password"}
            disabled={isPending || isSignUpCompleted}
            error={!!fieldErrors.confirmPassword}
            autoComplete="off"
          />

          <ErrorMsgField msg={fieldErrors.confirmPassword?.message} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            id="show-password"
            type="checkbox"
            checked={showPassword}
            onChange={(e) => setShowPassword(e.target.checked)}
            disabled={isPending || isSignUpCompleted}
          />
          <label htmlFor="show-password">
            パスワードを表示する
          </label>
        </div>

        <Button
          variant="indigo"
          width="stretch"
          className="tracking-widest"
          isBusy={isPending}
          disabled={
            !formMethods.formState.isValid ||
            isPending ||
            isSignUpCompleted
          }
        >
          登録
        </Button>
      </form>

      {isSignUpCompleted && (
        <div>
          <div className="mt-4 flex items-center gap-x-2">
            <FontAwesomeIcon icon={faSpinner} spin />
            <div>サインアップが完了しました。ログインページに移動します。</div>
          </div>
          <NextLink
            href={`/login?${c_Email}=${formMethods.getValues(c_Email)}`}
            className="text-blue-500 hover:underline"
          >
            自動的に画面が切り替わらないときはこちらをクリックしてください。
          </NextLink>
        </div>
      )}
    </main>
  );
};

export default Page;
