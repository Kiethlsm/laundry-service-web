import { SHOP } from "@/lib/shop";
export function ShopContact() {
  return (
    <div className="shop-contact">
      <h3>Ghé Sạch Sạch</h3>
      <a className="shop-location" href={SHOP.mapsUrl} target="_blank" rel="noopener noreferrer">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <span><span>{SHOP.address}</span><strong>Mở Google Maps ↗<span className="sr-only"> trong thẻ mới</span></strong></span>
      </a>
      <a className="shop-phone" href={`tel:${SHOP.phone}`}>
        <span>Gọi cửa hàng</span><strong>{SHOP.phone}</strong>
      </a>
    </div>
  );
}
