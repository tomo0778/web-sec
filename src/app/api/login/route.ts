import { prisma } from "@/libs/prisma";
import { loginRequestSchema } from "@/app/_types/LoginRequest";
import { userProfileSchema } from "@/app/_types/UserProfile";
import type { UserProfile } from "@/app/_types/UserProfile";
import type { ApiResponse } from "@/app/_types/ApiResponse";
import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/app/api/_helper/createSession";
import bcrypt from "bcrypt";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  clearFailedLogin,
} from "@/libs/loginRateLimit";
// キャッシュを無効化して毎回最新情報を取得
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export const POST = async (req: NextRequest) => {
  try {
    const result = loginRequestSchema.safeParse(await req.json());
    if (!result.success) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "リクエストボディの形式が不正です。",
      };
      return NextResponse.json(res);
    }
    const loginRequest = result.data;

    const rateLimit = checkLoginRateLimit(loginRequest.email);

    if (!rateLimit.allowed) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: `ログイン試行回数が多すぎます。${rateLimit.remainingSeconds}秒後に再度お試しください。`,
      };

      return NextResponse.json(res);
    }

    const user = await prisma.user.findUnique({
      where: { email: loginRequest.email },
    });
    if (!user) {
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message: "このメールアドレスは登録されていません。",
        // message: "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    // パスワードの検証
    // ✍ bcrypt でハッシュ化したパスワードを検証するように書き換えよ。
    const isValidPassword = await bcrypt.compare(
      loginRequest.password,
      user.password
    );
    if (!isValidPassword) {
      recordFailedLogin(loginRequest.email);
      const res: ApiResponse<null> = {
        success: false,
        payload: null,
        message:
          "メールアドレスまたはパスワードの組み合わせが正しくありません。",
      };
      return NextResponse.json(res);
    }

    const tokenMaxAgeSeconds = 60 * 60 * 3; // 3時間

    await createSession(user.id, tokenMaxAgeSeconds);

    const res: ApiResponse<UserProfile> = {
      success: true,
      payload: userProfileSchema.parse(user),
      message: "",
    };

    return NextResponse.json(res);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Internal Server Error";
    console.error(errorMsg);
    const res: ApiResponse<null> = {
      success: false,
      payload: null,
      message: "ログインのサーバサイドの処理に失敗しました。",
    };
    return NextResponse.json(res);
  }
};
