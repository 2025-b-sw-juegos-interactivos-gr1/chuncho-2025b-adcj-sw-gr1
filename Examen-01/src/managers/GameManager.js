import { CONFIG } from "../utils/config.js";
import { PlayerController } from "../controllers/PlayerController.js";
import { PackageSystem } from "../systems/PackageSystem.js";

export class GameManager {
  constructor(scene) {
    this.scene = scene;

    this.playerController = null;
    this.packageSystem = null;
    this.shipMesh = null;
    this.shipPrompt = null;
    this.shipCircle = null;

    this.deliveredCount = 0;
    this.inputMap = {};

    const timeLimit = CONFIG.MODELS?.GAME?.TIME_LIMIT ?? 10;

    this.timer = {
      startTime: 0,
      timeLimit,
      timeRemaining: timeLimit,
      isRunning: false,
    };

    this.isInitialized = false;
    this.timerObserver = null;
    this.gameplayObserver = null;
  }

  /* =========================
     INICIALIZACIÓN (UNA VEZ)
     ========================= */
  init() {
    if (this.isInitialized) return;

    this.loadModel(CONFIG.MODELS.STATION);
    this.loadModel(CONFIG.MODELS.SHIP);

    this.playerController = new PlayerController(this.scene);
    this.playerController.loadPlayer();

    this.packageSystem = new PackageSystem(this.scene);
    this.packageSystem.loadPackage();

    this.setupInput();

    this.isInitialized = true;
  }

  /* =========================
     INICIO DE PARTIDA
     ========================= */
  startGame() {
    if (!this.isInitialized) this.init();

    this.resetGame();
    this.startTimer();
    this.updateGameplay();
  }

  /* =========================
     RESET DE PARTIDA
     ========================= */
  resetGame() {
    this.timer.isRunning = false;
    this.timer.startTime = 0;
    this.timer.timeRemaining = this.timer.timeLimit;

    const timerEl = document.getElementById("timer-value");
    if (timerEl) timerEl.textContent = this.timer.timeLimit;

    this.deliveredCount = 0;
    const deliveredEl = document.getElementById("packages-delivered");
    if (deliveredEl) deliveredEl.textContent = "0";

    // Reset jugador
    if (this.playerController?.playerMesh) {
      const p = CONFIG.MODELS.PLAYER.POSITION;
      this.playerController.playerMesh.position.set(p.x, p.y, p.z);
    }

    // Reset paquete
    if (this.packageSystem?.packageMesh) {
      const p = CONFIG.MODELS.PACKAGE.POSITION;
      const worldRoot = this.scene.metadata?.worldRoot;
      this.packageSystem.packageMesh.setParent(worldRoot || null);
      this.packageSystem.packageMesh.position.set(p.x, p.y, p.z);
      this.packageSystem.isCarried = false;
    }
  }

