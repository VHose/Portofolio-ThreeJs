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
        background: 0xF5F5DC, // Cream
        wall: 0xFFFFFF,
        frame: 0x3D2B1F,
        frameBack: 0xFFFAF0,
        textHeader: 0x1A1A1A, // Dark charcoal
        textSub: 0x4A4A4A,    // Medium Grey
        accent: 0xB8860B,     // Gold
        navy: 0x0A192F,       // Dark Blue
        white: 0xFFFFFF
    },
    room: {
        width: 30,
        height: 10,
        length: 300 // Extended for detailed spaced out layout
    },
    scroll: {
        damp: 0.08,
        parallax: 0.5
    }
};

// ===== State =====
const state = {
    scrollTarget: 8, // Start at 8 (User defined limit)
    scrollCurrent: 8,
    mouse: new THREE.Vector2(),
    parallax: { x: 0, y: 0 },
    hoveredObject: null,
    // Zone tracking
    currentZone: null,
    // Animated Floating Groups
    animatedObjects: []
};

// ===== Waypoint Definitions DELETED (Scroll based now) =====
const ZONES = {
    // Zones will now be based on Z-position ranges in the loop
};

// ===== Scene Setup =====
const canvas = document.getElementById('three-canvas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.colors.background);
// Soft fog to blend the distance
scene.fog = new THREE.Fog(CONFIG.colors.background, 10, 250);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 300);
// Initial Position
camera.position.set(0, 5.5, 8); // Start at user-defined limit
camera.rotation.set(0, 0, 0);   // Facing Forward (towards negative Z)

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap at 1.5 for performance
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const raycaster = new THREE.Raycaster();
const clickableObjects = [];

// ===== Brighter Lighting (No Ceiling Lights) =====
const ambientLight = new THREE.AmbientLight(0xFFFFFF, 2.0);  // Very bright ambient
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1.2);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// Directional Light for Shadows (Sun-like)
const dirLight = new THREE.DirectionalLight(0xFFFFFF, 1.0);
dirLight.position.set(10, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

function addWarmLight(x, y, z) {
    const light = new THREE.PointLight(0xFFFFFF, 1.0, 40);  // Brighter, longer range
    light.position.set(x, y, z);
    scene.add(light);
}

// ===== Environment: Grid Floor (Void) =====
function createGridFloor() {
    // 1. Grid Helper
    const gridHelper = new THREE.GridHelper(200, 100, 0x00D4FF, 0x004466);
    gridHelper.position.y = 0;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    scene.add(gridHelper);

    // 2. Reflective Floor Plane (Glass-like)
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        roughness: 0.1,
        metalness: 0.8,
        transparent: true,
        opacity: 0.8
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    scene.add(plane);
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
    const chainLength = 2.5 * scale; // Reduced from 3.5
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
// Realistic Polished Wood Floor Texture
function createWoodFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base background
    ctx.fillStyle = '#3E2723';
    ctx.fillRect(0, 0, 1024, 1024);

    const plankW = 128; // Wider planks
    const plankH = 1024; // Full length strips (or long planks)

    // Draw Wood Planks (Long strips style like in reference images)
    for (let x = 0; x < 1024; x += plankW) {
        // Uniform Dark Brown (Chocolate/Coffee)
        const hue = 25;
        const sat = 35;
        const lit = 22 + Math.random() * 4;

        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${lit}%)`;
        ctx.fillRect(x, 0, plankW, 1024);

        // Wood Grain (Wavy lines)
        ctx.strokeStyle = `rgba(0,0,0,0.2)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 0; y < 1024; y += 20) {
            let drift = (Math.random() - 0.5) * 10;
            ctx.moveTo(x + 10 + drift, y);
            ctx.lineTo(x + 10 + drift, y + 20);

            let drift2 = (Math.random() - 0.5) * 10;
            ctx.moveTo(x + plankW - 10 + drift2, y);
            ctx.lineTo(x + plankW - 10 + drift2, y + 20);
        }
        ctx.stroke();

        // Plank Gap
        ctx.strokeStyle = '#1A0F0A'; // Very dark gap
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 0, plankW, 1024);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    // Repeat texture
    texture.repeat.set(CONFIG.room.width / 5, CONFIG.room.length / 5);
    // Anisotropy for sharp texture at angle
    if (renderer.capabilities.getMaxAnisotropy) {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
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

    // Wood Floor - Polished
    const floorGeo = new THREE.PlaneGeometry(width, length);
    const floorMat = new THREE.MeshStandardMaterial({
        map: createWoodFloorTexture(),
        roughness: 0.2,   // Polished wood
        metalness: 0.1    // Slight reflection
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
    const rightWallBefore = new THREE.Mesh(rightWallBeforeGeo, wallMat);
    rightWallBefore.rotation.y = -Math.PI / 2;
    rightWallBefore.position.set(halfW, height / 2, -rightBeforeDoorLen / 2);
    scene.add(rightWallBefore);

    // Part of right wall AFTER the door (from doorZ+doorWidth to end)
    const rightAfterDoorLen = length - Math.abs(doorZ) - doorWidth / 2;
    const rightWallAfterGeo = new THREE.PlaneGeometry(rightAfterDoorLen, height);
    const rightWallAfter = new THREE.Mesh(rightWallAfterGeo, wallMat);
    rightWallAfter.rotation.y = -Math.PI / 2;
    rightWallAfter.position.set(halfW, height / 2, -(Math.abs(doorZ) + doorWidth / 2 + rightAfterDoorLen / 2));
    scene.add(rightWallAfter);

    // Part of right wall ABOVE the door
    const rightAboveDoorGeo = new THREE.PlaneGeometry(doorWidth, height - doorHeight);
    const rightAboveDoor = new THREE.Mesh(rightAboveDoorGeo, wallMat);
    rightAboveDoor.rotation.y = -Math.PI / 2;
    rightAboveDoor.position.set(halfW, height - (height - doorHeight) / 2, doorZ);
    scene.add(rightAboveDoor);

    // Back Wall
    const backWallGeo = new THREE.PlaneGeometry(width, height);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, height / 2, -length);
    scene.add(backWall);

    // Front Wall (solid, no door)
    const frontWallGeo = new THREE.PlaneGeometry(width, height);
    const frontWall = new THREE.Mesh(frontWallGeo, wallMat);
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
    const skirtMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A });

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

    // NOTE: Warm lights are added in buildScene loop — removed duplicates here

    // ===== Top Trim (Cornice - "Garis Coklat Outline") =====
    const corniceMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.8 });
    const corniceH = 0.25;
    const corniceD = 0.15;

    // Left Cornice
    const leftCornice = new THREE.Mesh(new THREE.BoxGeometry(length, corniceH, corniceD), corniceMat);
    leftCornice.rotation.y = Math.PI / 2;
    leftCornice.position.set(-halfW + corniceD / 2, height - corniceH / 2, -length / 2);
    scene.add(leftCornice);

    // Right Cornice
    const rightCornice = new THREE.Mesh(new THREE.BoxGeometry(length, corniceH, corniceD), corniceMat);
    rightCornice.rotation.y = -Math.PI / 2;
    rightCornice.position.set(halfW - corniceD / 2, height - corniceH / 2, -length / 2);
    scene.add(rightCornice);

    // Front/Back Cornice
    const endCorniceGeo = new THREE.BoxGeometry(width, corniceH, corniceD);
    const frontCornice = new THREE.Mesh(endCorniceGeo, corniceMat);
    frontCornice.position.set(0, height - corniceH / 2, -corniceD / 2);
    scene.add(frontCornice);
    const backCornice = new THREE.Mesh(endCorniceGeo, corniceMat);
    backCornice.position.set(0, height - corniceH / 2, -length + corniceD / 2);
    scene.add(backCornice);

    // ===== Vertical Corner Trims (Pillars) =====
    const cornerW = 0.25; // Width of the vertical line
    const cornerGeo = new THREE.BoxGeometry(cornerW, height, cornerW);

    // Front Left Corner
    const flTrim = new THREE.Mesh(cornerGeo, corniceMat);
    flTrim.position.set(-halfW + cornerW / 2, height / 2, -cornerW / 2);
    scene.add(flTrim);

    // Front Right Corner
    const frTrim = new THREE.Mesh(cornerGeo, corniceMat);
    frTrim.position.set(halfW - cornerW / 2, height / 2, -cornerW / 2);
    scene.add(frTrim);

    // Back Left Corner
    const blTrim = new THREE.Mesh(cornerGeo, corniceMat);
    blTrim.position.set(-halfW + cornerW / 2, height / 2, -length + cornerW / 2);
    scene.add(blTrim);

    // Back Right Corner
    const brTrim = new THREE.Mesh(cornerGeo, corniceMat);
    brTrim.position.set(halfW - cornerW / 2, height / 2, -length + cornerW / 2);
    scene.add(brTrim);

    // ===== Ceiling Structure (Beams/Arches) =====
    // [USER] ATUR GENTENG/ATAP DISINI (Jarak, Ketebalan, Rotasi)
    const archMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.5 });
    // Same rotation logic as ceiling to match curve

    // Create arches every 25 units (Reduced count for performance - "lebih dikit aja")
    for (let z = -10; z > -length; z -= 25) {
        // Reduced segments (6 radial, 30 tubular) for less lag
        // Slightly shortened arc (Math.PI - 0.3) to prevent clipping into cornices ("nembus")
        // Radius matches ceiling, thickness 0.12
        const archGeo = new THREE.TorusGeometry(ceilingRadius - 0, 0.12, 20, 20, Math.PI - 0);
        const arch = new THREE.Mesh(archGeo, archMat);
        arch.position.set(0, height, z);

        scene.add(arch);
    }
}

