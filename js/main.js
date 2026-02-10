/**
 * VALENTINO HOSE PORTFOLIO
 * 3D Gallery - Warm Lighting Edition (FIXED COLORS)
 */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

// ===== Configuration =====
const CONFIG = {
    colors: {
        background: 0x1A1A1A, // Dark exterior
        wall: 0xFFFFFF,       // White walls
        frame: 0x3D2B1F,
        frameBack: 0xFFFDF8,
        textHeader: 0x1A1A1A,
        textBody: 0x1A1A1A,
        accent: 0xFFD887,
        warmLight: 0xFFFFFF,
        iconHover: 0xE07B39
    },
    room: {
        width: 30,
        height: 10,
        length: 100 // Extended length
    },
    nav: {
        moveSpeed: 0.005,
        lookSpeed: 0.002,
        damping: 0.9
    }
};

// ===== State =====
const state = {
    move: { forward: false, backward: false, left: false, right: false },
    velocity: new THREE.Vector3(),
    isDragging: false,
    yaw: Math.PI,
    pitch: 0,
    mouse: new THREE.Vector2(),
    hoveredObject: null,
    // Teleportation state
    isTeleporting: false,
    teleportProgress: 0,
    teleportStart: { pos: new THREE.Vector3(), yaw: 0, pitch: 0 },
    teleportTarget: { pos: new THREE.Vector3(), yaw: 0, pitch: 0 },
    // Zone tracking for debounce
    currentZone: null
};

// ===== Waypoint Definitions (facing walls directly) =====
// ===== Waypoint Definitions (Spaced Out) =====
const WAYPOINTS = {
    entrance: { pos: new THREE.Vector3(0, 2, -12), yaw: Math.PI, pitch: 0.10 }, // About Me (Centered)
    academy: { pos: new THREE.Vector3(-5, 2, -25), yaw: Math.PI / 2, pitch: 0.10 },
    organizations: { pos: new THREE.Vector3(5, 2, -40), yaw: -Math.PI / 2, pitch: 0.10 },
    roles: { pos: new THREE.Vector3(-5, 2, -55), yaw: Math.PI / 2, pitch: 0.10 },
    activities: { pos: new THREE.Vector3(5, 2, -70), yaw: -Math.PI / 2, pitch: 0.10 },
    achievements: { pos: new THREE.Vector3(6, 2, -85), yaw: -Math.PI / 2, pitch: 0.10 }, // New Location
    contact: { pos: new THREE.Vector3(0, 2, -95), yaw: 0, pitch: 0.50 }
};

// ===== Trigger Zones Definition (Spaced Out) =====
const ZONES = {
    entrance: {
        xMin: -5, xMax: 5,    // Centered Trigger Zone
        zMin: -14, zMax: -6,  // Adjusted for new checkpoint
        title: 'PROFESSIONAL PROFILE',
        introName: 'Valentino Hose',
        subtitle: 'Informatics Student & Web Developer',
        items: [
            { title: '✦ Web Development', sub: '', detail: '' },
            { title: '✦ Analytical Problem Solving', sub: '', detail: '' },
            { title: '✦ User Experience Design', sub: '', detail: '' }
        ],
        extraHtml: `<hr class="divider"><p class="award-text">Penerima <strong>The Dean's Most Outstanding List Award</strong> dari Universitas Kristen Maranatha periode 2024/2025.</p>`
    },
    academy: {
        xMin: -15, xMax: -4,
        zMin: -28, zMax: -22,
        title: 'ACADEMY',
        items: [
            { title: 'Maranatha Christian University', sub: '2024 - Present', detail: 'S1 Teknik Informatika' },
            { title: 'SMAK Kalam Kudus', sub: '2021 - 2024', detail: 'Science Major' }
        ]
    },
    organizations: {
        xMin: 4, xMax: 15,
        zMin: -43, zMax: -37,
        title: 'ORGANIZATIONS',
        items: [
            { title: 'Ketua HMIF', sub: 'Himpunan Mahasiswa', detail: 'Leading Association' },
            { title: 'Google Ambassador', sub: '2025 - 2026', detail: 'Campus Tech Rep' },
            { title: 'UKOR Free Fire', sub: 'Cabinet Member', detail: 'Esports Community' }
        ]
    },
    roles: {
        xMin: -15, xMax: -4,
        zMin: -58, zMax: -52,
        title: 'MORE ROLES',
        items: [
            { title: 'Kemitraan HMIF', sub: 'Active Staff', detail: 'Partnership Division' }
        ]
    },
    activities: {
        xMin: 4, xMax: 15,
        zMin: -73, zMax: -67,
        title: 'ACTIVITIES',
        items: [
            { title: 'Lab Staff GWM', sub: 'Internship', detail: 'Laboratory Assistant' },
            { title: 'Teaching Assistant', sub: 'Logika & Project Next', detail: 'Academic Mentor' }
        ]
    },
    achievements: {
        xMin: 4, xMax: 15, // Right side
        zMin: -88, zMax: -82,
        title: 'ACHIEVEMENTS',
        items: [
            { title: "The Dean's Most Outstanding List", sub: "2024/2025", detail: "Highest Academic Honor" }
        ],
        extraHtml: `<p class="award-text">Recognized for maintaining a perfect GPA and active participation in university development.</p>`
    },
    contact: {
        xMin: -5, xMax: 5,
        zMin: -98, zMax: -90,
        title: 'CONTACT',
        items: [
            { title: 'Email', sub: 'valentinohose@gmail.com', detail: 'Primary Contact' },
            { title: 'LinkedIn', sub: 'linkedin.com/in/valentinohose', detail: 'Professional Network' },
            { title: 'GitHub', sub: 'github.com/VHose', detail: 'Code Repository' }
        ]
    }
};

// ===== Scene Setup =====
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.background);
scene.fog = new THREE.Fog(CONFIG.colors.background, 10, 80);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 150);
// Spawn inside the gallery at entrance, facing into the hall
camera.position.set(13, 2, -5);
camera.rotation.y = Math.PI;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const raycaster = new THREE.Raycaster();
const clickableObjects = [];

// ===== Brighter Lighting =====
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 1.2);  // Increased
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 0.8);  // Brighter
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

function addWarmLight(x, y, z) {
    const light = new THREE.PointLight(0xFFFFFF, 1.0, 40);  // Brighter, longer range
    light.position.set(x, y, z);
    scene.add(light);
}

