export function RecipePagination({
  currentPage,
  totalPages,
  hasMoreRecipes,
  onPageChange,
  onLoadMore,
  onScrollToTop,
}) {
  const paginationItems = Array.from({ length: totalPages }, (_, index) => index + 1)

  return (
    <section className="mt-6 flex flex-col gap-3">
      <nav
        className="flex flex-wrap items-center justify-center gap-2 self-center"
        aria-label="Пагинация рецептов"
      >
        {paginationItems.map((pageNumber) => (
          pageNumber === currentPage ? (
            <span
              key={pageNumber}
              className="btn-primary pointer-events-none opacity-70"
              aria-current="page"
            >
              {pageNumber}
            </span>
          ) : (
            <button
              key={pageNumber}
              type="button"
              className="btn-secondary"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          )
        ))}
      </nav>

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        {hasMoreRecipes ? (
          <button
            type="button"
            className="btn-secondary col-start-2 justify-self-center"
            onClick={onLoadMore}
          >
            Показать ещё
          </button>
        ) : null}

        <button
          type="button"
          className="btn-secondary col-start-3 justify-self-end"
          onClick={onScrollToTop}
        >
          В начало
        </button>
      </div>
    </section>
  )
}