// Stone Texture Generator (Procedural Noise)
function createStoneTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Grey
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(0, 0, 512, 512);

    // Add noise for stone speckles
    for (let i = 0; i < 50000; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const shade = Math.floor(Math.random() * 50); // 0-50
        // Randomly darker or lighter
        ctx.fillStyle = Math.random() > 0.5
            ? `rgba(0,0,0, ${Math.random() * 0.1})`
            : `rgba(255,255,255, ${Math.random() * 0.1})`;
        ctx.fillRect(x, y, 2, 2);
    }

    // Cracks / Veins
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 20; i++) {
        ctx.beginPath();
        let x = Math.random() * 512;
        let y = Math.random() * 512;
        ctx.moveTo(x, y);
        for (let j = 0; j < 10; j++) {
            x += (Math.random() - 0.5) * 50;
            y += (Math.random() - 0.5) * 50;
            ctx.lineTo(x, y);
        }
        ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Helper: Roman Pillar / Stand
const sharedStoneTexture = createStoneTexture();
const sharedStoneMat = new THREE.MeshStandardMaterial({
    map: sharedStoneTexture,
    roughness: 0.9,
    color: 0xDDDDDD
});

function createRomanPillar(height) {
    const group = new THREE.Group();
    const stoneMat = sharedStoneMat;

    // Dimensions
    const baseH = 0.4;
    const capitalH = 0.3;
    const shaftH = height - baseH - capitalH;
    const radius = 0.4;

    // 1. Base (Stepped) - Reverted to Standard
    const baseGeo1 = new THREE.BoxGeometry(1.0, baseH / 2, 0.8);
    const base1 = new THREE.Mesh(baseGeo1, stoneMat);
    base1.position.y = baseH / 4;
    group.add(base1);

    const baseGeo2 = new THREE.CylinderGeometry(radius * 1.2, radius * 1.3, baseH / 2, 16);
    const base2 = new THREE.Mesh(baseGeo2, stoneMat);
    base2.position.y = baseH * 0.75;
    group.add(base2);

    // 2. Shaft (Cylinder) - Reverted
    const shaftGeo = new THREE.CylinderGeometry(radius * 0.9, radius, shaftH, 24);
    const shaft = new THREE.Mesh(shaftGeo, stoneMat);
    shaft.position.y = baseH + shaftH / 2;
    group.add(shaft);

    // 3. Capital (Top detail) - Reverted
    const capGeo1 = new THREE.CylinderGeometry(radius * 1.3, radius * 0.95, capitalH / 2, 16);
    const cap1 = new THREE.Mesh(capGeo1, stoneMat);
    cap1.position.y = baseH + shaftH + capitalH / 4;
    group.add(cap1);

    const capGeo2 = new THREE.BoxGeometry(1.2, capitalH / 2, 0.6);
    const cap2 = new THREE.Mesh(capGeo2, stoneMat);
    cap2.position.y = baseH + shaftH + capitalH * 0.75;
    group.add(cap2);

    return group;
}

// Helper: "Press That Picture" Prompt
function createPressPrompt(parent) {
    const group = new THREE.Group();
    // Position below content initially
    group.position.set(0, -2.0, 0.2);

    // Background for text visibility
    const bgGeo = new THREE.PlaneGeometry(3.5, 0.6);
    const bgMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide
    });
    const bg = new THREE.Mesh(bgGeo, bgMat);
    group.add(bg);

    // Text
    const textMesh = createText("Press That Picture", { fontSize: 0.25, color: 0xFFFFFF, anchorX: 'center' });
    if (textMesh) {
        textMesh.position.set(0, 0, 0.05); // Centered on BG
        group.add(textMesh);
    }

    // Add to parent
    parent.add(group);

    // Metadata for animation
    group.userData = {
        isPrompt: true,
        visible: false,
        slideProgress: 0
    };

    return group;
}

// ===== Helpers (createText, createFramedPanel, createIcon, createWallFrame tetap sama) =====
const loader = new FontLoader();
let loadedFont = null;
const sharedTextureLoader = new THREE.TextureLoader();