// ===== Chandelier (Scaled Up) =====
function createChandelier(x, z) {
    const group = new THREE.Group();
    const wallHeight = CONFIG.room.height;
    // Ceiling is curved - at center the ceiling is at wallHeight + radius
    const ceilingApex = wallHeight + CONFIG.room.width / 2;

    // Scale factor for bigger chandelier
    const scale = 2.0;

    // Gold/bronze material for fixture
    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xB8860B,
        metalness: 0.8,
        roughness: 0.3
    });

    // Chain from ceiling - longer to reach down from curved ceiling
    const chainLength = 3.5 * scale;
    const chainGeo = new THREE.CylinderGeometry(0.05 * scale, 0.05 * scale, chainLength, 12);
    const chain = new THREE.Mesh(chainGeo, goldMat);
    chain.position.set(0, ceilingApex - chainLength / 2, 0);
    group.add(chain);

    // Ceiling mount (decorative rosette)
    const mountGeo = new THREE.CylinderGeometry(0.5 * scale, 0.35 * scale, 0.15 * scale, 24);
    const mount = new THREE.Mesh(mountGeo, goldMat);
    mount.position.set(0, ceilingApex - 0.08, 0);
    group.add(mount);

    // Height where chandelier body hangs
    const chandelierBodyY = ceilingApex - chainLength - 0.4 * scale;

    // Central body (decorative ball)
    const bodyGeo = new THREE.SphereGeometry(0.4 * scale, 24, 24);
    const body = new THREE.Mesh(bodyGeo, goldMat);
    body.position.set(0, chandelierBodyY, 0);
    group.add(body);

    // Arms with bulbs (8 arms for bigger chandelier)
    const armCount = 8;
    for (let i = 0; i < armCount; i++) {
        const angle = (i / armCount) * Math.PI * 2;
        const armLength = 1.2 * scale;

        // Arm
        const armGeo = new THREE.CylinderGeometry(0.04 * scale, 0.04 * scale, armLength, 12);
        const arm = new THREE.Mesh(armGeo, goldMat);
        arm.rotation.z = Math.PI / 2;
        arm.position.set(
            Math.cos(angle) * armLength / 2,
            chandelierBodyY,
            Math.sin(angle) * armLength / 2
        );
        arm.rotation.y = -angle;
        group.add(arm);

        // Bulb holder
        const holderGeo = new THREE.CylinderGeometry(0.08 * scale, 0.12 * scale, 0.15 * scale, 12);
        const holder = new THREE.Mesh(holderGeo, goldMat);
        holder.position.set(
            Math.cos(angle) * armLength,
            chandelierBodyY + 0.08 * scale,
            Math.sin(angle) * armLength
        );
        group.add(holder);

        // Light bulb (glowing)
        const bulbGeo = new THREE.SphereGeometry(0.12 * scale, 16, 16);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFF8DC }); // Cream white glow
        const bulb = new THREE.Mesh(bulbGeo, bulbMat);
        bulb.position.set(
            Math.cos(angle) * armLength,
            chandelierBodyY - 0.05,
            Math.sin(angle) * armLength
        );
        group.add(bulb);
    }

    // Spotlight pointing DOWN from chandelier - MUCH BRIGHTER
    const spotlight = new THREE.SpotLight(0xFFF8DC, 6.0, 60, Math.PI / 4, 0.5, 1);
    spotlight.position.set(0, chandelierBodyY - 0.2 * scale, 0);

    // Target on the floor below the chandelier
    const targetObj = new THREE.Object3D();
    targetObj.position.set(0, 0, 0);
    group.add(targetObj);
    spotlight.target = targetObj;

    group.add(spotlight);

    group.position.set(x, 0, z);
    scene.add(group);
    return group;
}

// Ceiling Spotlight with visible fixture
function createSpotlight(targetX, targetZ, side) {
    const group = new THREE.Group();
    const height = CONFIG.room.height;

    // --- UBAH DI SINI ---
    // Semakin KECIL angkanya (misal 0.5), posisi lampu semakin DEKAT ke dinding.
    // Semakin BESAR angkanya (misal 3.0), posisi lampu semakin ke TENGAH ruangan.
    const distanceFromWall = 0.3;

    const fixtureX = side === 'left'
        ? -CONFIG.room.width / 2 + distanceFromWall
        : CONFIG.room.width / 2 - distanceFromWall;
    // --------------------

    // Lamp fixture (Cylinder) - Posisinya otomatis ikut fixtureX
    const fixtureGeo = new THREE.CylinderGeometry(0.15, 0.25, 0.4, 16);
    const fixtureMat = new THREE.MeshStandardMaterial({ color: 0x2C2C2C, metalness: 0.8, roughness: 0.3 });
    const fixture = new THREE.Mesh(fixtureGeo, fixtureMat);
    fixture.position.set(fixtureX, height - 0.2, targetZ);
    group.add(fixture);

    // Light bulb glow - White color
    const bulbGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // White
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(fixtureX, height - 0.4, targetZ);
    group.add(bulb);

    // Spotlight - White light
    const spotlight = new THREE.SpotLight(0xFFFFFF, 2, 15, Math.PI / 6, 0.5, 1);
    spotlight.position.set(fixtureX, height - 0.5, targetZ);

    // Target tetap di dinding (targetX)
    const targetObj = new THREE.Object3D();
    targetObj.position.set(targetX, 3, targetZ);
    scene.add(targetObj);
    spotlight.target = targetObj;

    spotlight.castShadow = true;
    group.add(spotlight);

    scene.add(group);
    return group;
}

// ===== Texture Generators =====
// Realistic Marble Floor Texture
function createMarbleFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base cream color
    ctx.fillStyle = '#F5F0E8';
    ctx.fillRect(0, 0, 1024, 1024);

    // Marble veins
    ctx.strokeStyle = 'rgba(180, 170, 160, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        let x = Math.random() * 1024;
        let y = Math.random() * 1024;
        ctx.moveTo(x, y);
        for (let j = 0; j < 8; j++) {
            x += (Math.random() - 0.5) * 150;
            y += (Math.random() - 0.5) * 150;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Darker veins
    ctx.strokeStyle = 'rgba(120, 110, 100, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        let x = Math.random() * 1024;
        let y = Math.random() * 1024;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) {
            x += (Math.random() - 0.5) * 100;
            y += (Math.random() - 0.5) * 100;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    // Tile grid lines
    ctx.strokeStyle = 'rgba(200, 190, 180, 0.5)';
    ctx.lineWidth = 3;
    const tileSize = 256;
    for (let i = 0; i <= 4; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, 1024);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(1024, i * tileSize);
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(CONFIG.room.width / 8, CONFIG.room.length / 8);
    return texture;
}

