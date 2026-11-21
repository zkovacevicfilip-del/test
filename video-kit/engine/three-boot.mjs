// Načte three.js, 3D jezdce a model člověka (MakeHuman) a zpřístupní je ostatním skriptům (scenes.js je obyčejný skript, ne modul).
// window.RIDE3D_READY: motor na něj počká v setup(), než začne kreslit (model se stahuje asynchronně).
import * as THREE from './vendor/three.module.js';
import { makeRider, makeStage, makeRoad, loadHuman, bones, KITS } from './rider3d.mjs';
window.RIDE3D = { THREE, makeRider, makeStage, makeRoad, loadHuman, bones, KITS };
window.RIDE3D_READY = loadHuman();
