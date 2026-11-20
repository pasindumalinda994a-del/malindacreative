"use client";

import { type CSSProperties, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  EyeGaze,
  IRIS_SCALE,
  PUPIL_SCALE,
  type EyeGazeHandle,
} from "@/components/about/EyeGaze";

gsap.registerPlugin(useGSAP);

type AboutHeroProps = {
  brand: string;
};

const stagger = (i: number) =>
  ({ "--i": i, "--stagger-base": "180ms" }) as CSSProperties;

/** Right eye starts later so rainbow reveals stay clearly out of sync. */
const RIGHT_EYE_DELAY = 1.05;

/**
 * Max pupil travel = fraction of the ring between socket and pupil radii
 * so the ball stays inside the hole like a real iris.
 */
const SOCKET_TRAVEL = 0.85;
/** Vertical ellipse tighter than horizontal (almond lids). */
const TRAVEL_Y_RATIO = 0.65;
/** Pupil leads iris slightly for depth; iris stays within the same socket limit. */
const PUPIL_LEAD = 1.06;

/** Brow rotate range in degrees at full horizontal gaze. */
const BROW_ROTATE = 8;
/** Brow horizontal drift as a fraction of iris offset. */
const BROW_X_FACTOR = 0.32;
/** Brow vertical lift (px) at full upward / downward gaze. */
const BROW_Y_LIFT = 10;
/** Brow scaleY range around 1 at full gaze intensity. */
const BROW_SCALE_Y = 0.03;

/** Idle: wait before a micro-saccade when the pointer is still. */
const IDLE_DELAY = 2.5;
/** Idle micro-nudge radius in px. */
const IDLE_NUDGE = 2.5;

type GazeDrivers = {
  irisX: gsap.QuickToFunc;
  irisY: gsap.QuickToFunc;
  pupilX: gsap.QuickToFunc;
  pupilY: gsap.QuickToFunc;
  browRotate: gsap.QuickToFunc;
  browX: gsap.QuickToFunc;
  browY: gsap.QuickToFunc;
  browScaleY: gsap.QuickToFunc;
};

function makeDrivers(
  iris: HTMLElement,
  pupil: HTMLElement,
  brow: HTMLElement,
): GazeDrivers {
  const gazeEase = "power2.out";
  const gazeDuration = 0.25;
  const browEase = "power3.out";
  const browDuration = 0.4;
  return {
    irisX: gsap.quickTo(iris, "x", { duration: gazeDuration, ease: gazeEase }),
    irisY: gsap.quickTo(iris, "y", { duration: gazeDuration, ease: gazeEase }),
    pupilX: gsap.quickTo(pupil, "x", {
      duration: gazeDuration * 0.9,
      ease: gazeEase,
    }),
    pupilY: gsap.quickTo(pupil, "y", {
      duration: gazeDuration * 0.9,
      ease: gazeEase,
    }),
    browRotate: gsap.quickTo(brow, "rotation", {
      duration: browDuration,
      ease: browEase,
    }),
    browX: gsap.quickTo(brow, "x", { duration: browDuration, ease: browEase }),
    browY: gsap.quickTo(brow, "y", { duration: browDuration, ease: browEase }),
    browScaleY: gsap.quickTo(brow, "scaleY", {
      duration: browDuration,
      ease: browEase,
    }),
  };
}

/** Clamp a vector into an ellipse with semi-axes maxX / maxY. */
function clampEllipse(dx: number, dy: number, maxX: number, maxY: number) {
  const nx = maxX > 0 ? dx / maxX : 0;
  const ny = maxY > 0 ? dy / maxY : 0;
  const len = Math.hypot(nx, ny) || 1;
  const scale = Math.min(1, 1 / len);
  return { x: nx * scale * maxX, y: ny * scale * maxY };
}

/**
 * Paper hero: pair of huge eyes with curved brand eyebrows and rainbow pupils.
 * Iris + pupil track the pointer with elliptical socket limits; brows react in 2D.
 */
