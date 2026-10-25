"use client";
import { useState } from "react";
import Link from "next/link";
import type { Category, Service } from "@/lib/types";
import { formatVND, UNIT_LABEL } from "@/lib/format";
import { Arrow, ServiceEmoji } from "./ui";

export function ServiceDial({
  categories,
  services,
}: {
  categories: Category[];
  services: Service[];
}) {
  const [selected, setSelected] = useState(categories[0]?.id || 1);
  const category = categories.find((c) => c.id === selected);
  const service = services
    .filter((s) => s.category_id === selected)
    .reduce(
      (lowest, current) =>
        !lowest || current.price < lowest.price ? current : lowest,
      undefined as Service | undefined,
    );
  return (
    <div className="washer-stage">
      <div className="washer-orbit" aria-hidden="true" />
      <span className="washer-wordmark" aria-hidden="true">
        sạch.
      </span>
      <div className="washer-ground" aria-hidden="true" />
      <div className="washer-model">
        <div className="washer-side washer-side-right" aria-hidden="true" />
        <div className="washer-side washer-side-left" aria-hidden="true" />
        <div className="washer-top" aria-hidden="true" />
        <div className="wash-panel">
          <div className="panel-top">
            <span>Chăm đồ theo cách của bạn</span>
            <span className="panel-lights" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </div>
          <div className="washer-console" aria-hidden="true">
            <span className="washer-drawer" />
            <span className="washer-knob" />
            <span className="washer-screen">sạch sạch.</span>
          </div>
          <div
            className="dial"
            style={
              {
                "--dial-angle": `${(selected - 1) * 60}deg`,
              } as React.CSSProperties
            }
          >
            <span className="dial-marker" aria-hidden="true" />
            <div className="dial-content" aria-live="polite" aria-atomic="true">
              <ServiceEmoji id={selected} />
              <h2>{category?.name || "Dịch vụ"}</h2>
              {service ? (
                <>
                  <p>
                    Từ <strong>{formatVND(service.price)}</strong>
                    <span> / {UNIT_LABEL[service.unit]}</span>
                  </p>
                  <small>Dự kiến {service.est_hours} giờ</small>
                </>
              ) : (
                <p>Chưa có dịch vụ</p>
              )}
            </div>
          </div>
          <div className="dial-choices" role="group" aria-label="Chọn dịch vụ xem nhanh">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected === c.id}
                onClick={() => setSelected(c.id)}
              >
                {c.name}
              </button>
            ))}
          </div>
          <Link
            className="panel-book"
            href={`/dat-lich?nhom=${category?.slug || ""}`}
          >
            Đặt lịch dịch vụ này <Arrow />
          </Link>
          <div className="washer-base" aria-hidden="true">
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  );
}
