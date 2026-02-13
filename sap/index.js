gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

// create the smooth scroller FIRST!
const smoother = ScrollSmoother.create({
 wrapper: "#wrapper",
 content: "#content",
 smooth: 1,
 normalizeScroll: true, // prevents address bar from showing/hiding on most devices, solves various other browser inconsistencies
 ignoreMobileResize: true, // skips ScrollTrigger.refresh() on mobile resizes from address bar showing/hiding
 effects: true,
 preventDefault: true
});

gsap.set(".heading", {
 yPercent: -150,
 opacity: 1
});

// let tl = gsap.timeline();
let mySplitText = new SplitText("#split-stagger", { type: "words,chars" });
let chars = mySplitText.chars;

chars.forEach((char, i) => {
 smoother.effects(char, { speed: 1, lag: (i + 1) * 0.1 });
});

// 💚 This just adds the GSAP link to this pen, don't copy this bit
import { GSAPInfoBar } from "https://codepen.io/GreenSock/pen/vYqpyLg.js";
new GSAPInfoBar({ link: "https://gsap.com/docs/v3/Plugins/ScrollSmoother/" });
// 💚 Happy tweening!
