import NextLink from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightToBracket,
  faPenNib,
} from "@fortawesome/free-solid-svg-icons";
import { prisma } from "@/libs/prisma";

export const dynamic = "force-dynamic";

const Page = async () => {
  const publicProfiles = await prisma.user.findMany({
    where: { aboutSlug: { not: null } },
    select: {
      name: true,
      aboutSlug: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return (
    <main>
      <h1 className="text-3xl font-bold">WebSec</h1>

      <p className="mt-2 text-slate-600">
        セッション認証・サインアップ
      </p>

      <div className="mt-8">
        <h2 className="text-xl font-bold">機能一覧</h2>

        <div className="mt-4 flex flex-col gap-y-3">

          <NextLink
            href="/login"
            className="flex items-center rounded border p-3 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faRightToBracket} className="mr-3" />
            <div>
              <div className="font-bold">ログイン</div>
              <div className="text-sm text-slate-500">
                セッション認証
              </div>
            </div>
          </NextLink>

          <NextLink
            href="/signup"
            className="flex items-center rounded border p-3 hover:bg-slate-50"
          >
            <FontAwesomeIcon icon={faPenNib} className="mr-3" />
            <div>
              <div className="font-bold">サインアップ</div>
              <div className="text-sm text-slate-500">
                新規ユーザー登録
              </div>
            </div>
          </NextLink>

        </div>
      </div>
    </main>
  );
};

export default Page;