import { defineComponent } from 'bitecs';

export const CardTag = defineComponent();
export const CardSlotTag = defineComponent();

// Map tracking slotted entities. Only used by Server.
export const CardSlotStorage = new Map<number, number[]>();
// Map mapping card to its slot
export const SlottedCardStorage = new Map<number, number>();
