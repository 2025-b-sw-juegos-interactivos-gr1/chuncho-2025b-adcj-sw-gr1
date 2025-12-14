import { CONFIG } from "../utils/config.js";

export class ZoneSystem {
  constructor(scene) {
    this.scene = scene;
    this.zoneMesh = null;
  }

  createZone() {
    // Zona simple como ejemplo (caja transparente)
    this.zoneMesh = BABYLON.MeshBuilder.CreateBox(
      "deliveryZone",
      { size: CONFIG.ZONE?.SIZE ?? 10 },
      this.scene
    );

    this.zoneMesh.position = new BABYLON.Vector3(
      CONFIG.ZONE?.POSITION?.x ?? 0,
      CONFIG.ZONE?.POSITION?.y ?? 0,
      CONFIG.ZONE?.POSITION?.z ?? 30
    );

    const mat = new BABYLON.StandardMaterial("zoneMat", this.scene);
    mat.diffuseColor = new BABYLON.Color3(0, 1, 0);
    mat.alpha = 0.3;
    this.zoneMesh.material = mat;

    this.zoneMesh.isPickable = false;

    // Parentar al mundo
    const worldRoot = this.scene.metadata?.worldRoot;
    if (worldRoot) this.zoneMesh.parent = worldRoot;
  }
}
