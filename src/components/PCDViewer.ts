import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Manages the entire Three.js scene, including loading and displaying PCD files.
 */
export class ThreePCDViewer {
  // Private properties to hold core Three.js components
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private currentMesh: THREE.Points | null = null;
  private pcdLoader: PCDLoader;
  private animationFrameId: number | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.pcdLoader = new PCDLoader();
    
    // Initialize all the necessary components
    this.scene = this.initScene();
    this.renderer = this.initRenderer();
    this.camera = this.initCamera();
    this.controls = this.initControls();

    // Attach the renderer's canvas to the DOM and start the animation loop
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener('resize', this.handleResize);
    this.animate();
  }


  private initScene(): THREE.Scene {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    return scene;
  }

  private initRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    return renderer;
  }

  private initCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 2);
    return camera;
  }

  private initControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    controls.enableDamping = true; // Makes the controls feel smoother
    controls.minPolarAngle = 0;    // Allow looking from top-down
    controls.maxPolarAngle = Math.PI; // Allow looking from bottom-up
    return controls;
  }


  /**
   * Loads a new PCD file, replacing the existing one.
   */
  public loadPCD(url: string): void {
    THREE.Cache.enabled = false; // Disable cache to ensure fresh loads
    this.pcdLoader.load(url, (points) => {
      // 1. Clean up the previous model
      if (this.currentMesh) {
        this.scene.remove(this.currentMesh);
        this.currentMesh.geometry.dispose();
        if (Array.isArray(this.currentMesh.material)) {
          this.currentMesh.material.forEach(m => m.dispose());
        } else {
          this.currentMesh.material.dispose();
        }
      }
      
      // 2. Create a new, consistent material for the points
      points.material = new THREE.PointsMaterial({
        size: 0.025,
        sizeAttenuation: true, // Points get smaller with distance
        vertexColors: !!points.geometry.attributes.color, // Use vertex colors if available
        color: points.geometry.attributes.color ? undefined : 0xffffff, // Otherwise, default to white
      });
      
      // 3. Center the geometry and set its orientation
      points.geometry.center(); // A simpler way to center the model
      points.rotation.x = -Math.PI / 2; // Stand the model upright

      // 4. Add the new model to the scene
      this.currentMesh = points;
      this.scene.add(points);
    });
  }

  /**
   * The robust cleanup function to properly destroy the instance.
   */
  public cleanup(): void {
    // Stop the animation loop
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    if (this.currentMesh) {
      this.scene.remove(this.currentMesh);
      this.currentMesh.geometry.dispose();
      // Dispose material(s)
       if (Array.isArray(this.currentMesh.material)) {
          this.currentMesh.material.forEach(m => m.dispose());
      } else {
          this.currentMesh.material.dispose();
      }
    }
    this.renderer.dispose();

    // Remove the canvas from the DOM
    this.container.removeChild(this.renderer.domElement);
  }


  private animate = (): void => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public handleResize = (): void => {
    const { clientWidth, clientHeight } = this.container;
    this.camera.aspect = clientWidth / clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(clientWidth, clientHeight);
  };
}