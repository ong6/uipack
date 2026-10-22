import { act, renderHook } from "@testing-library/react";
import { useLayerFlight } from "../src/flight";

// A stand-in for a Web Animation: the test decides when it finishes.
function fakeAnimation() {
  let finish!: () => void;
  const finished = new Promise<Animation>((resolve) => {
    finish = () => resolve(animation);
  });
  const animation = { finished, cancel: vi.fn() } as unknown as Animation & { cancel: ReturnType<typeof vi.fn> };
  return { animation, finish };
}

// Let the Promise.all in fly() settle.
const flushPromises = () => act(async () => {});

describe("useLayerFlight", () => {
  it("lands straight away when nothing runs", () => {
    const { result } = renderHook(() => useLayerFlight(() => {}));
    const land = vi.fn();
    result.current.fly([], land);
    expect(land).toHaveBeenCalledTimes(1);
  });

  it("lands once every animation of the flight has finished", async () => {
    const { result } = renderHook(() => useLayerFlight(() => {}));
    const a = fakeAnimation();
    const b = fakeAnimation();
    const land = vi.fn();
    result.current.fly([a.animation, b.animation], land);
    a.finish();
    await flushPromises();
    expect(land).not.toHaveBeenCalled();
    b.finish();
    await flushPromises();
    expect(land).toHaveBeenCalledTimes(1);
  });

  it("never lands an older flight after a newer one, with or without a settle between them", async () => {
    const clear = vi.fn();
    const { result } = renderHook(() => useLayerFlight(clear));
    const first = fakeAnimation();
    const second = fakeAnimation();
    const third = fakeAnimation();
    const landFirst = vi.fn();
    const landSecond = vi.fn();
    const landThird = vi.fn();

    result.current.fly([first.animation], landFirst);
    result.current.settle();
    expect(first.animation.cancel).toHaveBeenCalled();
    expect(clear).toHaveBeenCalledTimes(1);
    result.current.fly([second.animation], landSecond);
    // A newer flight replaces this one even when the owner does not settle first.
    result.current.fly([third.animation], landThird);

    first.finish();
    second.finish();
    await flushPromises();
    expect(landFirst).not.toHaveBeenCalled();
    expect(landSecond).not.toHaveBeenCalled();

    third.finish();
    await flushPromises();
    expect(landThird).toHaveBeenCalledTimes(1);
    expect(result.current.anims.current).toEqual([third.animation]);
  });

  it("cancels the running animations on unmount and never lands into the unmounted owner", async () => {
    const { result, unmount } = renderHook(() => useLayerFlight(() => {}));
    const a = fakeAnimation();
    const land = vi.fn();
    result.current.fly([a.animation], land);
    unmount();
    expect(a.animation.cancel).toHaveBeenCalledTimes(1);
    a.finish();
    await flushPromises();
    expect(land).not.toHaveBeenCalled();
  });

  it("calls the latest clearLayers on settle", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { result, rerender } = renderHook(({ clear }) => useLayerFlight(clear), { initialProps: { clear: first } });
    rerender({ clear: second });
    result.current.settle();
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
