"use client";

import { Suspense, useCallback, useEffect, useMemo, useLayoutEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { SkeletonUtils } from "three-stdlib";

function Character({
  trigger,
  onAnimationEnd,
  onReady,
}: {
  trigger: "yokoyure" | "unazuku" | "speak" | "otefuri" | "nayamu";
  onAnimationEnd: () => void;
  onReady: () => void;
}) {
  const [isReady, setIsReady] = useState(false);
  const { scene, animations: yokoyure } = useGLTF("/api/models/q7n2x4");
  const { animations: unazuku } = useGLTF("/api/models/p3v8k1");
  const { animations: speak } = useGLTF("/api/models/m9r5t2");
  const { animations: otefuri } = useGLTF("/api/models/b6w1c8");
  const { animations: nayamu } = useGLTF("/api/models/z4h7y3");
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene) as THREE.Object3D;
    clone.visible = false;
    return clone;
  }, [scene]);
  const allAnimations = useMemo(() => [
    ...yokoyure,
    ...unazuku,
    ...speak, 
    ...otefuri, 
    ...nayamu
  ], [nayamu, otefuri, speak, unazuku, yokoyure])
  const { actions, mixer } = useAnimations(allAnimations, clonedScene);
  const onAnimationEndRef = useRef(onAnimationEnd)
  useEffect(() => { onAnimationEndRef.current = onAnimationEnd }, [onAnimationEnd])

  const yokoyureName = yokoyure[0]?.name;
  const unazukuName = unazuku[0]?.name;
  const speakName = speak[0]?.name;
  const otefuriName = otefuri[0]?.name;
  const nayamuName = nayamu[0]?.name;
  const currentOverlayActionRef = useRef<THREE.AnimationAction | null>(null);

  // 起動時にyokoyureをループ再生
  useLayoutEffect(() => {
    if (isReady) {
      return;
    }

    const idleAction = actions[yokoyureName];
    if (idleAction) {
      idleAction.reset();
      // eslint-disable-next-line react-hooks/immutability
      idleAction.loop = THREE.LoopRepeat;
      // eslint-disable-next-line react-hooks/immutability
      idleAction.timeScale = 0.5;
      // eslint-disable-next-line react-hooks/immutability
      idleAction.clampWhenFinished = false;
      idleAction.enabled = true;
      idleAction.setEffectiveWeight(1);
      idleAction.setEffectiveTimeScale(0.5);
      idleAction.play();
      mixer.update(1 / 60);
      setIsReady(true);
      onReady();
    }
  }, [actions, isReady, mixer, onReady, yokoyureName]);

  // triggered によってアニメーションをを1回再生してyokoyureに戻る
  useEffect(() => {
    const idleAction = actions[yokoyureName];
    if (!idleAction) return;

    if (trigger === "yokoyure") {
      const overlayAction = currentOverlayActionRef.current;
      if (overlayAction) {
        overlayAction.stop();
        currentOverlayActionRef.current = null;
      }
      idleAction.enabled = true;
      idleAction.setEffectiveWeight(1);
      idleAction.setEffectiveTimeScale(0.5);
      idleAction.play();
      return
    }

    const overlayAction = trigger === "unazuku"
        ? actions[unazukuName!]
        : trigger === "speak"
        ? actions[speakName!]
        : trigger === "otefuri"
        ? actions[otefuriName!]
        : trigger === "nayamu"
        ? actions[nayamuName!]
        : null;

    if (!overlayAction) return;

    if (
      currentOverlayActionRef.current &&
      currentOverlayActionRef.current !== overlayAction
    ) {
      currentOverlayActionRef.current.fadeOut(0.15);
      currentOverlayActionRef.current.stop();
    }

    currentOverlayActionRef.current = overlayAction;

    idleAction.enabled = true;
    idleAction.setEffectiveWeight(1);
    idleAction.setEffectiveTimeScale(0.5);
    idleAction.play();

    overlayAction.reset();
    // eslint-disable-next-line react-hooks/immutability
    overlayAction.loop = THREE.LoopOnce;
    // eslint-disable-next-line react-hooks/immutability
    overlayAction.clampWhenFinished = true;
    // eslint-disable-next-line react-hooks/immutability
    overlayAction.timeScale = 0.3;
    overlayAction.enabled = true;
    overlayAction.setEffectiveWeight(1);
    overlayAction.crossFadeFrom(idleAction, 0.2, false);
    overlayAction.play();

    const onFinish = (event: THREE.Event & { action?: THREE.AnimationAction }) => {
      if (event.action !== overlayAction) {
        return;
      }
      idleAction.enabled = true;
      idleAction.setEffectiveWeight(1);
      idleAction.setEffectiveTimeScale(0.5);
      idleAction.play();
      overlayAction.crossFadeTo(idleAction, 0.2, false);
      currentOverlayActionRef.current = null;
      onAnimationEndRef.current(); // triggerをリセット→横揺れ開始
    };
    mixer.addEventListener("finished", onFinish);
    return () => mixer.removeEventListener("finished", onFinish);
  }, [
    trigger,
    actions,
    mixer,
    yokoyureName,
    unazukuName,
    speakName,
    otefuriName,
    nayamuName,
    onAnimationEnd,
  ]);

  return (
    <primitive
      object={clonedScene}
      scale={3}
      position={[0, -2.5, 0]}
      visible={isReady}
    />
  );
}

export default function CharacterViewer({ trigger, onAnimationEnd }: { trigger: "yokoyure" | "unazuku" | "speak" | "otefuri" | "nayamu"; onAnimationEnd: () => void }) {
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const handleReady = useCallback(() => {
    setIsCanvasReady(true);
  }, []);

  return (
    <Canvas
      camera={{ position: [0, 1, 3], fov: 50 }}
      style={{
        width: "100%",
        height: "100%",
        opacity: isCanvasReady ? 1 : 0,
      }}
    >
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={null}>
        <Character
          trigger={trigger}
          onAnimationEnd={onAnimationEnd}
          onReady={handleReady}
        />
      </Suspense>
    </Canvas>
  );
}