  /* =========================
     INPUT
     ========================= */
  setupInput() {
    // El input ya está configurado en PlayerController
    // Solo necesitamos acceder al inputMap desde ahí
    window.addEventListener('keydown', (evt) => {
      this.inputMap[evt.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (evt) => {
      this.inputMap[evt.key.toLowerCase()] = false;
    });
  }

  /* =========================
     GAMEPLAY PRINCIPAL (E)
     ========================= */
  updateGameplay() {
    if (this.gameplayObserver) {
      this.scene.onBeforeRenderObservable.remove(this.gameplayObserver);
    }

    this.gameplayObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (!this.timer.isRunning) return;
      
      // Validaciones robustas
      if (!this.playerController?.playerMesh) return;
      if (!this.packageSystem?.packageMesh) return;

      const player = this.playerController.playerMesh;
      const pkg = this.packageSystem;
      const worldRoot = this.scene.metadata?.worldRoot;

      // Actualizar indicadores visuales
      if (!pkg.isCarried) {
        pkg.updateProximityIndicators(player);
        if (this.shipPrompt) this.shipPrompt.setEnabled(false);
        this.updateStatusText("Busca el paquete (cañón)");
      } else {
        // Mostrar indicador de la nave si está cerca
        const nearShip = this.shipMesh &&
          BABYLON.Vector3.Distance(
            player.getAbsolutePosition(),
            this.shipMesh.getAbsolutePosition()
          ) < 8;
        
        if (this.shipPrompt) this.shipPrompt.setEnabled(nearShip);
        if (this.shipCircle && this.shipCircle.material) {
          // Hacer que el círculo brille más cuando está cerca con el paquete
          this.shipCircle.material.emissiveColor = nearShip 
            ? new BABYLON.Color3(0, 2, 0) 
            : new BABYLON.Color3(0, 1, 0);
        }
        this.updateStatusText(nearShip ? "¡Entrega el paquete en la nave!" : "Lleva el paquete a la nave");
      }

      // Manejar input E
      if (!this.inputMap["e"]) return;
      this.inputMap["e"] = false;

      // Si el paquete no está siendo cargado, intentamos recogerlo
      if (!pkg.isCarried) {
        if (pkg.isPlayerNear(player)) {
          pkg.pickUp(player);
          console.log("📦 Paquete recogido!");
        } else {
          console.log("⚠️ Demasiado lejos del paquete");
        }
        return;
      }

      // Si el paquete está siendo cargado, lo soltamos o entregamos
      if (pkg.isCarried) {
        const nearShip =
          this.shipMesh &&
          BABYLON.Vector3.Distance(
            player.getAbsolutePosition(),
            this.shipMesh.getAbsolutePosition()
          ) < 8;

        if (nearShip) {
          pkg.deliver(worldRoot); // Entregar el paquete
          this.deliveredCount++;
          const deliveredEl = document.getElementById("packages-delivered");
          if (deliveredEl) {
            deliveredEl.textContent = this.deliveredCount;
          }
          console.log("✅ Paquete entregado! Total:", this.deliveredCount);
        } else {
          pkg.drop(worldRoot); // Soltar el paquete en el suelo
          console.log("📍 Paquete soltado en el suelo");
        }
      }
    });
  }

