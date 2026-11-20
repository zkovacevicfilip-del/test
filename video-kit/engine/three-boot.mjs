// Načte three.js a 3D jezdce a zpřístupní je ostatním skriptům (scenes.js je obyčejný skript, ne modul).
import * as THREE from './vendor/three.module.js';
import { makeRider, makeStage, makeRoad, KITS } from './rider3d.mjs';
window.RIDE3D = { THREE, makeRider, makeStage, makeRoad, KITS };
