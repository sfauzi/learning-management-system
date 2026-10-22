"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const SLIDES = [
  {
    title: "Telkom University Bandung (TUB)",
    address:
      "Jl. Telekomunikasi. 1, Terusan Buahbatu, Kabupaten Bandung, Jawa Barat 40257",
    link: "https://telkomuniversity.ac.id/",
    img: "/assets/img/tunc-bdg.jpg",
  },
  {
    title: "Telkom University Jakarta (TUJ)",
    address:
      "Jl. Raya Daan Mogot, Kedaung Kali Angke, Kecamatan Cengkareng, Kota Jakarta Barat, DKI Jakarta",
    link: "https://jakarta.telkomuniversity.ac.id/",
    img: "/assets/img/tunc-jkt.jpg",
  },
  {
    title: "Telkom University Purwokerto (TUP)",
    address: "Jalan Pancurawis 53147 Purwokerto Kidul, Jawa Tengah",
    link: "https://purwokerto.telkomuniversity.ac.id/",
    img: "/assets/img/tunc-pwt.jpg",
  },
  {
    title: "Telkom University Surabaya (TUS)",
    address: "Jl. Ketintang, Ketintang, Kec. Gayungan, Surabaya, Jawa Timur",
    link: "https://surabaya.telkomuniversity.ac.id/",
    img: "/assets/img/tunc-sby.jpg",
  },
];

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(timer);
  }, [paused]);

  const go = (dir: number) =>
    setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <section
      className="relative h-[380px] overflow-hidden rounded-2xl bg-brand shadow-[0_4px_14px_rgb(15_23_42/0.08)]"
      aria-label="Campus banner"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className="absolute inset-0 grid grid-cols-1 transition-opacity duration-700 sm:grid-cols-[1.05fr_1fr]"
          style={{ opacity: i === index ? 1 : 0, pointerEvents: i === index ? "auto" : "none" }}
          aria-hidden={i !== index}
        >
          <div className="relative z-10 flex flex-col justify-center gap-3 p-7 sm:p-9">
            <h1 className="text-[26px] font-bold leading-tight text-white sm:text-[30px]">
              {slide.title}
            </h1>
            <p className="max-w-[42ch] text-[13px] leading-relaxed text-white/85">
              {slide.address}
            </p>
            <a
              href={slide.link}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-2 rounded-[10px] bg-white px-4 py-2 text-[13px] font-semibold text-brand transition hover:bg-white/90"
            >
              Show more
              <Icon name="arrowRight" size={15} />
            </a>
          </div>
          <div className="absolute inset-y-0 right-0 hidden w-1/2 sm:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.img}
              alt={slide.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand via-brand/30 to-transparent" />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => go(-1)}
        className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
        aria-label="Previous slide"
      >
        <Icon name="chevronLeft" size={18} />
      </button>
      <button
        type="button"
        onClick={() => go(1)}
        className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/15 p-2 text-white transition hover:bg-white/30"
        aria-label="Next slide"
      >
        <Icon name="chevronRight" size={18} />
      </button>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-1.5 bg-white/45"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
