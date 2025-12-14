import { CONFIG } from "../utils/config.js";

export class PlayerController {
  constructor(scene) {
    this.scene = scene;
    this.playerMesh = null;

    this.speed = 0.17;
    this.inputMap = {};
  }

  loadPlayer() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      CONFIG.MODELS.PLAYER.PATH,
      CONFIG.MODELS.PLAYER.FILE,
      this.scene,
      meshes => {
        this.playerMesh = meshes[0];

        this.playerMesh.position = new BABYLON.Vector3(
          CONFIG.MODELS.PLAYER.POSITION.x,
          CONFIG.MODELS.PLAYER.POSITION.y,
          CONFIG.MODELS.PLAYER.POSITION.z
        );

        this.playerMesh.scaling.scaleInPlace(
          CONFIG.MODELS.PLAYER.SCALE
        );

        const worldRoot = this.scene.metadata?.worldRoot;
        if (worldRoot) this.playerMesh.parent = worldRoot;

        this.setupInput();
        this.enableMovement();
      }
    );
  }

  setupInput() {
    this.scene.actionManager = new BABYLON.ActionManager(this.scene);

    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        evt => {
          this.inputMap[evt.sourceEvent.key.toLowerCase()] = true;
        }
      )
    );

    this.scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        evt => {
          this.inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        }
      )
    );
  }

  enableMovement() {
    this.scene.onBeforeRenderObservable.add(() => {
      if (!this.playerMesh) return;

      if (this.inputMap["w"]) {
        this.playerMesh.position.z += this.speed;
      }
      if (this.inputMap["s"]) {
        this.playerMesh.position.z -= this.speed;
      }
      if (this.inputMap["a"]) {
        this.playerMesh.position.x -= this.speed;
      }
      if (this.inputMap["d"]) {
        this.playerMesh.position.x += this.speed;
      }
    });
  }
}