  updateStatusText(message) {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = `Estado: ${message}`;
    }
  }

  /* =========================
     MODELOS
     ========================= */
  loadModel(modelConfig) {
    BABYLON.SceneLoader.ImportMesh(
      "",
      modelConfig.PATH,
      modelConfig.FILE,
      this.scene,
      (meshes) => {
        const rootMesh = meshes[0];

        rootMesh.position = new BABYLON.Vector3(
          modelConfig.POSITION.x,
          modelConfig.POSITION.y,
          modelConfig.POSITION.z
        );

        rootMesh.scaling = new BABYLON.Vector3(
          modelConfig.SCALE,
          modelConfig.SCALE,
          modelConfig.SCALE
        );

        const worldRoot = this.scene.metadata?.worldRoot;
        if (worldRoot) rootMesh.parent = worldRoot;

        // Guardar referencia a la nave
        if (modelConfig === CONFIG.MODELS.SHIP) {
          this.shipMesh = rootMesh;
        }

        if (modelConfig === CONFIG.MODELS.SHIP) {
          this.createShipBaseCircle(rootMesh);
        }
      }
    );
  }
 
  /* =========================
     Base circular debajo de la nave
     ========================= */
  createShipBaseCircle(shipMesh) {
    const circle = BABYLON.MeshBuilder.CreateDisc(
      "shipBaseCircle",
      { radius: 3, tessellation: 64 },
      this.scene
    );

    const mat = new BABYLON.StandardMaterial("shipCircleMat", this.scene);
    mat.diffuseColor = new BABYLON.Color3(0, 1, 0); // Verde
    mat.emissiveColor = new BABYLON.Color3(0, 1, 0);
    mat.alpha = 0.5;

    circle.material = mat;
    circle.rotation.x = Math.PI / 2;
    circle.position.y = 1;

    circle.parent = shipMesh; // Colocarlo debajo de la nave
    circle.isPickable = false; // No debe interferir con colisiones
    
    this.shipCircle = circle;
    this.createShipPrompt(shipMesh);
  }

  createShipPrompt(shipMesh) {
    // Crear un plano para el texto
    const plane = BABYLON.MeshBuilder.CreatePlane(
      "shipPromptPlane",
      { width: 5, height: 2 },
      this.scene
    );

    // Crear textura dinámica para el texto
    const texture = new BABYLON.DynamicTexture(
      "shipPromptTexture",
      { width: 512, height: 256 },
      this.scene
    );
    
    const ctx = texture.getContext();
    ctx.fillStyle = "rgba(0, 100, 0, 0.8)";
    ctx.fillRect(0, 0, 512, 256);
    
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Pulsa E para entregar", 256, 128);
    
    texture.update();

    const mat = new BABYLON.StandardMaterial("shipPromptMat", this.scene);
    mat.diffuseTexture = texture;
    mat.emissiveTexture = texture;
    mat.opacityTexture = texture;
    mat.backFaceCulling = false;

    plane.material = mat;
    plane.position.y = 8; // Encima de la nave
    plane.parent = shipMesh;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    plane.isPickable = false;

    this.shipPrompt = plane;
    this.shipPrompt.setEnabled(false); // Oculto por defecto
  }

  /* =========================
     TIMER
     ========================= */
  startTimer() {
    if (this.timerObserver) {
      this.scene.onBeforeRenderObservable.remove(this.timerObserver);
    }

    const timerEl = document.getElementById("timer-value");

    this.timer.startTime = Date.now();
    this.timer.isRunning = true;

    this.timerObserver = this.scene.onBeforeRenderObservable.add(() => {
      if (!this.timer.isRunning) return;

      const elapsed = (Date.now() - this.timer.startTime) / 1000;
      this.timer.timeRemaining = Math.max(0, this.timer.timeLimit - elapsed);

      if (timerEl) {
        timerEl.textContent = Math.ceil(this.timer.timeRemaining);
      }

      if (this.timer.timeRemaining <= 0) {
        this.endGame();
      }
    });
  }

  /* =========================
     FIN DE PARTIDA
     ========================= */
  endGame() {
    this.timer.isRunning = false;

    // Calcular estadísticas
    const timeUsed = this.timer.timeLimit - this.timer.timeRemaining;
    const packagesDelivered = this.deliveredCount;
    const averageTime = packagesDelivered > 0 ? (timeUsed / packagesDelivered).toFixed(2) : 0;

    // Actualizar valores en el resumen
    const finalPackages = document.getElementById("final-packages-display");
    if (finalPackages) finalPackages.textContent = packagesDelivered;

    const finalTime = document.getElementById("final-time-display");
    if (finalTime) finalTime.textContent = `${timeUsed.toFixed(1)}s`;

    const averageTimeEl = document.getElementById("average-time-display");
    if (averageTimeEl) {
      averageTimeEl.textContent = packagesDelivered > 0 ? `${averageTime}s` : "--";
    }

    // Mensaje de rendimiento basado en paquetes entregados
    const performanceMsg = document.getElementById("performance-message");
    if (performanceMsg) {
      let message = "";
      if (packagesDelivered === 0) {
        message = "¡No te rindas! Inténtalo de nuevo.";
      } else if (packagesDelivered === 1) {
        message = "¡Buen comienzo! Puedes mejorar.";
      } else if (packagesDelivered === 2) {
        message = "¡Bien hecho! Vas por buen camino.";
      } else if (packagesDelivered === 3) {
        message = "¡Excelente trabajo!";
      } else if (packagesDelivered >= 4) {
        message = "¡INCREÍBLE! ¡Eres un maestro de las entregas!";
      }
      performanceMsg.textContent = message;
    }

    const summary = document.getElementById("summary-screen");
    if (summary) summary.style.display = "flex";
  }
}
