import { CONFIG } from "./utils/config.js";
import { GameManager } from "./managers/GameManager.js";

const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);

let gameManager = null;

const createScene = () => {
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1);

  const worldRoot = new BABYLON.TransformNode("worldRoot", scene);
  scene.metadata = { worldRoot };

  // Calcular el centro entre la estación y la nave
  const centerX = (CONFIG.MODELS.STATION.POSITION.x + CONFIG.MODELS.SHIP.POSITION.x) / 2;
  const centerZ = (CONFIG.MODELS.STATION.POSITION.z + CONFIG.MODELS.SHIP.POSITION.z) / 2;
  
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2, // Ángulo horizontal (mirando hacia adelante)
    Math.PI / 2.5, // Ángulo vertical (un poco desde arriba)
    80, // Distancia
    new BABYLON.Vector3(centerX, 5, centerZ), // Target centrado
    scene
  );
  camera.attachControl(canvas, true);
  
  // Límites de la cámara para mejor control
  camera.lowerRadiusLimit = 30;
  camera.upperRadiusLimit = 150;
  camera.lowerBetaLimit = 0.1;
  camera.upperBetaLimit = Math.PI / 2;

  new BABYLON.HemisphericLight(
    "hemiLight",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );

  const shipPos = CONFIG.MODELS.SHIP.POSITION;
  new BABYLON.PointLight(
    "pointLight",
    new BABYLON.Vector3(shipPos.x, shipPos.y, shipPos.z),
    scene
  );

  BABYLON.SceneLoader.Append(
    CONFIG.MODELS.SKYBOX.PATH,
    CONFIG.MODELS.SKYBOX.FILE,
    scene,
    () => {
      scene.meshes.forEach((mesh) => {
        if (mesh.name.toLowerCase().includes("sky")) {
          mesh.infiniteDistance = true;
          mesh.isPickable = false;
        }
      });
    }
  );

  gameManager = new GameManager(scene);

  // Carga assets una sola vez (sin empezar la partida)
  gameManager.init();

  return scene;
};

const scene = createScene();

// UI Buttons
const playButton = document.getElementById("play-button");
const replayButton = document.getElementById("replay-button");
const startScreen = document.getElementById("start-screen");
const summaryScreen = document.getElementById("summary-screen");

if (playButton) {
  playButton.addEventListener("click", () => {
    if (startScreen) startScreen.style.display = "none";
    if (summaryScreen) summaryScreen.style.display = "none";
    gameManager.startGame();
  });
}

if (replayButton) {
  replayButton.addEventListener("click", () => {
    if (summaryScreen) summaryScreen.style.display = "none";
    if (startScreen) startScreen.style.display = "flex";
    gameManager.resetGame();
  });
}

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});
