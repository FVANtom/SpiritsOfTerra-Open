import { Modules } from '@kaetram/common/network';
import itemData from '@kaetram/server/data/items.json';
import Collection from '@kaetram/server/src/game/entity/collection/collection';
import Item from '@kaetram/server/src/game/entity/objects/item';
import { Blink } from '@kaetram/server/src/network/packets';
import sotItemData from '@kaetram/server/extensions/sot/data/items.json';

import type { Enchantments } from '@kaetram/common/types/item';

/**
 * A class for collections of entities of a certain type in the game.
 */
export default class ItemCollection extends Collection<Item> {
    public override tryLoad(position: Position, key: string): Item | undefined {
        if (!(key in sotItemData) && !(key in itemData)) return undefined;
        return this.spawn({
            key,
            x: position.x,
            y: position.y,
            dropped: false
        });
    }

    public createEntity(params: {
        key: string;
        x: number;
        y: number;
        dropped?: boolean;
        count?: number;
        enchantments?: Enchantments;
        owner?: string;
    }): Item {
        return this.createItem(
            params.key,
            params.x,
            params.y,
            params.dropped,
            params.count,
            params.enchantments,
            params.owner
        );
    }

    // workaround to support default values
    private createItem(
        key: string,
        x: number,
        y: number,
        dropped = false,
        count = 1,
        enchantments: Enchantments = {},
        owner = ''
    ): Item {
        return new Item(key, x, y, dropped, count, enchantments, owner);
    }

    public override onAdd(entity: Item): void {
        // Not the prettiest way of doing it honestly...
        entity.onDespawn(() => this.remove(entity));
        if (entity.dropped) {
            entity.despawn();
            entity.onBlink(() =>
                this.world.push(Modules.PacketType.Broadcast, {
                    packet: new Blink(entity.instance)
                })
            );
        } else entity.onRespawn(() => this.add(entity));
    }

    /**
     * Override for checking if we should remove an entity.
     * @param entity The entity we are removing.
     * @returns Condiitonal on whether or not we should remove the entity.
     */

    public override shouldRemove(entity: Item): boolean {
        if (entity.dropped) return true;

        entity.respawn();

        return true;
    }
}
