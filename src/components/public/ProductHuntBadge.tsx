const PRODUCT_HUNT_HREF =
  "https://www.producthunt.com/products/summify-3?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-summify-6";

const PRODUCT_HUNT_IMG_SRC =
  "https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1151203&theme=dark&t=1779281447486";

/** Official Product Hunt featured badge — marketing pages only. */
export function ProductHuntBadge() {
  return (
    <div className="mt-7 flex w-full justify-center lg:justify-start">
      <a
        href={PRODUCT_HUNT_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block max-w-[250px] opacity-80 transition-opacity duration-200 hover:opacity-100"
      >
        <img
          alt="Summify - Turn long sources into summaries, mind maps, learning cards. | Product Hunt"
          width={250}
          height={54}
          src={PRODUCT_HUNT_IMG_SRC}
          className="h-auto w-full max-w-[250px]"
        />
      </a>
    </div>
  );
}