function createText(content, options = {}) {
    // ... (start of createText)
    if (!loadedFont) return null;
    const size = options.fontSize || 0.5;
    const color = options.color || CONFIG.colors.textBody;
    const geometry = new TextGeometry(content, {
        font: loadedFont,
        size: size,
        height: 0.02,
        curveSegments: 1, // Reduced for performance (was 4)
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
    const size = 1.0; // Increased from 0.8

    // Frame background with visible border
    // Use a nicer frame (Gold/Bronze) for icons
    const frameMat = new THREE.MeshStandardMaterial({
        color: CONFIG.colors.accent, // Gold
        roughness: 0.3,
        metalness: 0.6
    });

    // Backing (white/cream)
    // Scale backing up with size
    const backingGeo = new THREE.BoxGeometry(size + 0.4, size + 0.4, 0.05);
    const backingMat = new THREE.MeshStandardMaterial({ color: 0xFFFAF0 });
    const backing = new THREE.Mesh(backingGeo, backingMat);
    backing.position.z = -0.05;
    group.add(backing);

    // Border (Gold Frame)
    // Scale border with size
    const rimWidth = 0.1;
    const rimDepth = 0.08;
    // const halfSize = (size + 0.4)/2 + rimWidth/2;

    // Top
    const top = new THREE.Mesh(new THREE.BoxGeometry(size + 0.4 + rimWidth * 2, rimWidth, rimDepth), frameMat);
    top.position.set(0, (size + 0.4) / 2 + rimWidth / 2, 0);
    group.add(top);

    // Bottom
    const bot = new THREE.Mesh(new THREE.BoxGeometry(size + 0.4 + rimWidth * 2, rimWidth, rimDepth), frameMat);
    bot.position.set(0, -((size + 0.4) / 2 + rimWidth / 2), 0);
    group.add(bot);

    // Left
    const left = new THREE.Mesh(new THREE.BoxGeometry(rimWidth, size + 0.4, rimDepth), frameMat);
    left.position.set(-((size + 0.4) / 2 + rimWidth / 2), 0, 0);
    group.add(left);

    // Right
    const right = new THREE.Mesh(new THREE.BoxGeometry(rimWidth, size + 0.4, rimDepth), frameMat);
    right.position.set((size + 0.4) / 2 + rimWidth / 2, 0, 0);
    group.add(right);

    // Removed the LineSegments (ugly wireframe)

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
            // High quality filtering
            texture.generateMipmaps = true;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

            // FIX: Correct Color Space for Vibrant, True Colors
            try {
                // Try modern property first
                texture.colorSpace = THREE.SRGBColorSpace;
            } catch (e) {
                // Fallback for older Three.js
                texture.encoding = 3001; // THREE.sRGBEncoding
            }

            const iconMat = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                // alphaTest: 0.5, // REMOVED: triggers jagged edges.
                side: THREE.DoubleSide,
                toneMapped: false, // Critical: Ignore scene lighting exposure
                depthWrite: true   // Allow writing to depth buffer (might need false if transparency issues occur, but true is safer for single layer)
            });
            const iconMesh = new THREE.Mesh(iconGeo, iconMat);
            iconMesh.position.z = 0.05; // More forward
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
    const header = createText(title, { fontSize: 0.5, color: CONFIG.colors.textHeader, anchorX: 'center' });
    if (header) {
        header.position.y = 1.6; // Slightly higher
        header.position.z = 0.02;
        group.add(header);
    }

    // Items with numbered list style
    let yPos = 0.8;
    let itemNum = 1;

    items.forEach(item => {
        // Item title - Dark Brown for contrast
        const titleColor = 0x3E2723; // Dark Brown
        const tMesh = createText(`${itemNum}. ${item.title}`, { fontSize: 0.22, color: titleColor, anchorX: 'center' });
        if (tMesh) {
            tMesh.position.y = yPos;
            tMesh.position.z = 0.02;
            group.add(tMesh);
        }

        // Subtitle - Medium Brown
        if (item.sub) {
            const sMesh = createText(item.sub, { fontSize: 0.16, color: 0x5D4037, anchorX: 'center' });
            if (sMesh) {
                sMesh.position.y = yPos - 0.28;
                sMesh.position.z = 0.02;
                group.add(sMesh);
            }
        }

        // Detail - Dark Gold/Orange
        if (item.detail) {
            const dMesh = createText(item.detail, { fontSize: 0.14, color: 0xB8860B, anchorX: 'center' });
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
// Shared materials (created once, reused across all lecterns)
const lecternWoodMat = new THREE.MeshStandardMaterial({ color: 0x5D3A1A, roughness: 0.6 });
const lecternBronzeMat = new THREE.MeshStandardMaterial({ color: 0xB8860B, metalness: 0.7, roughness: 0.3 });
const lecternCoverMat = new THREE.MeshStandardMaterial({ color: 0x3E2723, roughness: 0.6 });
const lecternPageMat = new THREE.MeshStandardMaterial({ color: 0xFFFDD0, roughness: 0.8 });
const lecternBookmarkMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, roughness: 0.4 });

// Shared geometries (created once, reused across all lecterns)
const lecternPostGeo = new THREE.CylinderGeometry(0.08, 0.1, 1.0, 8);
const lecternSurfaceGeo = new THREE.BoxGeometry(0.5, 0.04, 0.4);

function createLectern(x, z, side = 'center') {
    const group = new THREE.Group();
    const woodMat = lecternWoodMat;
    const bronzeMat = lecternBronzeMat;

    // Base post (shared geometry)
    const post = new THREE.Mesh(lecternPostGeo, woodMat);
    post.position.y = 0.5;
    group.add(post);

    // Reading surface (shared geometry)
    const surface = new THREE.Mesh(lecternSurfaceGeo, woodMat);
    surface.position.set(0, 1.05, 0.1);
    surface.rotation.x = -Math.PI / 6;
    group.add(surface);

    // Open Book (shared materials)
    const bookGroup = new THREE.Group();
    const bookWidth = 0.4;
    const bookDepth = 0.3;
    const coverThickness = 0.005;
    const pageThickness = 0.03;
    const coverMat = lecternCoverMat;
    const pageMat = lecternPageMat;
    const bookmarkMat = lecternBookmarkMat;

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
function create3DButton(text, x, isGold = false) {
    const btnGroup = new THREE.Group();
    const bW = 2.2, bH = 0.6, bD = 0.1;

    const btnGeo = new THREE.BoxGeometry(bW, bH, bD);
    const btnMat = new THREE.MeshStandardMaterial({
        color: isGold ? CONFIG.colors.accent : 0xFFFFFF,
        roughness: 0.3,
        metalness: 0.2
    });
    const btn = new THREE.Mesh(btnGeo, btnMat);
    btnGroup.add(btn);

    // Border for white button
    if (!isGold) {
        const outGeo = new THREE.BoxGeometry(bW + 0.02, bH + 0.02, bD - 0.02);
        const outMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const outline = new THREE.Mesh(outGeo, outMat);
        btnGroup.add(outline);
    }

    const btnText = createText(text, {
        fontSize: 0.14,
        color: isGold ? 0xFFFFFF : CONFIG.colors.textHeader,
        anchorX: 'center'
    });
    if (btnText) {
        btnText.position.z = bD / 2 + 0.01;
        btnGroup.add(btnText);
    }

    btnGroup.position.set(x, 0, 0);
    btn.userData = { isInteractive: true, hoverScale: 1.05 };
    clickableObjects.push(btn);
    return btnGroup;
}

function createIconFrame(type, url, position, label, sub) {
    const group = new THREE.Group();
    group.position.copy(position);

    // Reduced sizes
    const size = 1.2; // Was 1.6
    const frameW = size + 0.15; // Thinner border (Was size + 0.3)
    const frameH = size + 0.15;
    const frameD = 0.1; // Thinner

    // Brand Colors
    const brandColors = {
        'email': 0xEA4335,     // Gmail Red
        'linkedin': 0x0A66C2,  // LinkedIn Blue
        'github': 0x181717,    // GitHub Black
        'instagram': 0xE4405F  // Instagram Pink
    };

    const color = brandColors[type] || CONFIG.colors.accent;

    // Brand Colored Frame
    const outerMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, metalness: 0.5 });
    const innerMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF }); // Pure White Background

    // Outer box (The Frame)
    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, frameD), outerMat);
    group.add(outerFrame);

    // Inner part (The Content Area)
    const innerArea = new THREE.Mesh(new THREE.BoxGeometry(size, size, 0.05), innerMat);
    innerArea.position.z = frameD / 2 + 0.01;
    group.add(innerArea);

    // Icon Texture
    const iconGeo = new THREE.PlaneGeometry(size * 0.6, size * 0.6);
    const iconUrls = {
        'email': 'https://cdn-icons-png.flaticon.com/512/732/732200.png',
        'linkedin': 'https://cdn-icons-png.flaticon.com/512/174/174857.png',
        'github': 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
        'instagram': 'https://cdn-icons-png.flaticon.com/512/174/174855.png'
    };

    sharedTextureLoader.load(iconUrls[type], (texture) => {
        const iconMat = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const iconMesh = new THREE.Mesh(iconGeo, iconMat);
        iconMesh.position.z = frameD / 2 + 0.07;
        group.add(iconMesh);
        iconMesh.userData = { url, isInteractive: true };
        clickableObjects.push(iconMesh);
    });

    // Label Title
    const lTitle = createText(label, { fontSize: 0.22, color: CONFIG.colors.textHeader, anchorX: 'center' });
    if (lTitle) {
        lTitle.position.set(0, -1.0, 0); // Adjusted position for smaller frame
        group.add(lTitle);
    }

    // Label Sub
    const lSub = createText(sub, { fontSize: 0.12, color: 0x888888, anchorX: 'center' });
    if (lSub) {
        lSub.position.set(0, -1.25, 0); // Adjusted position
        group.add(lSub);
    }

    return group;
}

