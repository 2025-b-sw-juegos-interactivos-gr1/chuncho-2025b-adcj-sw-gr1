import { CONFIG } from "../utils/config.js";

export class PackageSystem {
  constructor(scene) {
    this.scene = scene;

    this.packageMesh = null;
    this.baseCircle = null;
    this.promptText = null; // Texto "Press E"

    this.isCarried = false;
    this.originPosition = null;
  }

  loadPackage() {
    BABYLON.SceneLoader.ImportMesh(
      "",
      CONFIG.MODELS.PACKAGE.PATH,
      CONFIG.MODELS.PACKAGE.FILE,
      this.scene,
      (meshes) => {
        this.packageMesh = meshes[0];

        this.originPosition = new BABYLON.Vector3(
          CONFIG.MODELS.PACKAGE.POSITION.x,
          CONFIG.MODELS.PACKAGE.POSITION.y,
          CONFIG.MODELS.PACKAGE.POSITION.z
        );

        this.packageMesh.position.copyFrom(this.originPosition);
        this.packageMesh.scaling.scaleInPlace(CONFIG.MODELS.PACKAGE.SCALE);

        const worldRoot = this.scene.metadata?.worldRoot;
        if (worldRoot) this.packageMesh.parent = worldRoot;

        this.createBaseCircle();
        this.createPromptIndicator();
      }
    );
  }

  createBaseCircle() {
    this.baseCircle = BABYLON.MeshBuilder.CreateDisc(
      "packageBaseCircle",
      { radius: 3, tessellation: 48 },
      this.scene
    );

    const mat = new BABYLON.StandardMaterial("packageCircleMat", this.scene);
    mat.diffuseColor = new BABYLON.Color3(1, 0.5, 0);
    mat.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    mat.alpha = 0.6;

    this.baseCircle.material = mat;
    this.baseCircle.rotation.x = Math.PI / 2;
    this.baseCircle.position.y = -1;
    this.baseCircle.parent = this.packageMesh;
    this.baseCircle.isPickable = false;
  }

  createPromptIndicator() {
    // Crear un plano para el texto
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "promptPlane",
      { width: 4, height: 1.5 },
      this.scene
    );

    // Crear textura dinámica para el texto
    const texture = new BABYLON.DynamicTexture(
      "promptTexture",
      { width: 512, height: 256 },
      this.scene
    );
    
    const ctx = texture.getContext();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.font = "bold 80px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Press E", 256, 128);
    
    texture.update();

    const mat = new BABYLON.StandardMaterial("promptMat", this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveTexture = texture;
    mat.opacityTexture = texture;
    mat.backFaceCulling = false;

    plane.material = mat;
    plane.position.y = 4; // Encima del paquete
    plane.parent = this.packageMesh;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL; // Siempre mira a la cámara
    plane.isPickable = false;

    this.promptText = plane;
    this.promptText.setEnabled(false); // Oculto por defecto
  }

  updateProximityIndicators(playerMesh) {
    if (!playerMesh || this.isCarried) {
      if (this.promptText) this.promptText.setEnabled(false);
      if (this.baseCircle) {
        // Color normal naranja
        this.baseCircle.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
      }
      return;
    }

    const isNear = this.isPlayerNear(playerMesh);
    
    // Mostrar/ocultar texto "Press E"
    if (this.promptText) {
      this.promptText.setEnabled(isNear);
    }

    // Cambiar color del círculo cuando está cerca
    if (this.baseCircle && this.baseCircle.material) {
      if (isNear) {
        // Verde brillante cuando puede recogerlo
        this.baseCircle.material.emissiveColor = new BABYLON.Color3(0, 1, 0);
      } else {
        // Color normal naranja
        this.baseCircle.material.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
      }
    }
  }

  isPlayerNear(playerMesh, distance = 4) {
    if (!this.packageMesh || !playerMesh) return false;
    return (
      BABYLON.Vector3.Distance(
        this.packageMesh.getAbsolutePosition(),
        playerMesh.getAbsolutePosition()
      ) < distance
    );
  }

  pickUp(playerMesh) {
    if (this.isCarried) return;

    this.packageMesh.setParent(playerMesh);
    this.packageMesh.position.set(0, 1.5, 1.5); // Posición encima del jugador
    this.isCarried = true;
    
    // Ocultar indicadores
    if (this.promptText) this.promptText.setEnabled(false);
    if (this.baseCircle) this.baseCircle.setEnabled(false);
  }

  drop(worldRoot) {
    if (!this.isCarried) return;

    // Obtener posición actual antes de cambiar el parent
    const currentPos = this.packageMesh.getAbsolutePosition().clone();
    
    this.packageMesh.setParent(worldRoot);
    this.packageMesh.position.copyFrom(currentPos);
    this.packageMesh.position.y = 0; // Lo ponemos en el suelo
    this.isCarried = false;
    
    // Mostrar indicadores de nuevo
    if (this.baseCircle) this.baseCircle.setEnabled(true);
  }

  deliver(worldRoot) {
    this.packageMesh.setParent(worldRoot);
    this.packageMesh.position.copyFrom(this.originPosition); // Reaparece en el origen
    this.isCarried = false;
    
    // Mostrar indicadores de nuevo
    if (this.baseCircle) this.baseCircle.setEnabled(true);
  }
}
