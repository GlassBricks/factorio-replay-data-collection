let testStartTick = 0
let fakeTick: number | typeof nil = nil

export function getTick(): number {
  if (fakeTick != nil) return fakeTick
  return game.tick - testStartTick
}

const after_test: ((this: void, fn: () => void) => void) | undefined = (_G as any).after_test

export function useFakeTime() {
  if (testStartTick != 0) return
  testStartTick = game.tick
  after_test?.(() => {
    testStartTick = 0
    fakeTick = nil
  })
}

export function withFakeTime(fn: () => void) {
  if (fakeTick != nil) {
    fn()
    return
  }
  fakeTick = game.tick - testStartTick
  fn()
  fakeTick = nil
}
