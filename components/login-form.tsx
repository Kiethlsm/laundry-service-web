"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";
import { Arrow } from "./ui";
export function LoginForm({
  demo,
  roleError,
}: {
  demo: boolean;
  roleError: boolean;
}) {
  const [state, action, pending] = useActionState(login, { error: "" });
  return (
    <form action={action} className="login-form">
      <label>
        Email quản trị
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          placeholder="admin@cuahang.vn"
          disabled={pending}
        />
      </label>
      <label>
        Mật khẩu
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
          disabled={pending}
        />
      </label>
      {(state.error || roleError) && (
        <p className="form-error" role="alert">
          {state.error || "Tài khoản chưa được cấp quyền quản trị."}
        </p>
      )}
      <button className="button full-button" disabled={pending || demo}>
        {pending ? "Đang đăng nhập…" : "Đăng nhập"}
        <Arrow />
      </button>
    </form>
  );
}
