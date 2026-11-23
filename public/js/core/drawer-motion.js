const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new WeakMap();

document.addEventListener('click', event => {
  const summary = event.target.closest('summary');
  const drawer = summary?.parentElement;
  if (!drawer?.matches('details') || drawer.firstElementChild !== summary || event.defaultPrevented) return;
  if (event.target.closest('a, button, input, select, textarea, label')) return;

  const previous = animations.get(drawer);
  if (!previous && (reducedMotion.matches || !drawer.animate)) return;
  event.preventDefault();

  // Let an opening parent resize naturally when one of its nested drawers is used.
  for (let parent = drawer.parentElement.closest('details'); parent; parent = parent.parentElement.closest('details')) {
    animations.get(parent)?.finish();
  }

  const open = !(previous?.open ?? drawer.open);
  const start = drawer.getBoundingClientRect().height;
  previous?.animation.cancel();
  drawer.open = open;
  const end = drawer.getBoundingClientRect().height;
  if (reducedMotion.matches || start === end) {
    animations.delete(drawer);
    delete drawer.dataset.drawerMotion;
    return;
  }

  drawer.open = true;
  drawer.dataset.drawerMotion = open ? 'opening' : 'closing';
  const animation = drawer.animate(
    { height: [`${start}px`, `${end}px`] },
    { duration: 220, easing: 'cubic-bezier(.2, .75, .25, 1)', fill: 'both' },
  );
  function finish() {
    drawer.open = open;
    delete drawer.dataset.drawerMotion;
    animations.delete(drawer);
    animation.cancel();
  }
  animations.set(drawer, { animation, finish, open });
  animation.onfinish = finish;
});
