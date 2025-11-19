import expect from "tstl-expect"
import PlayerInventory from "../dataCollectors/player-inventory"
import { testDataCollector } from "./test-util"

test("tracks player inventory", () => {
  const player = game.players[1]
  player.get_main_inventory()!.clear()
  const dataCollector = testDataCollector(new PlayerInventory(60))
  after_ticks(60 - 1, () => player.insert({ name: "iron-plate", count: 10 }))
  after_ticks(60 * 2 - 1, () => player.insert({ name: "copper-plate", count: 15 }))
  after_ticks(60 * 2, () => {
    const data = dataCollector.exportData()
    expect(data.players[player.name].inventory).toEqual([
      {},
      { "iron-plate": 10 },
      {
        "iron-plate": 10,
        "copper-plate": 15,
      },
    ])
  })
})

test("tracks player crafting queue", () => {
  const player = game.players[1]
  player.set_controller({
    type: defines.controllers.character,
    character: game.surfaces[1].create_entity({ name: "character", position: { x: 0, y: 0 } }),
  })
  expect(player.controller_type).toBe(defines.controllers.character)

  player.insert({ name: "iron-plate", count: 10 })
  expect(player.begin_crafting({ recipe: "iron-gear-wheel", count: 5 })).toBe(5)
  const dataCollector = testDataCollector(new PlayerInventory(60))
  after_ticks(60 * 2, () => {
    const data = dataCollector.exportData()
    expect(data.players[player.name].craftingQueue).toEqual([
      [{ count: 4, recipe: "iron-gear-wheel", item: "iron-gear-wheel", prerequisite: false }],
      [{ count: 2, recipe: "iron-gear-wheel", item: "iron-gear-wheel", prerequisite: false }],
    ])
    expect(data.players[player.name].craftingEvents).toEqual([
      { time: 30, recipe: "iron-gear-wheel" },
      { time: 61, recipe: "iron-gear-wheel" },
      { time: 92, recipe: "iron-gear-wheel" },
    ])
  })
})
