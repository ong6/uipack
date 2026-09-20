# Presentation starters

`uipack/presentations` keeps slide design and spoken delivery in one serializable object. It supplies three generic 16:9 layouts: Opening, Explanation, and System. Consumers own the words.

```tsx
import { SlideStarter, type SlideStarterData } from "uipack/presentations";
import "uipack/presentations.css";

const slide: SlideStarterData = {
  id: "opening",
  layout: "opening",
  title: "Opening",
  description: "A thesis and one sentence of context.",
  content: {
    eyebrow: "Presentation systems",
    headline: ["Design the slide.", "Plan what you will say."],
    context: "Keep the visual and its talk track together.",
  },
  speech: {
    say: "A finished slide is only half the work. This starter keeps the spoken explanation beside it.",
    delivery: "Pause after the first sentence.",
    next: "Now look at how the two layers divide the work.",
  },
};

<SlideStarter slide={slide} theme="light" />;
```

`SpeakerGuide` can be used separately. It derives a rough duration at 135 words per minute, copies the full talk track, announces copy success without moving focus, and does not render the script into the SVG. `showSpeech={false}` produces an audience-only preview.

For file generation, call `renderSlideSvg(slide, { theme, width })`. It returns self-contained SVG with a descriptive `<title>` and `<desc>`. Text is XML-escaped. The default is 1200×675; another width preserves 16:9.

The layouts deliberately do not provide an editor, autoplay, text-to-speech, or export to PowerPoint. Consumers can edit the typed data and save the returned SVG.