// ===== Video Project Panel =====
function createVideoProject(x, y, z, videoPath, title, desc) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // 1. Create HTML Video Element
    const video = document.createElement('video');
    video.src = videoPath;
    video.crossOrigin = 'anonymous';
    // Settings for "preview" style (loop, muted)
    video.loop = true;
    video.muted = true; // Required for autoplay
    video.playsInline = true;

    // Attempt to play immediately
    const playVideo = () => {
        video.play().catch(e => {
            console.warn("Autoplay blocked for", videoPath, e);
        });
    };
    playVideo();

    // 2. Create Video Texture
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    // 3. Screen Mesh (16:9 Aspect Ratio)
    // Scaling to fit roughly within 3x2 area
    const screenWidth = 3.2;
    const screenHeight = 1.8; // 16:9 ratio
    const geometry = new THREE.PlaneGeometry(screenWidth, screenHeight);

    // Use MeshBasicMaterial so the video looks "bright" like a screen
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide
    });

    const screen = new THREE.Mesh(geometry, material);
    screen.position.z = 0.06; // Slightly protrude from frame
    group.add(screen);

    // 4. Frame (Monitor Style)
    const frameW = screenWidth + 0.15;
    const frameH = screenHeight + 0.15;
    const frameD = 0.1;
    const frameMat = new THREE.MeshStandardMaterial({
        color: 0x1A1A1A, // Dark Grey/Black
        roughness: 0.2,
        metalness: 0.6
    });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, frameD), frameMat);
    group.add(frame);

    // 5. Title & Description floating below
    const titleMesh = createText(title, {
        fontSize: 0.25,
        color: CONFIG.colors.textHeader,
        anchorX: 'center'
    });
    if (titleMesh) {
        titleMesh.position.set(0, -screenHeight / 2 - 0.3, 0.05);
        group.add(titleMesh);
    }

    if (desc) {
        const descMesh = createText(desc, {
            fontSize: 0.15,
            color: 0x555555,
            anchorX: 'center'
        });
        if (descMesh) {
            descMesh.position.set(0, -screenHeight / 2 - 0.55, 0.05);
            group.add(descMesh);
        }
    }

    // Interaction Data
    screen.userData = {
        isInteractive: true,
        type: 'video',
        title: title
    };
    clickableObjects.push(screen);

    scene.add(group);
    state.animatedObjects.push(group);
    return group;
}

