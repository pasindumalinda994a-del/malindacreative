import * as THREE from "three";

type CornerUniforms = {
  uCornerRadius: { value: THREE.Vector2 };
};

/**
 * Adds a UV-space rounded-rect discard to a slide material.
 * Drive the radius each frame with `setSlideCornerRadius` (0 = no clip).
 */
export function attachSlideCornerClip(material: THREE.MeshBasicMaterial) {
  const uniforms: CornerUniforms = {
    uCornerRadius: { value: new THREE.Vector2(0, 0) },
  };
  material.userData.cornerUniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCornerRadius = uniforms.uCornerRadius;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        varying vec2 vCornerUv;
        `,
      )
      .replace(
        "#include <uv_vertex>",
        /* glsl */ `
        #include <uv_vertex>
        vCornerUv = uv;
        `,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform vec2 uCornerRadius;
        varying vec2 vCornerUv;
        `,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        /* glsl */ `
        #include <clipping_planes_fragment>
        if (uCornerRadius.x > 1.0e-5 || uCornerRadius.y > 1.0e-5) {
          vec2 p = abs(vCornerUv - 0.5);
          vec2 r = max(uCornerRadius, vec2(1.0e-5));
          vec2 q = p - (vec2(0.5) - r);
          if (q.x > 0.0 && q.y > 0.0) {
            vec2 n = q / r;
            if (dot(n, n) > 1.0) discard;
          }
        }
        `,
      );
  };

  material.customProgramCacheKey = () => "slide-corner-clip";
}

/** Sets rounded-corner radii in UV units (0-0.5). Pass 0,0 to disable clipping. */
export function setSlideCornerRadius(material: THREE.MeshBasicMaterial, radiusX: number, radiusY: number) {
  const uniforms = material.userData.cornerUniforms as CornerUniforms | undefined;
  if (!uniforms) return;
  uniforms.uCornerRadius.value.set(radiusX, radiusY);
}
