import type { User } from "firebase/auth";

const apiUrl =
  process.env.NEXT_PUBLIC_CONTENT_API_URL ?? "http://localhost:8000";

type ApiProblem = {
  code?: string;
  detail?: string;
  request_id?: string;
};

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

export function requiresAdminReauthentication(error: unknown): boolean {
  return (
    error instanceof AdminApiError &&
    (error.status === 401 || error.message.startsWith("เซสชันผู้ดูแล"))
  );
}

function friendlyError(problem: ApiProblem | null, status: number) {
  const reference = problem?.request_id
    ? ` รหัสอ้างอิง: ${problem.request_id}`
    : "";
  if (status === 403 && problem?.detail === "admin authorization is required") {
    return `บัญชีนี้ยังไม่มีสิทธิ์ผู้ดูแล กรุณาให้ผู้ดูแลระบบกำหนดสิทธิ์ admin=true${reference}`;
  }
  if (status === 401 || status === 403) {
    return `เซสชันผู้ดูแลหมดอายุหรือไม่ตรงกับระบบ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่${reference}`;
  }
  if (problem?.detail === "upload exceeds the configured size limit") {
    return `มีไฟล์ภาพขนาดเกิน 10 MB กรุณาลดขนาดไฟล์แล้วเลือกใหม่${reference}`;
  }
  if (problem?.code === "request_validation") {
    return `ระบบไม่สามารถบันทึกข้อมูลที่ส่งมาได้ กรุณาลองใหม่ หากยังพบปัญหาให้แจ้งรหัสอ้างอิงนี้${reference}`;
  }
  return `${problem?.detail ?? "เชื่อมต่อ Content API ไม่สำเร็จ"}${reference}`;
}

async function request(
  user: User,
  path: string,
  init: RequestInit,
  forceRefresh: boolean,
): Promise<Response> {
  let token: string;
  try {
    token = await user.getIdToken(forceRefresh);
  } catch {
    throw new AdminApiError(
      "ไม่สามารถยืนยันเซสชันผู้ดูแลได้ กรุณาออกจากระบบแล้วเข้าสู่ระบบใหม่",
      401,
    );
  }
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers,
  });
  if (response.ok) return response;
  if (!forceRefresh && (response.status === 401 || response.status === 403)) {
    return request(user, path, init, true);
  }
  const problem = (await response
    .json()
    .catch(() => null)) as ApiProblem | null;
  throw new AdminApiError(
    friendlyError(problem, response.status),
    response.status,
    problem?.request_id,
  );
}

export async function adminApi<T>(
  user: User,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await request(user, path, init, false);
  return response.json() as Promise<T>;
}

export type AdminDownload = Readonly<{
  blob: Blob;
  filename: string;
  exportId: string | null;
  recordCount: number | null;
}>;

function downloadFilename(contentDisposition: string | null): string {
  const filename = contentDisposition?.match(/filename="([^"\\/]+)"/i)?.[1];
  return (
    filename || `DD_BOX_Leads_${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}

export async function adminDownload(
  user: User,
  path: string,
): Promise<AdminDownload> {
  const response = await request(
    user,
    path,
    {
      method: "GET",
      headers: {
        Accept:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    },
    false,
  );
  const rawCount = response.headers.get("X-DDBox-Record-Count");
  const parsedCount =
    rawCount === null ? Number.NaN : Number.parseInt(rawCount, 10);
  return {
    blob: await response.blob(),
    filename: downloadFilename(response.headers.get("Content-Disposition")),
    exportId: response.headers.get("X-DDBox-Export-ID"),
    recordCount:
      Number.isInteger(parsedCount) && parsedCount >= 0 ? parsedCount : null,
  };
}