function buildScene() {
    createRoom();

    // ===== Section 1: ABOUT ME (Z = 0) =====
    // Floating "Hero" Section
    const introGroup = new THREE.Group();
    introGroup.position.set(0, 5.5, -5);
    introGroup.rotation.y = 0; // Face Camera

    // Profile Image
    sharedTextureLoader.load('assets/img/profile.jpg', (texture) => {
        const aspect = texture.image.width / texture.image.height;
        const imgHeight = 4.0;
        const imgWidth = imgHeight * aspect;
        // Floating Mesh
        const profileMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(imgWidth, imgHeight),
            new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide })
        );
        profileMesh.position.set(-2.2, 0, 0);
        introGroup.add(profileMesh);

        // Floating Shadow
        const shadowMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(imgWidth, imgHeight),
            new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 })
        );
        shadowMesh.position.set(-2.1, -0.2, -0.1);
        introGroup.add(shadowMesh);
    }, undefined, (err) => {
        // Fallback if image missing
        const fallbackGeo = new THREE.PlaneGeometry(3, 4);
        const fallbackMat = new THREE.MeshBasicMaterial({ color: 0xcccccc });
        const fallbackMesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        fallbackMesh.position.set(-2.2, 0, 0);
        introGroup.add(fallbackMesh);
    });

    // Text - Floating
    const nameText = createText("Valentino Hose", { fontSize: 0.8, color: CONFIG.colors.textHeader, anchorX: 'left' });
    if (nameText) { nameText.position.set(0.5, 1.2, 0); introGroup.add(nameText); }

    const roleText = createText("Google Student Ambassador", { fontSize: 0.35, color: 0x333333, anchorX: 'left' });
    if (roleText) { roleText.position.set(0.5, 0.5, 0); introGroup.add(roleText); }

    const detailText = createText("Informatics Student & Web Developer", { fontSize: 0.25, color: 0x666666, anchorX: 'left' });
    if (detailText) { detailText.position.set(0.5, 0.0, 0); introGroup.add(detailText); }

    const ctaText = createText("AVAILABLE FOR OPPORTUNITIES", { fontSize: 0.25, color: CONFIG.colors.accent, anchorX: 'left' });
    if (ctaText) { ctaText.position.set(0.5, -0.8, 0); introGroup.add(ctaText); }

    scene.add(introGroup);
    state.animatedObjects.push(introGroup); // Track for fade-in

    // Helper to create Floating Panels
    function createFloatingPanel(x, z, title, items) {
        const group = new THREE.Group();
        group.position.set(x, 4, z);
        group.rotation.y = 0;

        // Header
        const header = createText(title, { fontSize: 0.5, color: CONFIG.colors.accent, anchorX: 'center' });
        if (header) { header.position.set(0, 1.5, 0); group.add(header); }

        // Items
        items.forEach((item, idx) => {
            const yPos = 0.5 - (idx * 0.8);

            const itemTitle = createText(item.title, { fontSize: 0.35, color: CONFIG.colors.textHeader, anchorX: 'center' });
            if (itemTitle) { itemTitle.position.set(0, yPos, 0); group.add(itemTitle); }

            const itemSub = createText(item.sub, { fontSize: 0.25, color: 0x555555, anchorX: 'center' });
            if (itemSub) { itemSub.position.set(0, yPos - 0.3, 0); group.add(itemSub); }
        });

        // Initial State: Invisible
        group.traverse(child => {
            if (child.isMesh) {
                child.material.transparent = true;
                child.material.opacity = 0;
            }
        });

        scene.add(group);
        state.animatedObjects.push(group); // Track
    }

    // ===== Detailed Project Panel (Centered with Side Info) =====
    function createDetailedProject(z, imagePath, youtubeUrl, title, leftInfo, rightInfo) {
        const group = new THREE.Group();
        // Center position, higher up (y=5.0)
        const frameHeightC = 2.36 + 0.2; // roughly 2.56
        const bottomOfFrame = 5.0 - (frameHeightC / 2); // 5.0 - 1.28 = 3.72
        group.position.set(0, 5.0, z); // Main Group Y=5.0

        // --- 0. ROMAN PILLAR STAND ---
        // Pillar height needs to reach from floor (y=0) to bottomOfFrame (y=3.72 relative to world, or -1.28 relative to group)
        // Actually, easier to just add pillar to scene separately OR add to group with correct offset.
        // Let's add to group. Group is at Y=5.0. Floor is at Y=0. So floor is at local y = -5.0.
        // Pillar height = 3.72 (bottom of frame). 
        // Pillar position y (center of pillar) = -5.0 + (3.72 / 2) = -3.14

        const pillarH = 3.72;
        const pillar = createRomanPillar(pillarH);
        pillar.position.set(0, -5.0, 0); // Base at -5.0 (floor), but createRomanPillar builds UP from 0.
        // createRomanPillar builds from y=0 up to height.
        // So putting it at -5.0 means it starts at floor and goes up to -1.28 (just touching frame).
        group.add(pillar);

        // --- 1. Central Monitor (Larger) ---
        // Screen Scale: x1.3 from original (3.2 * 1.3 = ~4.16)
        const screenWidth = 4.2;
        const screenHeight = 2.36; // 16:9 ratio
        const screenGeo = new THREE.PlaneGeometry(screenWidth, screenHeight);

        // Default Material (Blue = Loading) to be distinct
        const placeholderMat = new THREE.MeshBasicMaterial({
            color: 0x0000AA, // Dark Blue default
            side: THREE.DoubleSide
        });

        const screen = new THREE.Mesh(screenGeo, placeholderMat);
        screen.position.z = 0.085; // Fix: Move in front of frame (Frame front is ~0.075)

        // Interaction Data
        screen.userData = {
            isInteractive: true,
            type: 'link',
            url: youtubeUrl,
            title: title
        };
        clickableObjects.push(screen);
        group.add(screen);

        // "Press That Picture" Prompt (Initially Hidden)
        const prompt = createPressPrompt(group);
        // Position relative to screen: Center, Below
        prompt.position.set(0, -1.8, 0.7); // Moved forward (z=0.7) to avoid clipping with pillar
        group.userData.prompt = prompt; // Store ref for animation logic

        // Add visible "LOADING..." text on the screen
        const loadingText = createText("LOADING...", { fontSize: 0.3, color: 0xFFFFFF, anchorX: 'center' });
        if (loadingText) {
            loadingText.position.set(0, 0, 0.1);
            group.add(loadingText);
        }

        // Load Image Texture Async
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            imagePath,
            (texture) => {
                // Success
                console.log("Texture loaded successfully:", imagePath);
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.minFilter = THREE.LinearFilter;
                texture.magFilter = THREE.LinearFilter;

                // Create NEW material to ensure clean state
                const newMat = new THREE.MeshBasicMaterial({
                    map: texture,
                    color: 0xffffff,
                    side: THREE.DoubleSide
                });
                screen.material = newMat;
                screen.material.needsUpdate = true;

                // Remove loading text
                if (loadingText) {
                    group.remove(loadingText);
                    // dispose logic for text mesh/geometry if needed, but group.remove is enough for visual
                }
            },
            undefined, // onProgress
            (err) => {
                // Error
                console.error("Error loading texture:", imagePath, err);

                // Change to Bright Red
                screen.material.color.setHex(0xFF0000);

                // Update Loading Text to ERROR
                if (loadingText) {
                    group.remove(loadingText); // Remove old one
                }
                const errText = createText("ERROR LOADING IMAGE\nCHECK CONSOLE", { fontSize: 0.2, color: 0xFFFFFF, anchorX: 'center' });
                if (errText) {
                    errText.position.set(0, 0, 0.1);
                    group.add(errText);
                }
            }
        );

        // Monitor Frame
        const frameW = screenWidth + 0.2;
        const frameH = screenHeight + 0.2;
        const frameD = 0.15;
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x1A1A1A, // Dark Grey/Black
            roughness: 0.2,
            metalness: 0.6
        });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(frameW, frameH, frameD), frameMat);
        group.add(frame);

        // Title (Floating above monitor)
        const titleMesh = createText(title, {
            fontSize: 0.35,
            color: CONFIG.colors.textHeader,
            anchorX: 'center'
        });
        if (titleMesh) {
            titleMesh.position.set(0, frameH / 2 + 0.5, 0);
            group.add(titleMesh);
        }

        // --- 2. Side Panels (Glass/Paper Style) ---
        // Panel Dimensions
        const panelW = 4.2;
        const panelH = 7.5;
        const panelDist = screenWidth / 2 + panelW / 2 + 0.4;

        const infoMat = new THREE.MeshStandardMaterial({
            color: 0xFFFAF0, // Cream paper
            roughness: 0.4,
            metalness: 0.1,
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide
        });

        // Helper to wrap text
        function wrapText(text, maxChars) {
            const words = text.split(' ');
            let lines = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
                if (currentLine.length + 1 + words[i].length <= maxChars) {
                    currentLine += ' ' + words[i];
                } else {
                    lines.push(currentLine);
                    currentLine = words[i];
                }
            }
            lines.push(currentLine);
            return lines;
        }

        // Helper to create text lines with auto-wrap AND CENTER ALIGN
        function createInfoText(contentBlocks, parent) {
            const maxChars = 45;

            // 1. Calculate Layout & Total Height
            let totalHeight = 0;
            const layoutItems = [];

            contentBlocks.forEach((block) => {
                if (!block) {
                    // Spacer
                    const h = 0.2;
                    totalHeight += h;
                    layoutItems.push({ type: 'spacer', height: h });
                    return;
                }

                const isHeader = block.startsWith('*');
                const cleanText = isHeader ? block.substring(1) : block;
                const fontSize = isHeader ? 0.22 : 0.14;
                const color = isHeader ? 0x2C1810 : 0x333333;
                const lineHeight = isHeader ? 0.35 : 0.25;

                const lines = isHeader ? [cleanText] : wrapText(cleanText, maxChars);

                lines.forEach(line => {
                    totalHeight += lineHeight;
                    layoutItems.push({
                        type: 'text',
                        text: line,
                        height: lineHeight,
                        size: fontSize,
                        color: color
                    });
                });

                if (isHeader) {
                    const headerSpace = 0.1;
                    totalHeight += headerSpace;
                    layoutItems.push({ type: 'spacer', height: headerSpace });
                }
            });

            // 2. Render from Top (StartY = totalHeight / 2)
            let currentY = totalHeight / 2;

            layoutItems.forEach(item => {
                // Move cursor to center of this item
                currentY -= item.height / 2;

                if (item.type === 'text') {
                    const tMesh = createText(item.text, {
                        fontSize: item.size,
                        color: item.color,
                        anchorX: 'center' // CENTER ALIGN
                    });
                    if (tMesh) {
                        tMesh.position.set(0, currentY, 0.02); // X=0 for center
                        parent.add(tMesh);
                    }
                }

                // Move cursor past this item
                currentY -= item.height / 2;
            });
        }

        // -- Left Panel --
        const leftGroup = new THREE.Group();
        leftGroup.position.set(-panelDist, 1.0, 0.5);
        leftGroup.rotation.y = Math.PI / 8;

        // Use taller panel
        const detailPanelH = panelH;
        const detailPanelGeo = new THREE.BoxGeometry(panelW, detailPanelH, 0.05);

        const leftPanel = new THREE.Mesh(detailPanelGeo, infoMat);
        leftGroup.add(leftPanel);

        // Add content to Left (Centered)
        createInfoText(leftInfo, leftGroup);
        group.add(leftGroup);


        // -- Right Panel --
        const rightGroup = new THREE.Group();
        rightGroup.position.set(panelDist, 1.0, 0.5);
        rightGroup.rotation.y = -Math.PI / 8; // Face user

        const rightPanel = new THREE.Mesh(detailPanelGeo, infoMat);
        rightGroup.add(rightPanel);

        // Add content to Right (Centered)
        createInfoText(rightInfo, rightGroup);
        group.add(rightGroup);

        scene.add(group);
        state.animatedObjects.push(group);
        return group;
    }


    // ===== Section 2: EXPERIENCES (Header -30, Content -42) =====
    const expZ = -30;
    const expContentZ = -42; // Deeper

    const expHeader = createText("EXPERIENCES", { fontSize: 0.8, color: CONFIG.colors.accent, anchorX: 'center' });
    if (expHeader) {
        expHeader.position.set(0, 7.5, expZ);
        scene.add(expHeader);
        state.animatedObjects.push(expHeader);
    }

    createFloatingPanel(-3.5, expContentZ, "WORK", [
        { title: "Lab Staff GWM", sub: "Internship (2024)", detail: "" },
        { title: "Teaching Assistant", sub: "Logika & Project Next", detail: "" }
    ]);

    createFloatingPanel(3.5, expContentZ, "ORGANIZATIONS", [
        { title: "Ketua HMIF", sub: "Himpunan Mahasiswa", detail: "" },
        { title: "Google Ambassador", sub: "2025 - 2026", detail: "" }
    ]);


    // ===== Section 3: PROJECTS (Header -70) =====
    const projZ = -70;

    const projHeader = createText("PROJECTS", { fontSize: 0.8, color: CONFIG.colors.accent, anchorX: 'center' });
    if (projHeader) {
        projHeader.position.set(0, 7.5, projZ);
        scene.add(projHeader);
        state.animatedObjects.push(projHeader);
    }



    // 1. PetShop (Center Z=-90)
    createDetailedProject(-90, 'assets/img/projects/petshop.jpg', 'https://www.youtube.com/playlist?list=PL5VVGqlQYy-5tPR69BEtZI-CuXKx866yf', "PetShop: E-Commerce",
        [
            "*Description",
            "This is a complete e-commerce platform designed to handle the shopping journey for users and a deep management system for administrators.",
            "",
            "*Customer Experience",
            "Users can search for products, view specific details and ratings, and manage their shopping cart. To keep accounts safe, I added an OTP (One-Time Password) login system.",
            "",
            "*Administrative Control",
            "The dashboard features 10 main menus for store management, including tools for updating categories and products, as well as stock logs that track why inventory is moving in or out."
        ],
        [
            "*Business Tools",
            "Owners can manage promos and discounts, view sales statistics to identify best-selling items, and print physical reports. The system handles order processing, refunds, and monitors active users.",
            "",
            "*Security & Data",
            "Passwords are encrypted for safety, and OTP codes are set with a time limit so they do not stay in the database permanently.",
            "",
            "*Technical Docs",
            "I documented the entire system architecture using 16 entities, 20 classes, and 54 activity and use case diagrams. Automatic email alerts for purchase confirmations and shipping are included."
        ]
    );

    // 2. SYC 2025 (Center Z=-120)
    createDetailedProject(-120, 'assets/img/projects/syc2025.jpg', 'https://youtu.be/9l-27PN-bSY', "SYC 2025 Event Page",
        [
            "*Event Showcase",
            "This was a project for the 'Redeemed' group during the SYC 2025 event. It serves as a visual record of the group's activities and photos, focusing on a clean layout to display event documentation.",
            "",
            "*Tech Stack",
            "HTML, Tailwind CSS"
        ],
        [
            "*Purpose",
            "To capture the moments of the event with a modern design.",
            "",
            "*Highlights",
            "Responsive Design, Clean Photo Gallery, Visual Documentation, User-Friendly Interface."
        ]
    );

    // 3. Library Management (Center Z=-150)
    createDetailedProject(-150, 'assets/img/projects/library.jpg', 'https://youtu.be/9_cRlZKAcDk', "Library Management",
        [
            "*Overview",
            "I built this program to manage book transactions in a library. It allows people to browse the catalog, borrow or return books, and suggest new titles for the library to acquire.",
            "",
            "*Tech Stack",
            "Python, Pandas for data handling."
        ],
        [
            "*Features",
            "Efficient Book Tracking, User Management, Borrow/Return Logic, Suggestion System for New Acquisitions."
        ]
    );

    // 4. Mexican Culinary (Center Z=-180)
    createDetailedProject(-180, 'assets/img/projects/mexican.jpg', 'https://www.youtube.com/playlist?list=PL5VVGqlQYy-4Edm7wwWaKG9P_k0382oND', "Mexican Culinary",
        [
            "*Educational Project",
            "This educational project introduces users to the culinary traditions of Mexico. I used a basic JSON structure to organize and present data about different Mexican dishes to the audience.",
            "",
            "*Data Structure",
            "JSON-based content management."
        ],
        [
            "*Content",
            "Interactive menu showcasing various traditional dishes. Dynamic data loading allows for easy updates and rich visual presentation."
        ]
    );

    // 5. Catch the Food (Center Z=-210)
    createDetailedProject(-210, 'assets/img/projects/game.jpg', 'https://youtu.be/GoYq0F8fHiA', "Catch the Food",
        [
            "*Game Title",
            "This is a simple arcade game inspired by the mechanics of the game Pou. Players control a character to catch traditional Mexican food while trying to avoid falling bombs that end the game.",
            "",
            "*Genre",
            "Arcade / Casual"
        ],
        [
            "*Mechanics",
            "Reflex-based gameplay where players dodge obstacles and collect points. Built with Vanilla JavaScript and HTML Canvas."
        ]
    );

    // ===== Section 4: ACHIEVEMENTS (Header -250) =====
    // Pushed back significantly
    const achZ = -250;
    const achContentZ = -262;

    const achHeader = createText("ACHIEVEMENTS", { fontSize: 0.8, color: CONFIG.colors.accent, anchorX: 'center' });
    if (achHeader) {
        achHeader.position.set(0, 7.5, achZ);
        scene.add(achHeader);
        state.animatedObjects.push(achHeader);
    }

    // Trophy / Models placeholders
    const tGroup = new THREE.Group();
    tGroup.position.set(0, 3, achContentZ);

    // Golden Cube as placeholder trophy
    const trophyGeo = new THREE.BoxGeometry(1, 1.5, 1);
    const trophyMat = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 1.0, roughness: 0.2 });
    const trophy = new THREE.Mesh(trophyGeo, trophyMat);
    trophy.rotation.y = Math.PI / 4;
    tGroup.add(trophy);

    const tText = createText("1st Place Hackathon", { fontSize: 0.3, color: CONFIG.colors.textHeader, anchorX: 'center' });
    if (tText) { tText.position.set(0, -1.2, 0); tGroup.add(tText); }

    scene.add(tGroup);
    state.animatedObjects.push(tGroup);


    // ===== Section 5: CONTACT (At the end) =====
    const endZ = -290; // Near wall at -300

    const contactGroup = new THREE.Group();
    contactGroup.position.set(0, 5.0, endZ);
    scene.add(contactGroup);

    // Big Bold Title - LET'S CONNECT
    const contactHeader = createText("LET'S CONNECT", { fontSize: 1.2, color: 0x888888, anchorX: 'center' }); // Greyscale/Silver as in Image 2
    if (contactHeader) {
        contactHeader.position.set(0, 2.5, 0);
        contactGroup.add(contactHeader);
    }

    // Gold line under title
    const cLineGeo = new THREE.PlaneGeometry(1.5, 0.02);
    const cLineMat = new THREE.MeshBasicMaterial({ color: CONFIG.colors.accent });
    const cLine = new THREE.Mesh(cLineGeo, cLineMat);
    cLine.position.set(0, 1.8, 0);
    contactGroup.add(cLine);

    // Subtext - Italics style (simulated with spacing)
    const cSubtext = createText("Step into my creative space. Each connection is a masterpiece waiting", { fontSize: 0.18, color: 0x666666, anchorX: 'center' });
    if (cSubtext) {
        cSubtext.position.set(0, 1.2, 0);
        contactGroup.add(cSubtext);
    }
    const cSubtext2 = createText("to be painted.", { fontSize: 0.18, color: 0x666666, anchorX: 'center' });
    if (cSubtext2) {
        cSubtext2.position.set(0, 0.9, 0);
        contactGroup.add(cSubtext2);
    }

    // Social Media Icons in Museum Frames
    // Spacing for 4 icons
    const iconData = [
        { type: 'email', label: 'EMAIL', sub: 'DIRECT INQUIRY', url: 'mailto:valentinohose@gmail.com', x: -4.5 },
        { type: 'linkedin', label: 'LINKEDIN', sub: 'PROFESSIONAL NETWORK', url: 'https://linkedin.com/in/valentinohose', x: -1.5 },
        { type: 'github', label: 'GITHUB', sub: 'CODE REPOSITORIES', url: 'https://github.com/VHose', x: 1.5 },
        { type: 'instagram', label: 'INSTAGRAM', sub: 'VISUAL JOURNEY', url: 'https://instagram.com/legaseeh', x: 4.5 }
    ];

    iconData.forEach(data => {
        const frame = createIconFrame(data.type, data.url, new THREE.Vector3(data.x, -1.0, 0), data.label, data.sub);
        contactGroup.add(frame);
    });

    state.animatedObjects.push(contactGroup);



    // Decor & Lighting — Chandeliers (Spaced out)
    createChandelier(0, -30);
    createChandelier(0, -80);
    createChandelier(0, -130);
    createChandelier(0, -180);
    createChandelier(0, -230);
    createChandelier(0, -280);
}

