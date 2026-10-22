"use client";
import { useActionState } from "react";
import { updateStatus } from "@/app/admin/actions";
import { nextStatuses, STATUS_LABEL, type OrderStatus } from "@/lib/format";
export function StatusForm({
  id,
  status,
}: {
  id: string;
  status: OrderStatus;
}) {
  const [state, action, pending] = useActionState(updateStatus, { error: "" });
  const allowed = nextStatuses(status);
  const forward = allowed.filter((s) => s !== "cancelled");
  return (
    <section className="status-panel">
      <h2>Cập nhật trạng thái</h2>
      {allowed.length ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="expected" value={status} />
          <div className="status-controls">
            <label>
              Trạng thái tiếp theo
              <select name="next" defaultValue={forward[0]} disabled={pending}>
                {forward.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <button className="button" disabled={pending}>
              {pending ? "Đang lưu…" : "Lưu trạng thái"}
            </button>
          </div>
          {allowed.includes("cancelled") && (
            <div className="cancel-controls">
              <label>
                <input type="checkbox" name="confirm_cancel" required={false} />{" "}
                Tôi muốn hủy đơn này
              </label>
              <button
                className="text-button danger"
                name="target"
                value="cancelled"
                disabled={pending}
                onClick={(e) => {
                  const form = e.currentTarget.form;
                  const input = form?.elements.namedItem(
                    "confirm_cancel",
                  ) as HTMLInputElement;
                  if (!input?.checked) {
                    e.preventDefault();
                    input?.focus();
                  }
                }}
              >
                Hủy đơn
              </button>
            </div>
          )}
        </form>
      ) : (
        <p>
          Đơn đã {status === "cancelled" ? "hủy" : "giao xong"}, không còn bước
          chuyển tiếp.
        </p>
      )}
      {state.error && (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="form-success" role="status">
          {state.success}
        </p>
      )}
    </section>
  );
}
