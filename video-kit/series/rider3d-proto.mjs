import { makeRider, makeStage } from './rider3d.mjs';
const q = new URLSearchParams(location.search), kit = q.get('kit') || 'white', yaw = +(q.get('yaw') || 14) * Math.PI / 180;
const c = document.getElementById('c'), g = c.getContext('2d');
g.fillStyle = '#17191B'; g.fillRect(0, 0, 1080, 1920);
const st = makeStage(1080, 1300, { rim: kit === 'black' ? 5.5 : 3.2 }), A = makeRider(kit), B = makeRider(kit);
// dva jezdci ve dvou pruzích: B dál (nízko), A blíž (vzpřímeně)
B.root.position.set(90, 0, -560); A.root.position.set(60, 0, 120); st.scene.add(A.root, B.root);
const D = 1430; st.cam.fov = 30; st.cam.updateProjectionMatrix(); st.cam.position.set(Math.sin(yaw) * D, 470, Math.cos(yaw) * D - 220); st.cam.lookAt(10, 175, -230);
A.update({ pose: 0, crank: 0.6, wheel: 0.3 }); B.update({ pose: 1, crank: 2.2, wheel: 1.1 });
// silnice (2D pod 3D): dvě světlejší plochy pruhů se zkreslením nekreslím, jen jemný gradient
const gr = g.createLinearGradient(0, 700, 0, 1600); gr.addColorStop(0, '#17191B'); gr.addColorStop(1, '#202226'); g.fillStyle = gr; g.fillRect(0, 700, 1080, 900);
for (let j = 0; j < 46; j++) { const y = 520 + j * 22, h = (Math.sin(j * 91.7) + 1) / 2; g.strokeStyle = `rgba(139,61,255,${0.12 + 0.35 * h})`; g.lineWidth = 2 + h * 2; g.setLineDash([80 + h * 150, 60 + h * 90]); g.lineDashOffset = j * 37; g.beginPath(); g.moveTo(0, y); g.lineTo(1080, y + Math.sin(j) * 6); g.stroke(); }
g.setLineDash([]);
st.render(); g.drawImage(st.canvas, 0, 330);
g.font = '800 62px sans-serif'; g.fillStyle = '#E4E3DE'; g.textAlign = 'center'; g.fillText('She drops her back', 540, 330);
document.title = 'ready';
