export const CONFIG = {
  MODELS: {
    // =====================
    // SKYBOX / ESPACIO
    // =====================
    SKYBOX: {
      PATH: "./assets/models/deep_space_skybox_16k_with_planets/",
      FILE: "scene.gltf"
    },

    // =====================
    // ESTACIÓN ESPACIAL
    // =====================
    STATION: {
      PATH: "./assets/models/space_station/",
      FILE: "scene.gltf",
      POSITION: { x: 0, y: 0, z: 0 },
      SCALE: 1
    },

    // =====================
    // NAVE DE ENTREGA
    // =====================
    SHIP: {
      PATH: "./assets/models/space_ship_dreadnought/",
      FILE: "scene.gltf",
      POSITION: { x: 100, y: 1, z: 0 },
      SCALE: 4
    },

    // =====================
    // JUGADOR
    // =====================
    PLAYER: {
      PATH: "./assets/models/rust_space_suit/",
      FILE: "scene.gltf",
      POSITION: { x: 90, y: 0, z: 10 },
      SCALE: 3
    },

    // =====================
    // PAQUETE / CAÑÓN
    // =====================
    PACKAGE: {
      PATH: "./assets/models/shedders_cannon/",
      FILE: "scene.gltf",
      POSITION: { x: 0, y: 0, z: -10 },
      SCALE: 1.5
    },

    // =====================
    // CONFIGURACIÓN DEL JUEGO
    // =====================
    GAME: {
      TIME_LIMIT: 30
    }
  },
};
