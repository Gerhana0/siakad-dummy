"use client";
import { useRef } from "react";

export type Metrics = {
  dwellHoverMs: number; // total waktu kursor berada di area widget
  mouseTraceLen: number; // panjang lintasan kursor (px)
  selections: number; // berapa kali pilihan dibuat/diganti
  optionsDisplayMs: number; // lama daftar opsi terbuka
  firstKeyLatencyMs: number; // fokus input -> ketikan pertama (-1 bila tidak mengetik)
  keystrokes: number;
  misclicks: number; // klik di area widget yang tidak memicu aksi
  totalMs: number; // interaksi pertama -> kelas berhasil diambil
};

export function useTracker() {
  const s = useRef({
    t0: 0, enterAt: 0, openAt: 0, focusAt: 0,
    dwell: 0, trace: 0, sel: 0, optMs: 0, firstKey: -1, keys: 0, miss: 0,
    last: null as null | { x: number; y: number },
  });
  const start = () => {
    if (!s.current.t0) s.current.t0 = performance.now();
  };

  const wrapper = {
    onPointerEnter: () => {
      start();
      s.current.enterAt = performance.now();
    },
    onPointerLeave: () => {
      if (s.current.enterAt) s.current.dwell += performance.now() - s.current.enterAt;
      s.current.enterAt = 0;
      s.current.last = null;
    },
    onPointerMove: (e: React.PointerEvent) => {
      const l = s.current.last;
      if (l) s.current.trace += Math.hypot(e.clientX - l.x, e.clientY - l.y);
      s.current.last = { x: e.clientX, y: e.clientY };
    },
    // Misclick: klik yang tidak mengenai elemen [data-interactive]. Elemen [data-surface] (mis. badan
    // modal) menandai area "kosong" di dalam elemen interaktif seperti latar modal.
    onClick: (e: React.MouseEvent) => {
      const hit = (e.target as HTMLElement).closest("[data-interactive], [data-surface]");
      if (!hit || hit.hasAttribute("data-surface")) s.current.miss++;
    },
  };

  const markOpen = () => {
    start();
    s.current.openAt = performance.now();
  };
  const markClose = () => {
    if (s.current.openAt) s.current.optMs += performance.now() - s.current.openAt;
    s.current.openAt = 0;
  };
  const markSelect = () => {
    start();
    s.current.sel++;
  };
  const markFocus = () => {
    start();
    s.current.focusAt = performance.now();
  };
  const markKey = () => {
    s.current.keys++;
    if (s.current.firstKey < 0 && s.current.focusAt)
      s.current.firstKey = performance.now() - s.current.focusAt;
  };

  const finish = (): Metrics => {
    markClose();
    const now = performance.now();
    if (s.current.enterAt) {
      s.current.dwell += now - s.current.enterAt;
      s.current.enterAt = now;
    }
    return {
      dwellHoverMs: Math.round(s.current.dwell),
      mouseTraceLen: Math.round(s.current.trace),
      selections: s.current.sel,
      optionsDisplayMs: Math.round(s.current.optMs),
      firstKeyLatencyMs: Math.round(s.current.firstKey),
      keystrokes: s.current.keys,
      misclicks: s.current.miss,
      totalMs: s.current.t0 ? Math.round(now - s.current.t0) : 0,
    };
  };

  return { wrapper, markOpen, markClose, markSelect, markFocus, markKey, finish };
}