// ===== Initial Load & Animate =====
// Loading Logic
let loadProgress = 0;
const loaderText = document.getElementById('loader-percentage');
const loaderEl = document.getElementById('loader');

// Simulate fast loading to 90%
const loadInterval = setInterval(() => {
    if (loadProgress < 90) {
        // Fast increment
        loadProgress += Math.floor(Math.random() * 5) + 1;
        if (loadProgress > 90) loadProgress = 90;
        if (loaderText) loaderText.innerText = loadProgress + '%';
    }
}, 30); // Update every 30ms

// Load Font (Actual Asset)
console.time("FontLoad");
loader.load('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/fonts/optimer_bold.typeface.json', (font) => {
    console.timeEnd("FontLoad");
    loadedFont = font;

    console.time("BuildScene");
    try {
        buildScene();
    } catch (error) {
        console.error("Error building scene:", error);
        if (loaderText) loaderText.innerText = "Error: " + error.message;
        // Don't remove loader if error, so user can see it
        return;
    }
    console.timeEnd("BuildScene");

    // Asset Loaded: Push to 100%
    clearInterval(loadInterval);
    loadProgress = 90;

    // Finish animation
    const finishInterval = setInterval(() => {
        loadProgress += 2;
        if (loaderText) loaderText.innerText = loadProgress + '%';

        if (loadProgress >= 100) {
            if (loaderText) loaderText.innerText = '100%';
            clearInterval(finishInterval);

            // Warm Lights
            for (let z = -10; z > -300; z -= 15) {
                addWarmLight(0, CONFIG.room.height - 0.5, z);
            }

            console.log("Loading Complete (100%)");

            // Fade out and remove loader
            setTimeout(() => {
                console.log("Removing loader UI...");
                if (loaderEl) {
                    loaderEl.style.opacity = 0;
                    setTimeout(() => {
                        loaderEl.remove();
                        console.log("Loader removed from DOM");
                    }, 800);
                }
            }, 500); // 0.5s delay to show 100%
        }
    }, 20);
}, undefined, (err) => {
    console.error("Font load failed", err);
    // Even if fail, close loader so user isn't stuck
    if (loaderEl) loaderEl.remove();
});