// Subtle wall texture
function createWallTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base color
    ctx.fillStyle = '#FAF9F6';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle stucco noise
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const brightness = 245 + Math.random() * 10;
        ctx.fillStyle = `rgb(${brightness}, ${brightness - 2}, ${brightness - 5})`;
        ctx.fillRect(x, y, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// ===== Room Construction =====
function createRoom() {
    const { width, height, length } = CONFIG.room;
    const halfW = width / 2;

    // Marble Floor - Shiny/Reflective
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
        map: createMarbleFloorTexture(),
        roughness: 0.15,  // Lower = shinier
        metalness: 0.3    // Higher = more reflective
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -length / 2);
    floor.receiveShadow = true;
    scene.add(floor);

    // Curved Ceiling (Barrel vault)
    // The arch goes from left wall to right wall, apex at center top
    const ceilingSegments = 64;  // Increased for smoother curve
    const ceilingRadius = width / 1.9;  // Ubah ini untuk lebar atap
    const ceilingGeo = new THREE.CylinderGeometry(
        ceilingRadius,  // top radius
        ceilingRadius,  // bottom radius
        length,         // cylinder length = room length
        ceilingSegments,
        10,
        true,           // open ended
        -17.2755555555555,  // start angle (your setting)
        Math.PI         // sweep angle (half circle = 180 degrees)
    );
    const ceilMat = new THREE.MeshStandardMaterial({
        color: 0xFAF9F6,
        roughness: 0.9,
        side: THREE.DoubleSide
    });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilMat);
    ceiling.rotation.set(Math.PI / 2, 0, 0);
    ceiling.position.set(0, height, -length / 2);
    scene.add(ceiling);

    // End caps to close ceiling openings (front and back)
    const capMat = new THREE.MeshStandardMaterial({
        color: 0xFAF9F6,  // Same as ceiling
        roughness: 0.9,
        side: THREE.DoubleSide
    });

    // Back cap (semicircle at z = -length)
    const glassCapGeo = new THREE.CircleGeometry(ceilingRadius, 64, 0, Math.PI);  // 64 segments for smooth edge
    const backGlass = new THREE.Mesh(glassCapGeo, capMat);
    backGlass.rotation.z = 0;  // Same as front
    backGlass.rotation.y = 0;  // Faces into gallery (no flip needed)
    backGlass.position.set(0, height, -length);
    scene.add(backGlass);

    // Front cap (semicircle at z = 0)
    const frontGlass = new THREE.Mesh(glassCapGeo, capMat);
    frontGlass.rotation.z = 0;
    frontGlass.rotation.y = Math.PI;
    frontGlass.position.set(0, height, 0);
    scene.add(frontGlass);

    // Wall Material - Simple white
    const wallMat = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.9
    });

    // Left Wall
    const leftWallGeo = new THREE.PlaneGeometry(length, height);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-halfW, height / 2, -length / 2);
    scene.add(leftWall);

    // Right Wall with Door Opening
    // Door position on right wall
    const doorWidth = 3;
    const doorHeight = 4;
    const doorZ = -5; // Near the entrance

    // Part of right wall BEFORE the door (from z=0 to doorZ)
    const rightBeforeDoorLen = Math.abs(doorZ) - doorWidth / 2;
    const rightWallBeforeGeo = new THREE.PlaneGeometry(rightBeforeDoorLen, height);
    const rightWallBefore = new THREE.Mesh(rightWallBeforeGeo, wallMat.clone());
    rightWallBefore.rotation.y = -Math.PI / 2;
    rightWallBefore.position.set(halfW, height / 2, -rightBeforeDoorLen / 2);
    scene.add(rightWallBefore);

    // Part of right wall AFTER the door (from doorZ+doorWidth to end)
    const rightAfterDoorLen = length - Math.abs(doorZ) - doorWidth / 2;
    const rightWallAfterGeo = new THREE.PlaneGeometry(rightAfterDoorLen, height);
    const rightWallAfter = new THREE.Mesh(rightWallAfterGeo, wallMat.clone());
    rightWallAfter.rotation.y = -Math.PI / 2;
    rightWallAfter.position.set(halfW, height / 2, -(Math.abs(doorZ) + doorWidth / 2 + rightAfterDoorLen / 2));
    scene.add(rightWallAfter);

    // Part of right wall ABOVE the door
    const rightAboveDoorGeo = new THREE.PlaneGeometry(doorWidth, height - doorHeight);
    const rightAboveDoor = new THREE.Mesh(rightAboveDoorGeo, wallMat.clone());
    rightAboveDoor.rotation.y = -Math.PI / 2;
    rightAboveDoor.position.set(halfW, height - (height - doorHeight) / 2, doorZ);
    scene.add(rightAboveDoor);

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(width, height);
    const backWall = new THREE.Mesh(backWallGeo, wallMat.clone());
    backWall.position.set(0, height / 2, -length);
    scene.add(backWall);

    // Front Wall (solid, no door)
    const frontWallGeo = new THREE.PlaneGeometry(width, height);
    const frontWall = new THREE.Mesh(frontWallGeo, wallMat.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, height / 2, 0);
    scene.add(frontWall);

    // Door Frame (Brown wood) on RIGHT wall
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.7 });

    // Front door frame
    const frameGeo = new THREE.BoxGeometry(0.2, doorHeight, 0.15);
    const frontFrame = new THREE.Mesh(frameGeo, frameMat);
    frontFrame.position.set(halfW, doorHeight / 2, doorZ - doorWidth / 2);
    scene.add(frontFrame);

    // Back door frame
    const backFrame = new THREE.Mesh(frameGeo, frameMat);
    backFrame.position.set(halfW, doorHeight / 2, doorZ + doorWidth / 2);
    scene.add(backFrame);

    // Top door frame
    const topFrameGeo = new THREE.BoxGeometry(0.2, 0.15, doorWidth + 0.3);
    const topFrame = new THREE.Mesh(topFrameGeo, frameMat);
    topFrame.position.set(halfW, doorHeight, doorZ);
    scene.add(topFrame);

    // SOLID DOOR (Brown wooden door)
    const doorMat = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Saddle brown
        roughness: 0.6,
        metalness: 0.1
    });
    const doorGeo = new THREE.BoxGeometry(0.1, doorHeight - 0.2, doorWidth - 0.2);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(halfW + 0.05, doorHeight / 2, doorZ);
    scene.add(door);

    // Door handle
    const handleMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.8, roughness: 0.3 });
    const handleGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(halfW + 0.15, doorHeight / 2, doorZ - 0.8);
    scene.add(handle);

    // Welcome mat (inside, near door)
    const matGeo = new THREE.PlaneGeometry(1.5, 2.5);
    const matMaterial = new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.9 });
    const welcomeMat = new THREE.Mesh(matGeo, matMaterial);
    welcomeMat.rotation.x = -Math.PI / 2;
    welcomeMat.position.set(halfW - 1.5, 0.01, doorZ);
    scene.add(welcomeMat);

    // Baseboards - All 4 walls
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });

    // Left & Right baseboards (along length)
    const skirtGeoLR = new THREE.BoxGeometry(length, 0.15, 0.08);

    const leftSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    leftSkirt.rotation.y = Math.PI / 2;
    leftSkirt.position.set(-halfW + 0.04, 0.075, -length / 2);
    scene.add(leftSkirt);

    const rightSkirt = new THREE.Mesh(skirtGeoLR, skirtMat);
    rightSkirt.rotation.y = -Math.PI / 2;
    rightSkirt.position.set(halfW - 0.04, 0.075, -length / 2);
    scene.add(rightSkirt);

    // Front & Back baseboards (along width)
    const skirtGeoFB = new THREE.BoxGeometry(width, 0.15, 0.08);

    const frontSkirt = new THREE.Mesh(skirtGeoFB, skirtMat);
    frontSkirt.position.set(0, 0.075, -0.04);
    scene.add(frontSkirt);

    const backSkirt = new THREE.Mesh(skirtGeoFB, skirtMat);
    backSkirt.position.set(0, 0.075, -length + 0.04);
    scene.add(backSkirt);

    addWarmLight(0, height - 0.5, -10);
    addWarmLight(0, height - 0.5, -25);
    addWarmLight(0, height - 0.5, -40);
    addWarmLight(0, height - 0.5, -55);
}

