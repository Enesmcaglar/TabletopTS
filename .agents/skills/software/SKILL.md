I am developing a TypeScript-based web game with threejs. We will have online features and physics in our game.

To ensure the code is highly scalable, understandable, and maintainable, you MUST strictly adhere to the following software architecture principles:

1. ECS (Entity Component System) Architecture:
- Always prioritize Composition over Inheritance. Do not use deep class inheritance hierarchies.

2. High Cohesion & Low Coupling:
- Every Component and System must have a single, highly focused responsibility (High Cohesion).
- Systems must not directly depend on or call each other (Low Coupling). Inter-system communication must happen exclusively by modifying Component data or via a decoupled Event/Pub-Sub emitter.

3. Clean TypeScript Coding Standards:
- Do not use the 'any' type under any circumstances. Everything must be strictly typed with interfaces or types.
- Use explicit, self-explanatory naming conventions for all variables and functions (e.g., use 'distanceFromPlayer' instead of 'd').
- Functions must follow the Single Responsibility Principle and should not exceed 20 lines of code.

Desired Mechanic to Implement:
It will be just like tabletop simulator. We will be using certain prefabs (like cards, card slots etc.) and basicly players will play the games themselves, there will be no game mechanic just sandbox.

Please first explain the architecture (the Entities, Components, and Systems you will design), and then provide the fully modular TypeScript code.