// ===== Navbar Listeners =====
document.querySelectorAll('#main-nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('data-target');
        let zTarget = 0;
        // Adjusted targets for new spacious layout
        switch (target) {
            case 'entrance': zTarget = 8; break;
            case 'experiences': zTarget = -22; break;   // Header at -30
            case 'projects': zTarget = -65; break;      // Header at -70
            case 'achievements': zTarget = -242; break; // Header at -250
            case 'contact': zTarget = -285; break;      // End of room (View wall at -300)
        }
        state.scrollTarget = zTarget;
    });
});


// ===== Scroll & Parallax Logic =====
function onWheel(event) {
    // Scroll affects target Z position
    // Delta comes from mouse wheel. Positive = Scroll Down (Move Forward in Z? or Backward?)
    // Typically: Scroll Down -> Go Deeper into gallery (Negative Z)

    // speed factor
    const speed = 0.015; // Slower scroll
    state.scrollTarget -= event.deltaY * speed;

    // Clamp scroll
    // StartZ = 8
    // EndZ = -285 (Contact Wall View)
    state.scrollTarget = Math.max(-285, Math.min(8, state.scrollTarget));
}

function onMouseMove(event) {
    // Normalize mouse pos (-1 to +1)
    state.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    state.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Parallax Target (X moved slightly, Y moved slightly)
    state.parallax.x = state.mouse.x * CONFIG.scroll.parallax;
    state.parallax.y = state.mouse.y * CONFIG.scroll.parallax;

    // Raycasting for Hover
    raycaster.setFromCamera(state.mouse, camera);
    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
        state.hoveredObject = intersects[0].object;
    } else {
        document.body.style.cursor = 'default';
        state.hoveredObject = null;
    }
}