// ===== Helpers (createText, createFramedPanel, createIcon, createWallFrame tetap sama) =====
const loader = new FontLoader();
let loadedFont = null;

function createText(content, options = {}) {
    if (!loadedFont) return null;
    const size = options.fontSize || 0.5;
    const color = options.color || CONFIG.colors.textBody;
    const geometry = new TextGeometry(content, {
        font: loadedFont,
        size: size,
        height: 0.02,
        curveSegments: 4,
        bevelEnabled: false
    });
    geometry.computeBoundingBox();
    const xOffset = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
    const yOffset = -0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y);
    if (options.anchorX === 'center') {
        geometry.translate(xOffset, yOffset, 0);
    } else {
        geometry.translate(0, yOffset, 0);
    }
    const material = new THREE.MeshBasicMaterial({ color: color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.05;
    return mesh;
}

function createFramedPanel(width, height) {
    const group = new THREE.Group();
    const frameWidth = 0.12;
    const frameDepth = 0.06;
    const frameMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.frame, roughness: 0.3 });
    const top = new THREE.Mesh(new THREE.BoxGeometry(width + frameWidth * 2, frameWidth, frameDepth), frameMat);
    top.position.y = height / 2 + frameWidth / 2;
    group.add(top);
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(width + frameWidth * 2, frameWidth, frameDepth), frameMat);
    bottom.position.y = -height / 2 - frameWidth / 2;
    group.add(bottom);
    const left = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, height, frameDepth), frameMat);
    left.position.x = -width / 2 - frameWidth / 2;
    group.add(left);
    const right = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, height, frameDepth), frameMat);
    right.position.x = width / 2 + frameWidth / 2;
    group.add(right);
    const matGeo = new THREE.BoxGeometry(width, height, 0.02);
    const matMat = new THREE.MeshStandardMaterial({ color: CONFIG.colors.frameBack });
    const backing = new THREE.Mesh(matGeo, matMat);
    backing.position.z = -0.01;
    group.add(backing);
    return group;
}

function createIcon(type, url, position, rotation = 0) {
    const group = new THREE.Group();
    group.position.copy(position);
    group.rotation.y = rotation;

    // Icon size
    const size = 0.8;

    // Frame background with visible border
    const frame = createFramedPanel(1.0, 1.0);
    frame.position.z = -0.05;
    group.add(frame);

    // Add outline/border around icon
    const borderGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.1, 1.1, 0.02));
    const borderMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const border = new THREE.LineSegments(borderGeo, borderMat);
    border.position.z = 0.01;
    group.add(border);

    // Icon URLs from CDN (using Simple Icons or similar)
    const iconUrls = {
        'email': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',      // Gmail
        'linkedin': 'https://cdn-icons-png.flaticon.com/512/174/174857.png',   // LinkedIn
        'github': 'https://cdn-icons-png.flaticon.com/512/733/733553.png',     // GitHub
        'instagram': 'https://cdn-icons-png.flaticon.com/512/174/174855.png'   // Instagram
    };

    // Create plane for icon texture
    const iconGeo = new THREE.PlaneGeometry(size, size);

    // Load texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
        iconUrls[type],
        (texture) => {
            const iconMat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                side: THREE.DoubleSide
            });
            const iconMesh = new THREE.Mesh(iconGeo, iconMat);
            iconMesh.position.z = 0.02;
            iconMesh.userData = { url: url, isInteractive: true, originalColor: 0xFFFFFF };
            group.add(iconMesh);
            clickableObjects.push(iconMesh);
        },
        undefined,
        (error) => {
            // Fallback: colored box if texture fails
            console.warn('Icon load failed, using fallback');
            let color = 0x888888;
            if (type === 'email') color = 0xEA4335;
            else if (type === 'instagram') color = 0xE1306C;
            else if (type === 'linkedin') color = 0x0077B5;
            else if (type === 'github') color = 0x333333;

            const fallbackMat = new THREE.MeshStandardMaterial({ color });
            const fallbackMesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.05), fallbackMat);
            fallbackMesh.userData = { url: url, isInteractive: true, originalColor: color };
            group.add(fallbackMesh);
            clickableObjects.push(fallbackMesh);
        }
    );

    // Label text - moved further down
    const text = createText(type.toUpperCase(), { fontSize: 0.14, color: CONFIG.colors.textBody, anchorX: 'center' });
    if (text) {
        text.position.y = -0.95; // More space from icon
        group.add(text);
    }

    scene.add(group);
    return group;
}

