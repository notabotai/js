import { App, Feature } from "../App.ts";
import { NumRange } from "../geom/NumRange.ts";

type AnimBase = {
  // deno-lint-ignore no-explicit-any
  obj: any;
  property: string;
  startValue: number;
  endValue: number;
  currentValue: number;
  progress: number;
  range?: NumRange;
};
type Anim = AnimBase &
  (
    | {
        type: "byTime";
        duration: number;
        startTime: number;
        randomDelay: number;
        delay: number;
        easing: EasingFn;
      }
    | {
        type: "bySpeed";
        speed: number;
      }
  );

type AnimOpts = {
  speed?: number;
  reachingThreshold?: number;
  duration?: number;
  easing?: EasingFn;
  randomDelay?: number;
  delay?: number;
  range?: NumRange;
};

type EasingFn = (t: number) => number;
class Easing {
  static linear(t: number) {
    return t;
  }
  static easeIn(t: number) {
    return t * t * t;
  }
  static easeOut(t: number) {
    return 1 - Math.pow(1 - t, 3);
  }
  static easeInOut(t: number) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}

/* animate
 *
 * Allow discrete property changes to show up as animations
 */
export class AnimateFeature extends Feature {
  animations: Anim[] = [];
  animationDuration = 300;
  animationSpeed = 0.1;
  reachingThreshold = 0.01;

  constructor(app: App, name: string) {
    super(app, name);
  }

  override update() {
    const app = this.app;
    this.animations.forEach((anim: Anim) => {
      if (anim.progress >= 1) return;
      if (anim.type === "byTime") {
        const { startTime, duration, startValue, endValue, easing } = anim;
        if (app.time < startTime) return;
        const timeElapsed = app.time - startTime;
        const timeRemaining = duration - timeElapsed;
        if (timeRemaining <= 0) {
          anim.currentValue = endValue;
          anim.progress = 1;
        } else {
          anim.progress = Math.min(timeElapsed / duration, 1);
          const easingFn = easing || Easing.linear;
          anim.currentValue = startValue + (endValue - startValue) * easingFn(anim.progress);
        }
      } else if (anim.type === "bySpeed") {
        const { currentValue, endValue, speed } = anim;
        if (Math.abs(currentValue - endValue) < this.reachingThreshold) {
          anim.currentValue = endValue;
        } else {
          anim.currentValue = currentValue + speed * (endValue - currentValue);
        }
      }
      if (anim.range !== undefined) {
        anim.currentValue = anim.range.normalize(anim.currentValue);
      }
    });
  }

  // deno-lint-ignore no-explicit-any
  byTime(obj: any, property: string, opts?: AnimOpts) {
    const app = this.app;
    opts = opts || {};
    opts.duration =
      opts.duration === undefined ? this.animationDuration : opts.duration;
    opts.easing = opts.easing || Easing.easeOut;
    opts.randomDelay = opts.randomDelay || 0;
    opts.delay = opts.delay || 0;
    const animation: Anim = {
      type: "byTime",
      obj,
      property,
      startValue: obj[property],
      endValue: obj[property],
      startTime: app.time,
      randomDelay: opts.randomDelay,
      delay: opts.delay,
      duration: opts.duration,
      currentValue: obj[property],
      progress: 1,
      easing: opts.easing,
      range: opts.range,
    };
    this.animations.push(animation);
    Object.defineProperty(obj, property, {
      get: function () {
        return animation.currentValue;
      },
      set: function (value) {
        if (animation.endValue === value) return; // already at the target value
        if (animation.startValue === null) {
          // first time setting the value
          animation.currentValue = value;
          animation.startValue = value;
          animation.endValue = value;
          animation.progress = 1;
          return;
        }
        animation.startValue = animation.currentValue;
        animation.endValue = value;
        animation.delay =
          animation.randomDelay === 0
            ? animation.delay
            : Math.random() * animation.randomDelay;
        animation.startTime = app.time + animation.delay;
        animation.progress = 0;
      },
    });
  }

  // deno-lint-ignore no-explicit-any
  bySpeed(obj: any, property: string, opts: AnimOpts) {
    opts = opts || {};
    opts.speed = opts.speed || this.animationSpeed;
    opts.reachingThreshold = opts.reachingThreshold || this.reachingThreshold;
    const animation: Anim = {
      type: "bySpeed",
      obj,
      property,
      startValue: obj[property],
      currentValue: obj[property],
      endValue: obj[property],
      speed: opts.speed,
      progress: 1,
    };
    this.animations.push(animation);
    Object.defineProperty(obj, property, {
      get: function () {
        return animation.currentValue;
      },
      set: function (value) {
        if (animation.endValue === value) return; // already going to the target value
        animation.endValue = value;
        animation.progress = 0;
      },
    });
  }

  // deno-lint-ignore no-explicit-any
  getAnimationIndex(obj: any, property: string) {
    return this.animations.findIndex(
      (anim: Anim) => anim.obj === obj && anim.property === property
    );
  }

  // deno-lint-ignore no-explicit-any
  removeAnimation(obj: any, property: string) {
    const animationIndex = this.getAnimationIndex(obj, property);
    const animation = this.animations[animationIndex];
    if (animationIndex === -1 || animation === undefined) {
      return;
    }
    const valueToSet = animation.endValue;
    delete obj[property];
    obj[property] = valueToSet;
    this.animations.splice(animationIndex, 1);
  }
}
