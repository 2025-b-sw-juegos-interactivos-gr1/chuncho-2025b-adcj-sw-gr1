// Mini escena de Halloween para Babylon.js Playground
// Se usan geometrías básicas y texturas incluidas en el Playground (ruta "textures/")
export const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    // --- Cámara ---
    const camera = new BABYLON.UniversalCamera("cam", new BABYLON.Vector3(0, 3, -15), scene);
    camera.attachControl(canvas, true);
    camera.speed = 0.6;
    camera.angularSensibility = 3000;
    camera.keysUp = [87];     // W
    camera.keysDown = [83];   // S
    camera.keysLeft = [65];   // A
    camera.keysRight = [68];  // D

    // Habilitar gravedad y colisiones
    camera.checkCollisions = true;

    scene.collisionsEnabled = true;

    // --- Niebla tenue ---
    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.015; // más alto = más niebla
    scene.fogColor = new BABYLON.Color3(0.02, 0.02, 0.03);

    // --- Iluminación general (fría) ---
    const hemi = new BABYLON.HemisphericLight("hemi", new BABYLON.Vector3(0, 1, 0), scene);
    hemi.intensity = 0.3;

    // --- Luna (naranja) + luz ---
    const moon = BABYLON.MeshBuilder.CreateDisc("moon", {radius: 8, tessellation: 64}, scene);
    moon.position = new BABYLON.Vector3(0, 40, 80);
    moon.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
    const moonMat = new BABYLON.StandardMaterial("moonMat", scene);
    moonMat.emissiveColor = new BABYLON.Color3(1, 0.98, 0.98);
    moon.material = moonMat;

    const moonLight = new BABYLON.DirectionalLight("moonLight", new BABYLON.Vector3(0, -1, -0.2), scene);
    moonLight.intensity = 1.0;
    moonLight.diffuse = new BABYLON.Color3(0.25, 0.25, 0.25);
    moonLight.specular = moonLight.diffuse;

    // Volumetric light scattering (opcional, sutil) como halo de la luna
    const vl = new BABYLON.VolumetricLightScatteringPostProcess("godrays", 1.0, camera, moon, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);
    vl.exposure = 0.25;
    vl.decay = 0.98;
    vl.weight = 0.75;

    // --- Suelo ---
    const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 200, height: 200, subdivisions: 64}, scene);
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseTexture = new BABYLON.Texture("textures/grass.png", scene);
    groundMat.diffuseTexture.uScale = groundMat.diffuseTexture.vScale = 40;
    groundMat.specularColor = BABYLON.Color3.Black();
    ground.material = groundMat;
    ground.checkCollisions = true;

    // --- Árboles sencillos (cilindro + esfera) ---
    const treeMatWood = new BABYLON.StandardMaterial("treeWood", scene);
    treeMatWood.diffuseTexture = new BABYLON.Texture("textures/wood.jpg", scene);
    const treeMatLeaves = new BABYLON.StandardMaterial("treeLeaves", scene);
    treeMatLeaves.diffuseColor = new BABYLON.Color3(0.06, 0.3, 0.05);
    treeMatLeaves.specularColor = BABYLON.Color3.Black();

    function makeTree(position) {
        const trunk = BABYLON.MeshBuilder.CreateCylinder("trunk", {height: 5, diameter: 0.6}, scene);
        trunk.position = position.add(new BABYLON.Vector3(0, 2.5, 0));
        trunk.material = treeMatWood;

        const leaves = BABYLON.MeshBuilder.CreateSphere("leaves", {diameter: 4, segments: 8}, scene);
        leaves.position = trunk.position.add(new BABYLON.Vector3(0, 3, 0));
        leaves.material = treeMatLeaves;

        const tree = new BABYLON.TransformNode("treeNode", scene);
        trunk.parent = tree;
        leaves.parent = tree;
        return tree;
    }

    // Disposición aleatoria de árboles alrededor
    // RNG con semilla para resultados reproducibles