function createWallFrame(side, zPos, title, items) {
    const group = new THREE.Group();
    const xPos = side === 'left' ? -CONFIG.room.width / 2 + 0.15 : CONFIG.room.width / 2 - 0.15;
    const yRot = side === 'left' ? Math.PI / 2 : -Math.PI / 2;
    group.position.set(xPos, 4.0, zPos); // Moved up
    group.rotation.y = yRot;

    // NO FRAME - Clean text directly on wall

    // Header - Dark charcoal color, bold
    const header = createText(title, { fontSize: 0.5, color: 0x222222, anchorX: 'center' });
    if (header) {
        header.position.y = 1.5;
        header.position.z = 0.02;
        group.add(header);
    }

    // Items with numbered list style
    let yPos = 0.8;
    let itemNum = 1;

    items.forEach(item => {
        // Item title - Brown color like in reference
        const titleColor = 0x887355; // Soft brown
        const tMesh = createText(`${itemNum}. ${item.title}`, { fontSize: 0.22, color: titleColor, anchorX: 'center' });
        if (tMesh) {
            tMesh.position.y = yPos;
            tMesh.position.z = 0.02;
            group.add(tMesh);
        }

        // Subtitle - Lighter brown/tan
        if (item.sub) {
            const sMesh = createText(item.sub, { fontSize: 0.16, color: 0x8B7355, anchorX: 'center' });
            if (sMesh) {
                sMesh.position.y = yPos - 0.28;
                sMesh.position.z = 0.02;
                group.add(sMesh);
            }
        }

        // Detail - Warm accent color
        if (item.detail) {
            const dMesh = createText(item.detail, { fontSize: 0.14, color: 0xFFD887, anchorX: 'center' });
            if (dMesh) {
                dMesh.position.y = yPos - 0.52;
                dMesh.position.z = 0.02;
                group.add(dMesh);
            }
        }

        yPos -= 1.0;
        itemNum++;
    });

    scene.add(group);
    return group;
}

// ===== Lectern (Info Stand) =====
function createLectern(x, z, side = 'center') {
    const group = new THREE.Group();

    // Materials
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.6 });
    const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.7, roughness: 0.3 });

    // Base post
    const postGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.0, 12);
    const post = new THREE.Mesh(postGeo, woodMat);
    post.position.y = 0.5;
    group.add(post);

    // Reading surface (angled)
    const surfaceGeo = new THREE.BoxGeometry(0.5, 0.04, 0.4);
    const surface = new THREE.Mesh(surfaceGeo, woodMat);
    surface.position.set(0, 1.05, 0.1);
    surface.rotation.x = -Math.PI / 6;
    group.add(surface);

    // Open Book (Dark cover, open pages, bookmark)
    const bookGroup = new THREE.Group();

    // Dimensions
    const bookWidth = 0.4;   // Total width when open
    const bookDepth = 0.3;
    const coverThickness = 0.005;
    const pageThickness = 0.03;

    // Materials
    const coverColor = 0x3E2723; // Dark Brown
    const pageColor = 0xFFFDD0;  // Cream / Paper white
    const bookmarkColor = 0x8B0000; // Dark Red

    const coverMat = new THREE.MeshStandardMaterial({ color: coverColor, roughness: 0.6 });
    const pageMat = new THREE.MeshStandardMaterial({ color: pageColor, roughness: 0.8 });
    const bookmarkMat = new THREE.MeshStandardMaterial({ color: bookmarkColor, roughness: 0.4 });

    // Left Cover
    const leftCover = new THREE.Mesh(new THREE.BoxGeometry(bookWidth / 2, coverThickness, bookDepth), coverMat);
    leftCover.position.set(-bookWidth / 4, 0, 0);
    leftCover.rotation.z = 0.1; // Slight angle
    bookGroup.add(leftCover);

    // Right Cover
    const rightCover = new THREE.Mesh(new THREE.BoxGeometry(bookWidth / 2, coverThickness, bookDepth), coverMat);
    rightCover.position.set(bookWidth / 4, 0, 0);
    rightCover.rotation.z = -0.1; // Slight angle
    bookGroup.add(rightCover);

    // Left Pages
    const leftPages = new THREE.Mesh(new THREE.BoxGeometry(bookWidth / 2 - 0.02, pageThickness, bookDepth - 0.02), pageMat);
    leftPages.position.set(-bookWidth / 4 + 0.005, coverThickness / 2 + pageThickness / 2, 0);
    leftPages.rotation.z = 0.1;
    bookGroup.add(leftPages);

    // Right Pages
    const rightPages = new THREE.Mesh(new THREE.BoxGeometry(bookWidth / 2 - 0.02, pageThickness, bookDepth - 0.02), pageMat);
    rightPages.position.set(bookWidth / 4 - 0.005, coverThickness / 2 + pageThickness / 2, 0);
    rightPages.rotation.z = -0.1;
    bookGroup.add(rightPages);

    // Spine (Center)
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.04, coverThickness, bookDepth), coverMat);
    spine.position.set(0, -0.01, 0);
    bookGroup.add(spine);

    // Bookmark (Ribbon)
    const bookmark = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.002, bookDepth + 0.05), bookmarkMat);
    bookmark.position.set(0, coverThickness + 0.002, 0);
    bookGroup.add(bookmark);

    // Attach to surface
    bookGroup.position.set(0, 0.02, 0.05);
    surface.add(bookGroup);

    // Remove direct world positioning since it's child of surface
    // orb positioning removed

    // Position based on side
    const xOffset = side === 'left' ? -CONFIG.room.width / 2 + 3 :
        side === 'right' ? CONFIG.room.width / 2 - 3 : 0;
    group.position.set(xOffset, 0, z);

    // Rotate to face center of room
    if (side === 'left') group.rotation.y = -Math.PI / 2;
    else if (side === 'right') group.rotation.y = Math.PI / 2;

    scene.add(group);
    return group;
}

