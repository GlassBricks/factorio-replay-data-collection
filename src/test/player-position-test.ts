import expect from "tstl-expect"
import PlayerPosition from "../dataCollectors/player-position"
import { testDataCollector } from "./test-util"

test("player position", () => {
  const player = game.players[1]
  const dc = testDataCollector(new PlayerPosition(10))
  after_ticks(9, () => player.teleport([20, 20]))
  after_ticks(19, () => player.teleport([10, 50]))
  after_ticks(29, () => player.teleport([30, 30]))
  after_ticks(39, () => player.teleport([40, 40]))
  after_ticks(40, () => {
    done()
    const data = dc.exportData()
    expect(data.period).toEqual(10)
    expect(data.players[player.name]).toEqual([
      [20, 20],
      [20, 20],
      [10, 50],
      [30, 30],
      [40, 40],
    ])
  })
})
