import * as THREE from 'three';

export interface EggnestEngineConfig {
  canvas: HTMLCanvasElement;
  onProgressChange?: (progress: number, activeSection: number) => void;
  onEggCountChange?: (count: number) => void;
}

export interface EggnestEngineHandle {
  scrollToSection: (index: number) => void;
  setScrollProgress: (prog: number) => void;
  destroy: () => void;
  getSectionProgress: () => number;
}

export function initEggnestSceneEngine(config: EggnestEngineConfig): EggnestEngineHandle {
  const { canvas, onProgressChange, onEggCountChange } = config;

  let animationFrameId: number;
  let isDestroyed = false;
  let running = true;
  let tPrev = performance.now();
  let clock = 0;

  // -------------------------------------------------------------------------
  // 1. Scene, Camera, Renderer
  // -------------------------------------------------------------------------
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0c1f14');
  scene.fog = new THREE.FogExp2('#122b1c', 0.024);

  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.2, 350);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Performance scaling
  const DPR_CAP = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(DPR_CAP);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // -------------------------------------------------------------------------
  // 2. Camera Waypoints & Rig (6 Scenes matching Eggnest Chapters)
  // -------------------------------------------------------------------------
  // 0: Hero - Sunrise wide approach to the farm
  // 1: Kandang - Close up inside the modern coop with brown laying hens
  // 2: Produksi - Macro view of fresh eggs, egg trays, and collection
  // 3: Ekosistem - Orbit showing the complete support ecosystem
  // 4: Farm Hub - Focus on the digital monitoring dashboard
  // 5: Gerakan - Sweeping aerial view of the Indonesian village (1 Rumah 1 Kandang)
  const CAM_WAYPOINTS = [
    { p: [0.0, 3.2, 14.5], t: [0.0, 2.2, -4.0], fov: 40 }, // 0: Hero
    { p: [-2.4, 1.75, 4.6], t: [0.6, 1.85, -1.8], fov: 44 }, // 1: Kandang & Ayam
    { p: [0.8, 1.25, 0.2], t: [-0.3, 1.05, -2.4], fov: 38 }, // 2: Produksi Telur
    { p: [3.4, 2.7, 3.2], t: [0.0, 2.1, -2.0], fov: 44 }, // 3: Ekosistem
    { p: [0.0, 1.95, 2.4], t: [0.0, 1.9, 0.0], fov: 34 }, // 4: Farm Hub
    { p: [0.0, 16.5, 14.0], t: [0.0, 0.5, -26.0], fov: 48 }, // 5: Gerakan Village Aerial
  ];

  const curveP = new THREE.CatmullRomCurve3(
    CAM_WAYPOINTS.map((c) => new THREE.Vector3(c.p[0], c.p[1], c.p[2])),
    false,
    'catmullrom',
    0.42
  );

  const curveT = new THREE.CatmullRomCurve3(
    CAM_WAYPOINTS.map((c) => new THREE.Vector3(c.t[0], c.t[1], c.t[2])),
    false,
    'catmullrom',
    0.42
  );

  const RIG = {
    prog: 0,
    smooth: 0,
    mx: 0,
    my: 0,
    tmx: 0,
    tmy: 0,
    intro: 0,
    introStart: performance.now(),
  };

  const _camP = new THREE.Vector3();
  const _camT = new THREE.Vector3();

  function applyCamera() {
    const N = CAM_WAYPOINTS.length - 1;
    const u = Math.min(Math.max(RIG.smooth / N, 0), 1);
    curveP.getPoint(u, _camP);
    curveT.getPoint(u, _camT);

    const i = Math.min(Math.floor(RIG.smooth), N - 1);
    const f = Math.min(Math.max(RIG.smooth - i, 0), 1);
    let fov = CAM_WAYPOINTS[i].fov + (CAM_WAYPOINTS[i + 1].fov - CAM_WAYPOINTS[i].fov) * f;

    // Intro zoom dolly
    const io = 1 - RIG.intro;
    _camP.z += io * 4.5;
    _camP.y += io * 0.5;
    fov += io * 6;

    // Subtle parallax drift
    const par = 1 - Math.min(Math.max(RIG.smooth / 1.6, 0), 1) * 0.45;
    _camP.x += RIG.mx * 0.55 * par;
    _camP.y += RIG.my * 0.3 * par;
    _camT.x -= RIG.mx * 0.18 * par;
    _camT.y -= RIG.my * 0.1 * par;

    camera.position.copy(_camP);
    camera.lookAt(_camT);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }

  // -------------------------------------------------------------------------
  // 3. Lighting & Atmospherics (Warm Indonesian Sunrise)
  // -------------------------------------------------------------------------
  const sunLight = new THREE.DirectionalLight('#FCE49C', 2.8);
  sunLight.position.set(16, 24, 18);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 80;
  sunLight.shadow.camera.left = -22;
  sunLight.shadow.camera.right = 22;
  sunLight.shadow.camera.top = 22;
  sunLight.shadow.camera.bottom = -22;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);

  const skyLight = new THREE.HemisphereLight('#8FB576', '#122518', 1.4);
  scene.add(skyLight);

  // Warm golden sunrise backlight
  const sunriseBackLight = new THREE.DirectionalLight('#E9B949', 1.6);
  sunriseBackLight.position.set(-18, 12, -35);
  scene.add(sunriseBackLight);

  // Coop interior warm lantern / heat lamp
  const coopWarmLight = new THREE.PointLight('#FCD179', 2.2, 9, 1.8);
  coopWarmLight.position.set(0, 2.2, -1.8);
  scene.add(coopWarmLight);

  // -------------------------------------------------------------------------
  // 4. Procedural Textures & Materials
  // -------------------------------------------------------------------------
  function createNoiseCanvas(w: number, h: number, baseColor: string, grainAlpha: number) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;
    for (let i = 0; i < w * h * 4; i += 4) {
      const n = (Math.random() - 0.5) * grainAlpha * 255;
      d[i] = Math.min(255, Math.max(0, d[i] + n));
      d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
      d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
    }
    ctx.putImageData(imgData, 0, 0);
    return new THREE.CanvasTexture(c);
  }

  const grassTex = createNoiseCanvas(512, 512, '#355424', 0.22);
  grassTex.wrapS = THREE.RepeatWrapping;
  grassTex.wrapT = THREE.RepeatWrapping;
  grassTex.repeat.set(18, 18);

  const earthTex = createNoiseCanvas(512, 512, '#543D28', 0.25);
  earthTex.wrapS = THREE.RepeatWrapping;
  earthTex.wrapT = THREE.RepeatWrapping;
  earthTex.repeat.set(8, 8);

  // Ground Plane
  const groundGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    // gentle rolling hills in background, flat in center
    const dist = Math.hypot(x, y);
    if (dist > 15) {
      const elev = Math.sin(x * 0.08) * Math.cos(y * 0.08) * 1.8 + Math.sin(x * 0.04 + y * 0.03) * 2.5;
      posAttr.setZ(i, Math.max(0, elev));
    }
  }
  groundGeo.computeVertexNormals();

  const groundMat = new THREE.MeshStandardMaterial({
    map: grassTex,
    color: '#3B5927',
    roughness: 0.88,
    metalness: 0.05,
  });

  const groundMesh = new THREE.Mesh(groundGeo, groundMat);
  groundMesh.rotation.x = -Math.PI / 2;
  groundMesh.position.y = 0;
  groundMesh.receiveShadow = true;
  scene.add(groundMesh);

  // Farm dirt yard path
  const pathGeo = new THREE.PlaneGeometry(8, 38, 16, 32);
  const pathMat = new THREE.MeshStandardMaterial({
    map: earthTex,
    color: '#5C442D',
    roughness: 0.95,
  });
  const pathMesh = new THREE.Mesh(pathGeo, pathMat);
  pathMesh.rotation.x = -Math.PI / 2;
  pathMesh.position.set(0, 0.02, 4);
  pathMesh.receiveShadow = true;
  scene.add(pathMesh);

  // -------------------------------------------------------------------------
  // 5. Countryside Vegetation & Trees (Tropical Indonesian Village Atmosphere)
  // -------------------------------------------------------------------------
  const foliageGroup = new THREE.Group();
  scene.add(foliageGroup);

  function createTropicalTree(x: number, z: number, scale = 1) {
    const tree = new THREE.Group();
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);

    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.32, 4.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#4E3621', roughness: 0.9 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.1;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    // Lush tropical canopy
    const canopyMat = new THREE.MeshStandardMaterial({
      color: '#345E24',
      roughness: 0.75,
      flatShading: true,
    });

    const tierCount = 3;
    for (let t = 0; t < tierCount; t++) {
      const radius = 2.4 - t * 0.55;
      const sphereGeo = new THREE.DodecahedronGeometry(radius, 1);
      const canopyMesh = new THREE.Mesh(sphereGeo, canopyMat);
      canopyMesh.position.y = 3.6 + t * 1.35;
      canopyMesh.rotation.y = t * 1.2;
      canopyMesh.scale.set(1.15, 0.85, 1.15);
      canopyMesh.castShadow = true;
      tree.add(canopyMesh);
    }

    foliageGroup.add(tree);
  }

  // Plant trees flanking the countryside farm approach
  const treeCoords = [
    [-9.5, 10], [9.2, 11], [-11, 4], [10.5, 3],
    [-13, -6], [12, -7], [-15, -16], [14, -18],
    [-18, -28], [17, -29], [-8, -32], [8, -33]
  ];
  treeCoords.forEach(([tx, tz]) => {
    createTropicalTree(tx, tz, 0.8 + Math.random() * 0.45);
  });

  // Banana / Tropical broadleaf shrubs
  function createBananaPlant(x: number, z: number, scale = 1) {
    const plant = new THREE.Group();
    plant.position.set(x, 0, z);
    plant.scale.setScalar(scale);

    const stemGeo = new THREE.CylinderGeometry(0.1, 0.16, 1.8, 6);
    const stemMat = new THREE.MeshStandardMaterial({ color: '#5A7D36', roughness: 0.7 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.9;
    plant.add(stem);

    const leafMat = new THREE.MeshStandardMaterial({
      color: '#4B7A2B',
      roughness: 0.6,
      side: THREE.DoubleSide,
    });

    const leafCount = 6;
    for (let i = 0; i < leafCount; i++) {
      const leafGeo = new THREE.CylinderGeometry(0.04, 0.5, 2.6, 4);
      const leaf = new THREE.Mesh(leafGeo, leafMat);
      leaf.position.y = 1.6;
      leaf.rotation.y = (i / leafCount) * Math.PI * 2;
      leaf.rotation.z = 0.75 + Math.random() * 0.15;
      leaf.scale.set(0.12, 1, 1);
      leaf.castShadow = true;
      plant.add(leaf);
    }
    foliageGroup.add(plant);
  }

  const shrubCoords = [
    [-5.5, 7], [5.8, 8], [-6.2, 1], [6.4, 0],
    [-4.8, -4], [5.2, -5], [-7.5, -12], [7.8, -13]
  ];
  shrubCoords.forEach(([sx, sz]) => createBananaPlant(sx, sz, 0.75 + Math.random() * 0.3));

  // -------------------------------------------------------------------------
  // 6. Modern Home-Scale Eggnest Chicken Coop (Kandang 12 Ekor)
  // -------------------------------------------------------------------------
  const coopGroup = new THREE.Group();
  coopGroup.position.set(0, 0, -2.2);
  scene.add(coopGroup);

  // Teak Wood Frame Pillars
  const woodMat = new THREE.MeshStandardMaterial({
    color: '#6B4423',
    roughness: 0.78,
  });

  const pillarGeo = new THREE.BoxGeometry(0.16, 2.8, 0.16);
  const pillarOffsets = [
    [-1.8, -0.9], [1.8, -0.9],
    [-1.8, 0.9], [1.8, 0.9],
    [0, -0.9], [0, 0.9]
  ];
  pillarOffsets.forEach(([px, pz]) => {
    const pillar = new THREE.Mesh(pillarGeo, woodMat);
    pillar.position.set(px, 1.4, pz);
    pillar.castShadow = true;
    coopGroup.add(pillar);
  });

  // Crossbeams
  const beamGeoX = new THREE.BoxGeometry(3.8, 0.14, 0.14);
  const beamTopFront = new THREE.Mesh(beamGeoX, woodMat);
  beamTopFront.position.set(0, 2.75, 0.9);
  coopGroup.add(beamTopFront);

  const beamTopBack = new THREE.Mesh(beamGeoX, woodMat);
  beamTopBack.position.set(0, 2.75, -0.9);
  coopGroup.add(beamTopBack);

  const beamMid = new THREE.Mesh(beamGeoX, woodMat);
  beamMid.position.set(0, 1.35, 0.9);
  coopGroup.add(beamMid);

  // Modern Sloped Roof (Eco Asbes / Tiled Shelter)
  const roofMat = new THREE.MeshStandardMaterial({
    color: '#8A3B22',
    roughness: 0.82,
    metalness: 0.1,
  });
  const roofGeo = new THREE.BoxGeometry(4.4, 0.12, 2.6);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.set(0, 3.0, 0.0);
  roof.rotation.x = 0.09;
  roof.castShadow = true;
  coopGroup.add(roof);

  // Galvanized Wire Mesh Battery Cages
  const wireMat = new THREE.MeshStandardMaterial({
    color: '#C8D2D8',
    roughness: 0.35,
    metalness: 0.85,
    wireframe: true,
  });
  const cageSolidMat = new THREE.MeshStandardMaterial({
    color: '#9CAAB2',
    roughness: 0.45,
    metalness: 0.75,
  });

  // 2 Tier Cage (Upper tier 6 hens, Lower tier 6 hens = 12 Ekor)
  const cageTier1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 1.35), wireMat);
  cageTier1.position.set(0, 0.95, 0);
  coopGroup.add(cageTier1);

  const cageTier2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.85, 1.35), wireMat);
  cageTier2.position.set(0, 1.95, 0);
  coopGroup.add(cageTier2);

  // Sloped Egg Roll-out Trays (Front lips)
  const trayGeo = new THREE.BoxGeometry(3.45, 0.06, 0.45);
  const eggTray1 = new THREE.Mesh(trayGeo, cageSolidMat);
  eggTray1.position.set(0, 0.54, 0.82);
  eggTray1.rotation.x = -0.16;
  coopGroup.add(eggTray1);

  const eggTray2 = new THREE.Mesh(trayGeo, cageSolidMat);
  eggTray2.position.set(0, 1.54, 0.82);
  eggTray2.rotation.x = -0.16;
  coopGroup.add(eggTray2);

  // Yellow Feeders (Trough for feed)
  const feederMat = new THREE.MeshStandardMaterial({
    color: '#E9B949',
    roughness: 0.4,
    metalness: 0.2,
  });
  const feederGeo = new THREE.BoxGeometry(3.4, 0.16, 0.22);
  const feeder1 = new THREE.Mesh(feederGeo, feederMat);
  feeder1.position.set(0, 0.75, 0.78);
  coopGroup.add(feeder1);

  const feeder2 = new THREE.Mesh(feederGeo, feederMat);
  feeder2.position.set(0, 1.75, 0.78);
  coopGroup.add(feeder2);

  // Water Pipe with Nipple Drinkers
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#E8EFF2', roughness: 0.2 });
  const pipeGeo = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 8);
  const waterPipe1 = new THREE.Mesh(pipeGeo, pipeMat);
  waterPipe1.rotation.z = Math.PI / 2;
  waterPipe1.position.set(0, 1.25, 0.2);
  coopGroup.add(waterPipe1);

  const waterPipe2 = new THREE.Mesh(pipeGeo, pipeMat);
  waterPipe2.rotation.z = Math.PI / 2;
  waterPipe2.position.set(0, 2.25, 0.2);
  coopGroup.add(waterPipe2);

  // Eggnest Home Farm Plaque (Signboard)
  const plaqueGeo = new THREE.BoxGeometry(1.4, 0.38, 0.05);
  const plaqueMat = new THREE.MeshStandardMaterial({
    color: '#153A24',
    roughness: 0.3,
    metalness: 0.4,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, 2.76, 0.95);
  coopGroup.add(plaque);

  // Brass Border on Plaque
  const plaqueBorder = new THREE.Mesh(
    new THREE.BoxGeometry(1.44, 0.42, 0.04),
    new THREE.MeshStandardMaterial({ color: '#E9B949', metalness: 0.8, roughness: 0.2 })
  );
  plaqueBorder.position.set(0, 2.76, 0.94);
  coopGroup.add(plaqueBorder);

  // -------------------------------------------------------------------------
  // 7. Brown Laying Hens (Ayam Petelur Cokelat - ISA Brown) with Dynamic Animation
  // -------------------------------------------------------------------------
  interface HenRig {
    group: THREE.Group;
    head: THREE.Mesh;
    comb: THREE.Mesh;
    leftWing: THREE.Mesh;
    rightWing: THREE.Mesh;
    tail: THREE.Mesh;
    baseY: number;
    peckSpeed: number;
    peckPhase: number;
    curiousSpeed: number;
    curiousPhase: number;
  }

  const hens: HenRig[] = [];

  const henFeatherMat = new THREE.MeshStandardMaterial({
    color: '#8A4A28', // Rich reddish brown ISA brown
    roughness: 0.85,
    metalness: 0.05,
  });
  const henBreastMat = new THREE.MeshStandardMaterial({
    color: '#A25E34',
    roughness: 0.8,
  });
  const combMat = new THREE.MeshStandardMaterial({
    color: '#D42A2A', // Vivid red comb
    roughness: 0.5,
  });
  const beakMat = new THREE.MeshStandardMaterial({
    color: '#F4B72B', // Yellow beak
    roughness: 0.3,
  });

  function createHen(tier: number, slotIndex: number): HenRig {
    const henGroup = new THREE.Group();
    const xPos = -1.35 + slotIndex * 0.54;
    const yPos = tier === 0 ? 0.62 : 1.62;
    const zPos = 0.05;

    henGroup.position.set(xPos, yPos, zPos);
    henGroup.scale.setScalar(0.42);

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.52, 12, 10);
    bodyGeo.scale(0.85, 0.9, 1.25);
    const body = new THREE.Mesh(bodyGeo, henFeatherMat);
    body.position.set(0, 0.45, 0);
    body.castShadow = true;
    henGroup.add(body);

    // Breast
    const breastGeo = new THREE.SphereGeometry(0.38, 10, 8);
    breastGeo.scale(0.8, 0.85, 0.9);
    const breast = new THREE.Mesh(breastGeo, henBreastMat);
    breast.position.set(0, 0.48, 0.35);
    henGroup.add(breast);

    // Neck & Head
    const headGeo = new THREE.SphereGeometry(0.24, 10, 8);
    headGeo.scale(0.8, 1.1, 0.9);
    const head = new THREE.Mesh(headGeo, henFeatherMat);
    head.position.set(0, 0.85, 0.42);
    head.castShadow = true;
    henGroup.add(head);

    // Comb on top
    const combGeo = new THREE.BoxGeometry(0.06, 0.16, 0.26);
    const comb = new THREE.Mesh(combGeo, combMat);
    comb.position.set(0, 0.22, 0);
    head.add(comb);

    // Beak
    const beakGeo = new THREE.ConeGeometry(0.08, 0.22, 6);
    beakGeo.rotateX(Math.PI / 2);
    const beak = new THREE.Mesh(beakGeo, beakMat);
    beak.position.set(0, 0, 0.24);
    head.add(beak);

    // Wattle
    const wattleGeo = new THREE.SphereGeometry(0.06, 6, 6);
    wattleGeo.scale(0.6, 1.2, 0.6);
    const wattle = new THREE.Mesh(wattleGeo, combMat);
    wattle.position.set(0, -0.12, 0.16);
    head.add(wattle);

    // Wings
    const wingGeo = new THREE.BoxGeometry(0.08, 0.42, 0.7);
    const leftWing = new THREE.Mesh(wingGeo, henFeatherMat);
    leftWing.position.set(-0.42, 0.45, -0.05);
    leftWing.rotation.z = -0.15;
    henGroup.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeo, henFeatherMat);
    rightWing.position.set(0.42, 0.45, -0.05);
    rightWing.rotation.z = 0.15;
    henGroup.add(rightWing);

    // Tail Feathers
    const tailGeo = new THREE.ConeGeometry(0.22, 0.6, 6);
    tailGeo.rotateX(-Math.PI / 4);
    const tail = new THREE.Mesh(tailGeo, henFeatherMat);
    tail.position.set(0, 0.65, -0.55);
    henGroup.add(tail);

    coopGroup.add(henGroup);

    return {
      group: henGroup,
      head,
      comb,
      leftWing,
      rightWing,
      tail,
      baseY: yPos,
      peckSpeed: 1.8 + Math.random() * 1.5,
      peckPhase: Math.random() * Math.PI * 2,
      curiousSpeed: 0.8 + Math.random() * 0.7,
      curiousPhase: Math.random() * Math.PI * 2,
    };
  }

  // Create exactly 12 Laying Hens (6 on Tier 0, 6 on Tier 1)
  for (let tier = 0; tier < 2; tier++) {
    for (let slot = 0; slot < 6; slot++) {
      hens.push(createHen(tier, slot));
    }
  }

  // -------------------------------------------------------------------------
  // 8. Fresh Eggs & Production System (Scroll-linked 0 -> 330 progression)
  // -------------------------------------------------------------------------
  const eggsGroup = new THREE.Group();
  scene.add(eggsGroup);

  const eggMat = new THREE.MeshStandardMaterial({
    color: '#D89E6E', // Warm brown egg shell
    roughness: 0.45,
    metalness: 0.1,
  });

  const eggsList: THREE.Mesh[] = [];
  const EGG_COUNT = 36; // 36 prominent 3D eggs on display trays

  // Create standard egg geometry
  function createEggGeometry(): THREE.BufferGeometry {
    const geo = new THREE.SphereGeometry(0.18, 16, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      // Taper the top to form an authentic ovoid egg
      if (y > 0) {
        const factor = 1 - (y / 0.18) * 0.28;
        pos.setX(i, pos.getX(i) * factor);
        pos.setZ(i, pos.getZ(i) * factor);
        pos.setY(i, y * 1.25);
      }
    }
    geo.computeVertexNormals();
    return geo;
  }

  const eggGeometry = createEggGeometry();

  // 1 Egg Collection Tray (Karton Telur) in front of coop
  const eggTrayMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.14, 1.2),
    new THREE.MeshStandardMaterial({ color: '#BBAE96', roughness: 0.9 })
  );
  eggTrayMesh.position.set(0.6, 0.08, -1.2);
  eggTrayMesh.receiveShadow = true;
  eggsGroup.add(eggTrayMesh);

  // Woven Bamboo Egg Basket (Keranjang Telur)
  const basketMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.65, 0.48, 0.45, 16, 1, true),
    new THREE.MeshStandardMaterial({ color: '#A57C48', roughness: 0.85, side: THREE.DoubleSide })
  );
  basketMesh.position.set(-0.8, 0.24, -0.9);
  basketMesh.castShadow = true;
  eggsGroup.add(basketMesh);

  // Populate eggs on tray and in basket
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 6; c++) {
      const egg = new THREE.Mesh(eggGeometry, eggMat);
      egg.position.set(
        0.6 - 0.65 + c * 0.25,
        0.24,
        -1.2 - 0.48 + r * 0.24
      );
      egg.rotation.set((Math.random() - 0.5) * 0.1, Math.random() * Math.PI, (Math.random() - 0.5) * 0.1);
      egg.castShadow = true;
      eggsGroup.add(egg);
      eggsList.push(egg);
    }
  }

  // Eggs in basket
  for (let b = 0; b < 6; b++) {
    const angle = (b / 6) * Math.PI * 2;
    const egg = new THREE.Mesh(eggGeometry, eggMat);
    egg.position.set(
      -0.8 + Math.cos(angle) * 0.28,
      0.32,
      -0.9 + Math.sin(angle) * 0.28
    );
    egg.rotation.z = 0.3;
    egg.castShadow = true;
    eggsGroup.add(egg);
    eggsList.push(egg);
  }

  // -------------------------------------------------------------------------
  // 9. Ekosistem Support Layer (Scene 04 3D Floating Feature Elements)
  // -------------------------------------------------------------------------
  const ecosystemGroup = new THREE.Group();
  ecosystemGroup.position.set(1.6, 1.8, -2.5);
  scene.add(ecosystemGroup);

  const ecoPillars = [
    { label: 'PAKAN TERSTANDAR', angle: 0, color: '#E9B949' },
    { label: 'VITAMIN & SUPLEMEN', angle: (Math.PI * 2) / 6, color: '#81B252' },
    { label: 'PENDAMPINGAN AHLI', angle: (Math.PI * 4) / 6, color: '#F7F1E4' },
    { label: 'EGGNEST FARM HUB', angle: (Math.PI * 6) / 6, color: '#E9B949' },
    { label: 'MONITORING PRODUKSI', angle: (Math.PI * 8) / 6, color: '#81B252' },
    { label: 'KOMUNITAS PETERNAK', angle: (Math.PI * 10) / 6, color: '#F7F1E4' },
  ];

  const ecoOrbs: THREE.Mesh[] = [];
  ecoPillars.forEach((p, idx) => {
    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.32, 2),
      new THREE.MeshStandardMaterial({
        color: p.color,
        emissive: p.color,
        emissiveIntensity: 0.45,
        roughness: 0.25,
        metalness: 0.7,
      })
    );
    const radius = 2.4;
    orb.position.set(Math.cos(p.angle) * radius, 0.4 + (idx % 2) * 0.35, Math.sin(p.angle) * radius);
    ecosystemGroup.add(orb);
    ecoOrbs.push(orb);
  });

  // -------------------------------------------------------------------------
  // 10. Farm Hub 3D Floating Dashboard Device (Scene 05)
  // -------------------------------------------------------------------------
  const tabletGroup = new THREE.Group();
  tabletGroup.position.set(0, 1.9, 0.3);
  scene.add(tabletGroup);

  // Tablet Shell
  const tabletMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.65, 2.35, 0.08),
    new THREE.MeshStandardMaterial({
      color: '#153A24',
      roughness: 0.35,
      metalness: 0.6,
    })
  );
  tabletMesh.castShadow = true;
  tabletGroup.add(tabletMesh);

  // Gold Trim
  const trimMesh = new THREE.Mesh(
    new THREE.BoxGeometry(1.69, 2.39, 0.06),
    new THREE.MeshStandardMaterial({
      color: '#E9B949',
      metalness: 0.85,
      roughness: 0.25,
    })
  );
  tabletGroup.add(trimMesh);

  // Canvas Texture for Farm Hub Screen
  const hubCanvas = document.createElement('canvas');
  hubCanvas.width = 512;
  hubCanvas.height = 720;
  const hubCtx = hubCanvas.getContext('2d')!;

  function drawHubScreen(pCount = 330) {
    hubCtx.fillStyle = '#0F2618';
    hubCtx.fillRect(0, 0, 512, 720);

    // Top Bar
    hubCtx.fillStyle = '#153A24';
    hubCtx.fillRect(0, 0, 512, 75);

    hubCtx.fillStyle = '#E9B949';
    hubCtx.font = 'bold 22px system-ui, sans-serif';
    hubCtx.fillText('EGGNEST FARM HUB', 28, 46);

    hubCtx.fillStyle = '#81B252';
    hubCtx.font = '14px system-ui, sans-serif';
    hubCtx.fillText('● LIVE SYNC', 390, 46);

    // Card 1: Telur Hari Ini
    hubCtx.fillStyle = '#183823';
    hubCtx.roundRect?.(24, 95, 464, 130, 16);
    hubCtx.fill();

    hubCtx.fillStyle = '#D1C8B8';
    hubCtx.font = '14px system-ui, sans-serif';
    hubCtx.fillText('TELUR HARI INI', 44, 126);

    hubCtx.fillStyle = '#FFFFFF';
    hubCtx.font = 'bold 38px system-ui, sans-serif';
    hubCtx.fillText('11 Butir', 44, 175);

    hubCtx.fillStyle = '#E9B949';
    hubCtx.font = '16px system-ui, sans-serif';
    hubCtx.fillText('91.6% Lay Rate (Sangat Baik)', 44, 206);

    // Card 2: Pakan & Kondisi Ayam
    hubCtx.fillStyle = '#183823';
    hubCtx.roundRect?.(24, 245, 222, 120, 16);
    hubCtx.fill();

    hubCtx.fillStyle = '#D1C8B8';
    hubCtx.font = '13px system-ui, sans-serif';
    hubCtx.fillText('PAKAN TERPAKAI', 40, 275);
    hubCtx.fillStyle = '#FFFFFF';
    hubCtx.font = 'bold 24px system-ui, sans-serif';
    hubCtx.fillText('1.44 kg', 40, 315);
    hubCtx.fillStyle = '#81B252';
    hubCtx.font = '12px system-ui, sans-serif';
    hubCtx.fillText('Stok cukup 18 hari', 40, 345);

    // Card 3: Kondisi Ayam
    hubCtx.fillStyle = '#183823';
    hubCtx.roundRect?.(266, 245, 222, 120, 16);
    hubCtx.fill();

    hubCtx.fillStyle = '#D1C8B8';
    hubCtx.font = '13px system-ui, sans-serif';
    hubCtx.fillText('KONDISI AYAM', 282, 275);
    hubCtx.fillStyle = '#FFFFFF';
    hubCtx.font = 'bold 24px system-ui, sans-serif';
    hubCtx.fillText('12/12 Sehat', 282, 315);
    hubCtx.fillStyle = '#81B252';
    hubCtx.font = '12px system-ui, sans-serif';
    hubCtx.fillText('Suhu kandang 26°C', 282, 345);

    // Card 4: Grafik Produktivitas Bulanan
    hubCtx.fillStyle = '#183823';
    hubCtx.roundRect?.(24, 385, 464, 180, 16);
    hubCtx.fill();

    hubCtx.fillStyle = '#D1C8B8';
    hubCtx.font = '13px system-ui, sans-serif';
    hubCtx.fillText('PRODUKSI BULAN INI', 44, 415);

    hubCtx.fillStyle = '#E9B949';
    hubCtx.font = 'bold 26px system-ui, sans-serif';
    hubCtx.fillText(`±${pCount} Butir`, 44, 452);

    // Bar chart
    const bars = [9, 10, 11, 11, 10, 11, 12, 10, 11, 11, 11, 10, 11, 12];
    bars.forEach((val, bi) => {
      const bh = (val / 12) * 65;
      hubCtx.fillStyle = bi === bars.length - 1 ? '#E9B949' : '#496B32';
      hubCtx.fillRect(44 + bi * 30, 540 - bh, 20, bh);
    });

    // Bottom Navigation
    hubCtx.fillStyle = '#153A24';
    hubCtx.fillRect(0, 645, 512, 75);

    hubCtx.fillStyle = '#E9B949';
    hubCtx.font = '12px system-ui, sans-serif';
    hubCtx.fillText('BERANDA', 40, 690);
    hubCtx.fillStyle = '#D1C8B8';
    hubCtx.fillText('ACADEMY', 150, 690);
    hubCtx.fillText('BANTUAN', 270, 690);
    hubCtx.fillText('PROFIL', 390, 690);
  }

  drawHubScreen(330);
  const hubTexture = new THREE.CanvasTexture(hubCanvas);
  const hubScreenMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.5, 2.15),
    new THREE.MeshBasicMaterial({ map: hubTexture })
  );
  hubScreenMesh.position.set(0, 0, 0.045);
  tabletGroup.add(hubScreenMesh);

  // -------------------------------------------------------------------------
  // 11. Gerakan 1 Rumah 1 Kandang (Indonesian Village Scene with 20+ Houses)
  // -------------------------------------------------------------------------
  const villageGroup = new THREE.Group();
  villageGroup.position.set(0, 0, -28);
  scene.add(villageGroup);

  interface VillageHouse {
    group: THREE.Group;
    targetScale: number;
    distanceOrder: number;
  }

  const villageHouses: VillageHouse[] = [];

  function createIndonesianHouse(x: number, z: number, scale = 1, distOrder = 1) {
    const house = new THREE.Group();
    house.position.set(x, 0, z);
    house.scale.setScalar(scale);

    // Walls (Cream plaster)
    const wallMat = new THREE.MeshStandardMaterial({ color: '#E8DFCC', roughness: 0.8 });
    const walls = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 3.2), wallMat);
    walls.position.y = 1.1;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Traditional Limasan Roof (Terracotta tile)
    const roofMat = new THREE.MeshStandardMaterial({ color: '#A04726', roughness: 0.75 });
    const roofGeo = new THREE.ConeGeometry(3.2, 1.8, 4);
    roofGeo.rotateY(Math.PI / 4);
    const houseRoof = new THREE.Mesh(roofGeo, roofMat);
    houseRoof.position.y = 3.0;
    houseRoof.castShadow = true;
    house.add(houseRoof);

    // Front Verandah
    const verandahMat = new THREE.MeshStandardMaterial({ color: '#5A3D22' });
    const verandah = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.1, 1.2), verandahMat);
    verandah.position.set(0, 0.05, 2.1);
    house.add(verandah);

    // Mini Backyard Eggnest Coop for each house!
    const miniCoopMat = new THREE.MeshStandardMaterial({ color: '#153A24' });
    const miniCoop = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.7), miniCoopMat);
    miniCoop.position.set(2.4, 0.45, -0.6);
    house.add(miniCoop);

    // Warm light on coop
    const coopGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 6, 6),
      new THREE.MeshBasicMaterial({ color: '#E9B949' })
    );
    coopGlow.position.set(2.4, 0.75, -0.3);
    house.add(coopGlow);

    villageGroup.add(house);
    villageHouses.push({ group: house, targetScale: scale, distanceOrder: distOrder });
  }

  // 24 Indonesian Village Homes arranged across rural roads and green gardens
  const housePlacements = [
    // 1st house (Initial close focus)
    { x: 0, z: 2, order: 1 },
    // 5 houses
    { x: -7, z: 0, order: 2 },
    { x: 7.5, z: -1, order: 2 },
    { x: -5, z: -6, order: 2 },
    { x: 6, z: -7, order: 2 },
    // 10 houses
    { x: -14, z: -2, order: 3 },
    { x: 14, z: -3, order: 3 },
    { x: -12, z: -11, order: 3 },
    { x: 12, z: -12, order: 3 },
    { x: 0, z: -14, order: 3 },
    // 20+ houses (Deeper neighborhood grid)
    { x: -21, z: -5, order: 4 },
    { x: 21, z: -6, order: 4 },
    { x: -18, z: -18, order: 4 },
    { x: 18, z: -19, order: 4 },
    { x: -7, z: -22, order: 4 },
    { x: 8, z: -23, order: 4 },
    { x: -26, z: -12, order: 5 },
    { x: 25, z: -13, order: 5 },
    { x: -24, z: -26, order: 5 },
    { x: 24, z: -27, order: 5 },
    { x: 0, z: -29, order: 5 },
    { x: -12, z: -34, order: 5 },
    { x: 12, z: -35, order: 5 },
    { x: 0, z: -42, order: 5 },
  ];

  housePlacements.forEach((hp) => createIndonesianHouse(hp.x, hp.z, 0.95, hp.order));

  // -------------------------------------------------------------------------
  // 12. Morning Sunrise Atmospheric Floating Dust Particles & Mist
  // -------------------------------------------------------------------------
  const PARTICLE_COUNT = 180;
  const particleGeo = new THREE.BufferGeometry();
  const particlePos = new Float32Array(PARTICLE_COUNT * 3);
  const particleSpeeds = new Float32Array(PARTICLE_COUNT);

  for (let p = 0; p < PARTICLE_COUNT; p++) {
    particlePos[p * 3] = (Math.random() - 0.5) * 36;
    particlePos[p * 3 + 1] = Math.random() * 9 + 0.2;
    particlePos[p * 3 + 2] = (Math.random() - 0.5) * 44;
    particleSpeeds[p] = 0.2 + Math.random() * 0.4;
  }
  particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

  const particleMat = new THREE.PointsMaterial({
    color: '#F9DC8A',
    size: 0.18,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
  });

  const particlesMesh = new THREE.Points(particleGeo, particleMat);
  scene.add(particlesMesh);

  // -------------------------------------------------------------------------
  // 13. Event Listeners (Scroll, Parallax, Resize)
  // -------------------------------------------------------------------------
  function updateScroll() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const scrollY = window.scrollY;
    RIG.prog = Math.min(Math.max(scrollY / maxScroll, 0), 1) * (CAM_WAYPOINTS.length - 1);

    const activeIndex = Math.min(Math.floor(RIG.smooth + 0.45), CAM_WAYPOINTS.length - 1);
    onProgressChange?.(RIG.smooth, activeIndex);

    // Egg count update for Scene 3
    if (RIG.smooth >= 1.5 && RIG.smooth <= 3.5) {
      const eggProgress = Math.min(Math.max((RIG.smooth - 1.8) / 1.0, 0), 1);
      const count = Math.round(eggProgress * 330);
      onEggCountChange?.(count);
      drawHubScreen(count);
      hubTexture.needsUpdate = true;
    } else if (RIG.smooth > 3.5) {
      onEggCountChange?.(330);
    }
  }

  function onPointerMove(e: PointerEvent) {
    RIG.tmx = (e.clientX / window.innerWidth) * 2 - 1;
    RIG.tmy = -((e.clientY / window.innerHeight) * 2 - 1);
  }

  function onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    updateScroll();
  }

  window.addEventListener('scroll', updateScroll, { passive: true });
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });

  // -------------------------------------------------------------------------
  // 14. Animation Loop
  // -------------------------------------------------------------------------
  function frame(now: number) {
    if (isDestroyed) return;

    const raw = (now - tPrev) / 1000 || 0;
    const dt = Math.min(raw, 0.05);
    tPrev = now;
    clock += dt;

    // Intro ease-in
    const el = (now - RIG.introStart) / 1000;
    RIG.intro = Math.min(Math.max(el / 2.2, 0), 1);

    // Smooth camera progression
    const dampRate = 5.2;
    RIG.smooth += (RIG.prog - RIG.smooth) * (1 - Math.exp(-dampRate * dt));
    RIG.mx += (RIG.tmx - RIG.mx) * (1 - Math.exp(-2.6 * dt));
    RIG.my += (RIG.tmy - RIG.my) * (1 - Math.exp(-2.6 * dt));

    // Update Camera
    applyCamera();

    // Animate Hens
    hens.forEach((hen, idx) => {
      // Natural head peck & curious turn
      const peck = Math.sin(clock * hen.peckSpeed + hen.peckPhase);
      hen.head.position.y = 0.85 + (peck > 0.4 ? -(peck - 0.4) * 0.28 : 0);
      hen.head.rotation.x = peck > 0.4 ? 0.35 : 0;

      const curious = Math.sin(clock * hen.curiousSpeed + hen.curiousPhase);
      hen.head.rotation.y = curious * 0.35;

      // Subtle wing fluff
      const wingWiggle = Math.sin(clock * 3.2 + idx) * 0.04;
      hen.leftWing.rotation.z = -0.15 + wingWiggle;
      hen.rightWing.rotation.z = 0.15 - wingWiggle;

      // Body breathing idle
      hen.group.position.y = hen.baseY + Math.sin(clock * 1.5 + idx) * 0.012;
    });

    // Animate Eggs emergence based on scroll progress
    const eggProgress = Math.min(Math.max((RIG.smooth - 1.8) / 1.0, 0), 1);
    eggsList.forEach((egg, i) => {
      const threshold = i / eggsList.length;
      const visible = eggProgress >= threshold * 0.9;
      egg.visible = visible;
      if (visible) {
        const scaleVal = Math.min((eggProgress - threshold * 0.9) * 4, 1);
        egg.scale.setScalar(scaleVal);
      }
    });

    // Animate Ecosystem Orbs floating
    ecoOrbs.forEach((orb, i) => {
      orb.position.y += Math.sin(clock * 2.2 + i * 1.2) * 0.003;
      orb.rotation.y += 0.015;
    });
    ecosystemGroup.rotation.y = clock * 0.08;

    // Animate Floating Farm Hub Tablet
    tabletGroup.position.y = 1.9 + Math.sin(clock * 1.4) * 0.04;
    tabletGroup.rotation.y = Math.sin(clock * 0.8) * 0.06;

    // Animate Village Houses reveal with aerial retreat in Scene 6
    if (RIG.smooth > 3.8) {
      const villageProg = Math.min((RIG.smooth - 3.8) / 1.2, 1);
      villageHouses.forEach((vh) => {
        const revealThreshold = (vh.distanceOrder - 1) / 5;
        const show = villageProg >= revealThreshold;
        vh.group.visible = show;
        if (show) {
          const s = Math.min((villageProg - revealThreshold) * 3, 1) * vh.targetScale;
          vh.group.scale.setScalar(s);
        }
      });
    }

    // Animate Floating Golden Sunlight Dust Particles
    const pos = particleGeo.attributes.position as THREE.BufferAttribute;
    for (let p = 0; p < PARTICLE_COUNT; p++) {
      let py = pos.getY(p) - particleSpeeds[p] * dt * 0.6;
      if (py < 0.2) py = 9.0;
      pos.setY(p, py);
    }
    pos.needsUpdate = true;

    // Render Scene
    renderer.render(scene, camera);

    if (running) {
      animationFrameId = requestAnimationFrame(frame);
    }
  }

  // Initial trigger
  updateScroll();
  animationFrameId = requestAnimationFrame(frame);

  return {
    scrollToSection: (index: number) => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const targetY = (index / (CAM_WAYPOINTS.length - 1)) * maxScroll;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    },
    setScrollProgress: (prog: number) => {
      RIG.prog = prog;
    },
    getSectionProgress: () => RIG.smooth,
    destroy: () => {
      isDestroyed = true;
      running = false;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', updateScroll);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    },
  };
}