// ===== Certificate Texture Generator =====
function createCertificateTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext('2d');

    // Background - parchment/cream
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 640);
    bgGrad.addColorStop(0, '#FFF9EE');
    bgGrad.addColorStop(0.5, '#FFFDF5');
    bgGrad.addColorStop(1, '#FFF6E0');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 640);

    // Outer gold border
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, 984, 600);

    // Inner border
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 2;
    ctx.strokeRect(35, 35, 954, 570);

    // Decorative corner flourishes
    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 2;
    const corners = [[40, 40], [984, 40], [40, 600], [984, 600]];
    corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        const dx = cx < 512 ? 1 : -1;
        const dy = cy < 320 ? 1 : -1;
        ctx.moveTo(cx, cy + dy * 40);
        ctx.quadraticCurveTo(cx, cy, cx + dx * 40, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy + dy * 30);
        ctx.quadraticCurveTo(cx + dx * 5, cy + dy * 5, cx + dx * 30, cy);
        ctx.stroke();
    });

    // Top ornamental line
    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 80);
    ctx.lineTo(824, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(250, 85);
    ctx.lineTo(774, 85);
    ctx.stroke();

    // University crest area (small gold circle)
    ctx.beginPath();
    ctx.arc(512, 120, 25, 0, Math.PI * 2);
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#DAA520';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText('✦', 512, 128);

    // Main title
    ctx.fillStyle = '#2C1810';
    ctx.font = '600 28px "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.fillText("THE DEAN'S MOST", 512, 190);
    ctx.fillText('OUTSTANDING LIST AWARD', 512, 225);

    // Decorative line under title
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(300, 245);
    ctx.lineTo(724, 245);
    ctx.stroke();

    // "Awarded to" text
    ctx.fillStyle = '#5C4A3A';
    ctx.font = 'italic 18px "Georgia", serif';
    ctx.fillText('This certificate is awarded to', 512, 290);

    // Name
    ctx.fillStyle = '#1A0F0A';
    ctx.font = '700 42px "Georgia", serif';
    ctx.fillText('Valentino Hose', 512, 350);

    // Decorative line under name
    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(320, 370);
    ctx.lineTo(704, 370);
    ctx.stroke();

    // Description
    ctx.fillStyle = '#5C4A3A';
    ctx.font = '16px "Georgia", serif';
    ctx.fillText('For exceptional academic achievement', 512, 410);
    ctx.fillText('in the Faculty of Information Technology', 512, 435);

    // Institution
    ctx.fillStyle = '#2C1810';
    ctx.font = '600 18px "Georgia", serif';
    ctx.fillText('Maranatha Christian University', 512, 480);

    // Period
    ctx.fillStyle = '#8B7355';
    ctx.font = '15px "Georgia", serif';
    ctx.fillText('Academic Year 2024/2025', 512, 510);

    // Bottom ornamental line
    ctx.strokeStyle = '#C5A55A';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(200, 550);
    ctx.lineTo(824, 550);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(250, 555);
    ctx.lineTo(774, 555);
    ctx.stroke();

    // Gold seal (bottom center)
    ctx.beginPath();
    ctx.arc(512, 575, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#DAA520';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#FFF9EE';
    ctx.font = 'bold 14px serif';
    ctx.fillText('★', 512, 581);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// ===== Certificate Frame (Positionable) =====
function createCertificateFrame(x, y, z, rotationY) {
    const group = new THREE.Group();
    const certWidth = 5.0;
    const certHeight = 3.125; // keeping 1024:640 ratio

    // Certificate canvas as texture
    const certTexture = createCertificateTexture();
    const certGeo = new THREE.PlaneGeometry(certWidth, certHeight);
    const certMat = new THREE.MeshStandardMaterial({
        map: certTexture,
        roughness: 0.4,
        metalness: 0.05
    });
    const certMesh = new THREE.Mesh(certGeo, certMat);
    certMesh.position.z = 0.03;
    group.add(certMesh);

    // Premium wooden frame
    const frameWidth = 0.18;
    const frameDepth = 0.1;
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x3D2B1F, roughness: 0.3, metalness: 0.1 });

    // Top frame
    const topF = new THREE.Mesh(new THREE.BoxGeometry(certWidth + frameWidth * 2, frameWidth, frameDepth), frameMat);
    topF.position.y = certHeight / 2 + frameWidth / 2;
    group.add(topF);
    // Bottom frame
    const botF = new THREE.Mesh(new THREE.BoxGeometry(certWidth + frameWidth * 2, frameWidth, frameDepth), frameMat);
    botF.position.y = -certHeight / 2 - frameWidth / 2;
    group.add(botF);
    // Left frame
    const leftF = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, certHeight + frameWidth * 2, frameDepth), frameMat);
    leftF.position.x = -certWidth / 2 - frameWidth / 2;
    group.add(leftF);
    // Right frame
    const rightF = new THREE.Mesh(new THREE.BoxGeometry(frameWidth, certHeight + frameWidth * 2, frameDepth), frameMat);
    rightF.position.x = certWidth / 2 + frameWidth / 2;
    group.add(rightF);

    // Inner gold trim
    const trimMat = new THREE.MeshStandardMaterial({ color: 0xDAA520, metalness: 0.6, roughness: 0.3 });
    const trimW = 0.04;
    const tTop = new THREE.Mesh(new THREE.BoxGeometry(certWidth, trimW, frameDepth + 0.01), trimMat);
    tTop.position.set(0, certHeight / 2 - trimW / 2, 0.01);
    group.add(tTop);
    const tBot = new THREE.Mesh(new THREE.BoxGeometry(certWidth, trimW, frameDepth + 0.01), trimMat);
    tBot.position.set(0, -certHeight / 2 + trimW / 2, 0.01);
    group.add(tBot);
    const tLeft = new THREE.Mesh(new THREE.BoxGeometry(trimW, certHeight, frameDepth + 0.01), trimMat);
    tLeft.position.set(-certWidth / 2 + trimW / 2, 0, 0.01);
    group.add(tLeft);
    const tRight = new THREE.Mesh(new THREE.BoxGeometry(trimW, certHeight, frameDepth + 0.01), trimMat);
    tRight.position.set(certWidth / 2 - trimW / 2, 0, 0.01);
    group.add(tRight);

    // Wall label under certificate
    const label = createText('Dean\'s Most Outstanding List Award — 2024/2025', {
        fontSize: 0.18,
        color: 0x887355,
        anchorX: 'center'
    });
    if (label) {
        label.position.set(0, -certHeight / 2 - 0.6, 0.02);
        group.add(label);
    }

    // Apply Position and Rotation
    group.position.set(x, y, z);
    group.rotation.y = rotationY;

    scene.add(group);

    // Prestige spotlight for certificate
    // Calculate spotlight position in front of the certificate based on rotation
    const dist = 3.0; // distance from wall
    const spotlightX = x + Math.sin(rotationY) * dist;
    const spotlightZ = z + Math.cos(rotationY) * dist;

    const certSpotlight = new THREE.SpotLight(0xFFF8DC, 3.0, 20, Math.PI / 6, 0.6, 1);
    certSpotlight.position.set(spotlightX, CONFIG.room.height - 0.5, spotlightZ);

    const certTarget = new THREE.Object3D();
    certTarget.position.set(x, y, z); // Target the center of frame
    scene.add(certTarget);
    certSpotlight.target = certTarget;
    certSpotlight.castShadow = true;
    scene.add(certSpotlight);

    return group;
}

// ===== Unified Info Panel Logic =====
const infoPanel = document.getElementById('info-panel');
const panelContent = document.getElementById('panel-content');
const toggleBtn = document.getElementById('panel-toggle');

