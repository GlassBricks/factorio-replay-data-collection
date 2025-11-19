import {
  EntityPrototypeFilterWrite,
  LuaEntity,
  nil,
  OnBuiltEntityEvent,
  OnEntityDiedEvent,
  OnPrePlayerMinedItemEvent,
  OnRobotBuiltEntityEvent,
  OnRobotPreMinedEvent,
  ScriptRaisedBuiltEvent,
  UnitNumber,
} from "factorio:runtime"
import { EventHandlers } from "../data-collector"

export default abstract class EntityTracker<T> implements EventHandlers {
  protected prototypes = new LuaSet<string>()

  private prototypeFilters?: EntityPrototypeFilterWrite[]

  protected constructor(...prototypeFilters: EntityPrototypeFilterWrite[]) {
    this.prototypeFilters = prototypeFilters
  }

  on_init() {
    for (const [name] of prototypes.get_entity_filtered(this.prototypeFilters!)) {
      this.prototypes.add(name)
    }
    delete this.prototypeFilters
  }

  trackedEntities: Record<UnitNumber, LuaEntity> = {}
  entityData: { [unitNumber: number]: T } = {}

  protected onCreated(entity: LuaEntity, event: OnBuiltEntityEvent | OnRobotBuiltEntityEvent | ScriptRaisedBuiltEvent) {
    const unitNumber = entity.unit_number
    if (unitNumber && this.prototypes.has(entity.name)) {
      const data = this.initialData(entity, event)
      if (data) {
        this.trackedEntities[unitNumber] = entity
        this.entityData[unitNumber] = data
      }
    }
  }

  protected abstract initialData(
    entity: LuaEntity,
    event: OnBuiltEntityEvent | OnRobotBuiltEntityEvent | ScriptRaisedBuiltEvent,
  ): T | nil

  script_raised_built(event: ScriptRaisedBuiltEvent) {
    this.onCreated(event.entity, event)
  }

  on_built_entity(event: OnBuiltEntityEvent) {
    this.onCreated(event.entity, event)
  }

  on_robot_built_entity(event: OnRobotBuiltEntityEvent) {
    this.onCreated(event.entity, event)
  }

  private onEntityDeleted(
    entity: LuaEntity,
    event: OnPrePlayerMinedItemEvent | OnRobotPreMinedEvent | OnEntityDiedEvent,
  ) {
    const unitNumber = entity.unit_number
    if (!unitNumber) return
    const entry = this.getEntityData(entity, unitNumber)
    if (!entry) return
    this.onDeleted?.(entity, event, entry)
    this.stopTracking(unitNumber)
  }

  protected onDeleted?(
    entity: LuaEntity,
    event: OnPrePlayerMinedItemEvent | OnRobotPreMinedEvent | OnEntityDiedEvent,
    data: T,
  ): void

  protected stopTracking(unitNumber: UnitNumber) {
    delete this.trackedEntities[unitNumber]
  }

  protected removeEntityData(unitNumber: UnitNumber) {
    delete this.entityData[unitNumber]
  }

  on_pre_player_mined_item(event: OnPrePlayerMinedItemEvent) {
    this.onEntityDeleted(event.entity, event)
  }

  on_robot_pre_mined(event: OnRobotPreMinedEvent) {
    this.onEntityDeleted(event.entity, event)
  }

  on_entity_died(event: OnEntityDiedEvent) {
    this.onEntityDeleted(event.entity, event)
  }

  protected getEntityData(entity: LuaEntity, unitNumber?: UnitNumber): T | nil {
    if (!entity.valid) {
      if (unitNumber) {
        delete this.trackedEntities[unitNumber]
      }
      return nil
    }
    unitNumber ??= entity.unit_number
    if (unitNumber) {
      return this.entityData[unitNumber]
    }
    return nil
  }

  protected abstract onPeriodicUpdate(entity: LuaEntity, data: T): void

  on_nth_tick() {
    for (const [unitNumber, entity] of pairs(this.trackedEntities)) {
      const data = this.getEntityData(entity, unitNumber)
      if (data) this.onPeriodicUpdate(entity, data)
    }
  }
}