export function AboutHero({ brand }: AboutHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<EyeGazeHandle>(null);
  const rightRef = useRef<EyeGazeHandle>(null);

  useGSAP(
    () => {
      const left = leftRef.current;
      const right = rightRef.current;
      const leftIris = left?.iris ?? null;
      const leftPupil = left?.pupil ?? null;
      const leftBrow = left?.brow ?? null;
      const leftEye = left?.eye ?? null;
      const rightIris = right?.iris ?? null;
      const rightPupil = right?.pupil ?? null;
      const rightBrow = right?.brow ?? null;
      const rightEye = right?.eye ?? null;
      if (
        !leftIris ||
        !leftPupil ||
        !leftBrow ||
        !leftEye ||
        !rightIris ||
        !rightPupil ||
        !rightBrow ||
        !rightEye
      ) {
        return;
      }

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Center iris/pupil on the eye (GSAP x/y replace Tailwind -translate).
      gsap.set([leftIris, leftPupil, rightIris, rightPupil], {
        xPercent: -50,
        yPercent: -50,
        x: 0,
        y: 0,
      });
      gsap.set([leftBrow, rightBrow], {
        transformOrigin: "50% 100%",
        rotation: 0,
        x: 0,
        y: 0,
        scaleY: 1,
      });

      if (reduced) return;

      const leftDrive = makeDrivers(leftIris, leftPupil, leftBrow);
      const rightDrive = makeDrivers(rightIris, rightPupil, rightBrow);

      let idleCall: gsap.core.Tween | null = null;
      type GazePose = { irisX: number; irisY: number; pupilX: number; pupilY: number };
      const restPose = (): GazePose => ({
        irisX: 0,
        irisY: 0,
        pupilX: 0,
        pupilY: 0,
      });
      let lastPose = { left: restPose(), right: restPose() };

      const applyEye = (
        eye: HTMLElement,
        drive: GazeDrivers,
        clientX: number,
        clientY: number,
        side: "left" | "right",
      ) => {
        const rect = eye.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return;

        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = clientX - cx;
        const dy = clientY - cy;

        // Ring between socket and pupil — pupil center may travel this far and stay in-hole.
        const irisRadius = (rect.width * IRIS_SCALE) / 2;
        const pupilRadius = (rect.width * PUPIL_SCALE) / 2;
        const ring = Math.max(0, irisRadius - pupilRadius);
        const maxX = ring * SOCKET_TRAVEL;
        const maxY = maxX * TRAVEL_Y_RATIO;
        // Pupil reaches the socket-fit limit; iris lags slightly behind (lead).
        const pupil = clampEllipse(dx, dy, maxX, maxY);
        const iris = clampEllipse(dx, dy, maxX / PUPIL_LEAD, maxY / PUPIL_LEAD);

        drive.irisX(iris.x);
        drive.irisY(iris.y);
        drive.pupilX(pupil.x);
        drive.pupilY(pupil.y);

        const nx = maxX > 0 ? pupil.x / maxX : 0;
        const ny = maxY > 0 ? pupil.y / maxY : 0;
        const intensity = Math.min(1, Math.hypot(nx, ny));

        drive.browRotate(nx * BROW_ROTATE);
        drive.browX(iris.x * BROW_X_FACTOR);
        // Looking up (negative screen Y toward top) lifts the brow.
        drive.browY(-ny * BROW_Y_LIFT);
        drive.browScaleY(1 + intensity * BROW_SCALE_Y);

        lastPose[side] = {
          irisX: iris.x,
          irisY: iris.y,
          pupilX: pupil.x,
          pupilY: pupil.y,
        };
      };

      const resetDrivers = (drive: GazeDrivers) => {
        drive.irisX(0);
        drive.irisY(0);
        drive.pupilX(0);
        drive.pupilY(0);
        drive.browRotate(0);
        drive.browX(0);
        drive.browY(0);
        drive.browScaleY(1);
      };

      const killIdle = () => {
        idleCall?.kill();
        idleCall = null;
      };

      const applyPose = (drive: GazeDrivers, pose: GazePose) => {
        drive.irisX(pose.irisX);
        drive.irisY(pose.irisY);
        drive.pupilX(pose.pupilX);
        drive.pupilY(pose.pupilY);
      };

      const scheduleIdle = () => {
        killIdle();
        idleCall = gsap.delayedCall(IDLE_DELAY, () => {
          // Tiny micro-saccade then settle back — keeps eyes “alive” at rest.
          const angle = Math.random() * Math.PI * 2;
          const nx = Math.cos(angle) * IDLE_NUDGE;
          const ny = Math.sin(angle) * IDLE_NUDGE * 0.65;

          applyPose(leftDrive, {
            irisX: lastPose.left.irisX + nx / PUPIL_LEAD,
            irisY: lastPose.left.irisY + ny / PUPIL_LEAD,
            pupilX: lastPose.left.pupilX + nx,
            pupilY: lastPose.left.pupilY + ny,
          });
          applyPose(rightDrive, {
            irisX: lastPose.right.irisX + nx / PUPIL_LEAD,
            irisY: lastPose.right.irisY + ny / PUPIL_LEAD,
            pupilX: lastPose.right.pupilX + nx,
            pupilY: lastPose.right.pupilY + ny,
          });

          idleCall = gsap.delayedCall(0.35, () => {
            applyPose(leftDrive, lastPose.left);
            applyPose(rightDrive, lastPose.right);
            scheduleIdle();
          });
        });
      };

      const onMove = (event: PointerEvent) => {
        applyEye(leftEye, leftDrive, event.clientX, event.clientY, "left");
        applyEye(rightEye, rightDrive, event.clientX, event.clientY, "right");
        scheduleIdle();
      };

      const onLeave = () => {
        killIdle();
        lastPose = { left: restPose(), right: restPose() };
        resetDrivers(leftDrive);
        resetDrivers(rightDrive);
      };

      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      scheduleIdle();

      return () => {
        killIdle();
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: sectionRef, dependencies: [] },
  );

  return (
    <section
      ref={sectionRef}
      className="relative h-svh w-full overflow-hidden bg-paper text-ink"
    >
      <h1 id="about-title" className="sr-only">
        {brand}
      </h1>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-[22%] bottom-[2%] flex items-center justify-center gap-[28vw] px-2 stagger-rise md:top-[20%] md:bottom-[0%] md:gap-[26vw] md:px-4"
        style={stagger(0)}
      >
        <EyeGaze ref={leftRef} brand={brand} pathId="about-brow-left" />
        <EyeGaze
          ref={rightRef}
          brand={brand}
          pathId="about-brow-right"
          pupilDelay={RIGHT_EYE_DELAY}
        />
      </div>
    </section>
  );
}