if (toggleBtn && infoPanel) {
    toggleBtn.addEventListener('click', (e) => {
        infoPanel.classList.toggle('minimized');
        e.stopPropagation();
    });
}

function showInfoPanel(zoneName) {
    const zone = ZONES[zoneName];
    if (!zone || !infoPanel || !panelContent) return;

    // Generate HTML based on zone data
    let html = '';

    // Header / Title for the page content
    if (zone.introName) {
        html += `<h2 class="profile-name">${zone.introName}</h2>`;
    } else if (zone.title) {
        html += `<h2 class="panel-title-large">${zone.title}</h2>`;
    }

    // Subtitle
    if (zone.subtitle) {
        html += `<p class="role-tag">${zone.subtitle}</p>`;
    }

    // Divider
    html += `<hr class="divider">`;

    // Extra HTML (like award text)
    if (zone.extraHtml) {
        html += zone.extraHtml;
    }

    // List Items
    if (zone.items && zone.items.length > 0) {
        html += `<ul class="skills-list">`;
        zone.items.forEach(item => {
            html += `<li>
                <div class="info-item-title">${item.title}</div>
                ${item.sub ? `<div class="info-item-sub">${item.sub}</div>` : ''}
                ${item.detail ? `<div class="info-item-detail">${item.detail}</div>` : ''}
            </li>`;
        });
        html += `</ul>`;
    }

    panelContent.innerHTML = html;

    // Show panel
    infoPanel.classList.remove('hidden');
    infoPanel.classList.add('visible');
}

function hideInfoPanel() {
    if (infoPanel) {
        infoPanel.classList.remove('visible');
        infoPanel.classList.add('hidden');
    }
}

function checkZone() {
    const x = camera.position.x;
    const z = camera.position.z;
    let newZone = null;

    // Find which zone camera is in (check both X and Z bounds)
    for (const [name, zone] of Object.entries(ZONES)) {
        const inX = x >= zone.xMin && x <= zone.xMax;
        const inZ = z >= zone.zMin && z <= zone.zMax;
        if (inX && inZ) {
            newZone = name;
            break;
        }
    }

    // Only update if zone changed (debounce)
    if (newZone !== state.currentZone) {
        state.currentZone = newZone;
        if (newZone) {
            showInfoPanel(newZone);
        } else {
            hideInfoPanel();
        }
    }
}

// ===== Build Scene =====
function buildScene() {
    createRoom();

    // ===== Front Wall: "The Scholarly Gallery" =====
    const introGroup = new THREE.Group();
    introGroup.position.set(0, 7.5, -0.1);
    introGroup.rotation.y = Math.PI;

    // "ABOUT ME" title
    const nameText = createText("ABOUT ME", { fontSize: 1.0, color: 0x222222, anchorX: 'center' });
    if (nameText) { nameText.position.y = 0.3; introGroup.add(nameText); }

    // Subtitles
    const jobText = createText("Valentino Hose", { fontSize: 0.4, color: CONFIG.colors.accent, anchorX: 'center' });
    if (jobText) { jobText.position.y = -0.8; introGroup.add(jobText); }

    const roleText = createText("Informatics Student & Web Developer", { fontSize: 0.18, color: 0x887355, anchorX: 'center' });
    if (roleText) { roleText.position.y = -1.2; introGroup.add(roleText); }

    scene.add(introGroup);

    // ===== Side Walls Content (Spaced Out) =====
    // Academy (-25)
    createWallFrame('left', -25, "ACADEMY", [
        { title: "Maranatha Christian Univ.", sub: "2024 - Present", detail: "S1 Teknik Informatika" },
        { title: "SMAK Kalam Kudus", sub: "2021 - 2024", detail: "Science Major" }
    ]);

    // Organizations (-40)
    createWallFrame('right', -40, "ORGANIZATIONS", [
        { title: "Ketua HMIF", sub: "Himpunan Mahasiswa", detail: "Leading Association" },
        { title: "Google Ambassador", sub: "2025 - 2026", detail: "Campus Tech Rep" },
        { title: "UKOR Free Fire", sub: "Cabinet Member", detail: "Esports Community" }
    ]);

    // Roles (-55)
    createWallFrame('left', -55, "MORE ROLES", [
        { title: "Kemitraan HMIF", sub: "Active Staff", detail: "Partnership Division" },
    ]);

    // Activities (-70)
    createWallFrame('right', -70, "ACTIVITIES", [
        { title: "Lab Staff GWM", sub: "Internship", detail: "Laboratory Assistant" },
        { title: "Teaching Assistant", sub: "Logika & Project Next", detail: "Academic Mentor" }
    ]);

    // Achievements (-85) - Right Side, near End
    const performGroup = createWallFrame('right', -85, "ACHIEVEMENTS", []); // Just Header
    // Certificate Frame
    const rightWallX = CONFIG.room.width / 2 - 0.15;
    createCertificateFrame(rightWallX, 3.8, -85, -Math.PI / 2);

    // ===== Contact Section (-95+) =====
    const endZ = -CONFIG.room.length + 0.15;
    const contactHeader = createText("LET'S CONNECT", { fontSize: 0.5, color: CONFIG.colors.textHeader, anchorX: 'center' });
    if (contactHeader) { contactHeader.position.set(0, 7, endZ + 0.1); scene.add(contactHeader); }

    createIcon("email", "mailto:valentinohose@gmail.com", new THREE.Vector3(-2.5, 5, endZ), 0);
    createIcon("linkedin", "https://linkedin.com/in/valentinohose", new THREE.Vector3(-0.8, 5, endZ), 0);
    createIcon("github", "https://github.com/VHose", new THREE.Vector3(0.8, 5, endZ), 0);
    createIcon("instagram", "https://instagram.com/legaseeh", new THREE.Vector3(2.5, 5, endZ), 0);

    // Decor & Lighting at new intervals
    const zPositions = [-25, -40, -55, -70, -85];
    zPositions.forEach(z => {
        if (z % 2 !== 0) createChandelier(0, z); // Chandeliers at -25, -55, -85? 
    });
    // Add specific chandeliers:
    createChandelier(0, -25);
    createChandelier(0, -55);
    createChandelier(0, -85);

    // Lecterns
    createLectern(0, -8, 'center');  // About Me (Centered) - Directly visible
    createLectern(0, -25, 'left');   // Academy
    createLectern(0, -40, 'right');  // Organizations
    createLectern(0, -55, 'left');   // Roles
    createLectern(0, -70, 'right');  // Activities
    createLectern(0, -85, 'right');  // Achievements (New)

    // Warm Lights
    for (let z = -10; z > -100; z -= 15) {
        addWarmLight(0, CONFIG.room.height - 0.5, z);
    }

    const loaderEl = document.getElementById('loader');
    if (loaderEl) {
        loaderEl.style.opacity = 0;
        setTimeout(() => loaderEl.remove(), 1000);
    }
}

