import loadSvg from 'load-svg'
import svgMesh3d from 'svg-mesh-3d'
import { parse as getSvgPaths } from 'extract-svg-path'
import TWEEN from 'tween.js'

export default class GLScene {
    constructor() {
        this.t = 0.0;
        this.params = {
            t1: { on: false, val: 0.0, t: 0.0 },
            t2: { on: false, val: 0.0, t: 0.0 },
            t3: { on: false, val: 0.0, t: 0.0 },
        };
        this.scene = new THREE.Scene();

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
        this.camera.position.set(0, 0, 20);
        this.camera.lookAt(new THREE.Vector3(0,0,0));

        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0xe9eae9);
        document.getElementById('gl-scene').appendChild(this.renderer.domElement);

        loadSvg('./images/congrats.svg', (err, svg)=>{
            if (err) throw err;

            let svgPath = getSvgPaths(svg);
            let o = svgMesh3d(svgPath, {
                delauney: false,
                scale: 4,
                simplify: 0.01
            });

            let g = new THREE.Geometry();
            this.vs = [];
            this.rs = [];

            for (let i = 0; i < o.cells.length; i++) {
                let c = o.cells[i];
                for (let j = 0; j < 3; j++) {
                    let p = o.positions[c[j]];
                    let v = new THREE.Vector3(p[0]*10, p[1]*10, p[2]*10);
                    g.vertices.push(v);
                    this.vs.push(v.clone());

                    this.rs.push(Math.random() * 2.0 - 1.0);
                }
                g.faces.push(new THREE.Face3(i*3, i*3+1, i*3+2));

            }

            let m = new THREE.MeshBasicMaterial({
                color: 0xcb6f5e, opacity: 1.0, wireframe: false,
                side: THREE.DoubleSide, transparent: true
            });

            this.obj = new THREE.Mesh(g, m);
            this.scene.add(this.obj);

            this.wire = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
                color: 0xcb6f5e, opacity: 1.0, wireframe: true,
                side: THREE.DoubleSide
            }));

            this.scene.add(this.wire);


        });

        window.addEventListener('resize', this.resize.bind(this), false);
        this.area = document.getElementById("toparea");
        this.area.style.height = window.innerHeight + "px";

        this.trigger();
        setInterval(this.trigger.bind(this), 10000);

        this.animate();
    }

    resize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.area.style.height = window.innerHeight + "px";
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        if (this.obj) {
            let g = this.obj.geometry;

            if (this.params.t1.on) {
                for (let i = 0; i < g.faces.length; i++) {
                    let axis = new THREE.Vector3().subVectors(this.vs[i*3+1], this.vs[i*3+2]);
                    axis.z = 0;
                    axis.normalize();
                    let v = new THREE.Vector3().subVectors(this.vs[i*3], this.vs[i*3+1]);
                    v.applyAxisAngle(axis, this.params.t1.val);
                    v.add(this.vs[i*3+1]);

                    g.vertices[i*3].x = v.x;
                    g.vertices[i*3].y = v.y;
                    g.vertices[i*3].z = v.z;
                }
                g.verticesNeedUpdate = true;

                this.camera.position.y = (20-this.params.t1.t*5.0) * Math.sin( - this.params.t1.t)
                this.camera.position.z = (20-this.params.t1.t*5.0) * Math.cos(this.params.t1.t);
                this.camera.lookAt(new THREE.Vector3(0,0,0));
            }

            if (this.params.t2.on) {

                for (let i = 0; i < g.faces.length; i++) {
                    let vv = new THREE.Vector3(this.rs[i*3]/0.5, this.rs[i*3+1]/0.5, this.rs[i*3+1]).multiplyScalar(this.params.t2.val);

                    for (let j = 0; j < 3; j++) {
                        let v = this.vs[i*3+j].clone().add(vv);
                        g.vertices[i*3+j].x = v.x;
                        g.vertices[i*3+j].y = v.y;
                        g.vertices[i*3+j].z = v.z;
                    }
                }
                g.verticesNeedUpdate = true;

                this.camera.position.x = 20 * Math.sin(this.params.t2.t)
                this.camera.position.z = 20 * Math.cos(this.params.t2.t);
                this.camera.lookAt(new THREE.Vector3(0,0,0));
            }

            if (this.params.t3.on) {

                let m = this.obj.material;
                this.obj.position.z = - 5.0 * this.params.t3.val;

                m.opacity = 1.0 - 0.8 * this.params.t3.val;
                m.needsUpdate = true;
                this.camera.position.z = this.params.t3.t;
            }
        }

        TWEEN.update();
        this.renderer.render(this.scene, this.camera);

    }

    trigger() {
        setTimeout(this.trans1.bind(this), 500);
        setTimeout(this.trans2.bind(this), 4000);
        setTimeout(this.trans3.bind(this), 7000);
    }

    trans1() {

        this.params.t1.on = true;
        this.params.t1.val = 0.0;

        new TWEEN.Tween(this.params.t1)
        .to({ val: Math.PI, t: Math.PI / 4.0 }, 800)
        .easing( TWEEN.Easing.Quadratic.Out )
        .onComplete(()=>{

            new TWEEN.Tween(this.params.t1)
            .delay(600)
            .to({ val: Math.PI * 2.0, t: 0.0 }, 800)
            .easing( TWEEN.Easing.Quadratic.Out )
            .onComplete(() => {
                this.params.t1.on = false;
            })
            .start();
        })
        .start();

    }

    trans2() {

        this.params.t2.on = true;
        this.params.t2.t = 0.0;

        new TWEEN.Tween(this.params.t2)
        .to({ val: 10.0, t: Math.PI * 1.0 }, 1000)
        .easing( TWEEN.Easing.Quintic.Out )
        .onComplete(()=>{

            new TWEEN.Tween(this.params.t2)
            .delay(200)
            .to({ val: 0.0, t: Math.PI * 2.0 }, 1000)
            .easing( TWEEN.Easing.Quintic.Out )
            .onComplete(() => {
                this.params.t2.on = false;
            })
            .start();
        })
        .start();
    }

    trans3() {

        this.params.t3.on = true;
        this.params.t3.t = 20.0;

        new TWEEN.Tween(this.params.t3)
        .to({ val: 1.0, t: 12.0 }, 1000)
        .easing( TWEEN.Easing.Quintic.Out )
        .onComplete(()=>{

            new TWEEN.Tween(this.params.t3)
            .delay(200)
            .to({ val: 0.0, t: 20.0 }, 1000)
            .easing( TWEEN.Easing.Quintic.Out )
            .onComplete(() => {
                this.params.t3.on = false;
            })
            .start();
        })
        .start();

    }
}
