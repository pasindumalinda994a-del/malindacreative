import * as THREE from "three";

type CornerUniforms = {
  uCornerRadius: { value: THREE.Vector2 };
  /** 0 = collapsed to the center point, 1 = the full plane. */
  uReveal: { value: number };
};

/**
 * Adds a UV-space rounded-rect discard and a center iris to a slide material.
 * Drive the radius with `setSlideCornerRadius` (0 = no corner clip) and the
 * iris with `setSlideReveal` (1 = fully open).
 */
export function attachSlideCornerClip(material: THREE.MeshBasicMaterial) {
  const uniforms: CornerUniforms = {
    uCornerRadius: { value: new THREE.Vector2(0, 0) },
    uReveal: { value: 1 },
  };
  material.userData.cornerUniforms = uniforms;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uCornerRadius = uniforms.uCornerRadius;
    shader.uniforms.uReveal = uniforms.uReveal;

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
        uniform float uReveal;
        varying vec2 vCornerUv;
        `,
      )
      .replace(
        "#include <clipping_planes_fragment>",
        /* glsl */ `
        #include <clipping_planes_fragment>
        if (uReveal <= 0.001) discard;
        if (uReveal < 0.999) {
          float halfExtent = clamp(uReveal, 0.0, 1.0) * 0.5;
          vec2 revealDelta = abs(vCornerUv - 0.5);
          if (revealDelta.x > halfExtent || revealDelta.y > halfExtent) discard;
        }
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

  material.customProgramCacheKey = () => "slide-corner-reveal";
}

/** Sets rounded-corner radii in UV units (0-0.5). Pass 0,0 to disable clipping. */
export function setSlideCornerRadius(material: THREE.MeshBasicMaterial, radiusX: number, radiusY: number) {
  const uniforms = material.userData.cornerUniforms as CornerUniforms | undefined;
  if (!uniforms) return;
  uniforms.uCornerRadius.value.set(radiusX, radiusY);
}

/** Opens the center iris. 0 is closed, 1 is the full plane. */
export function setSlideReveal(material: THREE.MeshBasicMaterial, reveal: number) {
  const uniforms = material.userData.cornerUniforms as CornerUniforms | undefined;
  if (!uniforms) return;
  uniforms.uReveal.value = reveal;
}