// ===== Initial Load & Animate (Tetap Sama) =====
loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
    loadedFont = font;
    buildScene();
});

function onMouseMove(event) {
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    if (state.isDragging) {
        state.yaw -= event.movementX * CONFIG.nav.lookSpeed;
        state.pitch -= event.movementY * CONFIG.nav.lookSpeed;
        state.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, state.pitch));
    }
}

function onMouseDown(event) {
    if (event.button === 0) {
        raycaster.setFromCamera(state.mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, true);
        if (intersects.length > 0) {
            let obj = intersects[0].object;
            while (obj.parent && !obj.userData.url) { obj = obj.parent; }
            if (obj.userData.url) window.open(obj.userData.url, '_blank');
        }
    }
    if (event.button === 2) { state.isDragging = true; document.body.style.cursor = 'grabbing'; }
}

function onMouseUp() { state.isDragging = false; document.body.style.cursor = 'default'; }

document.addEventListener('mousemove', onMouseMove);
document.addEventListener('mousedown', onMouseDown);
document.addEventListener('mouseup', onMouseUp);
document.addEventListener('contextmenu', e => e.preventDefault());

document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'KeyW': state.move.forward = true; break;
        case 'KeyS': state.move.backward = true; break;
        case 'KeyA': state.move.left = true; break;
        case 'KeyD': state.move.right = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'KeyW': state.move.forward = false; break;
        case 'KeyS': state.move.backward = false; break;
        case 'KeyA': state.move.left = false; break;
        case 'KeyD': state.move.right = false; break;
    }
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== Teleportation Function =====
function teleportTo(waypointName) {
    const waypoint = WAYPOINTS[waypointName];
    if (!waypoint || state.isTeleporting) return;

    // Store starting position
    state.teleportStart.pos.copy(camera.position);
    state.teleportStart.yaw = state.yaw;
    state.teleportStart.pitch = state.pitch;

    // Set target
    state.teleportTarget.pos.copy(waypoint.pos);
    state.teleportTarget.yaw = waypoint.yaw;
    state.teleportTarget.pitch = waypoint.pitch;

    // Start teleportation
    state.isTeleporting = true;
    state.teleportProgress = 0;

    // Store target zone for showing info panel when teleport completes
    state.teleportTargetZone = ZONES[waypointName] ? waypointName : null;

    // Stop any current movement
    state.velocity.set(0, 0, 0);
    state.move.forward = false;
    state.move.backward = false;
    state.move.left = false;
    state.move.right = false;
}

// Easing function for smooth transitions
function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ===== Waypoint Navigation Event Listeners =====
const navToggle = document.getElementById('nav-toggle');
const waypointList = document.getElementById('waypoint-list');

// Toggle menu on hamburger button click
navToggle?.addEventListener('click', () => {
    waypointList?.classList.toggle('open');
});

// Waypoint button clicks
document.querySelectorAll('.waypoint-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const waypointName = e.currentTarget.dataset.waypoint;
        teleportTo(waypointName);
        // Close menu after selection
        waypointList?.classList.remove('open');
    });
});

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('#waypoint-nav')) {
        waypointList?.classList.remove('open');
    }
});

function animate() {
    requestAnimationFrame(animate);

    // Handle teleportation animation
    if (state.isTeleporting) {
        state.teleportProgress += 0.025; // Speed of transition
        const t = easeInOutCubic(Math.min(state.teleportProgress, 1));

        // Interpolate position
        camera.position.lerpVectors(state.teleportStart.pos, state.teleportTarget.pos, t);

        // Interpolate rotation
        state.yaw = state.teleportStart.yaw + (state.teleportTarget.yaw - state.teleportStart.yaw) * t;
        state.pitch = state.teleportStart.pitch + (state.teleportTarget.pitch - state.teleportStart.pitch) * t;

        if (state.teleportProgress >= 1) {
            state.isTeleporting = false;
            camera.position.copy(state.teleportTarget.pos);
            state.yaw = state.teleportTarget.yaw;
            state.pitch = state.teleportTarget.pitch;

            // Show info panel if teleported to a zone waypoint
            if (state.teleportTargetZone) {
                state.currentZone = state.teleportTargetZone;
                showInfoPanel(state.teleportTargetZone);
                state.teleportTargetZone = null;
            }
        }
    }

    raycaster.setFromCamera(state.mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);
    if (intersects.length > 0) {
        let obj = intersects[0].object;
        if (!obj.userData.url && obj.parent?.userData?.url) obj = obj.parent;
        if (obj.userData?.isInteractive) {
            if (state.hoveredObject !== obj) {
                if (state.hoveredObject) state.hoveredObject.material.color.setHex(state.hoveredObject.userData.originalColor);
                state.hoveredObject = obj;
                obj.material.color.setHex(CONFIG.colors.iconHover);
                document.body.style.cursor = 'pointer';
            }
        }
    } else {
        if (state.hoveredObject) {
            state.hoveredObject.material.color.setHex(state.hoveredObject.userData.originalColor);
            state.hoveredObject = null;
            document.body.style.cursor = 'default';
        }
    }

    camera.rotation.set(0, 0, 0);
    camera.rotateY(state.yaw);
    camera.rotateX(state.pitch);

    // Only process movement if not teleporting
    if (!state.isTeleporting) {
        const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
        const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), state.yaw);
        if (state.move.forward) state.velocity.add(forward.multiplyScalar(CONFIG.nav.moveSpeed));
        if (state.move.backward) state.velocity.sub(forward.multiplyScalar(CONFIG.nav.moveSpeed));
        if (state.move.left) state.velocity.sub(right.multiplyScalar(CONFIG.nav.moveSpeed));
        if (state.move.right) state.velocity.add(right.multiplyScalar(CONFIG.nav.moveSpeed));
        camera.position.add(state.velocity);
        state.velocity.multiplyScalar(CONFIG.nav.damping);
    }

    const halfW = CONFIG.room.width / 2 - 0.5;
    const roomEnd = -CONFIG.room.length + 1;
    const roomStart = -1;
    camera.position.x = Math.max(-halfW, Math.min(halfW, camera.position.x));
    camera.position.z = Math.max(roomEnd, Math.min(roomStart, camera.position.z));
    camera.position.y = 1.7;

    // Check trigger zones for info panel
    checkZone();

    renderer.render(scene, camera);
}
animate();