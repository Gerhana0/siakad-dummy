"use client";
import Icon from "./Icon";

// Kerangka halaman bergaya SIAKAD. Menu samping hanya hiasan (tidak berfungsi).
const MENU: { icon: string; label: string; open?: boolean; children?: string[] }[] = [
  { icon: "edit", label: "Registrasi" },
  { icon: "book", label: "Mata Kuliah" },
  {
    icon: "edit",
    label: "KRS & KHS",
    open: true,
    children: ["KRS Reguler", "KRS Aktivitas Mahasiswa", "Cetak KRS", "Cek Nilai", "Pendaftaran Seminar", "Pendaftaran Ujian"],
  },
  { icon: "bank", label: "Aktivitas Mahasiswa" },
  { icon: "file", label: "Pengajuan" },
];

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <Icon name="cap" size={22} />
      </span>
      <span className="brand-name">SIAKAD</span>
    </div>
  );
}

export default function Shell({
  title,
  crumbs,
  badge,
  children,
}: {
  title: string;
  crumbs: string[];
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-head">
          <Brand />
          <span className="collapse" aria-hidden>
            <Icon name="chevronLeft" size={16} />
          </span>
        </div>
        <nav aria-label="Menu utama">
          {MENU.map((m) => (
            <div key={m.label} className="nav-group">
              <div className={`nav-item${m.open ? " is-open" : ""}`}>
                <Icon name={m.icon} />
                <span>{m.label}</span>
                <Icon name={m.open ? "chevronUp" : "chevronDown"} size={16} className="nav-caret" />
              </div>
              {m.open && m.children && (
                <ul className="nav-sub">
                  {m.children.map((c, i) => (
                    <li key={c} className={i === 0 ? "is-active" : ""}>
                      {c}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div>
            <h1 className="page-title">
              {title}
              {badge && <span className="round-badge">{badge}</span>}
            </h1>
            <nav className="crumbs" aria-label="Breadcrumb">
              {crumbs.map((c, i) => (
                <span key={c}>
                  {i > 0 && <Icon name="chevronRight" size={14} />}
                  {c}
                </span>
              ))}
            </nav>
          </div>
          <div className="top-actions" aria-hidden>
            <span className="icon-btn">
              <Icon name="moon" />
            </span>
            <span className="icon-btn">
              <Icon name="user" />
            </span>
          </div>
        </header>

        <section className="content">{children}</section>

        <footer className="footer">
          <span>Hak cipta © 2026 SIAKAD Simulasi · Untuk keperluan penelitian</span>
          <span>SIAKAD</span>
        </footer>
      </div>
    </div>
  );
}

export function ProfileCard({ pid }: { pid: string }) {
  return (
    <div className="card profile">
      <div className="avatar" aria-hidden>
        {pid.replace(/\D/g, "").slice(-2) || "P"}
      </div>
      <div>
        <div className="profile-name">Peserta {pid}</div>
        <div className="chips">
          <span className="chip">
            <Icon name="id" size={16} /> {pid}
          </span>
          <span className="chip">
            <Icon name="calendar" size={16} /> Tahun ajaran 2026 · Semester Gasal
          </span>
          <span className="chip">
            <Icon name="id" size={16} /> PA: Dosen Pembimbing Akademik
          </span>
        </div>
      </div>
    </div>
  );
}