function onClick(event) {
    if (state.hoveredObject && state.hoveredObject.userData.url) {
        window.open(state.hoveredObject.userData.url, '_blank');
    }
}

// Resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Listeners
window.addEventListener('wheel', onWheel);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onClick);

// Add dynamic spotlight to scene
const followSpot = new THREE.SpotLight(0xFFF8DC, 2.0, 40, Math.PI / 4, 0.5, 1);
followSpot.castShadow = true;
scene.add(followSpot);
const followSpotTarget = new THREE.Object3D();
scene.add(followSpotTarget);
followSpot.target = followSpotTarget;

// ===== Animate Loop =====
function animate() {
    requestAnimationFrame(animate);

    // 1. Smooth Scroll (Damping)
    state.scrollCurrent = THREE.MathUtils.lerp(state.scrollCurrent, state.scrollTarget, CONFIG.scroll.damp);

    // Updates camera Z
    camera.position.z = state.scrollCurrent;

    // Update Follow Spot Position (Always slightly ahead of camera)
    followSpot.position.set(camera.position.x, CONFIG.room.height - 1, camera.position.z - 5);
    followSpotTarget.position.set(camera.position.x, 3, camera.position.z - 15);

    // 2. Parallax Effect (Move Camera X/Y slightly based on mouse)
    // We linearly interpolate camera position X and Y towards parallax target
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, state.parallax.x, 0.1);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5.0 + state.parallax.y, 0.1); // Base height 5.0 matches hero center

    // 3. LookAt Logic
    // Camera always looks slightly ahead
    // But we want a fixed straight view mostly.
    camera.rotation.set(0, 0, 0); // Reset
    // Maybe slight rotation based on mouse too?
    camera.rotation.y = -state.mouse.x * 0.05;
    camera.rotation.x = state.mouse.y * 0.05;

    // 4. Prompt Logic & Render Distance Culling
    const promptDistThreshold = 15; // Distance to show prompt
    const renderLimit = 45; // Max distance to render heavy objects

    state.animatedObjects.forEach(obj => {
        const dist = Math.abs(camera.position.z - obj.position.z);

        // A. Render Culling (Performance Fix)
        if (dist > renderLimit) {
            obj.visible = false;
            // Skip further logic for this object if hidden
            return;
        } else {
            obj.visible = true;
        }

        // B. Prompt Logic (Slide "Press That Picture")
        if (obj.userData && obj.userData.prompt) {
            const prompt = obj.userData.prompt;

            // Logic: If close -> Slide In. If far -> Slide Out.
            if (dist < promptDistThreshold) {
                // Animate In
                prompt.userData.slideProgress = THREE.MathUtils.lerp(prompt.userData.slideProgress, 1, 0.1);
            } else {
                // Animate Out
                prompt.userData.slideProgress = THREE.MathUtils.lerp(prompt.userData.slideProgress, 0, 0.1);
            }

            // Apply Slide (Vertical Slide Up)
            // Start Y: -2.0 (hidden below). Target Y: -1.4 (visible just under screen).

            const startY = -2.0;
            const endY = -1.4;
            const currentY = THREE.MathUtils.lerp(startY, endY, prompt.userData.slideProgress);

            prompt.position.y = currentY;
            prompt.position.x = 0; // Centered horizontally

            // Opacity
            const opacity = prompt.userData.slideProgress;
            prompt.traverse(child => {
                if (child.material) {
                    child.material.opacity = opacity * 0.8; // Max 0.8
                    child.material.transparent = true;
                    child.visible = opacity > 0.01;
                }
            });
        }
    });

    // DEBUG: Update Z Position Display
    const debugZ = document.getElementById('debug-z');
    if (debugZ) {
        debugZ.innerText = `Z: ${camera.position.z.toFixed(2)}`;
    }

    renderer.render(scene, camera);
}
animate();