function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}}
const rand = mulberry32(12345);
const rng = { next: () => rand() };
    for (let i = 0; i < 80; i++) {
        const r = 30 + rng.next() * 70; // radio desde el centro
        const a = rng.next() * Math.PI * 2;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        const y = 0;
        const t = makeTree(new BABYLON.Vector3(x, y, z));
        t.scaling = new BABYLON.Vector3(0.8 + rng.next(), 0.8 + rng.next() * 1.5, 0.8 + rng.next());
    }

    // --- Calabazas mágicas ---
    const pumpkinMaterial = new BABYLON.StandardMaterial("pumpkinMat", scene);
    pumpkinMaterial.diffuseColor = new BABYLON.Color3(1.0, 0.45, 0.0);
    pumpkinMaterial.emissiveColor = new BABYLON.Color3(0.6, 0.2, 0.0); // leve brillo
    pumpkinMaterial.specularColor = new BABYLON.Color3(0.1, 0.05, 0.02);

    function makePumpkin(name) {
        // Esfera aplanada con detalles simples de tallo
        const body = BABYLON.MeshBuilder.CreateSphere(name + "Body", {diameterX: 1.6, diameterY: 1.2, diameterZ: 1.6, segments: 16}, scene);
        body.material = pumpkinMaterial;

        const stem = BABYLON.MeshBuilder.CreateCylinder(name + "Stem", {height: 0.4, diameter: 0.2}, scene);
        stem.material = treeMatWood;
        stem.position.y = 0.8;

        const pumpkin = new BABYLON.TransformNode(name, scene);
        body.parent = pumpkin;
        stem.parent = pumpkin;

        // Luz suave para que "brille"
        const glow = new BABYLON.PointLight(name + "Light", new BABYLON.Vector3(0, 0.5, 0), scene);
        glow.diffuse = new BABYLON.Color3(1.0, 0.5, 0.2);
        glow.intensity = 0.6;
        glow.range = 8;
        glow.parent = pumpkin;

        return pumpkin;
    }

    const pumpkins = [];
    const numPumpkins = 12;
    for (let i = 0; i < numPumpkins; i++) {
        const px = (rng.next() * 2 - 1) * 60;
        const pz = (rng.next() * 2 - 1) * 60;
        const p = makePumpkin("pumpkin" + i);
        p.position = new BABYLON.Vector3(px, 0.6, pz);
        pumpkins.push(p);
    }

    // --- GUI (puntuación y reloj) ---
    const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    function makeTextBlock(text, top, fontSize) {
        const tb = new BABYLON.GUI.TextBlock();
        tb.text = text;
        tb.color = "#ffd9a3";
        tb.fontSize = fontSize || 22;
        tb.fontFamily = "monospace";
        tb.top = top;
        tb.left = "0px";
        tb.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        tb.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        gui.addControl(tb);
        return tb;
    }

    const title = makeTextBlock("Bosque de Halloween — Recolecta calabazas antes de medianoche", "10px", 20);
    const hud = makeTextBlock("Calabazas: 0/" + numPumpkins + "  |  Tiempo: 90s", "40px", 18);
    const message = makeTextBlock("", "80px", 24);

    // --- Lógica de juego ---
    let collected = 0;
    let timeLeft = 90; // segundos hasta "medianoche"

    // Ayuda visual: resplandor general
    const gl = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 });
    gl.intensity = 0.6;

    // Detección de recogida por proximidad
    const player = camera; // usar la cámara como jugador

    scene.onBeforeRenderObservable.add(() => {
        const dt = scene.getEngine().getDeltaTime() / 1000;
        // Cada ~0.1s, chequea proximidad
        if (scene.getFrameId() % 6 === 0) {
            for (let i = pumpkins.length - 1; i >= 0; i--) {
                const p = pumpkins[i];
                if (!p) continue;
                const dist = BABYLON.Vector3.Distance(p.position, player.position);
                if (dist < 2.0) {
                    // recolectar
                    p.getChildMeshes().forEach(m => m.dispose());
                    p.dispose();
                    pumpkins.splice(i, 1);
                    collected++;
                    hud.text = `Calabazas: ${collected}/${numPumpkins}  |  Tiempo: ${Math.max(0, Math.ceil(timeLeft))}s`;
                }
            }
        }
        // Cuenta regresiva
        timeLeft -= dt;
        if (timeLeft < 0) timeLeft = 0;
        if (scene.getFrameId() % 3 === 0) {
            hud.text = `Calabazas: ${collected}/${numPumpkins}  |  Tiempo: ${Math.max(0, Math.ceil(timeLeft))}s`;
        }
        // Fin del juego
        if (timeLeft <= 0 && !scene._gameOver) {
            scene._gameOver = true;
            if (collected >= numPumpkins) {
                message.text = "¡Victoria! Recolectaste todas antes de medianoche.";
            } else {
                message.text = `Tiempo agotado. Recolectaste ${collected}/${numPumpkins}.`;
            }
        }
        if (collected >= numPumpkins && !scene._gameOver) {
            scene._gameOver = true;
            message.text = "¡Excelente! Has reunido todas las calabazas mágicas.";
        }
    });

    // --- Detalles atmosféricos ---
    // Cielo nocturno simple (gradiente oscuro)
    const sky = BABYLON.MeshBuilder.CreateSphere("sky", {diameter: 1000, sideOrientation: BABYLON.Mesh.BACKSIDE}, scene);
    const skyMat = new BABYLON.StandardMaterial("skyMat", scene);
    const skyTex = new BABYLON.GradientMaterial("skyGrad", scene);
    skyTex.topColor = new BABYLON.Color3(0.02, 0.02, 0.05);
    skyTex.bottomColor = new BABYLON.Color3(0.0, 0.0, 0.0);
    skyTex.offset = 0.5;
    skyTex.smoothness = 1.0;
    sky.material = skyTex;

    // Pequeños menhires/rocas para variedad
    for (let i = 0; i < 25; i++) {
        const rx = (rng.next() * 2 - 1) * 80;
        const rz = (rng.next() * 2 - 1) * 80;
        const rock = BABYLON.MeshBuilder.CreatePolyhedron("rock" + i, {type: 2, size: 1 + rng.next()}, scene);
        rock.position = new BABYLON.Vector3(rx, 0.5, rz);
        rock.rotation = new BABYLON.Vector3(rng.next() * 0.2, rng.next() * Math.PI * 2, rng.next() * 0.2);
        const rm = new BABYLON.StandardMaterial("rm" + i, scene);
        rm.diffuseTexture = new BABYLON.Texture("textures/stone.jpg", scene);
        rm.specularColor = BABYLON.Color3.Black();
        rock.material = rm;
    }

    // --- Sombra suave ---
    const shadowGen = new BABYLON.ShadowGenerator(1024, moonLight);
    shadowGen.useExponentialShadowMap = true;
    shadowGen.bias = 0.001;
    [ground].concat(scene.meshes.filter(m => m.name.startsWith("trunk") || m.name.startsWith("leaves"))).forEach(m => {
        m.receiveShadows = true;
    });
    scene.meshes.filter(m => m.name.includes("leaves") || m.name.includes("trunk") ).forEach(m => shadowGen.addShadowCaster(m));

    // --- Controles de ayuda ---
    const help = new BABYLON.GUI.TextBlock();
    help.text = "Controles: WASD para moverte, mouse para mirar. Acércate a las calabazas para recolectarlas.";
    help.color = "#b4c4ff";
    help.fontSize = 16;
    help.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    help.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    help.top = "-10px";
    gui.addControl(help);

    return scene;
};

// Export para modo módulo del Playground y compatibilidad global
export default createScene;
if (typeof window !== "undefined") { window.createScene = createScene; }