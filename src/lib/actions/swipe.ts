export interface SwipeOptions {
  threshold?: number;
  velocityThreshold?: number;
  touchAction?: string;
}

export interface SwipeEventDetail {
  direction: "left" | "right" | "up" | "down";
  deltaX: number;
  deltaY: number;
  velocity: number;
}

export function swipe(node: HTMLElement, options: SwipeOptions = {}) {
  const threshold = options.threshold ?? 50;
  const velocityThreshold = options.velocityThreshold ?? 0.5;
  const touchAction = options.touchAction ?? "pan-y";

  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let currentX = 0;
  let currentY = 0;
  let isPointerDown = false;
  let activePointerId: number | null = null;

  node.style.touchAction = touchAction;
  node.style.userSelect = "none";
  // Prevent default touch behaviors that might cause cancellation
  node.style.webkitUserSelect = "none";
  node.style.webkitTouchCallout = "none";

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    // Ignore if we already have an active pointer
    if (isPointerDown && activePointerId !== null) {
      return;
    }

    // Don't start swipe if the target is a video or its controls
    const target = event.target as HTMLElement;
    if (target.tagName === "VIDEO" || target.closest("video")) {
      return;
    }

    isPointerDown = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    currentX = startX;
    currentY = startY;
    startTime = Date.now();

    try {
      node.setPointerCapture(event.pointerId);
    } catch (e) {
      // Silently fail if pointer capture is not supported
    }

    // Prevent default to avoid browser gestures that might cancel our swipe
    if (event.pointerType === "touch") {
      event.preventDefault();
    }

    node.dispatchEvent(
      new CustomEvent("swipestart", {
        detail: { x: startX, y: startY },
      }),
    );
  }

  function handlePointerMove(event: PointerEvent) {
    if (!isPointerDown || event.pointerId !== activePointerId) return;

    currentX = event.clientX;
    currentY = event.clientY;

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    node.dispatchEvent(
      new CustomEvent("swipemove", {
        detail: { deltaX, deltaY, currentX, currentY },
      }),
    );
  }

  function handlePointerUp(event: PointerEvent) {
    if (!isPointerDown || event.pointerId !== activePointerId) {
      return;
    }

    isPointerDown = false;
    activePointerId = null;

    try {
      node.releasePointerCapture(event.pointerId);
    } catch (e) {
      // Silently fail if pointer release fails
    }

    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const deltaTime = Date.now() - startTime;
    const velocity = Math.sqrt(deltaX ** 2 + deltaY ** 2) / deltaTime;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY && absX > threshold) {
      const direction = deltaX > 0 ? "right" : "left";

      if (velocity > velocityThreshold || absX > threshold) {
        node.dispatchEvent(
          new CustomEvent("swipe", {
            detail: {
              direction,
              deltaX,
              deltaY,
              velocity,
            } as SwipeEventDetail,
          }),
        );

        if (direction === "left") {
          node.dispatchEvent(
            new CustomEvent("swipeleft", {
              detail: { deltaX, deltaY, velocity },
            }),
          );
        } else {
          node.dispatchEvent(
            new CustomEvent("swiperight", {
              detail: { deltaX, deltaY, velocity },
            }),
          );
        }
      }
    } else if (absY > absX && absY > threshold) {
      const direction = deltaY > 0 ? "down" : "up";

      if (velocity > velocityThreshold || absY > threshold) {
        node.dispatchEvent(
          new CustomEvent("swipe", {
            detail: {
              direction,
              deltaX,
              deltaY,
              velocity,
            } as SwipeEventDetail,
          }),
        );

        if (direction === "up") {
          node.dispatchEvent(
            new CustomEvent("swipeup", {
              detail: { deltaX, deltaY, velocity },
            }),
          );
        } else {
          node.dispatchEvent(
            new CustomEvent("swipedown", {
              detail: { deltaX, deltaY, velocity },
            }),
          );
        }
      }
    }

    node.dispatchEvent(
      new CustomEvent("swipeend", {
        detail: { deltaX, deltaY, velocity },
      }),
    );
  }

  function handlePointerCancel(event: PointerEvent) {
    if (!isPointerDown || event.pointerId !== activePointerId) {
      return;
    }

    isPointerDown = false;
    activePointerId = null;

    try {
      node.releasePointerCapture(event.pointerId);
    } catch (e) {
      // Silently fail if pointer release fails
    }

    // Pass the current offset in the cancel event so the component can handle it properly
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    node.dispatchEvent(
      new CustomEvent("swipecancel", {
        detail: { deltaX, deltaY },
      }),
    );
  }

  node.addEventListener("pointerdown", handlePointerDown);
  node.addEventListener("pointermove", handlePointerMove);
  node.addEventListener("pointerup", handlePointerUp);
  node.addEventListener("pointercancel", handlePointerCancel);

  return {
    destroy() {
      node.removeEventListener("pointerdown", handlePointerDown);
      node.removeEventListener("pointermove", handlePointerMove);
      node.removeEventListener("pointerup", handlePointerUp);
      node.removeEventListener("pointercancel", handlePointerCancel);
    },
    update(newOptions: SwipeOptions = {}) {
      Object.assign(options, newOptions);
      node.style.touchAction = options.touchAction ?? touchAction;
    },
  };
}
