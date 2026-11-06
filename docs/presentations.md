# Presentation starters

`uipack/presentations` keeps slide design and spoken delivery in one serializable object. It supplies three generic 16:9 layouts: Opening, Explanation, and System. Consumers own the words.

For talks, use [`uipack/deck`](deck.md): it plays a whole deck with one transition grammar, a speaker view and PDF export. These starters are single 16:9 layouts.

Choose a layout below to see the designed slide and the talk track that goes with it; the component takes the content, and these words belong to the example. Then a complete narrative (opening, argument, visual explanation, comparison and closing) composed from them. It is a composition example, not a slide editor: use `Figure` for 2D diagrams and `SlideScene` for 3D inside these layouts.

```uipack-demo slide-starters wide
The three starters with their talk tracks, then a five-chapter narrative composed from them, with a 3D scene and a figure.
```

```tsx
import { SlideStarter, type SlideStarterData } from "uipack/presentations";
import "uipack/presentations.css";

const slide: SlideStarterData = {
  id: "opening",
  layout: "opening",
  title: "Opening",
  description: "A short title and one line of context.",
  content: {
    headline: ["Slide and talk,", "planned together"],
    context: "Points on screen, cues in your notes",
  },
  speech: {
    say: "The slide is half the work.\nKeep what you'll say beside it, as cues.",
    delivery: "Pause after the title.",
    next: "What goes where",
  },
};

<SlideStarter slide={slide} theme="light" />;
```

Write the slide words and the speech the way [Writing](system/writing/talks.md) describes for a presented deck: a short headline (the eyebrow is optional and off by default), fragments on screen, and `say` as a few cue lines rather than a script.

`SpeakerGuide` can be used separately. It derives a rough duration at 135 words per minute, copies the full talk track, announces copy success without moving focus, and does not render the script into the SVG. `showSpeech={false}` produces an audience-only preview.

For file generation, call `renderSlideSvg(slide, { theme, width })`. It returns self-contained SVG with a descriptive `<title>` and `<desc>`. Text is XML-escaped. The default is 1200×675; another width preserves 16:9.

The layouts deliberately do not provide an editor, autoplay, text-to-speech, or export to PowerPoint. Consumers can edit the typed data and save the returned SVG.
