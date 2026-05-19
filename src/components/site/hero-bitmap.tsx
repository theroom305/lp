import Image from "next/image";
import Link from "next/link";

type HeroBitmapProps = Readonly<{
  eyebrow: string;
  title: string;
  intro: string;
  buyHref: string;
  buyLabel: string;
  sellHref: string;
  sellLabel: string;
}>;

const blurDataUrl =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0nMTYnIGhlaWdodD0nMTAnIHZpZXdCb3g9JzAgMCAxNiAxMCcgeG1sbnM9J2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJz48cmVjdCB3aWR0aD0nMTYnIGhlaWdodD0nMTAnIGZpbGw9JyMyZTNhMmMnLz48Y2lyY2xlIGN4PScxMicgY3k9JzMnIHI9JzQnIGZpbGw9JyNiODk1NmEnIG9wYWNpdHk9Jy42Jy8+PHBhdGggZD0nTTAgN2M0LTQgNyAyIDE2LTQgdjdoLTE2eicgZmlsbD0nI2RmYzdhNCcgb3BhY2l0eT0nLjcnLz48L3N2Zz4=";

export function HeroBitmap({
  eyebrow,
  title,
  intro,
  buyHref,
  buyLabel,
  sellHref,
  sellLabel,
}: HeroBitmapProps) {
  return (
    <section className="hero-bitmap" aria-labelledby="home-heading">
      <div className="hero-bitmap-media" data-test-id="hero-bitmap">
        {/* Photo by Jason Briscoe on Unsplash: https://unsplash.com/photos/-eLfQTmDfLk */}
        <Image
          alt=""
          aria-hidden="true"
          blurDataURL={blurDataUrl}
          className="hero-bitmap-image"
          fill
          fetchPriority="high"
          placeholder="blur"
          priority
          quality={40}
          sizes="(min-width: 760px) 52vw, 100vw"
          src="/hero/room305-hero.avif"
          unoptimized
        />
      </div>
      <div className="hero-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="home-heading">{title}</h1>
        <p>{intro}</p>
        <div className="hero-actions" aria-label="Choose your path">
          <Link
            className="button-link button-link-primary"
            href={buyHref}
            data-test-id="hero-buy"
          >
            {buyLabel}
          </Link>
          <Link
            className="button-link"
            href={sellHref}
            data-test-id="hero-sell"
          >
            {sellLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
