export function PackageVisual() {
  return (
    <div
      className="package-stage"
      aria-label="ภาพประกอบโครงสร้างกล่องบรรจุภัณฑ์"
    >
      <div className="package-box package-box-large">
        <span>
          YOUR
          <br />
          BRAND
        </span>
      </div>
      <div className="package-box package-box-small">
        <span>DD</span>
      </div>
      <span className="dimension-line dimension-width">กำหนดขนาด</span>
      <span className="dimension-line dimension-material">เลือกวัสดุ</span>
    </div>
  );
}
