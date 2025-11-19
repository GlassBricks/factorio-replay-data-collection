// this is the entry point for the TEST mod
// for the actual script, see main.ts

if ("factorio-test" in script.active_mods) {
  require("@NoResolution:__factorio-test__/init")(getProjectFilesMatchingRegex("-test\\.tsx?$"), {
    load_luassert: false,
    before_test_run() {
      game.forces.player.enable_all_recipes()
      game.tick_paused = false
    },
  })
}
