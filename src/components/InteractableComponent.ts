import { defineComponent, Types } from 'bitecs';

export const InteractableComponent = defineComponent({
  isHovered: Types.ui8,
  isSelected: Types.ui8,
  isDragged: Types.ui8,
});
